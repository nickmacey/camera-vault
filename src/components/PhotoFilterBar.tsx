import { useState } from "react";
import { Filter, SortAsc, Calendar, Award, Lock, TrendingUp, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface PhotoFilterBarProps {
  tierFilter: string;
  onTierFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  totalCount: number;
  filteredCount: number;
}

export const PhotoFilterBar = ({
  tierFilter,
  onTierFilterChange,
  sortBy,
  onSortByChange,
  totalCount,
  filteredCount,
}: PhotoFilterBarProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const tierOptions = [
    { value: "all", label: "All Tiers", icon: Filter, color: "text-foreground" },
    { value: "vault-worthy", label: "Vault Worthy", icon: Lock, color: "text-vault-gold" },
    { value: "high-value", label: "High Value", icon: TrendingUp, color: "text-vault-gold/70" },
    { value: "archive", label: "Archive", icon: Archive, color: "text-muted-foreground" },
  ];

  const sortOptions = [
    { value: "score-desc", label: "Highest Score First", icon: "📊" },
    { value: "score-asc", label: "Lowest Score First", icon: "📉" },
    { value: "date-desc", label: "Newest First", icon: "📅" },
    { value: "date-asc", label: "Oldest First", icon: "🕰️" },
    { value: "name-asc", label: "Name (A-Z)", icon: "🔤" },
    { value: "name-desc", label: "Name (Z-A)", icon: "🔡" },
  ];

  const currentTier = tierOptions.find(t => t.value === tierFilter);
  const currentSort = sortOptions.find(s => s.value === sortBy);

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Left section: Filter controls */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Tier Filter Dropdown */}
          <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2 bg-background hover:bg-vault-gold/10 hover:border-vault-gold transition-all duration-300"
              >
                {currentTier && <currentTier.icon className={`h-4 w-4 ${currentTier.color}`} />}
                <span className="font-semibold">{currentTier?.label}</span>
                <Filter className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-card border-border z-50">
              <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                Filter by Tier
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {tierOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => {
                    onTierFilterChange(option.value);
                    setIsFilterOpen(false);
                  }}
                  className={`gap-2 cursor-pointer ${
                    tierFilter === option.value ? 'bg-vault-gold/10 text-vault-gold font-semibold' : ''
                  }`}
                >
                  <option.icon className={`h-4 w-4 ${option.color}`} />
                  <span>{option.label}</span>
                  {tierFilter === option.value && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-vault-gold" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="w-[200px] bg-background hover:bg-vault-gold/10 hover:border-vault-gold transition-all duration-300">
              <SortAsc className="h-4 w-4 mr-2 text-vault-gold" />
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              <div className="text-xs uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                Sort Options
              </div>
              {sortOptions.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="cursor-pointer"
                >
                  <span className="mr-2">{option.icon}</span>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Active filter indicator */}
          {tierFilter !== "all" && (
            <Badge 
              variant="outline" 
              className="border-vault-gold text-vault-gold bg-vault-gold/5 gap-1"
            >
              <currentTier.icon className="h-3 w-3" />
              {currentTier?.label}
              <button
                onClick={() => onTierFilterChange("all")}
                className="ml-1 hover:text-foreground"
              >
                ×
              </button>
            </Badge>
          )}
        </div>

        {/* Right section: Count display */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Award className="h-4 w-4 text-vault-gold" />
          <span>
            Showing <span className="font-bold text-vault-gold">{filteredCount}</span>
            {filteredCount !== totalCount && (
              <span> of <span className="font-bold text-foreground">{totalCount}</span></span>
            )}
            {" "}photo{filteredCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="mt-4 pt-4 border-t border-border flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-vault-gold" />
          <span className="text-muted-foreground">Vault Worthy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-vault-gold/60" />
          <span className="text-muted-foreground">High Value</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          <span className="text-muted-foreground">Archive</span>
        </div>
      </div>
    </div>
  );
};
