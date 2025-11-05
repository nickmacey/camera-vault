import { Camera, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-card via-background to-card py-20 border-b border-border">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--secondary)/0.1),transparent_50%)]" />
      
      <div className="container relative mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 mb-6 animate-scale-in">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">AI-Powered Photo Analysis</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight animate-fade-in">
          Photo<span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Curator</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in">
          Intelligent photo scoring, curation, and showcase powered by advanced AI analysis
        </p>

        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground animate-fade-in">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <span>Auto Scoring</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-secondary" />
            <span>AI Analysis</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <span>Smart Curation</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
