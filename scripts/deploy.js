// Hardhat 部署脚本 - ContentStamp
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("👛 部署账户:", deployer.address);
  console.log("💰 余额:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

  const ContentStamp = await hre.ethers.getContractFactory("ContentStamp");
  const stamp = await ContentStamp.deploy();
  await stamp.waitForDeployment();

  const address = await stamp.getAddress();
  console.log("✅ ContentStamp 已部署!");
  console.log("📍 合约地址:", address);

  // 测试存证
  console.log("\n🧪 测试存证...");
  const testHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("Hello ContentStamp! First stamp on chain!"));
  const tx = await stamp.stamp(testHash, JSON.stringify({
    title: "测试存证",
    url: "https://contentstamp.vercel.app",
    description: "ContentStamp 第一条存证记录",
  }));
  await tx.wait();
  console.log("✅ 测试存证完成! Tx:", tx.hash);

  const total = await stamp.totalStamps();
  console.log("📊 总存证数:", total.toString());

  // 保存地址
  const fs = require("fs");
  fs.writeFileSync("deploy-local.json", JSON.stringify({
    contractAddress: address,
    deployer: deployer.address,
    txHash: tx.hash,
    network: "hardhat-local",
  }, null, 2));
  console.log("\n📄 部署信息已保存到 deploy-local.json");
  console.log("\n✅ 合约地址:", address);
  console.log("请将此地址更新到 extension/popup.js 和 verify/verify.js 的 CONTRACT_ADDRESS");
}

main().catch(console.error);
