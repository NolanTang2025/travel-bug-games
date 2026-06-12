import { supabase } from "@/integrations/supabase/client";
import type { DiaryPhoto } from "@/components/DiaryPhotoUpload";
import { deriveArchiveTitle } from "@/lib/archiveTitle";
import { removeGeneratedGamesByArchiveId } from "@/lib/creativeStorage";
import { invokeEdge } from "@/lib/invokeEdge";
import {
  cacheMediaFromSignedUrl,
  getCachedMediaObjectUrl,
  getCachedMediaObjectUrls,
  removeCachedMedia,
} from "@/lib/mediaImageCache";

export type ArchiveSummary = {
  title: string;
  places: string[];
  timeline: { date: string; note: string }[];
  mood: string[];
  topics: string[];
  voice_notes: string;
  one_line_persona: string;
};

export type UserArchive = {
  id: string;
  user_id: string;
  title: string | null;
  journal_text: string;
  summary_json: ArchiveSummary | null;
  status: "draft" | "ready" | "failed";
  created_at: string;
  updated_at: string;
};

export type ArchiveMedia = {
  id: string;
  archive_id: string;
  storage_path: string;
  sort_order: number;
  caption: string | null;
};

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function urlToDataUrl(url: string): Promise<string> {
  const absolute = url.startsWith("http") ? url : `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
  const res = await fetch(absolute);
  if (!res.ok) throw new Error(`Failed to load image: ${url}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function createArchiveWithRemoteImages(
  journalText: string,
  imageUrls: string[],
): Promise<{ archiveId: string }> {
  const photos: DiaryPhoto[] = [];
  for (const url of imageUrls.slice(0, 6)) {
    const dataUrl = await urlToDataUrl(url);
    photos.push({ id: crypto.randomUUID(), dataUrl });
  }
  return createArchiveWithPhotos(journalText, photos);
}

export async function createArchiveWithPhotos(
  journalText: string,
  photos: DiaryPhoto[],
): Promise<{ archiveId: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const title = deriveArchiveTitle(journalText);
  const { data: archive, error: archErr } = await supabase
    .from("user_archives")
    .insert({
      user_id: user.id,
      journal_text: journalText,
      title,
      status: "draft",
    })
    .select("id")
    .single();

  if (archErr || !archive) throw archErr ?? new Error("Failed to create archive");

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const ext = photo.dataUrl.includes("image/png") ? "png" : "jpg";
    const path = `${user.id}/${archive.id}/${crypto.randomUUID()}.${ext}`;
    const blob = dataUrlToBlob(photo.dataUrl);

    const { error: upErr } = await supabase.storage
      .from("archive-media")
      .upload(path, blob, { contentType: blob.type, upsert: false });

    if (upErr) throw upErr;

    const { error: mediaErr } = await supabase.from("archive_media").insert({
      archive_id: archive.id,
      user_id: user.id,
      storage_path: path,
      sort_order: i,
    });

    if (mediaErr) throw mediaErr;
  }

  return { archiveId: archive.id };
}

export async function generateArchive(archiveId: string): Promise<ArchiveSummary> {
  const data = await invokeEdge<{ summary: ArchiveSummary }>("generate-archive", { archiveId });
  return data.summary;
}

export async function fetchArchive(id: string): Promise<UserArchive | null> {
  const { data, error } = await supabase
    .from("user_archives")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as UserArchive | null;
}

export async function fetchArchiveMedia(archiveId: string): Promise<ArchiveMedia[]> {
  const { data, error } = await supabase
    .from("archive_media")
    .select("*")
    .eq("archive_id", archiveId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as ArchiveMedia[];
}

export async function getSignedMediaUrl(storagePath: string): Promise<string | null> {
  const batch = await getSignedMediaUrls([storagePath]);
  return batch[storagePath] ?? null;
}

const signedUrlCache = new Map<string, { url: string; expires: number }>();

/** Batch sign cover paths — one storage round-trip instead of N */
export async function getSignedMediaUrls(storagePaths: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(storagePaths.filter(Boolean))];
  if (!unique.length) return {};

  const now = Date.now();
  const out: Record<string, string> = {};
  const missing: string[] = [];

  for (const path of unique) {
    const hit = signedUrlCache.get(path);
    if (hit && hit.expires > now) out[path] = hit.url;
    else missing.push(path);
  }

  if (missing.length) {
    const { data, error } = await supabase.storage
      .from("archive-media")
      .createSignedUrls(missing, 3600);
    if (!error && data) {
      const ttl = now + 50 * 60 * 1000;
      for (const row of data) {
        if (row.signedUrl && row.path) {
          out[row.path] = row.signedUrl;
          signedUrlCache.set(row.path, { url: row.signedUrl, expires: ttl });
        }
      }
    }
  }

  return out;
}

/** First cover storage_path per archive — single DB query */
export async function fetchArchiveCoverPaths(archiveIds: string[]): Promise<Record<string, string>> {
  if (!archiveIds.length) return {};
  const { data, error } = await supabase
    .from("archive_media")
    .select("archive_id, storage_path, sort_order")
    .in("archive_id", archiveIds)
    .order("sort_order");
  if (error) throw error;

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    const id = row.archive_id as string;
    if (!map[id]) map[id] = row.storage_path as string;
  }
  return map;
}

export async function resolveArchiveCoverUrls(archiveIds: string[]): Promise<Record<string, string>> {
  return resolveArchiveThumbUrls(archiveIds);
}

/** Local IndexedDB blob first; fetch + persist only for cache misses. */
export async function resolveDisplayUrlForPath(storagePath: string): Promise<string | null> {
  const cached = await getCachedMediaObjectUrl(storagePath);
  if (cached) return cached;

  const signed = await getSignedMediaUrl(storagePath);
  if (!signed) return null;

  const local = await cacheMediaFromSignedUrl(storagePath, signed);
  return local ?? signed;
}

export async function resolveDisplayUrlsForPaths(
  storagePaths: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(storagePaths.filter(Boolean))];
  if (!unique.length) return {};

  const out = await getCachedMediaObjectUrls(unique);
  const missing = unique.filter((p) => !out[p]);
  if (!missing.length) return out;

  const signed = await getSignedMediaUrls(missing);
  await Promise.all(
    missing.map(async (path) => {
      const url = signed[path];
      if (!url) return;
      const local = await cacheMediaFromSignedUrl(path, url);
      out[path] = local ?? url;
    }),
  );
  return out;
}

/** Journal / list cover thumbnails keyed by archive id. */
export async function resolveArchiveThumbUrls(archiveIds: string[]): Promise<Record<string, string>> {
  const pathsByArchive = await fetchArchiveCoverPaths(archiveIds);
  const byPath = await resolveDisplayUrlsForPaths(Object.values(pathsByArchive));
  const thumbs: Record<string, string> = {};
  for (const [archiveId, path] of Object.entries(pathsByArchive)) {
    const url = byPath[path];
    if (url) thumbs[archiveId] = url;
  }
  return thumbs;
}

/** Display URLs for gameplay — prefers local cache over signed HTTPS. */
export async function fetchArchivePhotoUrls(archiveId: string): Promise<string[]> {
  const media = await fetchArchiveMedia(archiveId);
  const paths = media.map((m) => m.storage_path);
  const byPath = await resolveDisplayUrlsForPaths(paths);
  return paths.map((p) => byPath[p]).filter((u): u is string => !!u);
}

/** Signed storage URLs → data URLs for AI game generation */
export async function fetchArchivePhotoDataUrls(archiveId: string): Promise<string[]> {
  const signed = await fetchArchivePhotoUrls(archiveId);
  const out: string[] = [];
  for (const url of signed) {
    out.push(await urlToDataUrl(url));
  }
  return out;
}

export async function listUserArchives(): Promise<UserArchive[]> {
  const { data, error } = await supabase
    .from("user_archives")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserArchive[];
}

/** Permanently remove a journal entry, its photos, linked community game, and local cache. */
export async function deleteArchive(archiveId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const archive = await fetchArchive(archiveId);
  if (!archive || archive.user_id !== user.id) throw new Error("Entry not found");

  const media = await fetchArchiveMedia(archiveId);
  const storagePaths = media.map((m) => m.storage_path).filter(Boolean);

  const { data: linkedGames, error: gamesErr } = await supabase
    .from("community_games")
    .select("id, cover_path")
    .eq("archive_id", archiveId);
  if (gamesErr) throw gamesErr;

  const coverPaths = (linkedGames ?? [])
    .map((g) => g.cover_path as string | null)
    .filter((p): p is string => !!p);

  if (coverPaths.length) {
    const { error: coverErr } = await supabase.storage.from("community-covers").remove(coverPaths);
    if (coverErr) console.error("deleteArchive cover:", coverErr);
  }

  if (linkedGames?.length) {
    const { error: delGamesErr } = await supabase
      .from("community_games")
      .delete()
      .eq("archive_id", archiveId);
    if (delGamesErr) throw delGamesErr;
  }

  if (storagePaths.length) {
    await removeCachedMedia(storagePaths);
    const { error: storageErr } = await supabase.storage.from("archive-media").remove(storagePaths);
    if (storageErr) throw storageErr;
  }

  const { error: archErr } = await supabase.from("user_archives").delete().eq("id", archiveId);
  if (archErr) throw archErr;

  removeGeneratedGamesByArchiveId(archiveId);

  window.dispatchEvent(new CustomEvent("mnemo-archive-updated", { detail: { archiveId } }));
  window.dispatchEvent(new CustomEvent("mnemo-community-game-published"));
}
