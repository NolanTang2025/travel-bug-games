import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { bytesToDataUrl } from "./socialTypes.ts";

const MAX_IMAGES = 4;
const MAX_BYTES_PER_IMAGE = 1_500_000;

function mimeFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

/** Moonshot CN rejects remote signed URLs — embed storage files as data URLs. */
export async function archiveMediaAsVisionContent(
  admin: SupabaseClient,
  storagePaths: string[],
): Promise<{ type: string; image_url: { url: string } }[]> {
  const out: { type: string; image_url: { url: string } }[] = [];

  for (const path of storagePaths.slice(0, MAX_IMAGES)) {
    const { data: file, error } = await admin.storage.from("archive-media").download(path);
    if (error || !file) {
      console.warn("archive-media download failed:", path, error?.message);
      continue;
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_BYTES_PER_IMAGE) {
      console.warn("archive-media skip (size):", path, bytes.length);
      continue;
    }

    out.push({
      type: "image_url",
      image_url: { url: bytesToDataUrl(bytes, mimeFromPath(path)) },
    });
  }

  return out;
}
