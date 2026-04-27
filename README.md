# 🔏 ContentStamp — 链上内容存证

> 一键将内容哈希写入区块链，获得**不可篡改的创作时间戳 + 创作者身份声明**。

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)](https://soliditylang.org)
[![Base](https://img.shields.io/badge/Network-Base%20L2-0052FF?logo=base)](https://base.org)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-Extension%20MV3-4285F4?logo=googlechrome)](./extension)

---

## 🎯 解决什么问题

DeepSeek V4 让百万 Token 近乎免费。你花三天写的文章，AI 3秒就能洗稿——**你拿什么证明是你先发的？**

| 传统方式 | 问题 |
|---------|------|
| 截图 | 可以 PS |
| 邮件时间戳 | 服务器可改 |
| 版权登记 | ¥300-500，等两周 |

**区块链存证：数学证明，不可篡改，~$0.01，几秒确认。**

---

## ✨ 核心功能

```
stampWithAuthor(hash, url, "你的名字")
     │
     ▼
  Base 区块链 ← 永久记录
     │
     ├── 谁的钱包？ → 0x你...
     ├── 什么内容？ → SHA256 哈希
     ├── 谁写的？   → "你的名字"  ← v0.2.0 新增
     └── 什么时候？ → 2026-04-27 14:30 UTC
```

### 合约函数

| 函数 | 说明 |
|------|------|
| `stamp(hash, uri)` | 基础存证（向后兼容） |
| `stampWithAuthor(hash, uri, name)` | 🆕 存证 + 声明创作者身份 |
| `stampBatch(hashes[], uris[])` | 批量存证 |
| `stampBatchWithAuthor(...)` | 🆕 批量存证 + 身份声明 |
| `verify(hash)` | 验证内容是否已存证 |
| `findByHash(hash)` | 查找同一内容的所有存证记录 |
| `getStamp(id)` | 按 ID 查询完整记录 |
| `getStampsByAuthor(address)` | 按钱包地址查记录 |

---

## 🏗️ 项目结构

```
contentstamp/
├── contracts/
│   └── ContentStamp.sol       # Solidity 合约 (v0.2.0, 12个函数)
├── extension/                  # Chrome 插件 (Manifest V3)
│   ├── manifest.json
│   ├── popup.js                # 哈希计算 + MetaMask 上链
│   ├── content.js              # 页面内容提取
│   ├── background.js           # 右键菜单
│   └── icons/                  # 16/48/128px 图标
├── verify/                     # 公开验证页
│   ├── index.html
│   └── verify.js               # 链上查询逻辑
├── build/                      # 编译产物 (ABI + Bytecode)
├── docs/
│   ├── chrome-store-listing.md # Chrome商店文案
│   ├── growth-plan.md          # 四平台增长计划
│   └── zhihu-article.md        # 推广文章草稿
├── quick-deploy.js             # 一键部署 (Sepolia/Mainnet)
└── update-address.js           # 部署后批量更新地址
```

---

## 🚀 3步跑起来

### 1. 部署合约

```bash
# 获取 Base Sepolia 测试币
# https://www.alchemy.com/faucets/base-sepolia

# 测试网
PRIVATE_KEY=0x... node quick-deploy.js --sepolia

# 主网 (Gas ~$2-5)
PRIVATE_KEY=0x... node quick-deploy.js --mainnet
```

### 2. 更新合约地址

```bash
node update-address.js 0x部署后的合约地址
```

### 3. 加载 Chrome 插件

1. 打开 `chrome://extensions/`
2. 开启「开发者模式」→ 「加载已解压」
3. 选择 `extension/` 文件夹
4. 打开任意网页 → 右键或点图标 → 存证！

---

## 🔍 使用示例

```javascript
// 基础存证
await contract.stamp(
  ethers.keccak256(ethers.toUtf8Bytes(content)),
  "https://myblog.com/post-1"
);

// 声明创作者身份（v0.2.0）
await contract.stampWithAuthor(
  ethers.keccak256(ethers.toUtf8Bytes(content)),
  "https://myblog.com/post-1",
  "Simon Chen"
);

// 验证
const [exists, stampId, timestamp] = await contract.verify(hash);
```

---

## 💰 商业模型

| 版本 | 价格 | 功能 |
|------|------|------|
| 免费版 | $0 | 50次/月存证 |
| Pro 版 | $9.9/月 | 无限存证 + API |
| 企业版 | $0.001/次 | API 按量计费 |

目标：12 个月 → 5000 用户 → $2500/月

---

## 📊 合约详情

| 项目 | 值 |
|------|-----|
| 合约 | ContentStamp |
| Solidity | ^0.8.20 |
| 网络 | Base L2 |
| Gas 费 | ~$0.01/次 |
| 函数 | 12个 (含批量+身份声明) |
| 事件 | ContentStamped / ContentStampedWithAuthor |

---

## 🛡️ 存证证明什么、不证明什么

| ✅ 能证明 | ❌ 不能证明 |
|----------|------------|
| 内容在存证时间之前已存在 | 存证人就是原创作者 |
| 链上时间不可篡改 | 内容本身的价值/质量 |
| 所有人都能独立验证 | 法律上的版权归属（需配合其他证据） |

> 💡 **最佳实践**：发布后立即存证 + 保留创作过程记录（草稿/素材），形成完整证据链。

---

## 🔗 验证页

```bash
cd verify
vercel deploy  # 免费
```

验证 URL：`https://contentstamp.vercel.app?hash=0x...`

---

## 📝 License

MIT © 2026

**AI 让抄袭变得简单。让我们用区块链让它变得可追踪。**
