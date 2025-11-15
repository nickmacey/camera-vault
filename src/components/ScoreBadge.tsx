import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const ScoreBadge = ({ score, className, size = "md" }: ScoreBadgeProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 8.5) return "bg-gradient-to-br from-vault-gold via-vault-gold-dark to-vault-gold text-vault-dark border-2 border-vault-gold shadow-[0_0_20px_rgba(212,175,55,0.5)]";
    if (score >= 7.0) return "bg-gradient-to-br from-score-good to-score-good/80 text-white border-2 border-score-good/50 shadow-lg";
    if (score >= 6.0) return "bg-gradient-to-br from-score-average to-score-average/80 text-white border-2 border-score-average/50 shadow-lg";
    return "bg-gradient-to-br from-score-poor to-score-poor/80 text-white border-2 border-score-poor/50 shadow-lg";
  };

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1 min-w-[2.5rem]",
    md: "text-base px-3.5 py-2 min-w-[3.5rem]",
    lg: "text-xl px-5 py-3 min-w-[4.5rem]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-bold font-mono tracking-tight transition-all duration-300 hover:scale-105",
        getScoreColor(score),
        sizeClasses[size],
        className
      )}
    >
      {score.toFixed(1)}
    </div>
  );
};

export default ScoreBadge;
