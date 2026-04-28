import { cn } from "@/lib/utils";

interface VinylRecordProps {
  coverPhoto?: string | null;
  emoji?: string;
  labelBg?: string;
  badge?: string;
  size?: "sm" | "md" | "lg";
  spinning?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const sizeMap = {
  sm: "w-[120px]",
  md: "w-[148px] sm:w-[156px]",
  lg: "w-[200px] sm:w-[220px]",
};

const labelSizeMap = {
  sm: "w-[44%] border-[4px]",
  md: "w-[44%] border-[5px]",
  lg: "w-[44%] border-[6px]",
};

const holeSizeMap = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5 sm:h-4 sm:w-4",
  lg: "h-4 w-4 sm:h-5 sm:w-5",
};

export default function VinylRecord({
  coverPhoto,
  emoji,
  labelBg,
  badge,
  size = "md",
  spinning = false,
  className,
  children,
}: VinylRecordProps) {
  return (
    <div className={cn("relative", sizeMap[size], className)}>
      <div
        className={cn(
          "vinyl-record-surface relative w-full transition-all duration-300 ease-out",
          spinning && "spinning"
        )}
      >
        <div className="pointer-events-none absolute inset-0 rounded-full opacity-40 bg-[radial-gradient(circle_at_38%_28%,hsl(0_0%_100%/0.28),transparent_48%)]" />
        <div
          className={cn(
            "absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2 aspect-square rounded-full overflow-hidden shadow-inner",
            labelSizeMap[size]
          )}
          style={{
            background: coverPhoto ? undefined : labelBg ?? "hsl(220 18% 12%)",
            borderColor: "hsl(220 18% 8%)",
          }}
        >
          {coverPhoto ? (
            <img src={coverPhoto} alt="" className="h-full w-full object-cover" />
          ) : children ? (
            children
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-2xl drop-shadow-md">
              {emoji ?? "🎵"}
            </div>
          )}
        </div>
        <span
          className={cn(
            "absolute left-1/2 top-1/2 z-[18] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-950 vinyl-label-hole ring-1 ring-neutral-900",
            holeSizeMap[size]
          )}
          aria-hidden
        />
        {badge && (
          <span className="pointer-events-none absolute bottom-[17%] right-[14%] z-[8] max-w-[46%] truncate rounded-md bg-black/45 px-1.5 py-0.5 text-center font-data text-[7px] font-bold uppercase tracking-wide text-white/95 shadow-sm backdrop-blur-[2px]">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
