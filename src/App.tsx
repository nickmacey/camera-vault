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
import { VaultDoorAnimation } from "@/components/VaultDoorAnimation";
import { AuthGuard } from "@/components/AuthGuard";
import { UploadProvider } from "@/contexts/UploadContext";
import { FloatingUploadProgress } from "@/components/FloatingUploadProgress";

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
          <Toaster />
          <Sonner />
          <FloatingUploadProgress />
          {showAnimation && !animationComplete && (
            <VaultDoorAnimation onComplete={handleAnimationComplete} />
          )}
          <div className={`transition-opacity duration-700 ${animationComplete ? 'opacity-100' : 'opacity-0'}`}>
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                
                {/* App routes (protected) */}
                <Route path="/app" element={<AuthGuard><Index /></AuthGuard>} />
                <Route path="/app/vault" element={<AuthGuard><VaultPage /></AuthGuard>} />
                <Route path="/auth/google/callback" element={<GoogleCallback />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </UploadProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
