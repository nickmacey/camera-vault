import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const ScoreBadge = ({ score, className, size = "md" }: ScoreBadgeProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-score-excellent text-white";
    if (score >= 70) return "bg-score-good text-white";
    if (score >= 60) return "bg-score-average text-white";
    return "bg-score-poor text-white";
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-1 min-w-[2.5rem]",
    md: "text-sm px-3 py-1.5 min-w-[3rem]",
    lg: "text-base px-4 py-2 min-w-[3.5rem]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold shadow-lg",
        getScoreColor(score),
        sizeClasses[size],
        className
      )}
    >
      {score.toFixed(0)}
    </div>
  );
};

export default ScoreBadge;
