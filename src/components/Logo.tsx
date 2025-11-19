import { Lock } from "lucide-react";

interface LogoProps {
  variant?: "full" | "icon" | "wordmark";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function Logo({ variant = "full", size = "md", animated = false }: LogoProps) {
  const sizes = {
    sm: { icon: "h-6 w-6", iconInner: "h-4 w-4", text: "text-xl", tagline: "text-xs" },
    md: { icon: "h-8 w-8", iconInner: "h-5 w-5", text: "text-3xl", tagline: "text-sm" },
    lg: { icon: "h-12 w-12", iconInner: "h-7 w-7", text: "text-5xl", tagline: "text-base" }
  };

  const sizeClasses = sizes[size];

  if (variant === "icon") {
    return (
      <div className={`relative ${animated ? 'group' : ''}`}>
        <div className={`${sizeClasses.icon} rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary ${animated ? 'group-hover:rotate-45 transition-transform duration-500' : ''}`}>
          <Lock className={`${sizeClasses.iconInner} text-primary`} />
        </div>
      </div>
    );
  }

  if (variant === "wordmark") {
    return (
      <span className={`${sizeClasses.text} font-black text-foreground uppercase tracking-wider`}>
        VAULT
      </span>
    );
  }

  // Full logo with tagline
  return (
    <div className="flex items-center gap-3">
      <Logo variant="icon" size={size} animated={animated} />
      <div>
        <div className={`${sizeClasses.text} font-black text-foreground uppercase tracking-wider leading-none mb-1`}>
          VAULT
        </div>
        {size !== "sm" && (
          <div className={`${sizeClasses.tagline} text-muted-foreground uppercase tracking-wide`}>
            Your Photos. Your Magic.
          </div>
        )}
      </div>
    </div>
  );
}
