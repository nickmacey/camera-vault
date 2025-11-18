import { Lock } from "lucide-react";

interface AnimatedLockIconProps {
  size?: number;
  className?: string;
}

export const AnimatedLockIcon = ({ size = 64, className = "" }: AnimatedLockIconProps) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Outer glow ring - pulsing */}
      <div className="absolute inset-0 rounded-full bg-vault-gold/20 animate-ping" 
           style={{ animationDuration: '3s' }} />
      
      {/* Middle glow ring - rotating */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-vault-gold/40 via-transparent to-vault-gold/40 animate-spin" 
           style={{ animationDuration: '8s' }} />
      
      {/* Static glow halo */}
      <div className="absolute inset-0 rounded-full bg-vault-gold/30 blur-xl" />
      <div className="absolute inset-0 rounded-full bg-vault-gold/20 blur-2xl scale-125" />
      
      {/* Main circular border with gradient */}
      <div className="relative rounded-full p-1 bg-gradient-to-br from-vault-gold via-vault-gold/80 to-vault-gold/50 animate-pulse"
           style={{ animationDuration: '4s' }}>
        <div className="rounded-full bg-vault-black p-6 border-2 border-vault-gold/30">
          {/* Lock icon with subtle animations */}
          <div className="relative animate-[scale-in_0.5s_ease-out]">
            <Lock 
              className="text-vault-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.5)] transition-transform duration-300 hover:scale-110" 
              size={size}
              strokeWidth={2.5}
            />
            
            {/* Shimmer effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-[slide-in-right_3s_ease-in-out_infinite]" 
                 style={{ animationDelay: '1s' }} />
          </div>
        </div>
      </div>
      
      {/* Corner highlights */}
      <div className="absolute top-0 right-0 w-3 h-3 bg-vault-gold/60 rounded-full blur-sm animate-pulse" 
           style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
      <div className="absolute bottom-0 left-0 w-2 h-2 bg-vault-gold/40 rounded-full blur-sm animate-pulse" 
           style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
    </div>
  );
};
