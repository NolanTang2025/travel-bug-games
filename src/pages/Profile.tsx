import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Mail, Sparkles, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/riso/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { listUserArchives } from "@/lib/archiveApi";
import { BRAND_NAME } from "@/lib/brand";
import { getGeneratedGames } from "@/lib/creativeStorage";
import {
  formatMemberSince,
  getAuthProviderLabel,
  getUserAvatarUrl,
  getUserDisplayName,
  getUserInitials,
} from "@/lib/userProfile";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [archiveCount, setArchiveCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    listUserArchives()
      .then((rows) => setArchiveCount(rows.length))
      .catch(() => setArchiveCount(0));
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.message("Signed out");
    navigate("/", { replace: true });
  };

  if (!user) return null;

  const name = getUserDisplayName(user);
  const avatarUrl = getUserAvatarUrl(user);
  const localGames = getGeneratedGames().length;

  return (
    <section className="mx-auto w-full max-w-lg px-4 py-10 sm:py-14">
      <PageHeader
        eyebrow={`${BRAND_NAME} · Profile`}
        title={
          <>
            Hey, <span className="text-riso-pink">{name}</span>
          </>
        }
        lead="Your account, saved work, and quick links in one place."
      />

      <div className="riso-card rotate--1 mb-6">
        <div className="flex items-center gap-4">
          <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-riso-ink bg-riso-pink font-display text-lg text-background shadow-pop-sm">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              getUserInitials(user)
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl text-riso-ink truncate">{name}</p>
            {user.email && (
              <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-muted-foreground truncate">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {user.email}
              </p>
            )}
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {getAuthProviderLabel(user)} · Member since {formatMemberSince(user)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="sticker-sm rounded-xl bg-riso-cyan/25 p-4 rotate-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Archives</p>
          <p className="mt-1 font-display text-3xl text-riso-ink">
            {archiveCount === null ? "…" : archiveCount}
          </p>
        </div>
        <div className="sticker-sm rounded-xl bg-riso-yellow/35 p-4 -rotate-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Local games</p>
          <p className="mt-1 font-display text-3xl text-riso-ink">{localGames}</p>
        </div>
      </div>

      <div className="riso-card space-y-3 rotate-1">
        <p className="riso-eyebrow">Quick links</p>
        <Link to="/twin" className="riso-btn-google w-full justify-start">
          <UserCircle className="h-4 w-4" />
          Open Twin
        </Link>
        <Link to="/games/ai-create" className="riso-btn-primary w-full justify-start">
          <Sparkles className="h-4 w-4" />
          Make a game
        </Link>
        <Link to="/journal" className="riso-btn-secondary w-full justify-start">
          Open Journal
        </Link>
      </div>

      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="mt-6 riso-link inline-flex items-center gap-2 w-full justify-center"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </section>
  );
};

export default Profile;
