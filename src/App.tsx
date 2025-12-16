import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import GoogleCallback from "./pages/GoogleCallback";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import VaultPage from "./pages/VaultPage";
import StarsPage from "./pages/StarsPage";
import GemsPage from "./pages/GemsPage";
import HighlightReelPage from "./pages/HighlightReelPage";
import LensPage from "./pages/LensPage";
import MusicPage from "./pages/MusicPage";
import { VaultDoorAnimation } from "@/components/VaultDoorAnimation";
import { AuthGuard } from "@/components/AuthGuard";
import { UploadProvider } from "@/contexts/UploadContext";
import { SpotifyPlayerProvider } from "@/contexts/SpotifyPlayerContext";
import { FloatingUploadProgress } from "@/components/FloatingUploadProgress";
import { PersistentSpotifyPlayer } from "@/components/PersistentSpotifyPlayer";

const queryClient = new QueryClient();

const App = () => {
  const [showAnimation, setShowAnimation] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Animation will show every time - no session storage check

  const handleAnimationComplete = () => {
    setAnimationComplete(true);
    setShowAnimation(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UploadProvider>
          <SpotifyPlayerProvider>
            <Toaster />
            <Sonner />
            <FloatingUploadProgress />
            {showAnimation && !animationComplete && (
              <VaultDoorAnimation onComplete={handleAnimationComplete} />
            )}
            <div className={`transition-opacity duration-700 ${animationComplete ? 'opacity-100' : 'opacity-0'}`}>
              <BrowserRouter>
                <PersistentSpotifyPlayer />
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  
                  {/* App routes (protected) */}
                  <Route path="/story" element={<AuthGuard><HighlightReelPage /></AuthGuard>} />
                  <Route path="/app" element={<AuthGuard><Index /></AuthGuard>} />
                  <Route path="/app/vault" element={<AuthGuard><VaultPage /></AuthGuard>} />
                  <Route path="/app/stars" element={<AuthGuard><StarsPage /></AuthGuard>} />
                  <Route path="/app/gems" element={<AuthGuard><GemsPage /></AuthGuard>} />
                  <Route path="/app/lens" element={<AuthGuard><LensPage /></AuthGuard>} />
                  <Route path="/app/music" element={<AuthGuard><MusicPage /></AuthGuard>} />
                  <Route path="/auth/google/callback" element={<GoogleCallback />} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </div>
          </SpotifyPlayerProvider>
        </UploadProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
