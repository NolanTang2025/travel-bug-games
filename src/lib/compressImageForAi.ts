const MAX_EDGE = 640;
const JPEG_QUALITY = 0.72;

/** 缩小照片再发给 AI，显著减少上传与 vision 耗时 */
export async function compressImageForAi(dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith("data:image/")) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
      if (scale >= 1 && dataUrl.length < 280_000) {
        resolve(dataUrl);
        return;
      }
      const w = Math.max(1, Math.round(width * scale));
      const h = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function compressPhotosForAi(dataUrls: string[]): Promise<string[]> {
  const first = dataUrls[0];
  if (!first) return [];
  const compressed = await compressImageForAi(first);
  return [compressed];
}
