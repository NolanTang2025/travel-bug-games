import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type DanmakuColor = "pink" | "yellow" | "cyan" | "violet" | "ink";

type DanmakuRow = {
  id: string;
  message: string;
  color: DanmakuColor;
  created_at: string;
};

type FlyingDanmaku = DanmakuRow & {
  top: number;
  duration: number;
};

const COLOR_CLASS: Record<DanmakuColor, string> = {
  pink: "bg-riso-pink text-background",
  yellow: "bg-riso-yellow text-riso-ink",
  cyan: "bg-riso-cyan text-riso-ink",
  violet: "bg-riso-violet text-background",
  ink: "bg-riso-ink text-background",
};

const COLORS: DanmakuColor[] = ["pink", "yellow", "cyan", "violet", "ink"];
const RATE_KEY = "mnemo_danmaku_last";
const RATE_MS = 2500;
const MAX_LIVE = 40;

function pickColor(): DanmakuColor {
  return COLORS[Math.floor(Math.random() * COLORS.length)]!;
}

function pickTrack(): number {
  return 8 + Math.random() * 62;
}

function pickDuration(message: string): number {
  return Math.min(16, Math.max(9, 8 + message.length * 0.12));
}

type Props = {
  /** 生成游戏全屏 loading 时隐藏输入栏 */
  hidden?: boolean;
};

export function PlayDanmaku({ hidden }: Props) {
  const [flying, setFlying] = useState<FlyingDanmaku[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [total, setTotal] = useState(0);
  const seen = useRef(new Set<string>());

  const pushDanmaku = useCallback((row: DanmakuRow) => {
    if (seen.current.has(row.id)) return;
    seen.current.add(row.id);
    if (seen.current.size > 200) {
      const first = seen.current.values().next().value;
      if (first) seen.current.delete(first);
    }

    setTotal((n) => n + 1);
    const item: FlyingDanmaku = {
      ...row,
      top: pickTrack(),
      duration: pickDuration(row.message),
    };
    setFlying((prev) => [...prev.slice(-(MAX_LIVE - 1)), item]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRecent = async () => {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from("play_danmaku")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since);

      if (!cancelled && !error) setTotal(count ?? 0);
    };

    void loadRecent();

    const channel = supabase
      .channel("play-danmaku-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "play_danmaku" },
        (payload) => {
          const row = payload.new as DanmakuRow;
          pushDanmaku(row);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [pushDanmaku]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const message = text.trim();
    if (!message) return;
    if (message.length > 80) {
      toast.error("Comments are limited to 80 characters");
      return;
    }

    const last = Number(localStorage.getItem(RATE_KEY) || "0");
    if (Date.now() - last < RATE_MS) {
      toast.message("Wait a moment before sending again");
      return;
    }

    setSending(true);
    const color = pickColor();
    const { error } = await supabase.from("play_danmaku").insert({ message, color });

    setSending(false);
    if (error) {
      toast.error("Send failed — try again later");
      return;
    }

    localStorage.setItem(RATE_KEY, String(Date.now()));
    setText("");
  };

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-[55] overflow-hidden"
        aria-live="polite"
        aria-label="Live comments"
      >
        {flying.map((d) => (
          <span
            key={d.id}
            className={[
              "danmaku-fly sticker-sm absolute whitespace-nowrap rounded-full px-3 py-1.5",
              "font-hand text-lg sm:text-xl shadow-pop-sm max-w-[min(90vw,420px)] truncate",
              COLOR_CLASS[d.color] ?? COLOR_CLASS.pink,
            ].join(" ")}
            style={{
              top: `${d.top}%`,
              animationDuration: `${d.duration}s`,
            }}
            onAnimationEnd={() => {
              setFlying((prev) => prev.filter((x) => x.id !== d.id));
            }}
          >
            {d.message}
          </span>
        ))}
      </div>

      {!hidden && (
        <div className="fixed bottom-0 left-0 right-0 z-[65] border-t-2 border-riso-ink bg-background/95 backdrop-blur-sm px-3 py-3 sm:px-4">
          <form
            onSubmit={(e) => void send(e)}
            className="mx-auto flex max-w-[640px] items-center gap-2"
          >
            <div className="hidden sm:flex items-center gap-1.5 shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5 text-riso-pink" />
              <span>{total > 0 ? `${total} live` : "Say something"}</span>
            </div>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={80}
              placeholder="Say something…"
              className="riso-input mt-0 flex-1 min-w-0 py-2.5"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="riso-btn-primary shrink-0 !px-4 !py-2.5 text-xs"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
