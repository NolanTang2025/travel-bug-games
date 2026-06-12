import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GoogleIcon } from "@/components/riso/GoogleIcon";
import { InstagramIcon } from "@/components/riso/InstagramIcon";
import { PageHeader } from "@/components/riso/PageHeader";
import { INSTAGRAM_OAUTH_PROVIDER } from "@/lib/authProviders";
import { BRAND_FULL, BRAND_NAME } from "@/lib/brand";
import { setLoginReturn, takeLoginReturn } from "@/lib/creativeStorage";

function authErrorMessage(err: { message?: string; msg?: string }): string {
  const raw = err.message ?? err.msg ?? "";
  if (raw.includes("provider is not enabled") || raw.includes("Unsupported provider")) {
    return "This sign-in method is not enabled yet. Try email or ask an admin to enable the provider in Supabase.";
  }
  if (raw.includes("signup_disabled")) {
    return "New sign-ups are disabled. Try again later.";
  }
  return raw || "Sign-in failed. Please try again.";
}

const Login = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromRef = useRef<string | null>(null);
  if (fromRef.current === null) {
    fromRef.current =
      takeLoginReturn() ??
      (location.state as { from?: string })?.from ??
      "/games/ai-create";
  }
  const from = fromRef.current;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate(from, { replace: true });
  }, [user, authLoading, navigate, from]);

  const signInWithOAuthProvider = async (provider: "google" | typeof INSTAGRAM_OAUTH_PROVIDER) => {
    setLoading(true);
    setLoginReturn(from);
    const redirectTo = `${window.location.origin}/login`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) toast.error(authErrorMessage(error));
    setLoading(false);
  };

  const signInWithMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Enter your email");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}${from}` },
    });
    setLoading(false);
    if (error) toast.error(authErrorMessage(error));
    else {
      setSent(true);
      toast.success("Sign-in link sent — check your inbox");
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-riso-pink" />
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-md px-4 py-14 sm:py-20">
      <PageHeader
        eyebrow={BRAND_FULL}
        title={
          <>
            Sign in to <span className="text-riso-pink">{BRAND_NAME}</span>
          </>
        }
        lead="Sign in before generating. Photos and journal drafts auto-save on your device — pick up where you left off after login."
      />

      <div className="riso-card space-y-5 rotate--1">
        {sent ? (
          <p className="font-hand text-xl text-center text-riso-ink py-4 leading-snug">
            We sent a sign-in link to <strong>{email}</strong>. Open it on this device.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void signInWithOAuthProvider("google")}
              disabled={loading}
              className="riso-btn-google group w-full"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-riso-ink bg-background shadow-pop-sm transition-transform group-hover:rotate-[-6deg]">
                <GoogleIcon className="h-[18px] w-[18px]" />
              </span>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => void signInWithOAuthProvider(INSTAGRAM_OAUTH_PROVIDER)}
              disabled={loading}
              className="riso-btn-google group w-full"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-riso-ink bg-background shadow-pop-sm transition-transform group-hover:rotate-[6deg]">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-riso-ink" />
                ) : (
                  <InstagramIcon className="h-[18px] w-[18px]" />
                )}
              </span>
              Continue with Instagram
            </button>

            <div className="riso-divider">
              <span className="riso-divider-line" />
              <span className="riso-eyebrow tracking-widest">or</span>
              <span className="riso-divider-line" />
            </div>

            <form onSubmit={signInWithMagicLink} className="space-y-3">
              <label className="block">
                <span className="riso-label">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="riso-input"
                  autoComplete="email"
                />
              </label>
              <button type="submit" disabled={loading} className="riso-btn-primary w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" strokeWidth={2.4} />}
                Email me a link
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-center">
        <Link to="/" className="riso-link">
          ← Back to home
        </Link>
      </p>
    </section>
  );
};

export default Login;
