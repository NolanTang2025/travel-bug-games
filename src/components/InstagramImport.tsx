import { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { autoArchiveFromInstagram } from "@/lib/autoArchive";
import { useAuth } from "@/hooks/useAuth";

export function InstagramImport() {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return toast.error("Paste an Instagram post link");
    if (!user) {
      toast.error("Sign in before importing");
      return;
    }
    setLoading(true);
    try {
      const archiveId = await autoArchiveFromInstagram(url);
      if (archiveId) setUrl("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sticker rounded-2xl bg-background p-5 sm:p-6 mb-8 border-2 border-riso-ink/10">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
        Auto-archive · Instagram
      </p>
      <p className="font-hand text-xl text-riso-ink mb-4">
        Paste a public post link — we&apos;ll add it to your archive and refresh your Twin.
      </p>
      {!user ? (
        <p className="font-mono text-sm text-muted-foreground">
          <Link to="/login" className="text-riso-pink hover:underline">
            Sign in
          </Link>{" "}
          to import. Or play AI Create / a Print Edition first — we auto-archive after you sign in.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.instagram.com/p/..."
            className="flex-1 rounded-lg border-2 border-riso-ink/25 px-4 py-2.5 font-mono text-sm focus:border-riso-pink focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-riso-ink text-background px-5 py-2.5 font-display uppercase text-xs tracking-wide disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Instagram className="h-4 w-4" />}
            Import
          </button>
        </form>
      )}
    </div>
  );
}
