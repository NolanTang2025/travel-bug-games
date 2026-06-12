import { useCallback, useState } from "react";
import {
  BookOpen,
  Copy,
  FileText,
  Play,
  Share2,
  Smartphone,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import type { AIGameTemplateSpec, JourneyBeat } from "@/games/templates/types";
import { isTextEngine } from "@/games/templates/types";
import { formatTemplateId } from "@/lib/formatTemplateId";
import { GameMechanicPreview } from "@/components/GameMechanicPreview";
import { GameAssetRevealStrip, GameAssetUploadPrompt } from "@/components/GameAssetUploadPrompt";
import { MnemoLevelStamp } from "@/components/MnemoLevelStamp";
import { resolveGameSprite } from "@/games/gameAssetResolve";

type TabId = "cover" | "post" | "lore";

type Props = {
  spec: AIGameTemplateSpec;
  beat?: JourneyBeat;
  photos: string[];
  shareCaption: string;
  engineLabel: string;
  /** Mobile WebView embed — tighter layout, no decorative overflow */
  compact?: boolean;
  onCopyShare: () => void;
  onTutorial: () => void;
  onSkip: () => void;
};

const TABS: { id: TabId; label: string; icon: typeof Sparkles }[] = [
  { id: "cover", label: "Cover", icon: Sparkles },
  { id: "post", label: "Post", icon: Smartphone },
  { id: "lore", label: "Lore", icon: FileText },
];

export function GameLevelIntro({
  spec,
  beat,
  photos,
  shareCaption,
  engineLabel,
  compact = false,
  onCopyShare,
  onTutorial,
  onSkip,
}: Props) {
  const [tab, setTab] = useState<TabId>("cover");
  const [photoIdx, setPhotoIdx] = useState(0);

  const cyclePhoto = useCallback(() => {
    if (photos.length <= 1) return;
    setPhotoIdx((i) => (i + 1) % photos.length);
  }, [photos.length]);

  const heroPhoto = photos[photoIdx] ?? photos[0];
  const stack: string[] =
    photos.length === 0
      ? []
      : photos.length === 1
        ? [photos[0]]
        : [
            photos[(photoIdx + 2) % photos.length],
            photos[(photoIdx + 1) % photos.length],
            photos[photoIdx],
          ];

  const durationLabel = isTextEngine(spec.engine)
    ? `${spec.textRounds?.length ?? 3} rounds`
    : `${spec.duration}s`;

  const targetSprite = resolveGameSprite(spec, "target", photos);
  const obstacleSprite = resolveGameSprite(spec, "obstacle", photos);

  return (
    <div
      className={[
        "game-level-scene relative z-10 flex min-h-screen flex-col pb-36 sm:pb-40",
        compact ? "game-level-scene--compact pt-14" : "pt-20 sm:pt-24",
      ].join(" ")}
    >
      <div className="game-level-grain pointer-events-none" aria-hidden />
      <div className="game-level-scanlines pointer-events-none" aria-hidden />
      <div className="game-level-float-layer pointer-events-none" aria-hidden>
        <span className="game-level-float-emoji game-level-float-a">{spec.targetEmoji}</span>
        <span className="game-level-float-emoji game-level-float-b">{spec.obstacleEmoji}</span>
        <span className="game-level-float-emoji game-level-float-c">{spec.targetEmoji}</span>
      </div>

      <div className="mx-auto w-full max-w-xl flex-1 px-4 sm:px-6">
        {/* Tab rail */}
        <div className="game-level-tabs game-level-rise mb-4 flex gap-1.5 p-1" style={{ animationDelay: "0ms" }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={[
                "game-level-tab flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 font-mono text-[10px] uppercase tracking-wider transition-all",
                tab === id ? "game-level-tab-active" : "game-level-tab-idle",
              ].join(" ")}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Cover panel */}
        {tab === "cover" && (
          <div key="cover" className="game-level-panel game-level-rise" style={{ animationDelay: "40ms" }}>
            <div className="game-level-hero mb-4">
              <button
                type="button"
                onClick={cyclePhoto}
                className="game-level-polaroid-stack group"
                aria-label={photos.length > 1 ? "Cycle trip photos" : undefined}
              >
                {stack.length > 0 ? (
                  stack.map((src, i) => (
                    <img
                      key={`${src}-${i}`}
                      src={src}
                      alt=""
                      className={[
                        "game-level-polaroid transition-transform duration-300 group-hover:scale-[1.02]",
                        i === stack.length - 1 ? "game-level-polaroid-front" : i === stack.length - 2 ? "game-level-polaroid-mid" : "game-level-polaroid-back",
                      ].join(" ")}
                    />
                  ))
                ) : (
                  <div
                    className="game-level-polaroid game-level-polaroid-front game-level-polaroid-empty flex items-center justify-center overflow-hidden"
                    style={{ background: spec.background }}
                    aria-hidden
                  >
                    <span className="text-5xl drop-shadow-md">{spec.targetEmoji}</span>
                  </div>
                )}
                {photos.length > 1 && (
                  <span className="game-level-photo-count font-mono text-[9px] uppercase tracking-wider">
                    tap · {photoIdx + 1}/{photos.length}
                  </span>
                )}
              </button>

              <div className="game-level-hero-copy">
                <MnemoLevelStamp variant="intro" className="text-white/75 mb-2" />
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="game-level-pill game-level-pill-pink">{engineLabel}</span>
                  <span className="game-level-pill game-level-pill-cyan">{durationLabel}</span>
                  <span className="game-level-pill game-level-pill-muted">{formatTemplateId(spec.templateId)}</span>
                </div>
                <h1 className="game-level-title text-white mb-2">
                  <span className="text-chroma-lg break-words">{spec.title}</span>
                </h1>
                <p className="game-level-tagline mb-2 text-base sm:text-lg text-riso-cyan/95">{spec.tagline}</p>
              </div>
            </div>

            <div className="game-level-preview-row">
              <GameMechanicPreview spec={spec} />
              <div className="game-level-stat-strip">
                <div className="game-level-stat">
                  <span className="game-level-stat-emoji">{spec.targetEmoji}</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-white/70">Collect</span>
                </div>
                <div className="game-level-stat">
                  <span className="game-level-stat-emoji">{spec.obstacleEmoji}</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-white/70">Dodge</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Post panel — phone mockup */}
        {tab === "post" && shareCaption && (
          <div key="post" className="game-level-panel game-level-rise" style={{ animationDelay: "40ms" }}>
            <div className="game-level-phone">
              <div className="game-level-phone-notch" />
              <div className="game-level-phone-screen">
                {heroPhoto && (
                  <img src={heroPhoto} alt="" className="game-level-phone-bg" />
                )}
                <div className="game-level-phone-gradient" />
                <div className="game-level-phone-ui">
                  <div className="game-level-phone-side">
                    <span className="game-level-phone-action">♥</span>
                    <span className="game-level-phone-action">↗</span>
                  </div>
                  <div className="game-level-phone-caption">
                    <p className="font-mono text-[8px] uppercase tracking-widest text-white/60 mb-2">
                      @you · Reels draft
                    </p>
                    <p className="game-level-phone-caption-text">{shareCaption}</p>
                  </div>
                </div>
              </div>
            </div>
            <button type="button" onClick={onCopyShare} className="game-dock-secondary mt-4">
              <Copy className="h-4 w-4" />
              Copy caption
            </button>
            <p className="mt-3 text-center font-mono text-[10px] text-white/50 uppercase tracking-wider">
              Paste to TikTok · Reels · Story
            </p>
          </div>
        )}

        {tab === "post" && !shareCaption && (
          <div className="game-level-panel game-level-empty font-mono text-sm text-white/60 text-center py-12">
            No caption yet — play first, then share your run.
          </div>
        )}

        {/* Lore panel */}
        {tab === "lore" && beat && (
          <div key="lore" className="game-level-panel game-level-rise" style={{ animationDelay: "40ms" }}>
            <div className="game-level-zine">
              <span className="game-level-tape game-level-tape-left" aria-hidden />
              <span className="game-level-tape game-level-tape-right" aria-hidden />
              <p className="riso-eyebrow flex items-center gap-1.5 mb-3">
                <Share2 className="h-3.5 w-3.5 text-riso-pink" />
                The bit we exaggerated
              </p>
              <p className="font-tech text-lg sm:text-xl leading-tight mb-3 text-riso-ink">{beat.headline}</p>
              <blockquote className="game-level-pullquote text-base sm:text-lg text-riso-ink/88 mb-4">
                &ldquo;{beat.moment}&rdquo;
              </blockquote>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-3">{beat.twist}</p>
              {beat.mnemoQuip && (
                <p className="font-mono text-xs text-riso-violet mb-4 border-t border-riso-ink/10 pt-3 tracking-wide">
                  {beat.mnemoQuip}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="game-level-mechanic game-level-mechanic-collect">
                  <p className="font-mono text-[9px] uppercase tracking-wider opacity-70 flex items-center gap-1">
                    <Target className="h-3 w-3" /> Collect
                  </p>
                  <p className="font-display text-2xl mt-1 leading-none flex items-center justify-center min-h-[2rem]">
                    {targetSprite.src ? (
                      <img src={targetSprite.src} alt="" className="h-10 w-10 object-contain drop-shadow-md" />
                    ) : (
                      spec.targetEmoji
                    )}
                  </p>
                  <p className="font-display text-sm mt-1">{targetSprite.displayName ?? beat.treasure}</p>
                </div>
                <div className="game-level-mechanic game-level-mechanic-dodge">
                  <p className="font-mono text-[9px] uppercase tracking-wider opacity-70 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Dodge
                  </p>
                  <p className="font-display text-2xl mt-1 leading-none flex items-center justify-center min-h-[2rem]">
                    {obstacleSprite.src ? (
                      <img src={obstacleSprite.src} alt="" className="h-10 w-10 object-contain drop-shadow-md" />
                    ) : (
                      spec.obstacleEmoji
                    )}
                  </p>
                  <p className="font-display text-sm mt-1">{obstacleSprite.displayName ?? beat.villain}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "lore" && !beat && (
          <div className="game-level-panel game-level-empty font-mono text-sm text-white/60 text-center py-12">
            Journal lore loads with your generated run.
          </div>
        )}
      </div>

      {/* Sticky CTAs */}
      <div className="game-level-dock">
        <div className="game-dock-panel">
          <p className="game-dock-label">Mnemo · ready to play</p>
          <GameAssetRevealStrip spec={spec} />
          <GameAssetUploadPrompt spec={spec} />
          <button type="button" onClick={onTutorial} className="game-dock-primary">
            <BookOpen className="h-4 w-4" />
            How to play
          </button>
          <button type="button" onClick={onSkip} className="game-dock-secondary">
            <Play className="h-4 w-4 fill-current" />
            Jump in
          </button>
        </div>
      </div>
    </div>
  );
}
