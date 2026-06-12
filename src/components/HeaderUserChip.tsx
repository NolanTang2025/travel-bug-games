import { Link, useLocation } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { getUserAvatarUrl, getUserDisplayName, getUserInitials } from "@/lib/userProfile";

export function HeaderUserChip({ user }: { user: User }) {
  const { pathname } = useLocation();
  const name = getUserDisplayName(user);
  const avatarUrl = getUserAvatarUrl(user);
  const active = pathname.startsWith("/profile");

  return (
    <Link
      to="/profile"
      title={`${name} — Profile`}
      aria-label={`${name} profile`}
      className={[
        "relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-riso-ink font-display text-[11px] text-background shadow-pop-sm transition-transform hover:rotate-[-6deg]",
        active ? "bg-riso-yellow ring-2 ring-riso-pink ring-offset-2" : "bg-riso-pink",
      ].join(" ")}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        getUserInitials(user)
      )}
    </Link>
  );
}
