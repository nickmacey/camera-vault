import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface PhotoBackgroundCardProps {
  photoUrl?: string;
  icon: LucideIcon;
  title: string;
  count: number;
  value?: string;
  description: string;
  previewPhotos?: string[];
  onClick?: () => void;
  variant?: 'vault-worthy' | 'high-value' | 'archive';
}

export const PhotoBackgroundCard = ({
  photoUrl,
  icon: Icon,
  title,
  count,
  value,
  description,
  previewPhotos = [],
  onClick,
  variant = 'high-value',
}: PhotoBackgroundCardProps) => {
  const borderClasses = {
    'vault-worthy': 'border-2 border-vault-gold shadow-[0_0_40px_hsla(45,70%,52%,0.3)] hover:shadow-[0_0_80px_hsla(45,70%,52%,0.6)]',
    'high-value': 'border border-vault-gold/30 hover:border-vault-gold/60 hover:shadow-[0_0_40px_hsla(45,70%,52%,0.2)]',
    'archive': 'border border-vault-mid-gray/20 hover:border-vault-mid-gray/50 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]',
  };

  const iconClasses = {
    'vault-worthy': 'text-vault-gold',
    'high-value': 'text-vault-gold/70',
    'archive': 'text-vault-light-gray',
  };

  return (
    <Card 
      className={`group relative overflow-hidden min-h-[600px] cursor-pointer transition-all duration-500 bg-vault-black/80 backdrop-blur-sm ${borderClasses[variant]} ${onClick ? 'hover:scale-[1.01]' : 'hover:scale-[1.005]'}`}
      onClick={onClick}
    >
      {/* Background photo with enhanced overlay */}
      {photoUrl && (
        <div className="absolute inset-0">
          <img 
            src={photoUrl}
            alt=""
            className="w-full h-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-1000"
          />
          <div className={`absolute inset-0 ${
            variant === 'vault-worthy' 
              ? 'bg-gradient-to-br from-vault-black/85 via-vault-black/90 to-vault-gold/10'
              : variant === 'high-value'
              ? 'bg-gradient-to-br from-vault-black/90 via-vault-black/92 to-vault-gold/5'
              : 'bg-gradient-to-br from-vault-black/92 via-vault-black/95 to-vault-black/98'
          }`} />
        </div>
      )}
      
      <div className="relative z-10 p-8 h-full flex flex-col">
        {/* Header section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Icon className={`h-8 w-8 ${iconClasses[variant]} group-hover:scale-110 transition-transform duration-300`} />
            <h3 className="font-black text-xl text-foreground">
              {title}
            </h3>
          </div>
          
          <div className="mb-2">
            <span className="font-mono text-5xl font-bold text-vault-gold group-hover:text-vault-gold/90 transition-colors">
              {count}
            </span>
            <span className="ml-2 text-muted-foreground">assets</span>
          </div>
          
          {value && (
            <div className="text-sm text-muted-foreground mb-3">
              Est. value: <span className="text-vault-gold font-bold">{value}</span>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
        
        {/* Multi-row photo grid */}
        {previewPhotos.length > 0 && (
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-4 gap-2 auto-rows-min">
              {previewPhotos.map((url, i) => (
                <div 
                  key={i} 
                  className={`aspect-square rounded overflow-hidden relative group/thumb ${
                    variant === 'vault-worthy' ? 'border-2 border-vault-gold/30' : 'border border-vault-gold/20'
                  } hover:border-vault-gold hover:scale-105 transition-all duration-300 hover:z-10`}
                  style={{
                    animation: `fade-in 0.5s ease-out ${i * 0.05}s backwards`
                  }}
                >
                  <img 
                    src={url} 
                    alt="" 
                    className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-500" 
                  />
                  {variant === 'vault-worthy' && (
                    <div className="absolute inset-0 bg-vault-gold/0 group-hover/thumb:bg-vault-gold/20 transition-colors duration-300" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
