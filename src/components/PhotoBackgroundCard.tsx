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
    'vault-worthy': 'border-2 border-vault-gold shadow-[0_0_40px_hsla(45,70%,52%,0.3)] hover:shadow-[0_0_60px_hsla(45,70%,52%,0.5)]',
    'high-value': 'border border-vault-gold/30 hover:border-vault-gold/50',
    'archive': 'border border-vault-mid-gray/20 hover:border-vault-mid-gray/40',
  };

  return (
    <Card 
      className={`group relative overflow-hidden h-64 cursor-pointer transition-all duration-500 ${borderClasses[variant]} ${onClick ? 'hover:scale-[1.02]' : ''}`}
      onClick={onClick}
    >
      {/* Background photo */}
      {photoUrl && (
        <div className="absolute inset-0">
          <img 
            src={photoUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className={`absolute inset-0 ${
            variant === 'vault-worthy' 
              ? 'bg-gradient-to-br from-vault-black/70 via-vault-black/80 to-vault-black/90'
              : 'bg-gradient-to-br from-vault-black/80 via-vault-black/85 to-vault-black/90'
          }`} />
        </div>
      )}
      
      <div className="relative z-10 p-8 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Icon className={`h-8 w-8 ${
              variant === 'vault-worthy' ? 'text-vault-gold' : 
              variant === 'high-value' ? 'text-vault-gold/70' : 
              'text-vault-light-gray'
            }`} />
            <h3 className="font-black text-xl text-foreground">
              {title}
            </h3>
          </div>
          
          <div className="mb-2">
            <span className="font-mono text-5xl font-bold text-vault-gold">
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
        
        {/* Mini preview of top photos */}
        {previewPhotos.length > 0 && (
          <div className="flex gap-2">
            {previewPhotos.slice(0, 3).map((url, i) => (
              <div 
                key={i} 
                className={`w-16 h-16 rounded overflow-hidden ${
                  variant === 'vault-worthy' ? 'border-2 border-vault-gold/50' : 'border border-vault-gold/30'
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
