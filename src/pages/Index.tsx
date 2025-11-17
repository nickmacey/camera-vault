import { useState, useEffect, useRef } from "react";
import { Lock, Shield, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DynamicHero } from "@/components/DynamicHero";
import PhotoUpload from "@/components/PhotoUpload";
import PhotoGallery from "@/components/PhotoGallery";
import { EditorialGrid } from "@/components/EditorialGrid";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import StatsBar from "@/components/StatsBar";
import { useTop10Photos } from "@/hooks/useTop10Photos";
import { SettingsButton } from "@/components/VaultSettings";

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
    <div className="min-h-screen bg-background">
      <SettingsButton />
      <DynamicHero onCTAClick={scrollToUpload} />
      <CategoryShowcase />
      <StatsBar />

      <main ref={uploadSectionRef} className="container mx-auto px-4 py-6 md:py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-6 md:mb-8 bg-card border border-border h-12 md:h-11">
            <TabsTrigger 
              value="upload" 
              className="gap-1 md:gap-2 data-[state=active]:bg-vault-gold data-[state=active]:text-background font-bold uppercase tracking-wide text-muted-foreground text-xs md:text-sm"
            >
              <Lock className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Secure</span>
              <span className="sm:hidden">Upload</span>
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

          <TabsContent value="gallery" className="animate-fade-in">
            <PhotoGallery />
          </TabsContent>

          <TabsContent value="elite" className="animate-fade-in">
            <EditorialGrid />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
