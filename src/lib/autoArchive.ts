import { toast } from "sonner";
import type { DiaryPhoto } from "@/components/DiaryPhotoUpload";
import {
  createArchiveWithPhotos,
  createArchiveWithRemoteImages,
  generateArchive,
} from "@/lib/archiveApi";
import { generateTwin } from "@/lib/twinApi";
import { invokeEdge } from "@/lib/invokeEdge";
import { supabase } from "@/integrations/supabase/client";

const SOURCES_KEY = "mnemo_archived_sources";

function readSources(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SOURCES_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function markSourceDone(sourceId: string) {
  const next = [...new Set([sourceId, ...readSources()])].slice(0, 200);
  localStorage.setItem(SOURCES_KEY, JSON.stringify(next));
}

export function wasSourceArchived(sourceId: string): boolean {
  return readSources().includes(sourceId);
}

export type AutoArchiveInput = {
  sourceId: string;
  journalText: string;
  photos?: DiaryPhoto[];
  imageUrls?: string[];
  silent?: boolean;
};

/** 登录用户：静默建档 → AI 摘要 → 刷新分身 */
export async function runAutoArchive(input: AutoArchiveInput): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  if (wasSourceArchived(input.sourceId)) return null;

  const hasPhotos = (input.photos?.length ?? 0) > 0 || (input.imageUrls?.length ?? 0) > 0;
  if (!hasPhotos && !input.journalText.trim()) return null;

  try {
    let archiveId: string;

    if (input.photos?.length) {
      ({ archiveId } = await createArchiveWithPhotos(input.journalText, input.photos));
    } else if (input.imageUrls?.length) {
      ({ archiveId } = await createArchiveWithRemoteImages(input.journalText, input.imageUrls));
    } else {
      return null;
    }

    let summaryReady = false;
    try {
      await generateArchive(archiveId);
      summaryReady = true;
    } catch (genErr) {
      console.error("generateArchive failed:", genErr);
      if (!input.silent) {
        const msg = genErr instanceof Error ? genErr.message : "AI summary failed";
        toast.error(`${msg} — open the archive and tap Regenerate summary`);
      }
    }

    if (summaryReady) {
      try {
        await generateTwin(archiveId);
      } catch (twinErr) {
        console.error("generateTwin failed:", twinErr);
        if (!input.silent) {
          toast.message("Summary saved — build your twin from the Twin page");
        }
      }
    }

    markSourceDone(input.sourceId);

    window.dispatchEvent(new CustomEvent("mnemo-archive-updated", { detail: { archiveId } }));

    if (!input.silent && summaryReady) {
      toast.success("Travel archive ready");
    }
    return archiveId;
  } catch (e) {
    console.error("autoArchive:", e);
    if (!input.silent) {
      toast.error(e instanceof Error ? e.message : "Auto-archive failed");
    }
    return null;
  }
}

export async function autoArchiveFromAiCreate(
  photos: { dataUrl: string }[],
  hint: string,
): Promise<string | null> {
  const diaryPhotos: DiaryPhoto[] = photos.map((p) => ({
    id: crypto.randomUUID(),
    dataUrl: p.dataUrl,
  }));
  const sourceId = `ai-create:${Date.now()}`;
  return runAutoArchive({
    sourceId,
    journalText: hint.trim() || "AI Create travel diary",
    photos: diaryPhotos,
    silent: true,
  });
}

export async function autoArchiveFromPrintEdition(
  editionId: string,
  journalText: string,
  imageUrls: string[],
): Promise<void> {
  const sourceId = `edition:${editionId}`;
  if (wasSourceArchived(sourceId)) return;

  await runAutoArchive({
    sourceId,
    journalText,
    imageUrls,
    silent: true,
  }).then((id) => {
    if (id) toast.message("Journal synced to travel archive");
  });
}

export async function autoArchiveFromInstagram(url: string): Promise<string | null> {
  const data = await invokeEdge<{ archiveId: string; normalizedUrl?: string }>("import-instagram", {
    url: url.trim(),
  });

  const sourceId = `instagram:${data.normalizedUrl ?? url}`;
  markSourceDone(sourceId);

  window.dispatchEvent(
    new CustomEvent("mnemo-archive-updated", { detail: { archiveId: data.archiveId } }),
  );

  toast.success("Imported from Instagram — archive created");
  return data.archiveId as string;
}
