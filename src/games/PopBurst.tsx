import { useEffect, useState } from "react";

type Pop = { id: number; x: number; y: number; text: string; tone: "good" | "bad" };

let popId = 0;

export function usePopBursts() {
  const [pops, setPops] = useState<Pop[]>([]);

  const burst = (x: number, y: number, text: string, tone: "good" | "bad" = "good") => {
    const id = ++popId;
    setPops((prev) => [...prev, { id, x, y, text, tone }]);
    setTimeout(() => setPops((prev) => prev.filter((p) => p.id !== id)), 700);
  };

  const PopLayer = () => (
    <>
      {pops.map((p) => (
        <span
          key={p.id}
          className={`absolute z-40 pointer-events-none font-display text-lg sm:text-xl animate-in fade-in zoom-in-95 duration-300 ${
            p.tone === "good" ? "text-riso-yellow" : "text-riso-pink"
          }`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: "translate(-50%, -50%)",
            animation: "game-pop 700ms ease-out forwards",
          }}
        >
          {p.text}
        </span>
      ))}
    </>
  );

  return { burst, PopLayer };
}

export function useKeyboard(onKey: (key: string) => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      onKey(e.key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onKey, enabled]);
}
