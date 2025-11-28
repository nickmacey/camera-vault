import { useState } from "react";
import { Search, Sparkles, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Photo {
  id: string;
  filename: string;
  description?: string | null;
  overall_score?: number | null;
}

interface AIPhotoSearchProps {
  photos: Photo[];
  onSearchResults: (filteredIds: string[] | null) => void;
  tier?: string;
  placeholder?: string;
}

export const AIPhotoSearch = ({ 
  photos, 
  onSearchResults, 
  tier,
  placeholder = "Search with AI (e.g., 'sunset photos', 'people smiling', 'landscapes')"
}: AIPhotoSearchProps) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      onSearchResults(null);
      return;
    }

    if (photos.length === 0) {
      toast.error("No photos to search");
      return;
    }

    setIsSearching(true);

    try {
      const photoDescriptions = photos.map(p => ({
        id: p.id,
        filename: p.filename,
        description: p.description,
        score: p.overall_score,
      }));

      const { data, error } = await supabase.functions.invoke('ai-photo-search', {
        body: { query, photoDescriptions, tier }
      });

      if (error) throw error;

      const matchingIds = data?.matchingIds || [];
      
      if (matchingIds.length === 0) {
        toast.info("No matching photos found");
        onSearchResults([]);
      } else {
        toast.success(`Found ${matchingIds.length} matching photo${matchingIds.length === 1 ? '' : 's'}`);
        onSearchResults(matchingIds);
      }
    } catch (error: any) {
      console.error("AI search error:", error);
      toast.error(error.message || "Search failed");
      onSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    onSearchResults(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="pl-10 pr-10"
          disabled={isSearching}
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <Button
        onClick={handleSearch}
        disabled={isSearching || !query.trim()}
        size="sm"
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        {isSearching ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            AI Search
          </>
        )}
      </Button>
    </div>
  );
};
