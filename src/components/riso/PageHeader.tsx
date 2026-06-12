import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  lead?: string;
  align?: "center" | "left";
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  lead,
  align = "center",
  className = "",
}: PageHeaderProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <header className={`mb-8 max-w-lg ${alignClass} ${className}`}>
      {eyebrow && <p className="riso-eyebrow mb-2">{eyebrow}</p>}
      <h1 className="riso-title">{title}</h1>
      {lead && <p className="riso-lead mt-3">{lead}</p>}
    </header>
  );
}
