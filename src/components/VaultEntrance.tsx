import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTop10Photos } from "@/hooks/useTop10Photos";
import { VaultDoor } from "./VaultDoor";

interface VaultEntranceProps {
  onEnter: () => void;
}

export const VaultEntrance = ({ onEnter }: VaultEntranceProps) => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [photoCount, setPhotoCount] = useState("");
  const [showCascade, setShowCascade] = useState(false);
  const [showDoor, setShowDoor] = useState(false);
  const [revealedPhotos, setRevealedPhotos] = useState<string[]>([]);
  const { top10Photos } = useTop10Photos();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sample photos for the emergence effect
  const samplePhotos = top10Photos.slice(0, 20);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Draw spotlight effect on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create radial gradient for spotlight
      const gradient = ctx.createRadialGradient(
        cursorPosition.x, cursorPosition.y, 0,
        cursorPosition.x, cursorPosition.y, 200
      );
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.15)");
      gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.05)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    draw();
  }, [cursorPosition]);

  const handlePhotoCountSubmit = () => {
    if (!photoCount) return;
    
    setShowCascade(true);
    
    // After cascade animation, show the door
    setTimeout(() => {
      setShowCascade(false);
      setShowDoor(true);
    }, 4000);
  };

  if (showDoor) {
    return <VaultDoor onOpen={onEnter} />;
  }

  return (
    <div className="relative h-screen w-full bg-vault-black overflow-hidden cursor-none">
      {/* Canvas for spotlight effect */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* Custom cursor spotlight */}
      <div
        className="fixed w-96 h-96 rounded-full pointer-events-none z-20 transition-transform duration-100"
        style={{
          left: cursorPosition.x - 192,
          top: cursorPosition.y - 192,
          background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)",
        }}
      />

      {/* Photos emerging from darkness */}
      <div className="absolute inset-0 z-0">
        {samplePhotos.map((photo, index) => {
          const x = (index * 127) % window.innerWidth;
          const y = ((index * 83) % window.innerHeight);
          const distance = Math.sqrt(
            Math.pow(cursorPosition.x - x, 2) + Math.pow(cursorPosition.y - y, 2)
          );
          const opacity = Math.max(0, Math.min(1, (300 - distance) / 300));

          return (
            <div
              key={photo.id}
              className="absolute transition-opacity duration-500"
              style={{
                left: x,
                top: y,
                width: "200px",
                height: "150px",
                opacity: opacity * 0.4,
                transform: `scale(${0.8 + opacity * 0.2})`,
              }}
            >
              <img
                src={photo.url}
                alt=""
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          );
        })}
      </div>

      {/* Cascade effect */}
      {showCascade && (
        <div className="absolute inset-0 z-30 overflow-hidden">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-cascade"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <img
                src={samplePhotos[i % samplePhotos.length]?.url}
                alt=""
                className="w-24 h-20 object-cover rounded opacity-60"
              />
            </div>
          ))}
          
          {/* Final message after cascade */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center animate-fade-in" style={{ animationDelay: "2s" }}>
              <p className="text-4xl text-white font-light mb-4">
                But only this one mattered.
              </p>
              {samplePhotos[0] && (
                <img
                  src={samplePhotos[0].url}
                  alt=""
                  className="mx-auto w-96 h-64 object-cover rounded-lg shadow-2xl mb-8"
                />
              )}
              <p className="text-3xl text-white font-light mb-2">
                What if you could find all of them?
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Central question and input */}
      {!showCascade && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center max-w-2xl px-6 animate-fade-in">
            <h1 className="text-4xl md:text-6xl text-white font-light mb-12 leading-relaxed">
              How many photographs<br />have you taken?
            </h1>
            
            <div className="flex gap-4 items-center justify-center">
              <Input
                type="number"
                value={photoCount}
                onChange={(e) => setPhotoCount(e.target.value)}
                placeholder="70,000"
                className="bg-transparent border-2 border-vault-gold text-white text-2xl text-center w-48 h-16 placeholder:text-vault-gold/50"
                onKeyDown={(e) => e.key === "Enter" && handlePhotoCountSubmit()}
              />
              <Button
                onClick={handlePhotoCountSubmit}
                className="bg-vault-gold hover:bg-vault-gold-dark text-vault-dark font-bold h-16 px-8"
                disabled={!photoCount}
              >
                Reveal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
