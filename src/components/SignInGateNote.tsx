import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";

type Props = {
  /** Where to return after sign-in */
  returnTo: string;
  className?: string;
};

/** Explains why sign-in is needed before AI generation — shown early, not at the last click. */
export function SignInGateNote({ returnTo, className = "" }: Props) {
  return (
    <div
      className={[
        "sticker-sm rounded-2xl border-2 border-riso-violet/35 bg-riso-violet/8 px-4 py-4 sm:px-5",
        className,
      ].join(" ")}
    >
      <p className="font-display text-sm uppercase tracking-wide text-riso-ink mb-1.5 flex items-center gap-2">
        <LogIn className="h-4 w-4 text-riso-violet" />
        Sign in to press your game
      </p>
      <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-3">
        We save your game to your account, add it to Journal, and give you a shareable link.
        Your draft stays on this device until you sign in.
      </p>
      <Link
        to="/login"
        state={{ from: returnTo }}
        className="riso-btn-secondary text-xs py-2 px-4 inline-flex"
      >
        Sign in or create account
      </Link>
    </div>
  );
}
