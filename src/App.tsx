import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import GoogleCallback from "./pages/GoogleCallback";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import { VaultDoorAnimation } from "@/components/VaultDoorAnimation";

const queryClient = new QueryClient();

const App = () => {
  const [showAnimation, setShowAnimation] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Check if animation has been shown this session
    const hasSeenAnimation = sessionStorage.getItem('vaultDoorShown');
    if (hasSeenAnimation) {
      setShowAnimation(false);
      setAnimationComplete(true);
    }
  }, []);

  const handleAnimationComplete = () => {
    sessionStorage.setItem('vaultDoorShown', 'true');
    setAnimationComplete(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showAnimation && !animationComplete && (
          <VaultDoorAnimation onComplete={handleAnimationComplete} />
        )}
        <div className={`transition-opacity duration-700 ${animationComplete ? 'opacity-100' : 'opacity-0'}`}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route path="/privacy" element={<Privacy />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
