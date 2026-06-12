import { Camera, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import type { GameAssetSpec } from "@/games/templates/types";
import { assetsNeedingUpload } from "@/games/gameAssetResolve";
import type { AIGameTemplateSpec } from "@/games/templates/types";

type Props = {
  spec: AIGameTemplateSpec;
  onAddPhotos?: () => void;
};

export function GameAssetUploadPrompt({ spec, onAddPhotos }: Props) {
  const pending = assetsNeedingUpload(spec);
  if (!pending.length) return null;

  return (
    <div className="game-asset-upload-prompt mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="rounded-2xl border-2 border-riso-yellow/50 bg-black/50 p-4 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-riso-yellow/25 text-riso-yellow">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-riso-cyan mb-1">
              Missing cast members
            </p>
            <p className="font-hand text-lg text-white leading-snug mb-3">
              Mnemo invented sprites — but these need your receipts:
            </p>
            <ul className="space-y-2 mb-4">
              {pending.map((asset: GameAssetSpec) => (
                <li key={asset.role} className="rounded-xl bg-white/8 px-3 py-2">
                  <p className="font-display text-sm text-riso-yellow">{asset.displayName}</p>
                  {asset.uploadTease && (
                    <p className="font-mono text-[11px] text-white/75 mt-0.5 leading-relaxed">{asset.uploadTease}</p>
                  )}
                </li>
              ))}
            </ul>
            {onAddPhotos ? (
              <button
                type="button"
                onClick={onAddPhotos}
                className="sticker inline-flex w-full items-center justify-center gap-2 bg-riso-yellow py-3 font-display text-sm uppercase tracking-wide text-riso-ink min-h-[48px] active:scale-[0.98]"
              >
                <Camera className="h-4 w-4" />
                Add the shot → remix
              </button>
            ) : (
              <Link
                to="/games/ai-create"
                className="sticker inline-flex w-full items-center justify-center gap-2 bg-riso-yellow py-3 font-display text-sm uppercase tracking-wide text-riso-ink min-h-[48px]"
              >
                <Camera className="h-4 w-4" />
                Upload & remix
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GameAssetRevealStrip({ spec }: { spec: AIGameTemplateSpec }) {
  const ready = (spec.gameAssets ?? []).filter((a) => a.status === "ready" && a.spriteUrl);
  if (!ready.length) return null;

  return (
    <div className="game-asset-reveal mb-4 animate-in fade-in duration-700">
      <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/50 mb-2 text-center">
        Pressed from your trip
      </p>
      <div className="flex justify-center gap-3 flex-wrap">
        {ready.map((asset) => (
          <div key={asset.role} className="flex flex-col items-center gap-1">
            <div className="game-fly-target-aigc h-16 w-16 rounded-full border-2 border-riso-yellow/40 p-1 bg-black/30">
              <img src={asset.spriteUrl} alt="" className="h-full w-full object-contain drop-shadow-md" />
            </div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-riso-yellow max-w-[5rem] text-center truncate">
              {asset.displayName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
