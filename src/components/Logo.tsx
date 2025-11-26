import vaultLogo from "@/assets/vault-logo.png";

interface LogoProps {
  variant?: "full" | "icon" | "wordmark";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function Logo({ variant = "full", size = "md", animated = false }: LogoProps) {
  const sizes = {
    sm: { icon: "h-18 w-18", iconInner: "h-12 w-12", text: "text-xl", tagline: "text-xs" },
    md: { icon: "h-24 w-24", iconInner: "h-15 w-15", text: "text-3xl", tagline: "text-sm" },
    lg: { icon: "h-36 w-36", iconInner: "h-21 w-21", text: "text-5xl", tagline: "text-base" }
  };

  const sizeClasses = sizes[size];

  if (variant === "icon") {
    return (
      <div className={`relative ${animated ? 'group' : ''}`}>
        <div className={`${sizeClasses.icon} flex items-center justify-center ${animated ? 'group-hover:rotate-45 transition-transform duration-500' : ''}`}>
          <img src={vaultLogo} alt="VAULT Logo" className="w-full h-full object-contain" />
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
