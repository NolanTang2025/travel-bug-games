import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  DiaryPhotoSpread,
  ingestDiaryFiles,
  type DiaryPhoto,
} from "@/components/DiaryPhotoUpload";
import { ArchiveGeneratingOverlay } from "@/components/ArchiveGeneratingOverlay";
import { runAutoArchive } from "@/lib/autoArchive";
import { PageHeader } from "@/components/riso/PageHeader";

function formatDiaryDate(d = new Date()) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const ArchiveCreate = () => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<DiaryPhoto[]>([]);
  const [journal, setJournal] = useState("");
  const [loading, setLoading] = useState(false);
  const [archiveDone, setArchiveDone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const diaryDate = useMemo(() => formatDiaryDate(), []);

  const handleAddFiles = async (files: File[]) => {
    const next = await ingestDiaryFiles(files, photos.length, (msg) => toast.error(msg));
    if (next.length) setPhotos((prev) => [...prev, ...next]);
  };

  const submit = async () => {
    if (!photos.length) return toast.error("Add at least one travel photo");
    setLoading(true);
    setArchiveDone(false);
    try {
      const archiveId = await runAutoArchive({
        sourceId: `manual:${Date.now()}`,
        journalText: journal,
        photos,
      });
      if (archiveId) {
        setArchiveDone(true);
        await new Promise((r) => setTimeout(r, 400));
        navigate(`/archive/${archiveId}`);
      }
    } catch (e: unknown) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to build archive");
    } finally {
      setLoading(false);
      setArchiveDone(false);
    }
  };

  return (
    <>
      <ArchiveGeneratingOverlay
        open={loading}
        done={archiveDone}
        photoPreview={photos[0]?.dataUrl}
        journalPreview={journal}
      />
      <section className="relative mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <PageHeader
        align="left"
        className="mb-8 max-w-none"
        eyebrow="▚ Travel archive ▚"
        title={
          <>
            Turn your diary into a <span className="text-riso-pink">travel archive</span>
          </>
        }
        lead="You usually don't need this page — Journal, Instagram, and AI Create auto-archive. Use this only to add an entry manually."
      />
      <p className="mb-8 -mt-4 font-hand text-lg text-riso-ink/70">{diaryDate}</p>

      <div className="sticker overflow-hidden rounded-2xl bg-riso-ink/5 shadow-pop-lg">
        <div className="grid lg:grid-cols-2">
          <div className="diary-paper-plain px-4 py-8 sm:px-8 border-b-2 lg:border-b-0 lg:border-r border-riso-ink/10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
              Snapshots
            </p>
            <DiaryPhotoSpread
              photos={photos}
              onAdd={handleAddFiles}
              onRemove={(id) => setPhotos((p) => p.filter((x) => x.id !== id))}
              dragging={dragging}
              onDrag={setDragging}
            />
            <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-riso-pink" />
              Where were you?
            </div>
          </div>

          <div className="diary-paper px-6 py-8 sm:px-10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
              Diary
            </p>
            <textarea
              value={journal}
              onChange={(e) => setJournal(e.target.value.slice(0, 4000))}
              placeholder="What happened on this trip? Places, weather, who you were with…"
              rows={12}
              className="w-full resize-none border-0 bg-transparent font-hand text-xl leading-relaxed text-riso-ink placeholder:text-riso-ink/30 focus:outline-none"
            />
            <p className="text-right font-mono text-[10px] text-muted-foreground">{journal.length}/4000</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={loading || photos.length === 0}
          className="sticker w-full max-w-md rounded-full bg-riso-pink text-background py-4 font-display uppercase tracking-wide disabled:opacity-45"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Building archive…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate archive
            </span>
          )}
        </button>
        <Link to="/twin" className="font-mono text-xs text-muted-foreground hover:text-riso-pink">
          ← Twin dashboard
        </Link>
      </div>
    </section>
    </>
  );
};

export default ArchiveCreate;
