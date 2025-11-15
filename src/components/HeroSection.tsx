import { Lock, Shield, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-vault-black py-20 border-b border-vault-mid-gray">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--vault-gold)/0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--vault-green)/0.08),transparent_50%)]" />
      
      <div className="container relative mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-vault-gold/10 border border-vault-gold/20 px-4 py-2 mb-6 animate-scale-in">
          <Sparkles className="h-4 w-4 text-vault-gold" />
          <span className="text-sm font-bold text-vault-gold uppercase tracking-wide">AI-Powered Asset Protection</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight animate-fade-in text-vault-platinum">
          <span className="vault-text-gradient">VAULT</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-vault-light-gray max-w-2xl mx-auto mb-8 animate-fade-in font-medium">
          Your most valuable work, identified and protected by AI
        </p>

        <div className="flex items-center justify-center gap-4 text-sm text-vault-light-gray animate-fade-in">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-vault-gold" />
            <span className="uppercase font-bold">Secure Storage</span>
          </div>
          <div className="h-4 w-px bg-vault-mid-gray" />
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-vault-green" />
            <span className="uppercase font-bold">AI Scoring</span>
          </div>
          <div className="h-4 w-px bg-vault-mid-gray" />
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-vault-gold" />
            <span className="uppercase font-bold">Asset Protection</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
