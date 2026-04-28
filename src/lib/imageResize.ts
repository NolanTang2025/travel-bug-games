/** Shrink data URLs so handoff payloads stay under typical limits. */
export function resizeDataUrl(
  dataUrl: string,
  maxWidth: number,
  quality: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) {
          resolve(dataUrl);
          return;
        }
        const scale = w > maxWidth ? maxWidth / w : 1;
        const cw = Math.round(w * scale);
        const ch = Math.round(h * scale);
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, cw, ch);
        const out = canvas.toDataURL("image/jpeg", quality);
        resolve(out);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
