import { useCallback, useRef } from "react";
import { Camera, Plus, X } from "lucide-react";

export const MAX_DIARY_PHOTOS = 6;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type DiaryPhoto = { id: string; dataUrl: string };

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
            {count}/{MAX_DIARY_PHOTOS} · drop or click
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

export function DiaryPhotoSpread({
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
  const canAdd = photos.length < MAX_DIARY_PHOTOS;

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
          <AddPolaroidSlot onAdd={onAdd} dragging={dragging} onDrag={onDrag} count={0} />
          <p className="mt-6 font-hand text-2xl text-riso-ink/80">waiting for memories…</p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground max-w-xs">
            Drop up to {MAX_DIARY_PHOTOS} travel photos · JPG/PNG · 5MB each
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
            <AddPolaroidSlot onAdd={onAdd} dragging={dragging} onDrag={onDrag} count={photos.length} />
          )}
        </div>
      )}

      {photos.length > 0 && (
        <p className="mt-5 text-center font-hand text-xl text-riso-ink/75">
          {photos.length === 1
            ? "one moment worth keeping ✦"
            : `${photos.length} moments from the same trip ✦`}
        </p>
      )}
    </div>
  );
}

export async function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function ingestDiaryFiles(
  files: File[],
  currentCount: number,
  onError: (msg: string) => void,
): Promise<DiaryPhoto[]> {
  const remaining = MAX_DIARY_PHOTOS - currentCount;
  if (remaining <= 0) {
    onError(`Diary pages hold up to ${MAX_DIARY_PHOTOS} photos`);
    return [];
  }

  const toAdd = files.slice(0, remaining);
  const next: DiaryPhoto[] = [];

  for (const file of toAdd) {
    if (!file.type.startsWith("image/")) {
      onError(`${file.name} isn't an image`);
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      onError(`${file.name} is over 5MB`);
      continue;
    }
    try {
      const dataUrl = await readImageFile(file);
      next.push({ id: crypto.randomUUID(), dataUrl });
    } catch {
      onError(`Couldn't read ${file.name}`);
    }
  }

  return next;
}
