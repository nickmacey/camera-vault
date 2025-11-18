import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

export const AutoSyncSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: provider } = useQuery({
    queryKey: ["google-photos-provider"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("connected_providers")
        .select("*")
        .eq("user_id", user.id)
        .eq("provider", "google_photos")
        .single();

      return data;
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: async ({ sync_enabled, auto_sync_frequency }: { sync_enabled?: boolean; auto_sync_frequency?: string }) => {
      if (!provider) return;

      const { error } = await supabase
        .from("connected_providers")
        .update({
          sync_enabled,
          auto_sync_frequency,
          updated_at: new Date().toISOString(),
        })
        .eq("id", provider.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-photos-provider"] });
      toast({
        title: "Settings updated",
        description: "Auto-sync settings have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update auto-sync settings.",
        variant: "destructive",
      });
      console.error("Error updating provider:", error);
    },
  });

  if (!provider) {
    return null;
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Automatic Photo Sync
          </h3>
          <p className="text-sm text-muted-foreground">
            Automatically sync new photos from Google Photos on a schedule
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-sync-enabled">Enable Auto-Sync</Label>
            <p className="text-sm text-muted-foreground">
              Automatically check for and import new photos
            </p>
          </div>
          <Switch
            id="auto-sync-enabled"
            checked={provider.sync_enabled ?? true}
            onCheckedChange={(checked) => {
              updateProviderMutation.mutate({ sync_enabled: checked });
            }}
          />
        </div>

        {provider.sync_enabled && (
          <div className="space-y-2">
            <Label htmlFor="sync-frequency">Sync Frequency</Label>
            <Select
              value={provider.auto_sync_frequency || "daily"}
              onValueChange={(value) => {
                updateProviderMutation.mutate({ auto_sync_frequency: value });
              }}
            >
              <SelectTrigger id="sync-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Every Hour</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {provider.last_sync 
                ? `Last synced: ${new Date(provider.last_sync).toLocaleString()}`
                : "Never synced"
              }
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
