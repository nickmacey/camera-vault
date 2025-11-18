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
import { VaultButton } from "@/components/VaultButton";

const Index = () => {
  const [activeTab, setActiveTab] = useState("gallery");
  const { dynamicAccent } = useTop10Photos();
  const uploadSectionRef = useRef<HTMLDivElement>(null);
  
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

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute top-0 left-0 right-0 z-40">
        <VaultButton />
      </div>
      <SettingsButton />
      <DynamicHero onCTAClick={scrollToUpload} />
      <CategoryShowcase />
      <StatsBar />

      <main ref={uploadSectionRef} className="container mx-auto px-3 sm:px-4 py-6 md:py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4 mb-4 sm:mb-6 md:mb-8 bg-card border border-border h-12 sm:h-14 md:h-11 shadow-lg shadow-vault-gold/10">
            <TabsTrigger 
              value="upload" 
              className="gap-0.5 sm:gap-1 md:gap-2 data-[state=active]:bg-vault-gold data-[state=active]:text-background font-bold uppercase tracking-wide text-muted-foreground text-[10px] sm:text-xs md:text-sm relative overflow-hidden group transition-all duration-300 px-1 sm:px-2"
            >
              <Lock className="h-3 w-3 md:h-4 md:w-4 group-data-[state=active]:animate-pulse group-data-[state=active]:drop-shadow-[0_0_4px_rgba(212,175,55,0.6)] transition-transform group-hover:scale-110" />
              <span className="hidden xs:inline sm:inline">Upload</span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-data-[state=active]:animate-[slide-in-right_2s_ease-in-out_infinite] pointer-events-none" />
            </TabsTrigger>
            <TabsTrigger 
              value="bulk" 
              className="gap-0.5 sm:gap-1 md:gap-2 data-[state=active]:bg-vault-gold data-[state=active]:text-background font-bold uppercase tracking-wide text-muted-foreground text-[10px] sm:text-xs md:text-sm relative overflow-hidden group transition-all duration-300 px-1 sm:px-2"
            >
              <FolderOpen className="h-3 w-3 md:h-4 md:w-4 group-data-[state=active]:animate-pulse group-data-[state=active]:drop-shadow-[0_0_4px_rgba(212,175,55,0.6)] transition-transform group-hover:scale-110" />
              <span className="hidden xs:inline sm:inline">Bulk</span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-data-[state=active]:animate-[slide-in-right_2s_ease-in-out_infinite] pointer-events-none" style={{ animationDelay: '0.3s' }} />
            </TabsTrigger>
            <TabsTrigger 
              value="gallery" 
              className="gap-0.5 sm:gap-1 md:gap-2 data-[state=active]:bg-vault-gold data-[state=active]:text-background font-bold uppercase tracking-wide text-muted-foreground text-[10px] sm:text-xs md:text-sm relative overflow-hidden group transition-all duration-300 px-1 sm:px-2"
            >
              <Shield className="h-3 w-3 md:h-4 md:w-4 group-data-[state=active]:animate-pulse group-data-[state=active]:drop-shadow-[0_0_4px_rgba(212,175,55,0.6)] transition-transform group-hover:scale-110" />
              <span className="hidden xs:inline">Vault</span>
              <span className="xs:hidden">Gallery</span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-data-[state=active]:animate-[slide-in-right_2s_ease-in-out_infinite] pointer-events-none" style={{ animationDelay: '0.6s' }} />
            </TabsTrigger>
            <TabsTrigger 
              value="elite" 
              className="gap-0.5 sm:gap-1 md:gap-2 data-[state=active]:bg-vault-gold data-[state=active]:text-background font-bold uppercase tracking-wide text-muted-foreground text-[10px] sm:text-xs md:text-sm relative overflow-hidden group transition-all duration-300 px-1 sm:px-2"
            >
              <Award className="h-3 w-3 md:h-4 md:w-4 group-data-[state=active]:animate-pulse group-data-[state=active]:drop-shadow-[0_0_4px_rgba(212,175,55,0.6)] transition-transform group-hover:scale-110" />
              <span className="hidden xs:inline">Elite</span>
              <span className="xs:hidden">Top</span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-data-[state=active]:animate-[slide-in-right_2s_ease-in-out_infinite] pointer-events-none" style={{ animationDelay: '0.9s' }} />
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

      <EditorialGrid />
      
      <footer className="border-t border-border mt-8 sm:mt-12 py-4 sm:py-6">
        <div className="container mx-auto px-3 sm:px-4 text-center text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
            <a 
              href="/privacy" 
              className="hover:text-foreground transition-colors underline"
            >
              Privacy Policy
            </a>
            <span>•</span>
            <a 
              href="/terms" 
              className="hover:text-foreground transition-colors underline"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
