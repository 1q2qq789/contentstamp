/**
 * ContentStamp 合约编译 + 部署脚本
 * 适用于 Base Sepolia 测试网
 */
const solc = require("solc");
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

async function main() {
    // 1. 编译合约
    console.log("🔨 编译合约...");
    const contractPath = path.join(__dirname, "contracts", "ContentStamp.sol");
    const source = fs.readFileSync(contractPath, "utf8");

    const input = {
        language: "Solidity",
        sources: { "ContentStamp.sol": { content: source } },
        settings: {
            outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
            optimizer: { enabled: true, runs: 200 },
        },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    if (output.errors) {
        const errors = output.errors.filter(e => e.severity === "error");
        if (errors.length > 0) {
            console.error("❌ 编译错误:", JSON.stringify(errors, null, 2));
            process.exit(1);
        }
    }

    const contract = output.contracts["ContentStamp.sol"]["ContentStamp"];
    const abi = contract.abi;
    const bytecode = "0x" + contract.evm.bytecode.object;
    console.log("✅ 编译成功，合约大小:", bytecode.length / 2, "bytes");

    // 保存 ABI
    fs.writeFileSync(
        path.join(__dirname, "ContentStamp.json"),
        JSON.stringify({ abi }, null, 2)
    );
    console.log("📄 ABI 已保存到 ContentStamp.json");

    // 2. 连接网络
    const RPC_URL = process.env.RPC_URL || "https://sepolia.base.org";
    console.log("🔗 连接 Base Sepolia:", RPC_URL);
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // 3. 获取钱包（优先用 env，否则生成新钱包）
    let wallet;
    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey) {
        wallet = new ethers.Wallet(privateKey, provider);
        console.log("👛 使用已有钱包:", wallet.address);
    } else {
        wallet = ethers.Wallet.createRandom().connect(provider);
        console.log("👛 生成新钱包:", wallet.address);
        console.log("🔑 私钥（请保存！）:", wallet.privateKey);
        console.log("💧 请到 https://www.alchemy.com/faucets/base-sepolia 领测试币");
    }

    const balance = await provider.getBalance(wallet.address);
    console.log("💰 余额:", ethers.formatEther(balance), "ETH");
    
    if (balance === 0n && !privateKey) {
        console.log("\n⚠️  新钱包余额为0，部署需要测试币");
        console.log("   faucet: https://www.alchemy.com/faucets/base-sepolia");
        console.log("   faucet: https://docs.base.org/chain/network-faucet");
        console.log("   充值后重新运行: PRIVATE_KEY=<你的私钥> node deploy.js\n");
        // 给出私钥让用户保存
        const envPath = path.join(__dirname, ".env");
        if (!fs.existsSync(envPath)) {
            fs.writeFileSync(envPath, `# ContentStamp 测试钱包\nPRIVATE_KEY=${wallet.privateKey}\n`);
            console.log("📝 私钥已保存到 .env 文件");
        }
        return;
    }

    // 4. 部署合约
    console.log("\n🚀 部署合约...");
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const stampContract = await factory.deploy();
    await stampContract.waitForDeployment();
    
    const contractAddress = await stampContract.getAddress();
    console.log("✅ 合约已部署!");
    console.log("📍 地址:", contractAddress);
    console.log("🔍 浏览器: https://sepolia.basescan.org/address/" + contractAddress);

    // 5. 测试存证
    console.log("\n🧪 测试存证...");
    const testHash = ethers.keccak256(ethers.toUtf8Bytes("Hello ContentStamp!"));
    const tx = await stampContract.stamp(testHash, "test:first stamp");
    await tx.wait();
    console.log("✅ 存证成功! Tx:", tx.hash);

    const totalStamps = await stampContract.totalStamps();
    console.log("📊 总存证数:", totalStamps.toString());

    // 保存部署信息
    const deployInfo = {
        network: "base-sepolia",
        contractAddress,
        deployTx: tx.hash,
        abi,
    };
    fs.writeFileSync(
        path.join(__dirname, "deploy.json"),
        JSON.stringify(deployInfo, null, 2)
    );
    console.log("📄 部署信息已保存到 deploy.json");
}

main().catch(console.error);
