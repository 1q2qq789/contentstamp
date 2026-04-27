# ContentStamp - 链上内容存证

一键将网页内容哈希上链，获得**不可篡改的创作时间戳证明**。

> DeepSeek / GPT 让 AI 内容成本趋零，抄袭零成本 — 你拿什么证明「这是我先发的」？

## 🎯 解决的痛点

| 痛点 | 解决方案 |
|------|----------|
| AI 时代内容抄袭零成本 | 哈希上链 → 不可篡改的时间戳 |
| 自媒体被洗稿后维权无门 | 链上存证 → 法律级时间证明 |
| AI 生成内容真假难辨 | 创作时自动标记 → 可验证来源 |

## 🏗️ 项目结构

```
contentstamp/
├── contracts/
│   └── ContentStamp.sol      # 存证智能合约（Solidity）
├── extension/                 # Chrome 插件
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js               # 核心逻辑：哈希+上链
│   ├── content.js             # 提取页面内容
│   ├── ethers-6.13.min.js    # ethers.js 库
│   └── icons/                 # 插件图标
├── verify/                    # 验证展示页
│   ├── index.html             # 公开验证页面
│   ├── verify.js
│   └── ethers-6.13.min.js
├── compiled.json              # 编译产物
├── quick-deploy.js            # 一键部署脚本
├── update-address.js          # 部署后更新地址
└── deploy.js                  # 旧版部署脚本
```

## 🚀 快速开始（3步）

### 1. 部署合约

```bash
# 先获取 Base Sepolia 测试币:
# https://www.alchemy.com/faucets/base-sepolia

# 部署到测试网
PRIVATE_KEY=0x你的私钥 node quick-deploy.js --sepolia

# 或部署到主网（Gas ~$2-5）
PRIVATE_KEY=0x你的私钥 node quick-deploy.js --mainnet
```

### 2. 更新合约地址

```bash
node update-address.js 0x部署后得到的合约地址
```

### 3. 加载 Chrome 插件

1. 打开 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `extension/` 文件夹
5. 打开任意网页 → 点击插件图标 → 存证！

## 📊 合约详情

| 项目 | 值 |
|------|-----|
| 合约 | ContentStamp |
| 语言 | Solidity 0.8.20 |
| 字节码 | 3,609 bytes |
| 函数 | 10 个 |
| 网络 | Base (L2, Gas ~$0.01/tx) |
| 功能 | stamp() / stampBatch() / verify() / findByHash() |

## 💰 商业模型（Solo Founder）

```
免费版：月存证 50 次
Pro 版：$9.9/月 无限存证 + API 接入
企业版：API 按量计费 $0.001/次

目标：12个月 5000 用户 → $2500/月
```

## 🔗 验证页

部署到 Vercel：
```bash
cd verify
vercel deploy  # 免费部署
```

验证 URL 格式：`https://contentstamp.vercel.app?hash=0x...`

## 📝 技术栈

- **合约**: Solidity 0.8.20, Base L2
- **插件**: Chrome Extension Manifest V3, ethers.js v6
- **验证页**: 纯 HTML/JS, 可部署到 Vercel/Netlify
- **Node**: ethers.js, solc 编译

## ⚠️ 注意事项

- 合约已优化（optimizer enabled, 200 runs）
- 只存不转账，零资金风险
- Base 主网 Gas 极低（~$0.01/tx）
- 插件需要 MetaMask 钱包
