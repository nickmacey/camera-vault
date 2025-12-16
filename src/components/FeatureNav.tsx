import { useNavigate, useLocation } from "react-router-dom";
import { 
  Eye, 
  Music, 
  Sparkles, 
  Star, 
  Gem, 
  BookImage,
  Upload,
  ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureNavProps {
  className?: string;
}

const features = [
  {
    id: "story",
    label: "My Story",
    icon: BookImage,
    path: "/story",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    hoverColor: "hover:bg-purple-500/20",
    borderColor: "border-purple-500/30",
  },
  {
    id: "lens",
    label: "My Lens",
    icon: Eye,
    path: "/app/lens",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    hoverColor: "hover:bg-cyan-500/20",
    borderColor: "border-cyan-500/30",
  },
  {
    id: "music",
    label: "Video Lab",
    icon: Music,
    path: "/app/music",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    hoverColor: "hover:bg-green-500/20",
    borderColor: "border-green-500/30",
  },
  {
    id: "vault",
    label: "My Vault",
    icon: Sparkles,
    path: "/app/vault",
    color: "text-primary",
    bgColor: "bg-primary/10",
    hoverColor: "hover:bg-primary/20",
    borderColor: "border-primary/30",
  },
  {
    id: "stars",
    label: "Photo Lab",
    icon: Star,
    path: "/app/stars",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    hoverColor: "hover:bg-amber-500/20",
    borderColor: "border-amber-500/30",
  },
  {
    id: "gems",
    label: "My Library",
    icon: Gem,
    path: "/app/gems",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    hoverColor: "hover:bg-blue-500/20",
    borderColor: "border-blue-500/30",
  },
];

export function FeatureNav({ className }: FeatureNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={cn("w-full", className)}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {features.map((feature) => {
            const isActive = location.pathname === feature.path;
            const Icon = feature.icon;
            
            return (
              <button
                key={feature.id}
                onClick={() => navigate(feature.path)}
                className={cn(
                  "relative group flex flex-col items-center p-3 md:p-4 rounded-xl border transition-all duration-300",
                  feature.bgColor,
                  feature.hoverColor,
                  isActive ? feature.borderColor : "border-transparent",
                  isActive && "ring-1 ring-offset-2 ring-offset-background",
                  isActive && `ring-${feature.color.replace('text-', '')}`
                )}
              >
                <div className={cn(
                  "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-110",
                  feature.bgColor
                )}>
                  <Icon className={cn("w-5 h-5 md:w-6 md:h-6", feature.color)} />
                </div>
                <span className={cn(
                  "text-xs md:text-sm font-bold uppercase tracking-wide",
                  isActive ? feature.color : "text-foreground"
                )}>
                  {feature.label}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className={cn(
                    "absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full",
                    feature.color.replace('text-', 'bg-')
                  )} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
