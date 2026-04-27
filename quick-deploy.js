/**
 * ContentStamp 一键部署脚本
 * 用法: 
 *   测试:   node quick-deploy.js
 *   Base Sepolia: PRIVATE_KEY=0x... node quick-deploy.js --sepolia
 *   Base Mainnet: PRIVATE_KEY=0x... node quick-deploy.js --mainnet
 */
import { ethers } from "ethers";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// 读取编译产物
const solcOutput = JSON.parse(readFileSync(resolve(__dirname, "compiled.json"), "utf8"));
const contractData = solcOutput.contracts["ContentStamp.sol"]["ContentStamp"];
const compiledAbi = contractData.abi;
const compiledBytecode = "0x" + contractData.evm.bytecode.object;

const NETWORKS = {
  "sepolia": {
    name: "Base Sepolia (测试网)",
    rpc: "https://sepolia.base.org",
    explorer: "https://sepolia.basescan.org",
  },
  "mainnet": {
    name: "Base Mainnet (主网)",
    rpc: "https://mainnet.base.org",
    explorer: "https://basescan.org",
  },
};

async function main() {
  const args = process.argv.slice(2);
  const networkKey = args.includes("--mainnet") ? "mainnet" : args.includes("--sepolia") ? "sepolia" : null;
  
  // 默认使用 Dry Run 模式（不部署）
  if (!networkKey) {
    console.log("🔍 Dry Run 模式：验证合约编译结果\n");
    console.log("✅ 合约编译成功");
    console.log("📦 字节码大小:", compiledBytecode.length / 2 - 1, "bytes");
    console.log("📋 ABI 函数数:", compiledAbi.length);
    console.log("\n部署命令：");
    console.log("  测试网: PRIVATE_KEY=0x... node quick-deploy.js --sepolia");
    console.log("  主网:   PRIVATE_KEY=0x... node quick-deploy.js --mainnet");
    console.log("\nGas 预估: Base Sepolia 免费 | Base Mainnet ~$2-5");
    return;
  }

  const network = NETWORKS[networkKey];
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ 请设置 PRIVATE_KEY 环境变量");
    process.exit(1);
  }

  console.log(`🚀 部署到 ${network.name}`);
  console.log(`🔗 RPC: ${network.rpc}`);

  const provider = new ethers.JsonRpcProvider(network.rpc);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const balance = await provider.getBalance(wallet.address);
  console.log(`👛 地址: ${wallet.address}`);
  console.log(`💰 余额: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error("❌ 余额为0，无法部署");
    if (networkKey === "sepolia") {
      console.log("💧 领测试币: https://www.alchemy.com/faucets/base-sepolia");
    }
    process.exit(1);
  }

  // 部署
  const factory = new ethers.ContractFactory(compiledAbi, compiledBytecode, wallet);
  console.log("⏳ 部署中...");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`\n✅ 部署成功!`);
  console.log(`📍 合约地址: ${address}`);
  console.log(`🔍 浏览器: ${network.explorer}/address/${address}`);

  // 保存
  const info = {
    contractAddress: address,
    network: networkKey,
    explorer: network.explorer,
    deployer: wallet.address,
    abi: compiledAbi,
  };
  writeFileSync(resolve(__dirname, "deploy.json"), JSON.stringify(info, null, 2));
  console.log("📄 部署信息已保存到 deploy.json");

  // 输出需要更新的文件
  console.log("\n📝 请更新以下文件中的 CONTRACT_ADDRESS:");
  console.log(`   extension/popup.js → ${address}`);
  console.log(`   verify/verify.js    → ${address}`);
}

main().catch(console.error);
