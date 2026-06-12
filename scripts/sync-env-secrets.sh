#!/usr/bin/env bash
# 从项目根目录 .env 同步密钥到 Supabase Edge Functions（Slack / AI / SITE_URL）
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "缺少 .env 文件。请复制 .env.example 并填写。"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

ARGS=()

if [[ -z "${moonshot_api_key:-}" ]]; then
  echo "错误: .env 里 moonshot_api_key 为空。"
  echo "请到 https://platform.moonshot.cn/console/api-keys 创建 Key，写入 .env 后重试。"
  exit 1
fi

ARGS+=("moonshot_api_key=${moonshot_api_key}")
ARGS+=("MOONSHOT_API_KEY=${moonshot_api_key}")

MOONSHOT_BASE="${moonshot_base_url:-https://api.moonshot.cn/v1}"
ARGS+=("moonshot_base_url=${MOONSHOT_BASE}")
ARGS+=("MOONSHOT_BASE_URL=${MOONSHOT_BASE}")

if [[ -n "${moonshot_model:-}" ]]; then
  ARGS+=("moonshot_model=${moonshot_model}")
  ARGS+=("MOONSHOT_MODEL=${moonshot_model}")
fi
if [[ -n "${moonshot_vision_model:-}" ]]; then
  ARGS+=("moonshot_vision_model=${moonshot_vision_model}")
  ARGS+=("MOONSHOT_VISION_MODEL=${moonshot_vision_model}")
fi
if [[ -n "${SITE_URL:-}" ]]; then
  ARGS+=("SITE_URL=${SITE_URL}")
fi
if [[ -n "${SLACK_CLIENT_ID:-}" ]]; then
  ARGS+=("SLACK_CLIENT_ID=${SLACK_CLIENT_ID}")
fi
if [[ -n "${SLACK_CLIENT_SECRET:-}" ]]; then
  ARGS+=("SLACK_CLIENT_SECRET=${SLACK_CLIENT_SECRET}")
fi
if [[ -n "${SLACK_SIGNING_SECRET:-}" ]]; then
  ARGS+=("SLACK_SIGNING_SECRET=${SLACK_SIGNING_SECRET}")
fi
if [[ -n "${SLACK_REDIRECT_URI:-}" ]]; then
  ARGS+=("SLACK_REDIRECT_URI=${SLACK_REDIRECT_URI}")
fi
if [[ -n "${SLACK_INTERNAL_SECRET:-}" ]]; then
  ARGS+=("SLACK_INTERNAL_SECRET=${SLACK_INTERNAL_SECRET}")
fi

if [[ ${#ARGS[@]} -eq 0 ]]; then
  echo "没有可同步的变量。请在 .env 填写 moonshot_api_key / SLACK_* / SITE_URL"
  exit 1
fi

echo "同步到 Supabase: ${ARGS[*]//=*/=***}"
supabase secrets set "${ARGS[@]}"
echo "完成。可执行: supabase functions deploy slack-oauth slack-events slack-send-draft"
