import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Loader2, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface GooglePhotosImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartSync: (filters: ImportFilters) => void;
}

export interface ImportFilters {
  skipScreenshots: boolean;
  skipSmallFiles: boolean;
  cameraOnly: boolean;
  dateRange: 'all' | 'year' | 'five_years' | 'custom';
  customStartDate?: Date;
  customEndDate?: Date;
}

export function GooglePhotosImportModal({ open, onOpenChange, onStartSync }: GooglePhotosImportModalProps) {
  const [scanning, setScanning] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<ImportFilters>({
    skipScreenshots: true,
    skipSmallFiles: true,
    cameraOnly: false,
    dateRange: 'all',
  });
  const [estimatedCount, setEstimatedCount] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);

  useEffect(() => {
    if (open) {
      scanLibrary();
    }
  }, [open]);

  useEffect(() => {
    calculateEstimates();
  }, [filters, totalCount]);

  async function scanLibrary() {
    try {
      setScanning(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get provider connection
      const { data: provider } = await supabase
        .from('connected_providers')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('provider', 'google_photos')
        .single();

      if (!provider?.access_token) {
        throw new Error('Not connected to Google Photos');
      }

      // Fetch first page to estimate total
      const response = await fetch(
        'https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=100',
        {
          headers: {
            Authorization: `Bearer ${provider.access_token}`
          }
        }
      );

      const data = await response.json();
      
      // If there's a next page token, user has a large library
      if (data.nextPageToken) {
        setTotalCount(10000); // Conservative estimate for large libraries
      } else {
        setTotalCount(data.mediaItems?.length || 0);
      }

      setScanning(false);
    } catch (error) {
      console.error('Failed to scan library:', error);
      setScanning(false);
    }
  }

  function calculateEstimates() {
    let count = totalCount;

    // Apply filter estimates
    if (filters.skipScreenshots) {
      count = Math.floor(count * 0.85); // Assume 15% are screenshots
    }
    if (filters.skipSmallFiles) {
      count = Math.floor(count * 0.95); // Assume 5% are tiny files
    }
    if (filters.cameraOnly) {
      count = Math.floor(count * 0.70); // Assume 30% are non-camera photos
    }

    // Apply date range filters
    if (filters.dateRange === 'year') {
      count = Math.floor(count * 0.15); // Rough estimate: last year is ~15% of all photos
    } else if (filters.dateRange === 'five_years') {
      count = Math.floor(count * 0.60); // Last 5 years is ~60% of all photos
    }

    setEstimatedCount(count);

    // Calculate time (3 seconds per photo)
    const timeInSeconds = count * 3;
    setEstimatedTime(timeInSeconds / 3600); // Convert to hours

    // Calculate cost ($0.002 per photo analyzed)
    setEstimatedCost(count * 0.002);
  }

  function handleStartSync() {
    onStartSync(filters);
  }

  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `~${Math.ceil(hours * 60)} minutes`;
    }
    return `~${hours.toFixed(1)} hours`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-black border border-border/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light text-foreground flex items-center gap-2">
            📷 Google Photos Import
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure filters to optimize your analysis
          </DialogDescription>
        </DialogHeader>

        {scanning ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-foreground text-lg mb-2">Scanning your library...</p>
            <p className="text-muted-foreground text-sm">This may take a moment</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Library Size */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="text-center">
                <p className="text-3xl font-light text-foreground mb-1">
                  {totalCount >= 10000 ? '10,000+' : totalCount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">photos in your library</p>
              </div>
            </div>

            {/* Filters Section */}
            <div>
              <h3 className="text-base font-medium text-foreground mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Optimize Your Analysis
              </h3>

              <div className="space-y-4">
                {/* Quality Filters */}
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="skipScreenshots"
                      checked={filters.skipScreenshots}
                      onCheckedChange={(checked) =>
                        setFilters({ ...filters, skipScreenshots: checked === true })
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="skipScreenshots"
                        className="text-sm font-normal text-foreground cursor-pointer"
                      >
                        Skip screenshots & screen recordings
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Exclude non-photographic content
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="skipSmallFiles"
                      checked={filters.skipSmallFiles}
                      onCheckedChange={(checked) =>
                        setFilters({ ...filters, skipSmallFiles: checked === true })
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="skipSmallFiles"
                        className="text-sm font-normal text-foreground cursor-pointer"
                      >
                        Skip photos under 500KB
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Filter out low-resolution images
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="cameraOnly"
                      checked={filters.cameraOnly}
                      onCheckedChange={(checked) =>
                        setFilters({ ...filters, cameraOnly: checked === true })
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="cameraOnly"
                        className="text-sm font-normal text-foreground cursor-pointer"
                      >
                        Camera photos only (has EXIF data)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Only analyze photos with camera metadata
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div className="border-t border-border/20 pt-4">
                  <Label className="text-sm font-medium text-foreground mb-3 block">
                    Date Range
                  </Label>
                  <RadioGroup
                    value={filters.dateRange}
                    onValueChange={(value: any) =>
                      setFilters({ ...filters, dateRange: value })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all" className="font-normal cursor-pointer">
                        All Time
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="year" id="year" />
                      <Label htmlFor="year" className="font-normal cursor-pointer">
                        Last Year (since {format(new Date(new Date().setFullYear(new Date().getFullYear() - 1)), 'MMM yyyy')})
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="five_years" id="five_years" />
                      <Label htmlFor="five_years" className="font-normal cursor-pointer">
                        Last 5 Years (since {format(new Date(new Date().setFullYear(new Date().getFullYear() - 5)), 'MMM yyyy')})
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom" className="font-normal cursor-pointer">
                        Custom Range
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Custom Date Range Pickers */}
                  {filters.dateRange === 'custom' && (
                    <div className="ml-6 mt-3 flex gap-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[180px] justify-start text-left font-normal",
                              !filters.customStartDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.customStartDate ? (
                              format(filters.customStartDate, "PPP")
                            ) : (
                              <span>Start date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.customStartDate}
                            onSelect={(date) =>
                              setFilters({ ...filters, customStartDate: date })
                            }
                            disabled={(date) =>
                              date > new Date() || date < new Date("2000-01-01")
                            }
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>

                      <span className="text-muted-foreground self-center">to</span>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[180px] justify-start text-left font-normal",
                              !filters.customEndDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.customEndDate ? (
                              format(filters.customEndDate, "PPP")
                            ) : (
                              <span>End date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.customEndDate}
                            onSelect={(date) =>
                              setFilters({ ...filters, customEndDate: date })
                            }
                            disabled={(date) =>
                              date > new Date() ||
                              (filters.customStartDate && date < filters.customStartDate)
                            }
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Estimates */}
            <div className="border-t border-border/20 pt-6">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-light text-primary mb-1">
                    {estimatedCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">photos to analyze</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-light text-primary mb-1">
                    {formatTime(estimatedTime)}
                  </p>
                  <p className="text-xs text-muted-foreground">estimated time</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-light text-primary mb-1">
                    ${estimatedCost.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">estimated cost</p>
                </div>
              </div>

              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground text-center">
                  💡 You can pause or cancel anytime. Analysis runs in the background.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartSync}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Start Analysis
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
