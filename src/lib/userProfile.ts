import type { User } from "@supabase/supabase-js";

export function getUserDisplayName(user: User): string {
  const meta = user.user_metadata ?? {};
  const name = meta.full_name ?? meta.name ?? meta.user_name ?? meta.preferred_username;
  if (typeof name === "string" && name.trim()) return name.trim();
  const email = user.email?.split("@")[0];
  return email || "Member";
}

export function getUserAvatarUrl(user: User): string | null {
  const meta = user.user_metadata ?? {};
  const url = meta.avatar_url ?? meta.picture;
  return typeof url === "string" && url.trim() ? url.trim() : null;
}

export function getUserInitials(user: User): string {
  const name = getUserDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function getAuthProviderLabel(user: User): string {
  const provider = user.app_metadata?.provider;
  if (provider === "google") return "Google";
  if (provider === "email") return "Email";
  if (provider === "custom:instagram" || provider === "instagram") return "Instagram";
  if (typeof provider === "string" && provider.startsWith("custom:")) {
    return provider.replace("custom:", "").replace(/^\w/, (c) => c.toUpperCase());
  }
  return "Account";
}

export function formatMemberSince(user: User): string {
  const created = user.created_at;
  if (!created) return "—";
  return new Date(created).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
