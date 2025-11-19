import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedScoreBarProps {
  score: number; // Score out of 10
  label: string;
  className?: string;
}

export function AnimatedScoreBar({ score, label, className }: AnimatedScoreBarProps) {
  const [width, setWidth] = useState(0);
  const percentage = Math.min(Math.max(score * 10, 0), 100); // Convert 0-10 to 0-100%

  useEffect(() => {
    // Animate the bar on mount
    const timer = setTimeout(() => {
      setWidth(percentage);
    }, 100);

    return () => clearTimeout(timer);
  }, [percentage]);

  // Color based on score
  const getColorClasses = () => {
    if (score >= 9) return 'bg-vault-gold shadow-[0_0_12px_hsl(var(--vault-gold)/0.6)]';
    if (score >= 7) return 'bg-gradient-to-r from-vault-gold to-yellow-400 shadow-[0_0_12px_hsl(var(--vault-gold)/0.4)]';
    if (score >= 5) return 'bg-gradient-to-r from-yellow-400 to-orange-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]';
    return 'bg-gradient-to-r from-orange-400 to-red-400 shadow-[0_0_10px_rgba(251,146,60,0.4)]';
  };

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between text-xs mb-2">
        <span className="text-vault-light-gray">{label}</span>
        <span className="font-mono text-vault-platinum font-bold">{score.toFixed(1)}</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-vault-mid-gray/30">
        {/* Background track with subtle glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-vault-mid-gray/10 to-transparent" />
        
        {/* Animated fill bar with glow */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out',
            getColorClasses()
          )}
          style={{ 
            width: `${width}%`,
            transformOrigin: 'left'
          }}
        >
          {/* Inner glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          
          {/* Shimmer effect */}
          <div 
            className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
            style={{
              animation: 'shimmer 2s infinite',
              backgroundSize: '200% 100%'
            }}
          />
        </div>

        {/* Score marker at the end */}
        {width > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-1000 ease-out"
            style={{ left: `${width}%`, marginLeft: '-2px' }}
          />
        )}
      </div>
    </div>
  );
}
