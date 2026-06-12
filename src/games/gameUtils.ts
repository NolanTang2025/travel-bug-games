/** Difficulty 0→1 over game duration (elapsed ms / total ms). */
export function difficultyRamp(elapsedMs: number, totalMs: number): number {
  return Math.min(1, elapsedMs / Math.max(1, totalMs));
}

/** Spawn interval (ms) — decreases as difficulty rises. */
export function spawnInterval(baseMs: number, ramp: number, minMs: number): number {
  return Math.max(minMs, baseMs - ramp * (baseMs - minMs));
}

export type ComboState = {
  count: number;
  multiplier: number;
};

export function bumpCombo(prev: ComboState): ComboState {
  const count = prev.count + 1;
  const multiplier = count >= 8 ? 3 : count >= 4 ? 2 : 1;
  return { count, multiplier };
}

export function resetCombo(): ComboState {
  return { count: 0, multiplier: 1 };
}
