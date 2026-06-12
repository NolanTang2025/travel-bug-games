import { ComingSoon } from "@/components/ComingSoon";
import { pausedCopy, type PausedRoute } from "@/lib/launchGate";

export function LaunchPausedRoute({ route }: { route: PausedRoute }) {
  const copy = pausedCopy(route);
  return (
    <ComingSoon
      eyebrow={copy.eyebrow}
      title={copy.title}
      tag={copy.tag}
      blurb={copy.blurb}
      tone={copy.tone}
    />
  );
}
