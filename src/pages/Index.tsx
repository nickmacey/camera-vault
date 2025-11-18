import { useState, useEffect, useRef } from "react";
import { Lock, Shield, Award, FolderOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DynamicHero } from "@/components/DynamicHero";
import PhotoUpload from "@/components/PhotoUpload";
import { BulkUpload } from "@/components/BulkUpload";
import PhotoGallery from "@/components/PhotoGallery";
import { EditorialGrid } from "@/components/EditorialGrid";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import StatsBar from "@/components/StatsBar";
import { useTop10Photos } from "@/hooks/useTop10Photos";
import { SettingsButton } from "@/components/VaultSettings";
import { GooglePhotosImportModal } from "@/components/GooglePhotosImportModal";
import { ProviderConnectionModal } from "@/components/ProviderConnectionModal";
import { SyncProgress } from "@/components/SyncProgress";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [activeTab, setActiveTab] = useState("gallery");
  const { dynamicAccent } = useTop10Photos();
  const uploadSectionRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showGoogleImport, setShowGoogleImport] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [currentSyncJobId, setCurrentSyncJobId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const scrollToUpload = () => {
    setActiveTab("upload");
    setTimeout(() => {
      uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  
  // Apply dynamic accent color to CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--vault-dynamic-accent', dynamicAccent);
  }, [dynamicAccent]);

  // Check for Google Photos connection success
  useEffect(() => {
    if (searchParams.get('google_photos_connected') === 'true') {
      setShowGoogleImport(true);
      // Remove the param from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('google_photos_connected');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleStartGoogleSync = (jobId: string) => {
    console.log('Google Photos sync started with job:', jobId);
    setShowGoogleImport(false);
    setCurrentSyncJobId(jobId);
    toast({
      title: "Sync Started",
      description: "Your photos are being analyzed in the background",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SettingsButton />
      <DynamicHero onCTAClick={scrollToUpload} />
      <CategoryShowcase />
      <StatsBar />

      <main ref={uploadSectionRef} className="container mx-auto px-4 py-6 md:py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4 mb-6 md:mb-8 bg-card border border-border h-12 md:h-11">
            <TabsTrigger 
              value="upload" 
              className="gap-1 md:gap-2 data-[state=active]:bg-vault-gold data-[state=active]:text-background font-bold uppercase tracking-wide text-muted-foreground text-xs md:text-sm"
            >
              <Lock className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Load</span>
              <span className="sm:hidden">Upload</span>
            </TabsTrigger>
            <TabsTrigger 
              value="bulk" 
              className="gap-1 md:gap-2 data-[state=active]:bg-vault-gold data-[state=active]:text-background font-bold uppercase tracking-wide text-muted-foreground text-xs md:text-sm"
            >
              <FolderOpen className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Bulk</span>
              <span className="sm:hidden">Bulk</span>
            </TabsTrigger>
            <TabsTrigger 
              value="gallery" 
              className="gap-1 md:gap-2 data-[state=active]:bg-vault-gold data-[state=active]:text-background font-bold uppercase tracking-wide text-muted-foreground text-xs md:text-sm"
            >
              <Shield className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Vault</span>
              <span className="sm:hidden">Gallery</span>
            </TabsTrigger>
            <TabsTrigger 
              value="elite" 
              className="gap-1 md:gap-2 data-[state=active]:bg-vault-gold data-[state=active]:text-background font-bold uppercase tracking-wide text-muted-foreground text-xs md:text-sm"
            >
              <Award className="h-3 w-3 md:h-4 md:w-4" />
              Elite
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="animate-fade-in">
            <PhotoUpload />
          </TabsContent>

          <TabsContent value="bulk" className="animate-fade-in">
            <BulkUpload />
          </TabsContent>

          <TabsContent value="gallery" className="animate-fade-in">
            <PhotoGallery />
          </TabsContent>

          <TabsContent value="elite" className="animate-fade-in">
            <EditorialGrid />
          </TabsContent>
        </Tabs>
      </main>

      {/* Sync Progress - Fixed bottom right */}
      {currentSyncJobId && (
        <div className="fixed bottom-4 right-4 w-96 z-50 shadow-xl">
          <SyncProgress 
            jobId={currentSyncJobId} 
            onComplete={() => {
              setCurrentSyncJobId(null);
              toast({
                title: "Sync Complete!",
                description: "Your photos have been analyzed and categorized",
              });
            }}
          />
        </div>
      )}

      <ProviderConnectionModal
        open={showProviderModal}
        onOpenChange={setShowProviderModal}
      />

      <GooglePhotosImportModal
        open={showGoogleImport}
        onOpenChange={setShowGoogleImport}
        onSyncStarted={handleStartGoogleSync}
      />

      {/* Footer with Privacy Policy Link */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <a 
            href="/privacy" 
            className="hover:text-foreground transition-colors underline"
          >
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
