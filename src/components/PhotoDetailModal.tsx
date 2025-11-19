import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  X, Camera, MapPin, Calendar, FileType, Maximize2, Download,
  Sparkles, ExternalLink, Aperture, Gauge, Zap, Mountain, Trash2, RefreshCw
} from "lucide-react";
import ScoreBadge from "./ScoreBadge";
import { SocialContentModal } from "./SocialContentModal";
import { GoogleMap } from "./GoogleMap";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { AnimatedScoreBar } from "./AnimatedScoreBar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Photo = Tables<"photos">;

interface PhotoDetailModalProps {
  photo: Photo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhotoDeleted?: () => void;
}

export const PhotoDetailModal = ({ photo, open, onOpenChange, onPhotoDeleted }: PhotoDetailModalProps) => {
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [generatingSocial, setGeneratingSocial] = useState(false);
  const [socialContent, setSocialContent] = useState<any>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (photo && open) {
      supabase.storage
        .from('photos')
        .createSignedUrl(photo.storage_path, 3600)
        .then(({ data }) => {
          if (data?.signedUrl) {
            setPhotoUrl(data.signedUrl);
          }
        });
    }
  }, [photo, open]);

  if (!photo) return null;

  const hasSocialContent = photo.instagram_caption || photo.twitter_caption || photo.linkedin_caption;
  
  const cameraData = photo.camera_data as any;
  const locationData = photo.location_data as any;
  const providerMetadata = photo.provider_metadata as any;

  const handleGenerateSocial = async () => {
    setGeneratingSocial(true);
    try {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .single();

      const { data, error } = await supabase.functions.invoke('generate-social-content', {
        body: {
          photoAnalysis: photo.ai_analysis,
          scores: {
            technical: photo.technical_score,
            commercial: photo.commercial_score,
            artistic: photo.artistic_score,
            emotional: photo.emotional_score,
            overall: photo.overall_score,
          },
          brandVoice: settings || {},
        },
      });

      if (error) throw error;

      setSocialContent(data);
      setSocialModalOpen(true);

      // Save to database
      await supabase
        .from('photos')
        .update({
          social_title: data.title,
          instagram_caption: data.captions.instagram,
          twitter_caption: data.captions.twitter,
          linkedin_caption: data.captions.linkedin,
          hashtags: data.hashtags,
          alt_text: data.altText,
        })
        .eq('id', photo.id);

    } catch (error) {
      console.error('Error generating social content:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate social content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingSocial(false);
    }
  };

  const handleViewSocial = () => {
    setSocialContent({
      title: photo.social_title || '',
      captions: {
        instagram: photo.instagram_caption || '',
        twitter: photo.twitter_caption || '',
        linkedin: photo.linkedin_caption || '',
      },
      hashtags: (photo.hashtags as any) || { high: [], medium: [], niche: [] },
      altText: photo.alt_text || '',
    });
    setSocialModalOpen(true);
  };

  const handleSaveEdits = async (editedContent: any) => {
    try {
      const { error } = await supabase
        .from('photos')
        .update({
          social_title: editedContent.title,
          instagram_caption: editedContent.captions.instagram,
          twitter_caption: editedContent.captions.twitter,
          linkedin_caption: editedContent.captions.linkedin,
          hashtags: editedContent.hashtags,
          alt_text: editedContent.altText,
        })
        .eq('id', photo.id);

      if (error) throw error;

      toast({
        title: "Saved!",
        description: "Social content updated successfully",
      });
      
      // Refresh the photo data
      onPhotoDeleted?.();
    } catch (error) {
      console.error('Error saving social content:', error);
      toast({
        title: "Save Failed",
        description: "Could not save social content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (photoUrl) {
      window.open(photoUrl, '_blank');
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!photo) return;

    setDeleting(true);
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove([photo.storage_path]);

      if (storageError) throw storageError;

      // Delete thumbnail if exists
      if (photo.thumbnail_path) {
        await supabase.storage
          .from('thumbnails')
          .remove([photo.thumbnail_path]);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id);

      if (dbError) throw dbError;

      toast({
        title: "Photo deleted",
        description: "Your photo has been permanently deleted.",
      });

      onOpenChange(false);
      onPhotoDeleted?.();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Deletion failed",
        description: "Could not delete photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const tierLabel = photo.tier === 'vault-worthy' ? 'VAULT WORTHY' 
                  : photo.tier === 'high-value' ? 'HIGH VALUE' 
                  : 'ARCHIVE';

  const tierColor = photo.tier === 'vault-worthy' ? 'text-vault-gold' 
                   : photo.tier === 'high-value' ? 'text-vault-green' 
                   : 'text-muted-foreground';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[95vh] p-0 bg-background border-2 border-vault-gold overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] h-full max-h-[95vh]">
            {/* Left: Photo Display */}
            <div className="relative bg-vault-black flex items-center justify-center p-4 md:p-8 min-h-[40vh] lg:min-h-full">
              <img
                src={photoUrl}
                alt={photo.filename}
                className="max-w-full max-h-[50vh] lg:max-h-[85vh] object-contain"
                loading="eager"
                decoding="async"
              />
              
              {/* Provider Badge */}
              <Badge className="absolute top-2 left-2 md:top-4 md:left-4 bg-vault-dark-gray text-vault-platinum border border-vault-mid-gray text-xs">
                {photo.provider === 'manual_upload' ? '📤 Manual Upload' : photo.provider}
              </Badge>

              {/* Close Button - Larger touch target on mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 md:top-4 md:right-4 text-vault-platinum hover:text-vault-gold h-10 w-10 md:h-9 md:w-9"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-6 w-6 md:h-5 md:w-5" />
              </Button>
            </div>

            {/* Right: Details Sidebar */}
            <div className="bg-card border-t lg:border-t-0 lg:border-l border-vault-mid-gray overflow-y-auto max-h-[50vh] lg:max-h-full">
              <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Overall Score */}
                <div className="text-center space-y-2">
                  <ScoreBadge score={photo.overall_score || 0} size="lg" />
                  <p className={`text-xs md:text-sm font-bold uppercase tracking-wide ${tierColor}`}>
                    {tierLabel}
                  </p>
                </div>

                <Separator className="bg-vault-mid-gray" />

                {/* Score Breakdown */}
                <div className="space-y-3 md:space-y-4">
                  <h3 className="text-xs md:text-sm font-bold uppercase tracking-wide text-vault-gold flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    Score Analysis
                  </h3>
                  
                  <div className="space-y-4">
                    <AnimatedScoreBar
                      score={photo.technical_score || 0}
                      label="Technical Excellence"
                    />

                    <AnimatedScoreBar
                      score={photo.commercial_score || 0}
                      label="Commercial Potential"
                    />

                    <AnimatedScoreBar
                      score={photo.artistic_score || 0}
                      label="Artistic Vision"
                    />

                    <AnimatedScoreBar
                      score={photo.emotional_score || 0}
                      label="Emotional Resonance"
                    />
                  </div>
                </div>

                {/* Vault Description */}
                {photo.ai_analysis && (
                  <>
                    <Separator className="bg-vault-mid-gray" />
                    <div className="space-y-2 md:space-y-3">
                      <h3 className="text-xs md:text-sm font-bold uppercase tracking-wide text-vault-gold flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Vault Description
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                        {photo.ai_analysis}
                      </p>
                    </div>
                  </>
                )}

                <Separator className="bg-vault-mid-gray" />

                {/* Metadata Tabs */}
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 h-10 bg-vault-dark-gray">
                    <TabsTrigger value="details" className="text-xs data-[state=active]:bg-vault-gold data-[state=active]:text-vault-black">Details</TabsTrigger>
                    <TabsTrigger value="camera" className="text-xs data-[state=active]:bg-vault-gold data-[state=active]:text-vault-black">Camera</TabsTrigger>
                    <TabsTrigger value="location" className="text-xs data-[state=active]:bg-vault-gold data-[state=active]:text-vault-black">Location</TabsTrigger>
                    <TabsTrigger value="social" className="text-xs data-[state=active]:bg-vault-gold data-[state=active]:text-vault-black">Social</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-3 mt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <FileType className="h-4 w-4 text-vault-gold mt-0.5" />
                        <div className="flex-1">
                          <p className="text-muted-foreground text-xs">Filename</p>
                          <p className="font-mono text-foreground break-all">{photo.filename}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Maximize2 className="h-4 w-4 text-vault-gold mt-0.5" />
                        <div className="flex-1">
                          <p className="text-muted-foreground text-xs">Dimensions</p>
                          <p className="font-mono text-foreground">
                            {photo.width} × {photo.height} px
                            <span className="text-muted-foreground ml-2">({photo.orientation})</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <FileType className="h-4 w-4 text-vault-gold mt-0.5" />
                        <div className="flex-1">
                          <p className="text-muted-foreground text-xs">File Size</p>
                          <p className="font-mono text-foreground">
                            {photo.file_size ? `${(photo.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {photo.date_taken && (() => {
                        try {
                          const date = new Date(photo.date_taken);
                          // Check if date is valid
                          if (isNaN(date.getTime())) {
                            return null;
                          }
                          return (
                            <div className="flex items-start gap-2">
                              <Calendar className="h-4 w-4 text-vault-gold mt-0.5" />
                              <div className="flex-1">
                                <p className="text-muted-foreground text-xs">Date Taken</p>
                                <p className="font-mono text-foreground">
                                  {date.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        } catch {
                          return null;
                        }
                      })()}
                    </div>
                  </TabsContent>

                  <TabsContent value="camera" className="space-y-3 mt-4">
                    {cameraData ? (
                      <div className="space-y-2 text-sm">
                        {cameraData.make && (
                          <div className="flex items-start gap-2">
                            <Camera className="h-4 w-4 text-vault-gold mt-0.5" />
                            <div className="flex-1">
                              <p className="text-muted-foreground text-xs">Camera</p>
                              <p className="font-mono text-foreground">
                                {cameraData.make} {cameraData.model}
                              </p>
                            </div>
                          </div>
                        )}

                        {cameraData.lens && (
                          <div className="flex items-start gap-2">
                            <Mountain className="h-4 w-4 text-vault-gold mt-0.5" />
                            <div className="flex-1">
                              <p className="text-muted-foreground text-xs">Lens</p>
                              <p className="font-mono text-foreground">{cameraData.lens}</p>
                            </div>
                          </div>
                        )}

                        {cameraData.focalLength && (
                          <div className="flex items-start gap-2">
                            <Maximize2 className="h-4 w-4 text-vault-gold mt-0.5" />
                            <div className="flex-1">
                              <p className="text-muted-foreground text-xs">Focal Length</p>
                              <p className="font-mono text-foreground">{cameraData.focalLength}mm</p>
                            </div>
                          </div>
                        )}

                        {cameraData.aperture && (
                          <div className="flex items-start gap-2">
                            <Aperture className="h-4 w-4 text-vault-gold mt-0.5" />
                            <div className="flex-1">
                              <p className="text-muted-foreground text-xs">Aperture</p>
                              <p className="font-mono text-foreground">f/{cameraData.aperture}</p>
                            </div>
                          </div>
                        )}

                        {cameraData.shutterSpeed && (
                          <div className="flex items-start gap-2">
                            <Zap className="h-4 w-4 text-vault-gold mt-0.5" />
                            <div className="flex-1">
                              <p className="text-muted-foreground text-xs">Shutter Speed</p>
                              <p className="font-mono text-foreground">{cameraData.shutterSpeed}</p>
                            </div>
                          </div>
                        )}

                        {cameraData.iso && (
                          <div className="flex items-start gap-2">
                            <Gauge className="h-4 w-4 text-vault-gold mt-0.5" />
                            <div className="flex-1">
                              <p className="text-muted-foreground text-xs">ISO</p>
                              <p className="font-mono text-foreground">{cameraData.iso}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No camera data available
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="location" className="space-y-3 mt-4">
                    {locationData ? (
                      <div className="space-y-3">
                        <div className="space-y-2 text-sm">
                          {locationData.placeName && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-vault-gold mt-0.5" />
                              <div className="flex-1">
                                <p className="text-muted-foreground text-xs">Location</p>
                                <p className="font-mono text-foreground">{locationData.placeName}</p>
                              </div>
                            </div>
                          )}

                          {locationData.city && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-vault-gold mt-0.5" />
                              <div className="flex-1">
                                <p className="text-muted-foreground text-xs">City</p>
                                <p className="font-mono text-foreground">{locationData.city}</p>
                              </div>
                            </div>
                          )}

                          {locationData.country && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-vault-gold mt-0.5" />
                              <div className="flex-1">
                                <p className="text-muted-foreground text-xs">Country</p>
                                <p className="font-mono text-foreground">{locationData.country}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-vault-gold mt-0.5" />
                            <div className="flex-1">
                              <p className="text-muted-foreground text-xs">Coordinates</p>
                              <p className="font-mono text-foreground text-xs">
                                {Number(locationData.latitude).toFixed(6)}, {Number(locationData.longitude).toFixed(6)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Embedded Google Map */}
                        <GoogleMap
                          latitude={Number(locationData.latitude)}
                          longitude={Number(locationData.longitude)}
                          className="w-full h-48"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No location data available
                      </p>
                    )}
                  </TabsContent>

                  {/* Social Tab */}
                  <TabsContent value="social" className="space-y-4 mt-4">
                    {hasSocialContent ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-vault-gold">SEO Title</div>
                          <div className="text-sm text-vault-light-gray">{photo.social_title}</div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-vault-gold">Instagram Caption</div>
                          <div className="text-sm text-vault-light-gray whitespace-pre-wrap">{photo.instagram_caption}</div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-vault-gold">Twitter Caption</div>
                          <div className="text-sm text-vault-light-gray whitespace-pre-wrap">{photo.twitter_caption}</div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-vault-gold">LinkedIn Caption</div>
                          <div className="text-sm text-vault-light-gray whitespace-pre-wrap">{photo.linkedin_caption}</div>
                        </div>

                        {photo.hashtags && (
                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-vault-gold">Hashtags</div>
                            <div className="space-y-2">
                              {(photo.hashtags as any)?.high && (
                                <div className="flex flex-wrap gap-2">
                                  {(photo.hashtags as any).high.map((tag: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="bg-vault-gold/20 text-vault-gold">
                                      #{tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-vault-gold">Alt Text (Accessibility)</div>
                          <div className="text-sm text-vault-light-gray">{photo.alt_text}</div>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={handleViewSocial}
                            className="flex-1"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            View & Edit
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleGenerateSocial}
                            disabled={generatingSocial}
                            className="flex-1"
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${generatingSocial ? 'animate-spin' : ''}`} />
                            Regenerate
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 space-y-4">
                        <Sparkles className="h-12 w-12 text-vault-gold mx-auto opacity-50" />
                        <p className="text-vault-light-gray">No social content generated yet</p>
                        <Button
                          onClick={handleGenerateSocial}
                          disabled={generatingSocial}
                          className="bg-vault-gold hover:bg-vault-gold/90 text-background"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {generatingSocial ? 'Generating...' : 'Generate Social Content'}
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <Separator className="bg-vault-mid-gray" />

                {/* Actions */}
                <div className="space-y-2 md:space-y-3">
                  {hasSocialContent ? (
                    <Button
                      onClick={handleViewSocial}
                      className="w-full bg-vault-gold text-vault-black hover:bg-vault-gold/90 h-11 text-sm"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      View Captions
                    </Button>
                  ) : (
                    <Button
                      onClick={handleGenerateSocial}
                      disabled={generatingSocial}
                      className="w-full bg-vault-gold text-vault-black hover:bg-vault-gold/90 h-11 text-sm"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {generatingSocial ? 'Generating...' : 'Generate Captions'}
                    </Button>
                  )}

                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="w-full border-vault-gold text-vault-gold hover:bg-vault-gold/10 h-11 text-sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Original
                  </Button>

                  {photo.source_url && (
                    <Button
                      onClick={() => window.open(photo.source_url!, '_blank')}
                      variant="outline"
                      className="w-full border-vault-mid-gray text-muted-foreground hover:bg-vault-dark-gray"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View in {photo.provider}
                    </Button>
                  )}

                  <Button
                    onClick={handleDeleteClick}
                    variant="outline"
                    className="w-full border-destructive text-destructive hover:bg-destructive/10 h-11 text-sm"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Photo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{photo?.filename}" from your vault and storage. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SocialContentModal
        open={socialModalOpen}
        onOpenChange={setSocialModalOpen}
        content={socialContent}
        onRegenerate={handleGenerateSocial}
        loading={generatingSocial}
        onSave={handleSaveEdits}
      />
    </>
  );
};
