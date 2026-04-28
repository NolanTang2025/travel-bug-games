import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/context/LocaleContext";
import { applySnapshotToSession, retrieveHandoffSnapshot } from "@/lib/handoff";

export default function GameJoin() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [code, setCode] = useState(() =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("code")?.toUpperCase() ?? ""
      : "",
  );
  const [busy, setBusy] = useState(false);
  const autoTried = useRef(false);

  const runJoin = useCallback(
    async (raw: string) => {
      const c = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
      if (c.length < 4) {
        toast.error(t("joinInvalid"));
        return;
      }
      setBusy(true);
      try {
        const snap = await retrieveHandoffSnapshot(c);
        applySnapshotToSession(snap);
        navigate("/games/ai-play", { replace: true });
      } catch {
        autoTried.current = false;
        toast.error(t("joinInvalid"));
      } finally {
        setBusy(false);
      }
    },
    [navigate, t],
  );

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("code");
    if (!q || autoTried.current) return;
    autoTried.current = true;
    void runJoin(q);
    // Intentionally once on mount — URL query handoff from QR
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <h1 className="text-2xl font-black mb-2">{t("joinTitle")}</h1>
      <p className="text-muted-foreground text-sm mb-8">{t("joinSubtitle")}</p>

      {busy ? (
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      ) : (
        <form
          className="w-full space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void runJoin(code);
          }}
        >
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            className="text-center text-lg tracking-[0.3em] font-mono h-14 rounded-xl"
            maxLength={8}
            autoCapitalize="characters"
          />
          <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={busy}>
            {t("joinSubmit")}
          </Button>
        </form>
      )}
    </div>
  );
}
