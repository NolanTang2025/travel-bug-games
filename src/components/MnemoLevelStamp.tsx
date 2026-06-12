import { BRAND_NAME } from "@/lib/brand";
import { MNEMO_PRESS, MNEMO_STAMP_INTRO, MNEMO_STAMP_OVER } from "@/lib/mnemoGameCopy";

type Variant = "intro" | "play" | "over" | "tutorial";

const COPY: Record<Variant, string> = {
  intro: MNEMO_STAMP_INTRO,
  play: MNEMO_PRESS,
  over: MNEMO_STAMP_OVER,
  tutorial: `${BRAND_NAME} · HOW TO PLAY`,
};

export function MnemoLevelStamp({ variant, className = "" }: { variant: Variant; className?: string }) {
  return (
    <p
      className={[
        "font-mono text-[9px] uppercase tracking-[0.28em] text-riso-violet/90",
        className,
      ].join(" ")}
    >
      ▚ {COPY[variant]} ▚
    </p>
  );
}
