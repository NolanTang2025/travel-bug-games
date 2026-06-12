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
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ArchiveCreate from "./pages/ArchiveCreate";
import ArchiveDetail from "./pages/ArchiveDetail";
import TwinDashboard from "./pages/TwinDashboard";
import TwinDraftEditor from "./pages/TwinDraftEditor";
import InstagramPlay from "./pages/InstagramPlay";
import ViralTrends from "./pages/ViralTrends";
import NotFound from "./pages/NotFound";
import { RequireAuth } from "./components/RequireAuth";
import { AuthProvider } from "./contexts/AuthProvider";
import { LaunchPausedRoute } from "@/components/LaunchPausedRoute";
import { LAUNCH_GATE } from "@/lib/launchGate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          <Route
            path="/play"
            element={
              LAUNCH_GATE.pastePostToGame ? (
                <InstagramPlay />
              ) : (
                <LaunchPausedRoute route="pastePost" />
              )
            }
          />
          <Route path="/games/ai-play" element={<AIGamePlay />} />
          <Route path="/games/play/:gameId" element={<AIGamePlay />} />
          <Route element={<SiteShell />}>
            <Route path="/" element={<Index />} />
            <Route path="/games/bug-forest" element={<BugGame />} />
            <Route
              path="/games/ai-create"
              element={
                LAUNCH_GATE.journalToGame ? (
                  <AIGameGenerator />
                ) : (
                  <LaunchPausedRoute route="journalCreate" />
                )
              }
            />
            <Route
              path="/trends"
              element={
                LAUNCH_GATE.trendRemixToGame ? (
                  <ViralTrends />
                ) : (
                  <LaunchPausedRoute route="trendRemix" />
                )
              }
            />
            <Route path="/games/editions/:id" element={<PrintEditionPlay />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/games/join" element={<JoinGame />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
            <Route
              path="/archive/new"
              element={
                <RequireAuth>
                  <ArchiveCreate />
                </RequireAuth>
              }
            />
            <Route
              path="/archive/:id"
              element={
                <RequireAuth>
                  <ArchiveDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/twin"
              element={
                <RequireAuth>
                  <TwinDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/twin/drafts/:id"
              element={
                <RequireAuth>
                  <TwinDraftEditor />
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
