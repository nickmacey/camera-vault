import { useState } from "react";
import { Upload, Image as ImageIcon, Award, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HeroSection from "@/components/HeroSection";
import PhotoUpload from "@/components/PhotoUpload";
import PhotoGallery from "@/components/PhotoGallery";
import Top10Showcase from "@/components/Top10Showcase";
import StatsBar from "@/components/StatsBar";

const Index = () => {
  const [activeTab, setActiveTab] = useState("gallery");

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      
      <StatsBar />

      <main className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="top10" className="gap-2">
              <Award className="h-4 w-4" />
              Top 10
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="animate-fade-in">
            <PhotoUpload />
          </TabsContent>

          <TabsContent value="gallery" className="animate-fade-in">
            <PhotoGallery />
          </TabsContent>

          <TabsContent value="top10" className="animate-fade-in">
            <Top10Showcase />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
