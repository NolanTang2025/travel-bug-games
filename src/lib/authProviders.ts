/** Must match Supabase Dashboard → Auth → Custom provider identifier */
export const INSTAGRAM_OAUTH_PROVIDER = "custom:instagram";

export function supabaseAuthCallbackUrl(): string | null {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/auth/v1/callback`;
}
