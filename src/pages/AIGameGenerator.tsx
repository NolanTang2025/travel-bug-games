import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  Stamp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const MAX_PHOTOS = 6;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

type DiaryPhoto = { id: string; dataUrl: string };

function formatDiaryDate(d = new Date()) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function WashiTape({ className }: { className: string }) {
  return <span className={`washi-tape ${className}`} aria-hidden />;
}

const POLAROID_LAYOUT = [
  { rotate: "-rotate-2", offset: "translate-x-0", size: "w-[140px] sm:w-[160px]", tape: "bg-riso-pink/80 -rotate-12", tapePos: "-top-2 left-4" },
  { rotate: "rotate-3", offset: "translate-x-2 sm:translate-x-4", size: "w-[130px] sm:w-[150px]", tape: "bg-riso-cyan/75 rotate-6", tapePos: "-top-1 right-3" },
  { rotate: "-rotate-1", offset: "-translate-x-1", size: "w-[135px] sm:w-[155px]", tape: "bg-riso-yellow/85 rotate-3", tapePos: "-top-2 left-5" },
  { rotate: "rotate-2", offset: "translate-x-1", size: "w-[128px] sm:w-[148px]", tape: "bg-riso-violet/70 -rotate-6", tapePos: "-top-1 right-4" },
  { rotate: "-rotate-3", offset: "translate-x-3", size: "w-[125px] sm:w-[145px]", tape: "bg-riso-lime/80 rotate-12", tapePos: "-top-2 left-3" },
  { rotate: "rotate-1", offset: "-translate-x-2", size: "w-[132px] sm:w-[152px]", tape: "bg-riso-orange/75 -rotate-3", tapePos: "-top-1 right-5" },
];

function PolaroidFrame({
  photo,
  layoutIndex,
  onRemove,
}: {
  photo: DiaryPhoto;
  layoutIndex: number;
  onRemove: () => void;
}) {
  const layout = POLAROID_LAYOUT[layoutIndex % POLAROID_LAYOUT.length];
  return (
    <div
      className={[
        "relative shrink-0 transition-transform duration-200 hover:z-10 hover:scale-[1.03]",
        layout.rotate,
        layout.offset,
        layout.size,
      ].join(" ")}
    >
      <WashiTape className={`${layout.tapePos} ${layout.tape}`} />
      <div className="sticker bg-background p-2 pb-7 group">
        <div className="relative aspect-[4/5] overflow-hidden border-2 border-riso-ink/80">
          <img
            src={photo.dataUrl}
            alt={`Travel snapshot ${layoutIndex + 1}`}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-riso-ink bg-background/95 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove photo"
          >
            <X className="h-3.5 w-3.5 text-riso-ink" strokeWidth={2.5} />
          </button>
        </div>
        <p className="mt-2 text-center font-hand text-base text-riso-ink/75 leading-none">
          moment {layoutIndex + 1} ✦
        </p>
      </div>
    </div>
  );
}

function AddPolaroidSlot({
  onAdd,
  dragging,
  onDrag,
  count,
}: {
  onAdd: (files: File[]) => void;
  dragging: boolean;
  onDrag: (v: boolean) => void;
  count: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const ingestFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return;
      onAdd(Array.from(fileList));
    },
    [onAdd],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      onDrag(false);
      ingestFiles(e.dataTransfer.files);
    },
    [ingestFiles, onDrag],
  );

  return (
    <label
      className="group relative block cursor-pointer shrink-0"
      onDragOver={(e) => {
        e.preventDefault();
        onDrag(true);
      }}
      onDragLeave={() => onDrag(false)}
      onDrop={handleDrop}
    >
      <div
        className={[
          "relative w-[120px] sm:w-[140px] rotate-2 transition-transform duration-200",
          "group-hover:rotate-0 group-hover:-translate-y-1",
          dragging ? "scale-[1.04] rotate-0" : "",
        ].join(" ")}
      >
        <div
          className={[
            "sticker border-dashed bg-riso-yellow/20 p-2 pb-6 transition-shadow",
            dragging ? "shadow-pop-lg ring-2 ring-riso-pink ring-offset-2 bg-riso-yellow/40" : "",
          ].join(" ")}
        >
          <div className="flex aspect-[4/5] flex-col items-center justify-center gap-2 border-2 border-dashed border-riso-ink/35 bg-background/60 p-3 text-center">
            {count === 0 ? (
              <Camera className="h-8 w-8 text-riso-ink/50" strokeWidth={2.2} />
            ) : (
              <Plus className="h-8 w-8 text-riso-ink/50" strokeWidth={2.2} />
            )}
            <p className="font-hand text-lg text-riso-ink/70 leading-none">
              {count === 0 ? "paste photos" : "add more"}
            </p>
          </div>
          <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
            {count}/{MAX_PHOTOS} · drop or click
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          ingestFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function DiaryPhotoSpread({
  photos,
  onAdd,
  onRemove,
  dragging,
  onDrag,
}: {
  photos: DiaryPhoto[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  dragging: boolean;
  onDrag: (v: boolean) => void;
}) {
  const canAdd = photos.length < MAX_PHOTOS;

  return (
    <div
      className={[
        "relative w-full min-h-[320px] rounded-xl p-4 sm:p-6",
        photos.length === 0 ? "diary-paper-plain border-2 border-dashed border-riso-ink/20" : "",
      ].join(" ")}
      onDragOver={(e) => {
        if (!canAdd) return;
        e.preventDefault();
        onDrag(true);
      }}
      onDragLeave={() => onDrag(false)}
      onDrop={(e) => {
        if (!canAdd) return;
        e.preventDefault();
        onDrag(false);
        onAdd(Array.from(e.dataTransfer.files));
      }}
    >
      {photos.length === 0 ? (
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center px-4">
          <AddPolaroidSlot
            onAdd={onAdd}
            dragging={dragging}
            onDrag={onDrag}
            count={0}
          />
          <p className="mt-6 font-hand text-2xl text-riso-ink/80">waiting for memories…</p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground max-w-xs">
            Drop up to {MAX_PHOTOS} travel photos · JPG/PNG · 5MB each
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
          {photos.map((photo, i) => (
            <PolaroidFrame
              key={photo.id}
              photo={photo}
              layoutIndex={i}
              onRemove={() => onRemove(photo.id)}
            />
          ))}
          {canAdd && (
            <AddPolaroidSlot
              onAdd={onAdd}
              dragging={dragging}
              onDrag={onDrag}
              count={photos.length}
            />
          )}
        </div>
      )}

      {photos.length > 0 && (
        <p className="mt-5 text-center font-hand text-xl text-riso-ink/75">
          {photos.length === 1
            ? "one moment worth keeping ✦"
            : `${photos.length} moments from the same day ✦`}
        </p>
      )}
    </div>
  );
}

const AIGameGenerator = () => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<DiaryPhoto[]>([]);
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const diaryDate = useMemo(() => formatDiaryDate(), []);
  const entryNo = useMemo(
    () => String(Math.floor(Math.random() * 80) + 12).padStart(2, "0"),
    [],
  );

  const readFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleAddFiles = async (files: File[]) => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast.error(`Diary pages hold up to ${MAX_PHOTOS} photos`);
      return;
    }

    const toAdd = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.message(`Only ${remaining} more slot${remaining === 1 ? "" : "s"} — kept the first ${remaining}`);
    }

    const next: DiaryPhoto[] = [];
    for (const file of toAdd) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} isn't an image`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} is over 5MB`);
        continue;
      }
      try {
        const dataUrl = await readFile(file);
        next.push({ id: crypto.randomUUID(), dataUrl });
      } catch {
        toast.error(`Couldn't read ${file.name}`);
      }
    }

    if (next.length) setPhotos((prev) => [...prev, ...next]);
  };

  const handleRemove = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const generate = async () => {
    if (!photos.length) return toast.error("Paste at least one travel photo into your diary");
    setLoading(true);
    try {
      const dataUrls = photos.map((p) => p.dataUrl);
      const { data, error } = await supabase.functions.invoke("generate-game", {
        body: { photos: dataUrls, photo: dataUrls[0], hint },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      sessionStorage.setItem(
        "ai_game",
        JSON.stringify({ ...data, photos: dataUrls, photo: dataUrls[0] }),
      );
      navigate("/games/ai-play");
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Failed to generate";
      if (msg.includes("Rate")) toast.error("Too many requests — try again in a moment");
      else if (msg.includes("Payment")) toast.error("AI credits exhausted. Add funds in Workspace settings.");
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground mb-2">
              ▚ Travel Bug Journal · Vol. {entryNo} ▚
            </p>
            <h1 className="font-display text-[clamp(2rem,6vw,3.5rem)] leading-[0.95] tracking-tight text-riso-ink">
              Turn today&apos;s page
              <br />
              into a <span className="text-riso-pink">playable</span> memory.
            </h1>
          </div>
          <div className="sticker-sm bg-riso-yellow px-4 py-3 rotate-2 text-right shrink-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-riso-ink/60">
              Date stamped
            </p>
            <p className="font-hand text-lg text-riso-ink leading-tight max-w-[180px]">
              {diaryDate}
            </p>
          </div>
        </div>
        <p className="mt-4 max-w-2xl font-mono text-sm text-foreground/70 leading-relaxed">
          Stick travel photos on the left — as many as the day holds. Scribble what happened on the right.
          We&apos;ll riso-print the whole spread into a tiny arcade game.
        </p>
      </header>

      <div className="relative">
        <div className="sticker overflow-hidden rounded-2xl bg-riso-ink/5 shadow-pop-lg">
          <div className="grid lg:grid-cols-[1fr_12px_1fr]">
            <div className="diary-paper-plain relative min-h-[480px] border-b-2 lg:border-b-0 lg:border-r border-riso-ink/10 px-4 py-8 sm:px-8">
              <div className="absolute top-5 left-4 sm:left-8">
                <span className="sticker-sm inline-block bg-riso-cyan px-3 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-riso-ink rotate--2">
                  Left page · snapshots
                </span>
              </div>

              <div className="flex h-full flex-col items-center justify-center pt-12 pb-6">
                <DiaryPhotoSpread
                  photos={photos}
                  onAdd={handleAddFiles}
                  onRemove={handleRemove}
                  dragging={dragging}
                  onDrag={setDragging}
                />

                <div className="mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-riso-pink" />
                  Where were you?
                  <span className="font-hand text-base normal-case tracking-normal text-riso-ink/70">
                    (the photos know)
                  </span>
                </div>
              </div>

              <p className="absolute bottom-4 left-4 sm:left-8 font-mono text-[10px] text-muted-foreground">
                — {entryNo} —
              </p>
            </div>

            <div className="diary-spine hidden lg:block border-x-2 border-riso-ink/20" aria-hidden />

            <div className="diary-paper relative min-h-[480px] px-6 py-8 sm:px-10 sm:pl-14">
              <div className="absolute top-5 right-6 sm:right-10">
                <span className="sticker-sm inline-block bg-riso-pink text-background px-3 py-1 font-mono text-[10px] uppercase tracking-[0.25em] rotate-1">
                  Right page · notes
                </span>
              </div>

              <div className="pt-10">
                <p className="mb-1 font-hand text-2xl text-riso-ink/90 pl-[52px]">
                  Dear future me,
                </p>

                <div className="relative">
                  <textarea
                    value={hint}
                    onChange={(e) => setHint(e.target.value.slice(0, 300))}
                    placeholder="Today I got lost in the old town and found the best ramen shop tucked behind a shrine…"
                    rows={8}
                    className={[
                      "w-full resize-none border-0 bg-transparent pl-[52px] pr-2 pt-1",
                      "font-hand text-xl sm:text-2xl leading-[28px] text-riso-ink",
                      "placeholder:text-riso-ink/30 focus:outline-none focus:ring-0",
                    ].join(" ")}
                    style={{ minHeight: "224px" }}
                  />
                  <p className="absolute bottom-0 right-0 font-mono text-[10px] text-muted-foreground">
                    {hint.length}/300
                  </p>
                </div>

                <div className="mt-6 pl-[52px] space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Optional · helps the AI read the mood
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["rainy afternoon", "first time here", "with friends", "miss this place"].map(
                      (chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() =>
                            setHint((prev) =>
                              prev ? `${prev} · ${chip}` : chip,
                            )
                          }
                          className="sticker-sm rounded-full bg-background px-3 py-1 font-hand text-base text-riso-ink/80 hover:bg-riso-yellow/40 transition-colors"
                        >
                          + {chip}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <p className="absolute bottom-4 right-6 sm:right-10 font-mono text-[10px] text-muted-foreground">
                — {entryNo} —
              </p>
            </div>
          </div>
        </div>

        <div
          className="absolute -top-1 right-8 sm:right-14 w-8 h-16 bg-riso-pink border-2 border-riso-ink shadow-pop-sm z-10"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)" }}
          aria-hidden
        />
      </div>

      <div className="mt-10 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={generate}
          disabled={loading || photos.length === 0}
          className={[
            "sticker group relative w-full max-w-md rounded-full px-8 py-5",
            "bg-riso-pink text-background font-display uppercase tracking-[0.15em] text-base sm:text-lg",
            "disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-pop",
            "transition-all duration-200",
          ].join(" ")}
        >
          <span className="flex items-center justify-center gap-3">
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Riso press is running…
              </>
            ) : (
              <>
                <Stamp className="h-5 w-5 transition-transform group-hover:rotate-12" />
                Press · Print my game
                <Sparkles className="h-4 w-4 opacity-80" />
              </>
            )}
          </span>
        </button>

        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground text-center max-w-sm">
          {photos.length === 0
            ? "Paste at least one photo on the left page to unlock the press"
            : `Printing from ${photos.length} photo${photos.length === 1 ? "" : "s"} · playable arcade in ~10s`}
        </p>
      </div>
    </section>
  );
};

export default AIGameGenerator;
