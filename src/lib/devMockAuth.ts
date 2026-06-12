import type { Session, User } from "@supabase/supabase-js";

/** Local preview only — never enable in production builds. */
export const DEV_MOCK_AUTH_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_DEV_MOCK_AUTH === "true";

export function createDevMockUser(): User {
  return {
    id: "00000000-0000-4000-8000-000000000099",
    aud: "authenticated",
    role: "authenticated",
    email: "preview@mnemo.games",
    email_confirmed_at: "2025-06-01T00:00:00.000Z",
    phone: "",
    confirmed_at: "2025-06-01T00:00:00.000Z",
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: "google", providers: ["google"] },
    user_metadata: {
      full_name: "Iris Tang",
      name: "Iris Tang",
      avatar_url: "",
    },
    identities: [],
    created_at: "2025-01-15T08:00:00.000Z",
    updated_at: new Date().toISOString(),
    is_anonymous: false,
  } as User;
}

export function createDevMockSession(user: User): Session {
  const expiresAt = Math.floor(Date.now() / 1000) + 86_400;
  return {
    access_token: "dev-mock-access-token",
    token_type: "bearer",
    expires_in: 86_400,
    expires_at: expiresAt,
    refresh_token: "dev-mock-refresh-token",
    user,
  } as Session;
}
