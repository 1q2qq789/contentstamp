# 🔏 ContentStamp 重构计划

> 基于 ai-fullstack-appstore 方法论：分层 + 模块化 + 迭代

## 一、现状评估

| 维度 | 当前 | 问题 |
|------|------|------|
| 架构 | Chrome 插件 MV3 直连 MetaMask | 无后端、无数据库、无用户系统 |
| 存证 | 通过 MetaMask 签名上链 | 体验门槛高（需安装钱包） |
| 验证 | 静态 HTML + ethers.js 查询 | 纯前端，依赖 RPC |
| 数据 | 全部在链上 | 查询慢，不能做统计/分析 |
| 用户 | 无 | 无法做付费/用户管理 |

## 二、重构目标 (v1.0)

| 目标 | 说明 |
|------|------|
| 用户系统 | 邮箱/钱包双登录 |
| 后端 API | 存证记录缓存、用户管理 |
| 数据库 | 存证索引、用户数据、使用统计 |
| 管理后台 | Dashboard + 收费系统 |
| 验证页升级 | 更丰富的验证信息展示 |

## 三、技术选型（借鉴 skill 推荐）

| 层 | 方案 | 理由 |
|----|------|------|
| 前端 (插件) | Chrome Extension MV3 + React | 已有基础，MV3 兼容，保持插件形式 |
| 后端 API | Next.js API Routes | 部署在 Vercel，零运维 |
| 数据库 | Supabase (PostgreSQL) | 免费层够用，支持 Auth + Realtime |
| 认证 | Supabase Auth | 邮箱 + 钱包双模式 |
| 部署 | Vercel + GitHub | 自动 CI/CD |
| 智能合约 | 保留 Solidity (Base L2) | 核心存证机制不变 |

## 四、分阶段迭代计划

### Phase 1: 后端 + 数据库（本周）

- [ ] Supabase 项目初始化
- [ ] 数据库 Schema（users, stamps, api_keys）
- [ ] 后端 API（存证记录同步、用户查询）
- [ ] Chrome 插件接入后端（非钱包模式读数据）

### Phase 2: 用户系统

- [ ] 邮箱注册/登录
- [ ] 钱包绑定
- [ ] 个人 Dashboard（存证历史）
- [ ] 免费版配额限制

### Phase 3: 付费系统

- [ ] Stripe 订阅集成
- [ ] Pro/企业版功能隔离
- [ ] API Key 管理

### Phase 4: 增强功能

- [ ] 批量存证页面
- [ ] 内容相似度检测
- [ ] 时间线可视化
- [ ] 自动化存证（CMS 插件 / API）

## 五、数据库 Schema（初步）

```sql
-- 用户表（由 Supabase Auth 管理，custom fields 在 public schema）
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  wallet_address TEXT UNIQUE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  stamp_count INTEGER DEFAULT 0,
  monthly_stamp_limit INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 存证记录缓存（方便查询 + 统计）
CREATE TABLE stamps (
  id BIGSERIAL PRIMARY KEY,
  content_hash TEXT NOT NULL,
  uri TEXT,
  author_name TEXT,
  author_address TEXT,
  tx_hash TEXT UNIQUE,
  block_number BIGINT,
  timestamp TIMESTAMPTZ,
  network TEXT DEFAULT 'base',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_stamps_content_hash ON stamps(content_hash);
CREATE INDEX idx_stamps_user_id ON stamps(user_id);
CREATE INDEX idx_stamps_timestamp ON stamps(timestamp DESC);

-- API Key 表
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 六、API 设计

```typescript
// 存证相关
POST /api/stamps          // 记录存证（由插件调用）
GET  /api/stamps          // 查询用户存证记录
GET  /api/stamps/:hash    // 按内容哈希查询
GET  /api/verify/:hash    // 验证 + 附加信息

// 用户相关
GET  /api/user/profile    // 用户信息
PUT  /api/user/profile    // 更新信息
GET  /api/user/usage      // 使用统计

// API Key
POST /api/keys            // 创建 API Key
GET  /api/keys            // 列出 API Key
DELETE /api/keys/:id      // 删除 API Key
```

## 七、文件结构（重构后）

```
contentstamp/
├── contracts/
│   └── ContentStamp.sol       # 保持不变
├── extension/                  # Chrome 插件（升级版）
│   ├── manifest.json
│   ├── popup/                  # React 实现
│   ├── background/
│   └── content/
├── frontend/                   # 新的 Web 前端
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 登录/注册
│   │   ├── dashboard/         # 个人中心
│   │   ├── verify/            # 验证页
│   │   └── api/               # API Routes
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── contracts.ts
│   ├── components/
│   └── package.json
├── supabase/
│   └── migrations/
├── docs/
│   └── ...
├── quick-deploy.js
└── README.md
```
