import type { PrintEdition } from "@/data/printEditions";
import { JournalAlbumBackdrop } from "./JournalAlbumBackdrop";
import { GamePlayAtmosphere } from "./GamePlayChrome";

/** Sample / print edition play surface — photo mood + riso stamp, no user upload required. */
export function EditionPlayShell({
  edition,
  children,
}: {
  edition: PrintEdition;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative w-full min-h-[100dvh] h-[100dvh] overflow-hidden touch-none"
      style={{ background: edition.game.background }}
    >
      <JournalAlbumBackdrop photos={[edition.coverPhoto]} mode="play" tint={edition.game.background} />
      <GamePlayAtmosphere tint={edition.game.background} />
      <div
        className="pointer-events-none absolute right-3 top-[4.5rem] z-[2] w-[4.5rem] rotate-6 opacity-80 sm:right-5 sm:top-20 sm:w-20"
        aria-hidden
      >
        <img
          src={edition.coverArt}
          alt=""
          className="w-full rounded-sm border-2 border-white/25 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
        />
      </div>
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
