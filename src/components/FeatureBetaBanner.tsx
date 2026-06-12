import { featureMeta, isFeatureBeta, type FeatureId } from "@/lib/launchGate";

type Props = {
  feature: FeatureId;
  className?: string;
};

export function FeatureBetaBanner({ feature, className = "" }: Props) {
  if (!isFeatureBeta(feature)) return null;

  const meta = featureMeta(feature);

  return (
    <div
      role="status"
      className={[
        "feature-beta-banner",
        meta.tone === "cyan" && "feature-beta-banner--cyan",
        meta.tone === "violet" && "feature-beta-banner--violet",
        meta.tone === "yellow" && "feature-beta-banner--yellow",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="feature-beta-badge" aria-hidden>
        BETA
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-riso-ink/80">
          {meta.bannerTitle}
        </p>
        <p className="mt-1.5 font-mono text-sm leading-relaxed text-riso-ink/90">{meta.bannerBody}</p>
      </div>
    </div>
  );
}
