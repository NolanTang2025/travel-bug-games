import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { getSavedGame } from "@/lib/gameLibrary";

export default function GameFromLibrary() {
  const nav = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (!id) {
      nav("/", { replace: true });
      return;
    }
    const g = getSavedGame(id);
    if (!g) {
      toast.error("Game not found");
      nav("/", { replace: true });
      return;
    }
    sessionStorage.setItem("ai_game", g.payload);
    nav("/games/ai-play", { replace: true });
  }, [id, nav]);

  return null;
}

