import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, ImageIcon, Sparkles } from "lucide-react";
import type { ArchiveSummary, UserArchive } from "@/lib/archiveApi";
import { deriveArchiveTitle } from "@/lib/archiveTitle";
import { DeleteMemoryButton } from "@/components/DeleteMemoryButton";

function titleFor(arch: UserArchive): string {
  const summary = arch.summary_json as ArchiveSummary | null;
  return (
    arch.title ||
    summary?.title ||
    (arch.journal_text ? deriveArchiveTitle(arch.journal_text) : "Travel entry")
  );
}

function statusTone(status: UserArchive["status"]) {
  if (status === "ready") return "bg-riso-cyan text-riso-ink";
  if (status === "failed") return "bg-riso-pink text-background";
  return "bg-riso-yellow text-riso-ink";
}

type Props = {
  archive: UserArchive;
  thumbUrl?: string;
  onDeleted?: () => void;
};

export function TravelArchiveCard({ archive, thumbUrl, onDeleted }: Props) {
  const summary = archive.summary_json as ArchiveSummary | null;
  const title = titleFor(archive);
  const date = new Date(archive.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const hasSummary = !!summary;

  return (
    <div className="journal-card-polaroid group relative">
      {onDeleted && (
        <div className="absolute top-3 right-3 z-30 pointer-events-auto">
          <DeleteMemoryButton
            archiveId={archive.id}
            title={title}
            onDeleted={onDeleted}
            variant="icon"
          />
        </div>
      )}
      <Link to={`/archive/${archive.id}`} className="relative z-0 block">
      <div className="relative px-4 pt-4">
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`rounded-full border-2 border-riso-ink px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest shadow-pop-sm ${statusTone(archive.status)}`}
          >
            {archive.status}
          </span>
        </div>
        <div className="journal-card-photo aspect-[4/3] w-full group-hover:rotate-0">
          {thumbUrl ? (
            <img src={thumbUrl} alt="" className="h-full w-full object-cover journal-upload-photo" loading="lazy" />
          ) : (
            <div className="flex h-full min-h-[140px] items-center justify-center bg-riso-ink/5 text-riso-ink/25">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
        </div>
        <span className="washi-tape washi-tape-cyan absolute -top-1 right-8 hidden sm:block" aria-hidden />
      </div>

      <div className="flex min-w-0 flex-col px-5 pb-5 pt-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{date}</p>
        <h3 className="mt-1.5 font-display text-lg leading-tight text-riso-ink group-hover:text-riso-pink transition-colors line-clamp-2">
          {title}
        </h3>
        <p className="mt-2 font-hand text-base text-riso-ink/75 line-clamp-2 flex-1 leading-snug">
          {summary?.one_line_persona || archive.journal_text || "Open to finish your travel entry"}
        </p>

        {hasSummary && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 rounded-full border border-riso-ink/15 bg-riso-violet/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-riso-violet">
              <Sparkles className="h-2.5 w-2.5" />
              AI insights
            </span>
          </div>
        )}

        <span className="mt-3 inline-flex items-center gap-1 font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground group-hover:text-riso-ink">
          <BookOpen className="h-3 w-3" />
          Read entry
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
      </Link>
    </div>
  );
}
