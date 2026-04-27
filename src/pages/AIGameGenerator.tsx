import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AIGameGenerator = () => {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Image only");
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
    const reader = new FileReader();
    reader.onload = (e) => setPhoto(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const generate = async () => {
    if (!photo) return toast.error("Upload a travel photo first");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-game", {
        body: { photo, hint },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      sessionStorage.setItem("ai_game", JSON.stringify({ ...data, photo }));
      navigate("/games/ai-play");
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "Failed to generate";
      if (msg.includes("Rate")) toast.error("Too many requests — try again in a moment");
      else if (msg.includes("Payment")) toast.error("AI credits exhausted. Add funds in Workspace settings.");
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-paper">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 mb-6">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent mb-3">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">AI Game Forge</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-2">
            Drop a photo. Get a game.
          </h1>
          <p className="text-muted-foreground">
            AI looks at your travel snapshot and invents a playable mini-game inspired by what it sees.
          </p>
        </div>

        <div className="bg-card rounded-3xl p-6 shadow-card">
          <label className="block cursor-pointer">
            <div className={`relative aspect-video rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${photo ? 'border-primary' : 'border-border hover:border-primary/50 bg-muted'}`}>
              {photo ? (
                <img src={photo} alt="Upload" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground p-6">
                  <Upload className="h-10 w-10 mx-auto mb-3" />
                  <p className="font-semibold">Click to upload a travel photo</p>
                  <p className="text-xs mt-1">JPG/PNG, up to 5MB</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>

          <div className="mt-4">
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Anything to know about this trip? <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={hint}
              onChange={(e) => setHint(e.target.value.slice(0, 300))}
              placeholder="e.g., I got stuck in the rain in Kyoto and ducked into 12 ramen shops..."
              className="w-full rounded-xl border border-input bg-background p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <Button
            onClick={generate}
            disabled={loading || !photo}
            size="lg"
            className="w-full mt-4 bg-gradient-sunrise hover:opacity-90 text-primary-foreground font-bold h-14 rounded-xl"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin mr-2" /> AI is dreaming…</>
            ) : (
              <><Sparkles className="h-5 w-5 mr-2" /> Generate my game</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIGameGenerator;
