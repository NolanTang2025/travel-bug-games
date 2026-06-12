import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteArchive } from "@/lib/archiveApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  archiveId: string;
  title: string;
  onDeleted: () => void;
  variant?: "icon" | "button";
  className?: string;
};

export function DeleteMemoryButton({
  archiveId,
  title,
  onDeleted,
  variant = "button",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onConfirm = async () => {
    setDeleting(true);
    try {
      await deleteArchive(archiveId);
      toast.success("Memory deleted");
      setOpen(false);
      onDeleted();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const iconTrigger = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setOpen(true);
      }}
      className={[
        "relative z-30 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-riso-ink bg-background/95 text-muted-foreground shadow-pop-sm",
        "hover:bg-riso-pink hover:text-background hover:border-riso-pink transition-colors cursor-pointer",
        className,
      ].join(" ")}
      aria-label="Delete memory"
    >
      <Trash2 className="h-3.5 w-3.5 pointer-events-none" />
    </button>
  );

  const buttonTrigger = (
    <button
      type="button"
      className={[
        "riso-btn-ghost w-full text-sm border-riso-pink/40 text-riso-pink hover:bg-riso-pink/10",
        className,
      ].join(" ")}
    >
      <Trash2 className="h-4 w-4" />
      Delete memory
    </button>
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {variant === "icon" ? iconTrigger : <AlertDialogTrigger asChild>{buttonTrigger}</AlertDialogTrigger>}
      <AlertDialogContent className="sticker rounded-2xl border-2 border-riso-ink bg-background max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl text-riso-ink uppercase tracking-wide">
            Delete this memory?
          </AlertDialogTitle>
          <AlertDialogDescription className="font-mono text-sm text-muted-foreground leading-relaxed">
            <span className="block mb-2 text-riso-ink/90">&ldquo;{title}&rdquo;</span>
            This removes the journal entry, photos, AI summary, linked game, and any digital twin built from this trip.
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={deleting}
            className="rounded-full border-2 border-riso-ink font-display uppercase tracking-wider text-xs"
          >
            Keep it
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={deleting}
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
            className="rounded-full border-2 border-riso-ink bg-riso-pink font-display uppercase tracking-wider text-xs text-background hover:bg-riso-pink/90"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete forever"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
