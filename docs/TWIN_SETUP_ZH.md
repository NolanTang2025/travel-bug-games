# Twin 闭环部署指南（中文）

当前 CLI 已关联项目：**Travel Game Diary**（`mwvizvnjywefiyptqizw`）

> 你原来的 `.env` 指向 Lovable 项目 `rhzxjicrxuokwzchdpof`，CLI 无法管理。本地跑通已改为 **Travel Game Diary**；上线 mnemo.games 时需把 Vercel 环境变量改成同一项目，或在 Lovable 项目里重复执行迁移。

## 已完成（助手侧）

- [x] 数据库迁移（表 + RLS + `archive-media` 桶）
- [x] 6 个 Edge Functions 已部署
- [x] `SITE_URL`、`SLACK_REDIRECT_URI` 已写入 secrets（本地 `http://localhost:8080`）

## 你需要完成的步骤

### 第 1 步：配置 AI 密钥（必做，无需 Lovable）

已改为 **Moonshot（月之暗面）** 优先，兼容 OpenAI 格式。你的 Supabase 项目里若已有 `moonshot_api_key` 可跳过。

1. 打开 <https://platform.moonshot.cn/console/api-keys> 注册并创建 API Key（新账号通常有试用额度）
2. 在终端执行：

```bash
cd /Users/iristang/Desktop/mnemo
supabase secrets set moonshot_api_key=你的key
```

也可改用 OpenAI：`supabase secrets set OPENAI_API_KEY=sk-...`

验证：站内 **AI Create** 能生成小游戏，或档案页能生成 archive。

---

### 第 2 步：开启登录（Supabase Auth）— 必做

报错 `Unsupported provider: provider is not enabled` = **你点的登录方式没在开控制台里打开**。

打开：<https://supabase.com/dashboard/project/mwvizvnjywefiyptqizw/auth/providers>

#### 方案 A：邮箱魔法链接（推荐，不用配 Google）

1. 点开 **Email**
2. 打开 **Enable Email provider**
3. 测试阶段可关闭 **Confirm email**（关掉后不用验证邮箱就能登录）
4. 保存

#### 方案 B：Google 登录（可选）

1. 在 [Google Cloud Console](https://console.cloud.google.com/) 创建 OAuth 客户端
2. Supabase → **Google** → 填入 Client ID / Secret
3. 打开 **Enable Google provider**

**URL 配置**（Authentication → URL Configuration）：

| 类型 | 地址 |
|------|------|
| Site URL | `http://localhost:8081` |
| Redirect URLs | `http://localhost:8081/**`、`http://localhost:8080/**`、`https://mnemo.games/**` |

---

### 第 3 步：本地启动前端

```bash
cd /Users/iristang/Desktop/mnemo
npm run dev
```

浏览器打开终端里显示的地址（一般是 `http://localhost:8080`）。

---

### 第 4 步：Phase 1 自测（档案 + 分身，无 Slack）

1. 打开 `/login` → 魔法链接或 Google 登录
2. `/archive/new` → 上传 2 张照片 + 写几句日记 → **Generate archive**
3. 进入档案页 → **Create digital twin**
4. `/twin` 应能看到分身信息

若失败：浏览器 F12 → Network，看 `generate-archive` 返回是否 `LOVABLE_API_KEY not configured`。

---

### 第 5 步：Slack 应用（Phase 2）

1. <https://api.slack.com/apps> → **Create New App**
2. **OAuth & Permissions** → User Token Scopes：
   - `chat:write`, `channels:history`, `groups:history`, `im:history`, `users:read`, `app_mentions:read`
3. **Redirect URL** 添加：
   ```
   https://mwvizvnjywefiyptqizw.supabase.co/functions/v1/slack-oauth
   ```
4. **Event Subscriptions** → Enable → Request URL：
   ```
   https://mwvizvnjywefiyptqizw.supabase.co/functions/v1/slack-events
   ```
   订阅：`app_mention`、`message.im`
5. 复制 **Client ID、Client Secret、Signing Secret**，执行：

```bash
supabase secrets set \
  SLACK_CLIENT_ID=xxx \
  SLACK_CLIENT_SECRET=xxx \
  SLACK_SIGNING_SECRET=xxx
```

6. **Install to Workspace**（OAuth 安装到你的测试 Slack）
7. 在 `/twin` 点 **Connect Slack** → 授权
8. 在频道 @ 你的应用，或给应用发 DM
9. 回到 Mnemo `/twin` 看草稿 → 编辑 → **发送**

---

### 第 6 步：上线 mnemo.games（可选）

Vercel 环境变量改为 Travel Game Diary：

- `VITE_SUPABASE_URL=https://mwvizvnjywefiyptqizw.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY=`（Dashboard → Settings → API → anon key）

```bash
supabase secrets set SITE_URL=https://mnemo.games
vercel --prod
```

Slack Redirect / Event URL 不变（仍指向 Supabase function）。
