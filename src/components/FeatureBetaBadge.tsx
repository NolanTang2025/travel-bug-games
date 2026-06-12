import { isFeatureBeta, type FeatureId } from "@/lib/launchGate";

export function FeatureBetaBadge({ feature }: { feature: FeatureId }) {
  if (!isFeatureBeta(feature)) return null;

  return (
    <span className="feature-beta-badge-sm" title="Private beta">
      BETA
    </span>
  );
}
