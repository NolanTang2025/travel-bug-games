import type { MemeTrend } from "@/data/memeTrends";

/** Riso gradient placeholder when user skips a personal photo. */
export function trendPlaceholderDataUrl(trend: MemeTrend): string {
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 600;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  }

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#f9c5d5");
  grad.addColorStop(0.45, "#f6e58d");
  grad.addColorStop(1, "#7ed6df");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(26,26,46,0.85)";
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  ctx.font = "72px serif";
  ctx.textAlign = "center";
  ctx.fillText(trend.emoji, canvas.width / 2, canvas.height * 0.42);

  ctx.font = "bold 28px monospace";
  ctx.fillStyle = "rgba(26,26,46,0.9)";
  const label = trend.title.toUpperCase().slice(0, 14);
  ctx.fillText(label, canvas.width / 2, canvas.height * 0.58);

  ctx.font = "18px monospace";
  ctx.fillStyle = "rgba(26,26,46,0.55)";
  ctx.fillText("MNEMO TREND PRESS", canvas.width / 2, canvas.height * 0.66);

  return canvas.toDataURL("image/jpeg", 0.88);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Prefer user photo; else trend cover; else generated riso card. */
export async function resolveTrendPhotoDataUrl(
  trend: MemeTrend,
  userPhoto: string | null,
): Promise<string> {
  if (userPhoto) return userPhoto;
  if (trend.coverUrl) {
    try {
      const res = await fetch(trend.coverUrl, { mode: "cors" });
      if (res.ok) return blobToDataUrl(await res.blob());
    } catch {
      /* fall through to canvas placeholder */
    }
  }
  return trendPlaceholderDataUrl(trend);
}
