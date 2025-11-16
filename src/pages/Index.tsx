import { useState, useEffect } from "react";
import { Lock, Shield, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DynamicHero } from "@/components/DynamicHero";
import PhotoUpload from "@/components/PhotoUpload";
import PhotoGallery from "@/components/PhotoGallery";
import { EditorialGrid } from "@/components/EditorialGrid";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import StatsBar from "@/components/StatsBar";
import { useTop10Photos } from "@/hooks/useTop10Photos";

const Index = () => {
  const [activeTab, setActiveTab] = useState("gallery");
  const { dynamicAccent } = useTop10Photos();
  
  // Apply dynamic accent color to CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--vault-dynamic-accent', dynamicAccent);
  }, [dynamicAccent]);

  return (
    <div className="min-h-screen bg-background">
      <DynamicHero />
      <CategoryShowcase />
      <StatsBar />

      <main className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8 bg-card border border-border">
            <TabsTrigger 
              value="upload" 
              className="gap-2 data-[state=active]:bg-vault-gold data-[state=active]:text-background font-bold uppercase tracking-wide text-muted-foreground"
            >
              <Lock className="h-4 w-4" />
              Secure
            </TabsTrigger>
            <TabsTrigger 
              value="gallery" 
              className="gap-2 data-[state=active]:bg-vault-gold data-[state=active]:text-background font-bold uppercase tracking-wide text-muted-foreground"
            >
              <Shield className="h-4 w-4" />
              Vault
            </TabsTrigger>
            <TabsTrigger 
              value="elite" 
              className="gap-2 data-[state=active]:bg-vault-gold data-[state=active]:text-background font-bold uppercase tracking-wide text-muted-foreground"
            >
              <Award className="h-4 w-4" />
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
