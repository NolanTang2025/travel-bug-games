import { supabase } from "@/integrations/supabase/client";
import { writeAiGameSession } from "@/lib/aiGameSession";
import { resolvePlayPhotos } from "@/lib/resolvePlayPhotos";
import { fetchArchivePhotoUrls, getSignedMediaUrl } from "@/lib/archiveApi";
import { removeGeneratedGamesByArchiveId } from "@/lib/creativeStorage";

export { writeAiGameSession };

export type CommunityGameRow = {
  id: string;
  user_id: string;
  archive_id: string | null;
  title: string;
  author_name: string | null;
  tagline: string | null;
  template_id: string | null;
  engine: string | null;
  spec: Record<string, unknown>;
  cover_path: string | null;
  upvote_count: number;
  created_at: string;
};

export type CommunityGameCard = CommunityGameRow & {
  coverUrl: string | null;
  authorName: string | null;
};

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function publicCoverUrl(path: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  return `${base}/storage/v1/object/public/community-covers/${path}`;
}

export function communityCoverPublicUrl(coverPath: string): string {
  return publicCoverUrl(coverPath);
}

async function uploadCover(userId: string, gameId: string, dataUrl: string): Promise<string | null> {
  if (!dataUrl.startsWith("data:image/")) return null;
  const ext = dataUrl.includes("image/png") ? "png" : "jpg";
  const path = `${userId}/${gameId}.${ext}`;
  const blob = dataUrlToBlob(dataUrl);
  const { error } = await supabase.storage.from("community-covers").upload(path, blob, {
    contentType: blob.type,
    upsert: true,
  });
  if (error) {
    console.error("uploadCover:", error);
    return null;
  }
  return path;
}

export async function publishCommunityGame(input: {
  title: string;
  tagline?: string;
  templateId?: string;
  engine?: string;
  spec: Record<string, unknown>;
  photos?: string[];
  archiveId?: string;
  hint?: string;
}): Promise<{ id: string; coverUrl: string | null } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const gameId = crypto.randomUUID();
  const photo = input.photos?.[0];
  const coverPath =
    photo?.startsWith("data:") ? await uploadCover(user.id, gameId, photo) : null;

  const row = {
    id: gameId,
    user_id: user.id,
    archive_id: input.archiveId ?? null,
    title: input.title.slice(0, 120),
    author_name: profile?.display_name?.slice(0, 80) ?? null,
    tagline: input.tagline?.slice(0, 160) ?? null,
    template_id: input.templateId ?? null,
    engine: input.engine ?? null,
    spec: {
      ...input.spec,
      hint: input.hint?.slice(0, 300),
    },
    cover_path: coverPath,
  };

  const { error } = await supabase.from("community_games").insert(row);
  if (error) {
    console.error("publishCommunityGame:", error);
    return null;
  }

  window.dispatchEvent(new CustomEvent("mnemo-community-game-published"));
  return {
    id: gameId,
    coverUrl: coverPath ? publicCoverUrl(coverPath) : null,
  };
}

/** Remove prior community games (and local cache) before remixing a journal entry. */
export async function replaceCommunityGamesForArchive(archiveId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

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
    if (coverErr) console.error("replaceCommunityGames cover:", coverErr);
  }

  if (linkedGames?.length) {
    const { error: delErr } = await supabase
      .from("community_games")
      .delete()
      .eq("archive_id", archiveId);
    if (delErr) throw delErr;
  }

  removeGeneratedGamesByArchiveId(archiveId);
  window.dispatchEvent(new CustomEvent("mnemo-community-game-published"));
}

/** Most recent community game linked to a journal archive, if any. */
export async function fetchCommunityGameByArchiveId(archiveId: string): Promise<CommunityGameRow | null> {
  const { data, error } = await supabase
    .from("community_games")
    .select("id, user_id, archive_id, title, author_name, tagline, template_id, engine, spec, cover_path, upvote_count, created_at")
    .eq("archive_id", archiveId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("fetchCommunityGameByArchiveId:", error);
    return null;
  }

  return (data as CommunityGameRow | null) ?? null;
}

async function resolveCoverUrl(row: CommunityGameRow): Promise<string | null> {
  if (row.cover_path) return publicCoverUrl(row.cover_path);
  if (row.archive_id) {
    try {
      const urls = await fetchArchivePhotoUrls(row.archive_id);
      if (urls[0]) return urls[0];
    } catch (e) {
      console.error("resolveCoverUrl archive:", e);
    }
  }
  return null;
}

export async function listTopCommunityGames(limit = 12): Promise<CommunityGameCard[]> {
  const { data, error } = await supabase
    .from("community_games")
    .select("id, user_id, archive_id, title, author_name, tagline, template_id, engine, spec, cover_path, upvote_count, created_at")
    .order("upvote_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listTopCommunityGames:", error);
    return [];
  }

  const rows = (data ?? []) as CommunityGameRow[];

  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      coverUrl: await resolveCoverUrl(row),
      authorName: row.author_name,
    })),
  );
}

export async function loadCommunityGameSession(gameId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("community_games")
    .select("*")
    .eq("id", gameId)
    .maybeSingle();

  if (error) {
    console.error("loadCommunityGameSession:", error);
    return false;
  }
  if (!data) return false;

  const row = data as CommunityGameRow;
  const specRaw = { ...(row.spec ?? {}) } as Record<string, unknown>;
  delete specRaw.photos;
  delete specRaw.photo;

  let photos: string[] = [];

  if (row.archive_id) {
    try {
      photos = await fetchArchivePhotoUrls(row.archive_id);
    } catch (e) {
      console.error("loadCommunityGameSession photos:", e);
    }
  }

  if (!photos.length && row.cover_path) {
    if (row.cover_path.startsWith(`${row.user_id}/`)) {
      photos = [publicCoverUrl(row.cover_path)];
    } else {
      const url = await getSignedMediaUrl(row.cover_path);
      if (url) photos = [url];
    }
  }

  if (!photos.length) {
    photos = resolvePlayPhotos(row.id, {}, []);
  }

  const hint = String(specRaw.hint ?? "");
  const payload: Record<string, unknown> = {
    ...specRaw,
    templateId: row.template_id ?? specRaw.templateId,
    engine: row.engine ?? specRaw.engine,
    title: row.title,
    tagline: row.tagline,
    photos,
    photo: photos[0],
    hint,
    archiveId: row.archive_id ?? undefined,
    communityGameId: row.id,
    source: "community",
  };

  return writeAiGameSession(payload);
}

export async function upvoteCommunityGame(gameId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from("community_game_upvotes").insert({
    game_id: gameId,
    user_id: user.id,
  });

  return !error;
}

export async function removeUpvoteCommunityGame(gameId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("community_game_upvotes")
    .delete()
    .eq("game_id", gameId)
    .eq("user_id", user.id);

  return !error;
}

export async function hasUpvotedCommunityGame(gameId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("community_game_upvotes")
    .select("game_id")
    .eq("game_id", gameId)
    .eq("user_id", user.id)
    .maybeSingle();

  return !!data;
}
