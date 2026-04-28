import { cn } from "@/lib/utils";

interface HoloCardProps {
  children: React.ReactNode;
  className?: string;
  shimmer?: boolean;
  glow?: boolean;
  float?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

export default function HoloCard({
  children,
  className,
  shimmer = true,
  glow = true,
  float = false,
  as: Tag = "div",
}: HoloCardProps) {
  return (
    <Tag
      className={cn(
        "relative rounded-[1.75rem] border border-white/55 bg-white/55 backdrop-blur-xl overflow-hidden",
        "transition-all duration-300 ease-out",
        glow && "hover:shadow-glow-ice",
        float && "animate-float-gentle",
        shimmer && "holo-shimmer",
        className
      )}
      style={{
        boxShadow:
          "var(--shadow-card), 0 0 0 1px hsl(220 14% 92% / 0.35), inset 0 1px 0 hsl(0 0% 100% / 0.45)",
      }}
    >
      {children}
    </Tag>
  );
}
