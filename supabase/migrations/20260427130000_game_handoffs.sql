-- Short-lived payloads so desktop can hand off sessionStorage to mobile via short code + QR
create table if not exists public.game_handoffs (
  code text primary key,
  payload jsonb not null,
  expires_at timestamptz not null
);

create index if not exists game_handoffs_expires_at on public.game_handoffs (expires_at);

alter table public.game_handoffs enable row level security;

-- No public policies: only Edge Functions using the service role insert/select.
