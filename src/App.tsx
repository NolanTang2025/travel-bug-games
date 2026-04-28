import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteShell } from "@/components/SiteShell";
import Index from "./pages/Index";
import BugGame from "./pages/BugGame";
import AIGameGenerator from "./pages/AIGameGenerator";
import AIGamePlay from "./pages/AIGamePlay";
import JournalEditor from "./pages/JournalEditor";
import JournalBook from "./pages/JournalBook";
import GameJoin from "./pages/GameJoin";
import GameFromLibrary from "./pages/GameFromLibrary";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <SiteShell>
                <Index />
              </SiteShell>
            }
          />
          <Route
            path="/journal"
            element={
              <SiteShell>
                <JournalEditor />
              </SiteShell>
            }
          />
          <Route
            path="/journal/book"
            element={
              <SiteShell>
                <JournalBook />
              </SiteShell>
            }
          />
          <Route
            path="/games/join"
            element={
              <SiteShell>
                <GameJoin />
              </SiteShell>
            }
          />
          <Route path="/games/library/:id" element={<GameFromLibrary />} />
          <Route path="/games/bug-forest" element={<BugGame />} />
          <Route
            path="/games/ai-create"
            element={
              <SiteShell>
                <AIGameGenerator />
              </SiteShell>
            }
          />
          <Route path="/games/ai-play" element={<AIGamePlay />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
