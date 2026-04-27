# ContentStamp 完整部署指南

## 方案 A：CLI 部署（推荐，最快）

```bash
cd /Users/simon/workspace/contentstamp

# 1. 获取测试币（浏览器打开）
#    https://www.alchemy.com/faucets/base-sepolia
#    输入你的 MetaMask 钱包地址 → 领 0.1 ETH

# 2. 部署到 Base Sepolia 测试网
PRIVATE_KEY=0x你的MetaMask私钥 node quick-deploy.js --sepolia

# 3. 部署成功后会输出:
#    ✅ 部署成功!
#    📍 合约地址: 0x1234...abcd
#    复制这个地址

# 4. 更新所有文件中的合约地址
node update-address.js 0x1234...abcd

# 5. 测试通过后，部署到主网
PRIVATE_KEY=0x你的私钥 node quick-deploy.js --mainnet
node update-address.js 0x主网合约地址
```

## 方案 B：Remix IDE 部署（可视化）

1. 打开 https://remix.ethereum.org
2. 创建新文件 `ContentStamp.sol`，粘贴 `/Users/simon/workspace/contentstamp/contracts/ContentStamp.sol`
3. 左侧编译器选择 `0.8.20`，勾选 `Enable optimization` (200 runs)，点击 Compile
4. 切换到 Deploy 标签：
   - Environment: `Injected Provider - MetaMask`
   - MetaMask 切换到 Base Sepolia 网络
   - 点击 Deploy
5. 复制部署后的合约地址
6. 本地运行: `node update-address.js 0x合约地址`

## 方案 C：直接主网（最快，$2-5 成本）

```bash
cd /Users/simon/workspace/contentstamp

# 确保 MetaMask 里有 $5+ 的 Base ETH
# 如果没有：从交易所提 ETH 到 Base 网络钱包

PRIVATE_KEY=0x你的私钥 node quick-deploy.js --mainnet
node update-address.js 0x合约地址
```

Base 主网 Gas 极低，合约部署约 $2-5。

---

## 部署后验证步骤

```bash
# 加载 Chrome 插件
# 1. chrome://extensions → 开发者模式
# 2. 加载已解压 → 选择 extension/ 文件夹

# 测试流程:
# 1. 打开任意网页（如知乎文章）
# 2. 右键 → "🔏 存证当前页面到 ContentStamp"
# 3. MetaMask 确认交易
# 4. 查看存证结果
# 5. 打开 verify/index.html → 输入哈希验证

# 验证页部署到 Vercel
cd verify
npx vercel deploy --prod
```

---

## 部署后快速检查清单

- [ ] 合约部署成功，拿到地址
- [ ] `node update-address.js` 更新了 popup.js 和 verify.js
- [ ] Chrome 插件加载成功
- [ ] 右键菜单出现 4 个 ContentStamp 选项
- [ ] 点击插件图标正常显示
- [ ] MetaMask 连接正常
- [ ] 存证交易成功上链
- [ ] 验证页能查到存证记录
- [ ] 主网部署
- [ ] Chrome 商店提交
