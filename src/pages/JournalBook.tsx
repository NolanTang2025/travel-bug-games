import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/context/LocaleContext";
import { loadJournal } from "@/lib/journalStorage";
import { cn } from "@/lib/utils";

function BookBlock({ step, children, className }: { step: number; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("journal-section-in", className)}
      style={{ animationDelay: `${380 + step * 85}ms` }}
    >
      {children}
    </div>
  );
}

export default function JournalBook() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const j = loadJournal();

  const goGame = () => {
    if (!j.images.length) {
      toast.error(t("journalNeedImage"));
      return;
    }
    const lines = [
      j.narrative.trim(),
      j.instagramUrl.trim() && `Instagram: ${j.instagramUrl.trim()}`,
      j.twitterUrl.trim() && `X/Twitter: ${j.twitterUrl.trim()}`,
    ].filter(Boolean) as string[];
    navigate("/games/ai-create", {
      state: {
        journalPhoto: j.images[0],
        journalHint: lines.join("\n\n"),
        journalLocaleId: j.travelLocaleId || "cn",
      },
    });
  };
  const hasContent = j.images.length > 0 || j.narrative.trim() || j.instagramUrl || j.twitterUrl;

  return (
    <div className="journal-desk flex-1 flex flex-col min-h-[100dvh]">
      <div className="journal-perspective flex-1 px-3 py-8 sm:px-6">
        <div className="journal-magic-open mx-auto w-full max-w-3xl flex flex-col">
          <article className="journal-paper relative pt-10 pb-12 pl-11 pr-6 sm:pl-14 sm:pr-12">
            <span className="journal-binding-holes" aria-hidden />

            <div className="pointer-events-none absolute -top-2 left-8 right-8 flex justify-center gap-8 sm:left-12 sm:right-12">
              <div className="journal-washi w-32 bg-gradient-to-r from-cyan-200/90 to-sky-50/85" />
              <div className="journal-washi w-28 bg-gradient-to-r from-violet-200/90 to-fuchsia-50/85" />
            </div>

            <BookBlock step={0}>
              <Link
                to="/journal"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/70 hover:text-primary transition-colors font-data"
              >
                <ArrowLeft className="h-4 w-4" /> {t("navJournal")}
              </Link>
              <h1 className="font-display text-center text-[2.5rem] sm:text-[3rem] mt-8 text-foreground font-bold">
                {t("bookTitle")}
              </h1>
            </BookBlock>

            {!hasContent ? (
              <BookBlock step={1}>
                <p className="text-center text-muted-foreground py-16 font-data text-lg">{t("bookEmpty")}</p>
              </BookBlock>
            ) : (
              <>
                {(j.instagramUrl || j.twitterUrl) && (
                  <BookBlock step={1} className="mt-10 space-y-2 text-sm text-foreground/80 break-all font-data">
                    {j.instagramUrl && (
                      <p>
                        <span className="font-bold text-foreground">IG</span> · {j.instagramUrl}
                      </p>
                    )}
                    {j.twitterUrl && (
                      <p>
                        <span className="font-bold text-foreground">X</span> · {j.twitterUrl}
                      </p>
                    )}
                  </BookBlock>
                )}

                {j.images.length > 0 && (
                  <BookBlock step={2} className="mt-8">
                    <div className="columns-1 sm:columns-2 gap-6 space-y-6">
                      {j.images.map((src, i) => (
                        <figure
                          key={i}
                          className={cn(
                            "polaroid-frame break-inside-avoid mb-6 animate-float-gentle",
                            i % 3 === 0 && "-rotate-1",
                            i % 3 === 1 && "rotate-2",
                            i % 3 === 2 && "-rotate-2",
                          )}
                          style={{ animationDelay: `${i * 0.8}s`, animationDuration: `${3.5 + i * 0.3}s` }}
                        >
                          <img src={src} alt="" className="w-full object-cover" />
                        </figure>
                      ))}
                    </div>
                  </BookBlock>
                )}

                {j.narrative.trim() && (
                  <BookBlock step={3} className="mt-10">
                    <div className="journal-ruled-area min-h-[120px] font-hand text-[1.05rem] leading-relaxed text-foreground whitespace-pre-wrap shadow-inner">
                      {j.narrative}
                    </div>
                  </BookBlock>
                )}
              </>
            )}

            <BookBlock step={4} className="mt-12 flex justify-center">
              <Button
                size="lg"
                className="rounded-full px-10 gap-2 font-bold font-data text-white shadow-lg hover:shadow-glow-ice hover:-translate-y-0.5 transition-all"
                style={{
                  background: "linear-gradient(135deg, hsl(200 90% 52%), hsl(210 85% 45%))",
                }}
                type="button"
                onClick={goGame}
              >
                <Sparkles className="h-5 w-5" />
                {t("journalTurnGame")}
              </Button>
            </BookBlock>
          </article>
        </div>
      </div>
    </div>
  );
}
