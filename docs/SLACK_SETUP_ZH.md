# Mnemo Slack Bot 配置（白话版）

Mnemo 在 Slack 里是一个 **机器人应用**。别人 @ 你或你私信机器人时，它用「你的旅行分身」起草回复，**只有你在 Mnemo 网站点发送后才会真正发到 Slack**。

---

## 你要准备什么

1. 能登录 [Slack API](https://api.slack.com/apps) 的账号（和工作区管理员权限，用于安装应用）
2. 项目根目录 `.env` 里填好 Slack 三件套（见下）
3. Supabase 项目：**Travel Game Diary**（`mwvizvnjywefiyptqizw`）

---

## 第一步：在 Slack 创建应用「Mnemo」

1. 打开 https://api.slack.com/apps → **Create New App** → **From scratch**
2. 名称填 **Mnemo**，选你的工作区
3. 左侧 **App Home** → 显示名称可写 `Mnemo Twin`

### OAuth & Permissions

**Redirect URLs** 添加（复制粘贴）：

```
https://mwvizvnjywefiyptqizw.supabase.co/functions/v1/slack-oauth
```

**Bot Token Scopes** 添加：

- `app_mentions:read`
- `chat:write`
- `channels:history`
- `groups:history`
- `im:history`
- `users:read`

**User Token Scopes** 添加（用于你确认后用自己的身份发帖）：

- `chat:write`
- `channels:history`
- `groups:history`
- `im:history`
- `users:read`
- `app_mentions:read`

保存后点 **Install to Workspace**（或 **Reinstall**）。

### Event Subscriptions

1. 打开 **Enable Events**
2. **Request URL** 填：

```
https://mwvizvnjywefiyptqizw.supabase.co/functions/v1/slack-events
```

保存后 Slack 会显示 **Verified**（若失败，先完成下面「同步密钥」并重新 deploy `slack-events`）。

3. **Subscribe to bot events** 添加：

- `app_mention`
- `message.im`

保存。

### 复制三个密钥

**Settings → Basic Information**：

- **Client ID** → 填进 `.env` 的 `SLACK_CLIENT_ID`
- **Client Secret** → `SLACK_CLIENT_SECRET`
- **Signing Secret** → `SLACK_SIGNING_SECRET`

---

## 第二步：填 `.env` 并同步到云端

在项目根目录 `.env` 增加（或核对）：

```env
SITE_URL=http://localhost:8081
# 上线后改为 https://mnemo.games

SLACK_CLIENT_ID=你的Client ID
SLACK_CLIENT_SECRET=你的Client Secret
SLACK_SIGNING_SECRET=你的Signing Secret
SLACK_REDIRECT_URI=https://mwvizvnjywefiyptqizw.supabase.co/functions/v1/slack-oauth
SLACK_INTERNAL_SECRET=随便一串随机字母数字
```

然后执行：

```bash
chmod +x scripts/sync-env-secrets.sh
./scripts/sync-env-secrets.sh
```

或：`npm run secrets:sync`

---

## 第三步：部署 Slack 相关云函数

```bash
supabase db query --linked -f supabase/migrations/20250603120200_slack_bot_token.sql
supabase functions deploy slack-oauth slack-events slack-send-draft slack-draft-reply
```

---

## 第四步：在 Mnemo 里跑通

1. 本地 `npm run dev` → http://localhost:8081
2. 先有分身：Journal / AI Create 生成一次旅行内容（会自动建档）
3. 打开 **/twin** → **Connect Slack** → 在 Slack 授权
4. 在 Slack 里 **私信 Mnemo 应用**，或在你已邀请机器人的频道 **@Mnemo** 说一句话
5. 机器人会回复一条提示；回到 **/twin** 看 **Pending drafts** → 编辑 → **发送**

---

## 常见问题

| 现象 | 处理 |
|------|------|
| Connect Slack 报错 / Slack not configured | `.env` 没填全或没跑 `secrets:sync` |
| Event URL 验证失败 | 检查 `SLACK_SIGNING_SECRET` 是否同步；重新 deploy `slack-events` |
| @ 了没反应 | 频道里要先 `/invite @Mnemo`；且要用**连接 Slack 的同一个账号** @ 或私信 |
| 有草稿发不出去 | 重新 Connect Slack；确认 User Token 有 `chat:write` |

---

## 流程图（一句话）

```
Slack @Mnemo 或私信 → 云端记草稿 → Mnemo /twin 你点发送 → 以你的 Slack 身份发出
```

Bot 只负责「通知 + 监听」；真正发帖内容以你在 Mnemo 里批准的为准。
