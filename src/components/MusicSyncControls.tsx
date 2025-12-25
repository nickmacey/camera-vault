import { useMusicSync } from "@/contexts/MusicSyncContext";
import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Music, Zap, Gauge } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function MusicSyncControls() {
  const { 
    syncEnabled, 
    setSyncEnabled, 
    speedMultiplier, 
    setSpeedMultiplier,
    pulseEnabled,
    setPulseEnabled,
    isPlaying,
    progress 
  } = useMusicSync();
  
  const { currentTrack, isReady } = useSpotifyPlayer();
  
  // Only show if Spotify is connected
  if (!isReady && !currentTrack) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 left-4 z-40 bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-4 w-72 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/30">
        <div className={`p-2 rounded-lg ${syncEnabled ? 'bg-primary/20' : 'bg-muted'}`}>
          <Music className={`h-4 w-4 ${syncEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-foreground">Music Sync</h4>
          <p className="text-xs text-muted-foreground">
            {isPlaying ? 'Playing' : 'Paused'}
          </p>
        </div>
        <Switch
          checked={syncEnabled}
          onCheckedChange={setSyncEnabled}
        />
      </div>
      
      <AnimatePresence>
        {syncEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Speed Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1.5 text-muted-foreground">
                  <Gauge className="h-3 w-3" />
                  Animation Speed
                </Label>
                <span className="text-xs font-mono text-primary">
                  {speedMultiplier.toFixed(1)}x
                </span>
              </div>
              <Slider
                value={[speedMultiplier]}
                onValueChange={([v]) => setSpeedMultiplier(v)}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground/50">
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>
            
            {/* Pulse Toggle */}
            <div className="flex items-center justify-between py-2">
              <Label className="text-xs flex items-center gap-1.5 text-muted-foreground">
                <Zap className="h-3 w-3" />
                Pulse Effect
              </Label>
              <Switch
                checked={pulseEnabled}
                onCheckedChange={setPulseEnabled}
                className="scale-90"
              />
            </div>
            
            {/* Progress Indicator */}
            {currentTrack && (
              <div className="pt-2 border-t border-border/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="truncate flex-1">{currentTrack.name}</span>
                  <span className="font-mono">{Math.round(progress * 100)}%</span>
                </div>
                <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    style={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
