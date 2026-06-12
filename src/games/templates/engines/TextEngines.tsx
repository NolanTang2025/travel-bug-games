import { useCallback, useEffect, useMemo, useState } from "react";
import { GameCountdown } from "../../GameCountdown";
import { GameHUD } from "../../GameHUD";
import { containsCjk } from "@/lib/gameTextNormalize";
import type { AIGameTemplateSpec, TextRound, TextRoundOrder, TextRoundQuiz } from "../types";
import { isTextRoundOrder } from "../types";
import type { EngineProps } from "./shared";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function TextShell({
  spec,
  roundIndex,
  total,
  score,
  misses,
  ready,
  onReady,
  children,
}: {
  spec: AIGameTemplateSpec;
  roundIndex: number;
  total: number;
  score: number;
  misses: number;
  ready: boolean;
  onReady: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative w-full min-h-[100dvh] flex flex-col px-4 pb-8 pt-20"
      style={{ background: spec.background }}
    >
      {!ready && <GameCountdown onDone={onReady} />}
      <GameHUD
        hint={spec.instruction}
        pills={[
          { key: "round", label: `Q ${roundIndex + 1}/${total}` },
          { key: "score", label: `${score} pts`, className: "bg-riso-yellow text-riso-ink" },
          { key: "miss", label: `✗ ${misses}`, className: "bg-riso-pink/90 text-background" },
        ]}
      />
      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full gap-6">{children}</div>
    </div>
  );
}

function Feedback({ ok }: { ok: boolean | null }) {
  if (ok === null) return null;
  return (
    <p
      className={`text-center font-display text-lg animate-in fade-in ${
        ok ? "text-riso-yellow" : "text-riso-pink"
      }`}
    >
      {ok ? "✓ Correct" : "Try again…"}
    </p>
  );
}

function useTextRounds(spec: AIGameTemplateSpec): TextRound[] {
  return useMemo(() => spec.textRounds?.filter((r) => r.prompt) ?? [], [spec.textRounds]);
}

function useRoundFlow(rounds: TextRound[], ready: boolean, onEnd: EngineProps["onEnd"]) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [locked, setLocked] = useState(false);
  const total = Math.max(1, rounds.length);
  const round = rounds[idx];
  const done = idx >= total;

  const advance = useCallback(
    (correct: boolean) => {
      if (locked || !ready) return;
      setLocked(true);
      setFeedback(correct);
      if (correct) setScore((s) => s + 10);
      else setMisses((m) => m + 1);
      window.setTimeout(() => {
        setFeedback(null);
        setLocked(false);
        setIdx((i) => i + 1);
      }, 700);
    },
    [locked, ready],
  );

  useEffect(() => {
    if (ready && done && rounds.length > 0) {
      onEnd({ score, misses });
    }
  }, [ready, done, score, misses, onEnd, rounds.length]);

  return { idx, total, round, score, misses, feedback, locked, advance, done };
}

export function TextQuizEngine({ spec, onEnd }: EngineProps) {
  const rounds = useTextRounds(spec) as TextRoundQuiz[];
  const [ready, setReady] = useState(false);
  const { idx, total, round, score, misses, feedback, locked, advance, done } = useRoundFlow(
    rounds,
    ready,
    onEnd,
  );

  useEffect(() => {
    if (rounds.length === 0) onEnd({ score: 0, misses: 0 });
  }, [rounds.length, onEnd]);

  if (!rounds.length) return null;
  if (done) return null;
  const q = round as TextRoundQuiz;
  const opts = q.options?.slice(0, 4) ?? [];
  const optionStyle = opts.some(containsCjk) ? "normal-case tracking-normal" : "uppercase tracking-wide";

  return (
    <TextShell spec={spec} roundIndex={idx} total={total} score={score} misses={misses} ready={ready} onReady={() => setReady(true)}>
      <p className="font-mono text-2xl sm:text-3xl text-white text-center leading-snug drop-shadow-md tracking-wide">{q.prompt}</p>
      <Feedback ok={feedback} />
      <div className="grid gap-3">
        {opts.map((opt, i) => (
          <button
            key={i}
            type="button"
            disabled={locked || !ready}
            onClick={() => advance(i === q.correctIndex)}
            className={`sticker w-full rounded-2xl bg-background/95 text-riso-ink px-5 py-4 font-display text-left text-sm sm:text-base ${optionStyle} hover:bg-riso-yellow disabled:opacity-60 transition-colors`}
          >
            {opt}
          </button>
        ))}
      </div>
    </TextShell>
  );
}

export function TextFillEngine({ spec, onEnd }: EngineProps) {
  return <TextQuizEngine spec={spec} onEnd={onEnd} />;
}

export function TextChoiceEngine({ spec, onEnd }: EngineProps) {
  const rounds = useTextRounds(spec) as TextRoundQuiz[];
  const [ready, setReady] = useState(false);
  const { idx, total, round, score, misses, feedback, locked, advance, done } = useRoundFlow(
    rounds,
    ready,
    onEnd,
  );

  useEffect(() => {
    if (rounds.length === 0) onEnd({ score: 0, misses: 0 });
  }, [rounds.length, onEnd]);

  if (!rounds.length) return null;
  if (done) return null;
  const q = round as TextRoundQuiz;
  const opts = q.options?.slice(0, 2) ?? ["A", "B"];

  return (
    <TextShell spec={spec} roundIndex={idx} total={total} score={score} misses={misses} ready={ready} onReady={() => setReady(true)}>
      <p className="font-mono text-2xl sm:text-3xl text-white text-center leading-snug tracking-wide">{q.prompt}</p>
      <Feedback ok={feedback} />
      <div className="grid sm:grid-cols-2 gap-4">
        {opts.map((opt, i) => (
          <button
            key={i}
            type="button"
            disabled={locked || !ready}
            onClick={() => advance(i === q.correctIndex)}
            className="sticker min-h-[120px] rounded-2xl bg-background/95 text-riso-ink px-4 py-6 font-mono text-lg tracking-wide hover:bg-riso-cyan disabled:opacity-60"
          >
            {opt}
          </button>
        ))}
      </div>
    </TextShell>
  );
}

export function TextOrderEngine({ spec, onEnd }: EngineProps) {
  const rounds = useTextRounds(spec).filter(isTextRoundOrder) as TextRoundOrder[];
  const [ready, setReady] = useState(false);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [usedIdx, setUsedIdx] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const total = Math.max(1, rounds.length);
  const round = rounds[idx];
  const shuffled = useMemo(() => (round ? shuffle(round.tiles) : []), [round, idx]);
  const done = idx >= total;

  useEffect(() => {
    if (rounds.length === 0) onEnd({ score: 0, misses: 0 });
  }, [rounds.length, onEnd]);

  useEffect(() => {
    if (ready && done && rounds.length > 0) onEnd({ score, misses });
  }, [ready, done, score, misses, onEnd, rounds.length]);

  const onTile = (tileIdx: number) => {
    if (!round || feedback !== null || usedIdx.includes(tileIdx)) return;
    const word = shuffled[tileIdx];
    const expect = round.tiles[picked.length];
    if (word !== expect) {
      setMisses((m) => m + 1);
      setFeedback(false);
      window.setTimeout(() => {
        setFeedback(null);
        setPicked([]);
        setUsedIdx([]);
      }, 600);
      return;
    }
    const next = [...picked, word];
    const nextUsed = [...usedIdx, tileIdx];
    setPicked(next);
    setUsedIdx(nextUsed);
    if (next.length === round.tiles.length) {
      setScore((s) => s + 10);
      setFeedback(true);
      window.setTimeout(() => {
        setFeedback(null);
        setPicked([]);
        setUsedIdx([]);
        setIdx((i) => i + 1);
      }, 700);
    }
  };

  if (!rounds.length || done) return null;

  return (
    <TextShell spec={spec} roundIndex={idx} total={total} score={score} misses={misses} ready={ready} onReady={() => setReady(true)}>
      <p className="font-mono text-2xl text-white text-center tracking-wide">{round!.prompt}</p>
      <div className="min-h-[52px] flex flex-wrap justify-center gap-2 rounded-xl bg-black/30 px-3 py-3">
        {picked.length === 0 ? (
          <span className="font-mono text-xs text-white/50">Tap words in order</span>
        ) : (
          picked.map((w, i) => (
            <span key={i} className="sticker-sm bg-riso-yellow text-riso-ink px-3 py-1 font-display text-sm">
              {w}
            </span>
          ))
        )}
      </div>
      <Feedback ok={feedback} />
      <div className="flex flex-wrap justify-center gap-2">
        {shuffled.map((word, i) => (
          <button
            key={`${word}-${i}`}
            type="button"
            disabled={Boolean(feedback) || usedIdx.includes(i)}
            onClick={() => onTile(i)}
            className="sticker rounded-full bg-background text-riso-ink px-5 py-2 font-display text-sm disabled:opacity-40"
          >
            {word}
          </button>
        ))}
      </div>
    </TextShell>
  );
}
