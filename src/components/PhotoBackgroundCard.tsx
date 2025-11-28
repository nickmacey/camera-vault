import { useState } from "react";
import { Card } from "@/components/ui/card";
import { LucideIcon, Printer, Share2, Image } from "lucide-react";

interface ValueBreakdown {
  print: number;
  social: number;
  stock: number;
}

interface PhotoBackgroundCardProps {
  photoUrl?: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  count: number;
  value?: string;
  valueBreakdown?: ValueBreakdown;
  description: string;
  previewPhotos?: string[];
  onClick?: () => void;
  variant?: 'vault-worthy' | 'high-value' | 'archive';
}

export const PhotoBackgroundCard = ({
  photoUrl,
  icon: Icon,
  title,
  subtitle,
  count,
  value,
  valueBreakdown,
  description,
  previewPhotos = [],
  onClick,
  variant = 'high-value',
}: PhotoBackgroundCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const variantStyles = {
    'vault-worthy': {
      border: 'border-2 border-primary/50',
      shadow: 'shadow-[0_0_60px_hsla(var(--primary)/0.4)] hover:shadow-[0_0_100px_hsla(var(--primary)/0.7)]',
      iconColor: 'text-primary',
      gradient: 'from-primary/20 via-background/80 to-background',
      countColor: 'text-primary',
      valueColor: 'text-primary',
      glowColor: 'bg-primary/20',
    },
    'high-value': {
      border: 'border border-accent/40',
      shadow: 'shadow-[0_0_40px_hsla(var(--accent)/0.3)] hover:shadow-[0_0_80px_hsla(var(--accent)/0.6)]',
      iconColor: 'text-accent',
      gradient: 'from-accent/15 via-background/85 to-background',
      countColor: 'text-accent',
      valueColor: 'text-accent',
      glowColor: 'bg-accent/20',
    },
    'archive': {
      border: 'border border-muted/30',
      shadow: 'shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]',
      iconColor: 'text-muted-foreground',
      gradient: 'from-muted/10 via-background/90 to-background',
      countColor: 'text-muted-foreground',
      valueColor: 'text-muted-foreground',
      glowColor: 'bg-muted/20',
    },
  };

  const styles = variantStyles[variant];

  return (
    <Card 
      className={`group relative overflow-hidden min-h-[450px] sm:min-h-[550px] md:min-h-[650px] cursor-pointer transition-all duration-700 bg-background/40 backdrop-blur-xl ${styles.border} ${styles.shadow} hover:scale-[1.02] hover:-translate-y-2`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background with photo */}
      <div className="absolute inset-0 overflow-hidden">
        {photoUrl && (
          <>
            <img 
              src={photoUrl}
              alt=""
              className={`w-full h-full object-cover transition-all duration-1000 ${
                isHovered ? 'opacity-30 scale-110 blur-sm' : 'opacity-15 scale-100 blur-[2px]'
              }`}
              loading="lazy"
              decoding="async"
            />
            <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} transition-opacity duration-700`} />
          </>
        )}
        
        {/* Animated glow effect */}
        <div 
          className={`absolute inset-0 ${styles.glowColor} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
          style={{
            background: `radial-gradient(circle at 50% 50%, ${styles.glowColor} 0%, transparent 70%)`,
          }}
        />
      </div>
      
      <div className="relative z-10 p-4 sm:p-6 md:p-8 h-full flex flex-col">
        {/* Icon with glow */}
        <div className="mb-4 sm:mb-6 flex items-start justify-between">
          <div className="relative">
            <div className={`absolute inset-0 ${styles.glowColor} blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <Icon className={`relative h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 ${styles.iconColor} transition-all duration-500 ${
              isHovered ? 'scale-110 rotate-12' : 'scale-100 rotate-0'
            }`} />
          </div>
        </div>

        {/* Title and subtitle */}
        <div className="mb-4 sm:mb-6">
          <h3 className="font-black text-xl sm:text-2xl md:text-3xl text-foreground mb-1 tracking-tight leading-none">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-light">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Count with animation */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-baseline gap-2 sm:gap-3">
            <span className={`font-black text-4xl sm:text-5xl md:text-7xl ${styles.countColor} transition-all duration-500 ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}>
              {count}
            </span>
            <span className="text-sm sm:text-base md:text-xl text-muted-foreground font-light">
              {count === 1 ? 'asset' : 'assets'}
            </span>
          </div>
        </div>
        
        {/* Value */}
        {value && (
          <div className="mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-muted-foreground/80">
              Estimated value
            </p>
            <p className={`text-xl sm:text-2xl md:text-3xl font-black ${styles.valueColor}`}>
              {value}
            </p>
            
            {/* Value Breakdown */}
            {valueBreakdown && (
              <div className="mt-2 flex flex-wrap gap-2 sm:gap-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Printer className="h-3 w-3" />
                  <span>${valueBreakdown.print.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Share2 className="h-3 w-3" />
                  <span>${valueBreakdown.social.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Image className="h-3 w-3" />
                  <span>${valueBreakdown.stock.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Description */}
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground/90 leading-relaxed mb-4 sm:mb-6 font-light">
          {description}
        </p>
        
        {/* Photo grid preview with stagger animation - only show if photos exist */}
        {previewPhotos.length > 0 && previewPhotos.some(url => url) && (
          <div className="flex-1 overflow-hidden mt-auto">
            <div className="grid grid-cols-4 gap-2">
              {previewPhotos.filter(url => url).slice(0, 8).map((url, i) => (
                <div 
                  key={i} 
                  className={`aspect-square rounded-lg overflow-hidden relative ${
                    variant === 'vault-worthy' 
                      ? 'border-2 border-primary/40 shadow-[0_0_15px_hsla(var(--primary)/0.3)]' 
                      : variant === 'high-value'
                      ? 'border border-accent/30 shadow-[0_0_10px_hsla(var(--accent)/0.2)]'
                      : 'border border-muted/20'
                  } hover:scale-110 hover:z-10 transition-all duration-300`}
                  style={{
                    animation: `fade-in 0.6s ease-out ${i * 0.08}s backwards`,
                    transform: isHovered ? `translateY(-${i * 2}px)` : 'translateY(0)',
                    transitionDelay: `${i * 30}ms`,
                  }}
                >
                  <img 
                    src={url}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Card>
  );
};
