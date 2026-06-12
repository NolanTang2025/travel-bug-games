import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { dismissDraft, fetchDraft, sendDraft } from "@/lib/twinApi";
import { PageHeader } from "@/components/riso/PageHeader";

const TwinDraftEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [triggerText, setTriggerText] = useState("");
  const [draftText, setDraftText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchDraft(id)
      .then((d) => {
        if (!d) {
          toast.error("Draft not found");
          navigate("/twin");
          return;
        }
        if (d.status !== "pending") {
          toast.message("This draft was already handled");
          navigate("/twin");
          return;
        }
        setTriggerText(d.trigger_text);
        setDraftText(d.draft_text);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const onSend = async () => {
    if (!id || !draftText.trim()) return;
    setSending(true);
    try {
      await sendDraft(id, draftText.trim());
      toast.success("Sent to Slack");
      navigate("/twin");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const onDismiss = async () => {
    if (!id) return;
    setSending(true);
    try {
      await dismissDraft(id);
      toast.message("Draft discarded");
      navigate("/twin");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-riso-pink" />
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[640px] px-4 py-10 sm:py-14">
      <Link to="/twin" className="riso-link">
        ← Back to Twin
      </Link>

      <PageHeader
        align="left"
        className="mt-6 mb-6 max-w-none"
        eyebrow="Slack draft"
        title="Review before sending"
        lead="Nothing posts to Slack until you hit Send."
      />

      <div className="riso-card mb-6 bg-riso-ink/5 rotate--1">
        <p className="riso-eyebrow mb-2">They said</p>
        <p className="font-mono text-sm whitespace-pre-wrap text-riso-ink leading-relaxed">{triggerText}</p>
      </div>

      <label className="block mb-6">
        <p className="riso-label mb-2">Your reply (editable)</p>
        <textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          rows={6}
          className="w-full rounded-xl border-2 border-riso-ink/30 bg-background px-4 py-3 font-hand text-xl text-riso-ink focus:border-riso-pink focus:outline-none transition-colors"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSend}
          disabled={sending || !draftText.trim()}
          className="riso-btn-primary"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send to Slack
        </button>
        <button type="button" onClick={onDismiss} disabled={sending} className="riso-btn-ghost">
          <Trash2 className="h-4 w-4" />
          Discard
        </button>
      </div>
    </section>
  );
};

export default TwinDraftEditor;
