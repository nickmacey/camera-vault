import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAllProviders, getConnectableProviders } from "@/lib/providers/providerRegistry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProviderConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProviderConnectionModal({ open, onOpenChange }: ProviderConnectionModalProps) {
  const { toast } = useToast();
  const allProviders = getAllProviders();
  const connectableProviders = getConnectableProviders();
  
  const handleConnect = (providerId: string) => {
    toast({
      title: "Coming Soon",
      description: `${providerId} integration will be available in Phase 2`,
      variant: "default"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-black border border-border/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light text-foreground">
            Connect Photo Sources
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Expand your vault by connecting external photo libraries
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-6">
          {/* Manual Upload - Always Connected */}
          <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📤</span>
                  <h3 className="text-lg font-medium text-foreground">Manual Upload</h3>
                  <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Upload photos directly from your device
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>• 50MB max file size</span>
                  <span>• EXIF data support</span>
                  <span>• JPG, PNG, HEIC, WebP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Connectable Providers */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Available Integrations</h4>
            <div className="space-y-3">
              {connectableProviders.map((provider) => {
                const caps = provider.getCapabilities();
                return (
                  <div 
                    key={provider.id}
                    className="border border-border/20 rounded-lg p-4 hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{provider.icon}</span>
                          <h3 className="text-base font-medium text-foreground">{provider.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {provider.description}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {caps.maxFileSize && (
                            <span>• {Math.round(caps.maxFileSize / (1024 * 1024))}MB max</span>
                          )}
                          {caps.hasMetadata && <span>• Full EXIF data</span>}
                          {caps.hasLocation && <span>• Location data</span>}
                          {caps.rateLimit && (
                            <span>• {caps.rateLimit.toLocaleString()} requests/day</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnect(provider.name)}
                        className="ml-4"
                      >
                        Connect
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coming Soon Section */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Phase 2</h4>
            <p className="text-xs text-muted-foreground/70 mb-2">
              More integrations coming soon based on demand
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/20">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
