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
import Journal from "./pages/Journal";
import PrintEditionPlay from "./pages/PrintEditionPlay";
import JoinGame from "./pages/JoinGame";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<SiteShell />}>
            <Route path="/" element={<Index />} />
            <Route path="/games/bug-forest" element={<BugGame />} />
            <Route path="/games/ai-create" element={<AIGameGenerator />} />
            <Route path="/games/ai-play" element={<AIGamePlay />} />
            <Route path="/games/editions/:id" element={<PrintEditionPlay />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/games/join" element={<JoinGame />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
