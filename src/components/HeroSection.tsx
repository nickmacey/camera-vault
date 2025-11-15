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
        
        <p className="text-xl md:text-2xl text-vault-light-gray max-w-2xl mx-auto mb-8 animate-fade-in font-medium leading-relaxed">
          The difference between a camera roll<br/>and a career.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 text-vault-light-gray animate-fade-in mt-12">
          <div className="text-center">
            <Lock className="h-6 w-6 text-vault-gold mx-auto mb-2" />
            <div className="font-black text-sm uppercase tracking-wide text-vault-platinum mb-1">Identify</div>
            <p className="text-xs max-w-[180px]">AI scores every photo.<br/>Your top 10% in seconds.</p>
          </div>
          <div className="text-center">
            <Shield className="h-6 w-6 text-vault-gold mx-auto mb-2" />
            <div className="font-black text-sm uppercase tracking-wide text-vault-platinum mb-1">Protect</div>
            <p className="text-xs max-w-[180px]">Smart watermarks keep<br/>your best work secure.</p>
          </div>
          <div className="text-center">
            <Sparkles className="h-6 w-6 text-vault-gold mx-auto mb-2" />
            <div className="font-black text-sm uppercase tracking-wide text-vault-platinum mb-1">Monetize</div>
            <p className="text-xs max-w-[180px]">Export directly to Getty,<br/>Adobe Stock, Shutterstock.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
