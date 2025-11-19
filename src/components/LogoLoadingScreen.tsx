import { useEffect, useState } from "react";
import { Logo } from "./Logo";

interface LogoLoadingScreenProps {
  onComplete: () => void;
}

export function LogoLoadingScreen({ onComplete }: LogoLoadingScreenProps) {
  const [phase, setPhase] = useState<"opening" | "glowing" | "fadeOut">("opening");

  useEffect(() => {
    // Opening animation
    const openingTimer = setTimeout(() => {
      setPhase("glowing");
    }, 1000);

    // Glow phase
    const glowTimer = setTimeout(() => {
      setPhase("fadeOut");
    }, 2000);

    // Fade out and complete
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(openingTimer);
      clearTimeout(glowTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-background flex items-center justify-center transition-opacity duration-800 ${
        phase === "fadeOut" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative">
        {/* Logo with vault opening animation */}
        <div
          className={`transition-all duration-1000 ${
            phase === "opening"
              ? "animate-[vaultOpen_1s_ease-in-out]"
              : phase === "glowing"
              ? "logo-pulse"
              : ""
          }`}
        >
          <Logo variant="icon" size="lg" />
        </div>

        {/* Wordmark fades in after opening */}
        <div
          className={`mt-6 text-center transition-all duration-500 ${
            phase === "opening" ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          }`}
        >
          <div className="text-4xl font-black text-foreground uppercase tracking-wider">
            VAULT
          </div>
          <div className="text-sm text-muted-foreground uppercase tracking-wide mt-2">
            Your Photos. Your Magic.
          </div>
        </div>
      </div>
    </div>
  );
}
