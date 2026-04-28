/** Shared audio/haptics helpers for mini-game templates */

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function vibrate(ms: number) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // ignore
  }
}

export function beep(type: "good" | "bad" | "tick") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type === "bad" ? "square" : "sine";
    o.frequency.value = type === "good" ? 660 : type === "bad" ? 180 : 420;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(type === "bad" ? 0.08 : 0.05, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + (type === "tick" ? 0.06 : 0.12));
    o.start(now);
    o.stop(now + (type === "tick" ? 0.08 : 0.16));
    setTimeout(() => ctx.close().catch(() => {}), 220);
  } catch {
    // ignore
  }
}

export const isPhoneUa = () =>
  typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
