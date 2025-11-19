import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { 
  Lock, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  Star,
  Shield,
  Camera,
  DollarSign,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo variant="wordmark" size="sm" />
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/auth')}
              className="font-bold"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl text-center animate-fade-in">
          <div className="flex justify-center mb-8">
            <Logo variant="icon" size="lg" animated />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-bold uppercase tracking-wide">
              AI-Powered Photo Intelligence
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 uppercase tracking-tight leading-tight">
            Turn Your Camera Roll<br />
            Into <span className="text-primary">Magic</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            AI analyzes every photo, finds your hidden gems, and helps you sell prints.
            <span className="text-foreground font-bold"> The difference between a camera roll and a treasure.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Input
              type="email"
              placeholder="Enter your email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="max-w-sm h-14 text-lg"
            />
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="font-bold h-14 px-8 text-lg"
            >
              Start Free 7-Day Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Unlimited photos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 text-center">
            <div>
              <div className="text-4xl font-black text-primary mb-2">1,000+</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">Photographers</div>
            </div>
            <div>
              <div className="text-4xl font-black text-primary mb-2">500K+</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">Photos Analyzed</div>
            </div>
            <div>
              <div className="text-4xl font-black text-primary mb-2">$2M+</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">In Print Sales</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16">
            {/* Problem */}
            <div className="animate-fade-in">
              <h2 className="text-3xl font-black text-foreground mb-6 uppercase">
                You Have Thousands of Photos
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-400 text-xl">✗</span>
                  </div>
                  <div>
                    <p className="text-foreground font-bold">Can't find your best work</p>
                    <p className="text-muted-foreground text-sm">Lost in the chaos of your camera roll</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-400 text-xl">✗</span>
                  </div>
                  <div>
                    <p className="text-foreground font-bold">No idea which could sell</p>
                    <p className="text-muted-foreground text-sm">Missing potential revenue opportunities</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-400 text-xl">✗</span>
                  </div>
                  <div>
                    <p className="text-foreground font-bold">Too overwhelmed to start</p>
                    <p className="text-muted-foreground text-sm">Setting up a print business feels impossible</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-400 text-xl">✗</span>
                  </div>
                  <div>
                    <p className="text-foreground font-bold">Spending hours on social captions</p>
                    <p className="text-muted-foreground text-sm">Writing content takes longer than shooting</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Solution */}
            <div className="animate-fade-in">
              <h2 className="text-3xl font-black text-primary mb-6 uppercase">
                VAULT Solves Everything
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle2 className="text-green-500 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-foreground font-bold">AI finds your best work instantly</p>
                    <p className="text-muted-foreground text-sm">4-dimensional scoring in seconds</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle2 className="text-green-500 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-foreground font-bold">Identifies commercial winners</p>
                    <p className="text-muted-foreground text-sm">Know exactly which photos will sell</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle2 className="text-green-500 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-foreground font-bold">Print store setup in 5 minutes</p>
                    <p className="text-muted-foreground text-sm">No inventory, no shipping, just profit</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle2 className="text-green-500 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-foreground font-bold">AI-written social captions</p>
                    <p className="text-muted-foreground text-sm">Instagram, LinkedIn, Twitter - all done</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-foreground mb-4 uppercase">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              From camera roll chaos to organized cash flow in 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <Card className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <div className="text-4xl font-black text-primary mb-2">1</div>
              <h3 className="text-lg font-bold text-foreground mb-2 uppercase">Upload Photos</h3>
              <p className="text-sm text-muted-foreground">
                Drag & drop folders or connect Google Photos. Bulk upload up to 70,000 photos.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <div className="text-4xl font-black text-primary mb-2">2</div>
              <h3 className="text-lg font-bold text-foreground mb-2 uppercase">AI Analyzes</h3>
              <p className="text-sm text-muted-foreground">
                Every photo scored on technical quality, commercial value, artistic merit, emotional impact.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <div className="text-4xl font-black text-primary mb-2">3</div>
              <h3 className="text-lg font-bold text-foreground mb-2 uppercase">See Your Best</h3>
              <p className="text-sm text-muted-foreground">
                Photos auto-organized into Elite, Stars, and Gems tiers. Find hidden winners instantly.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <div className="text-4xl font-black text-primary mb-2">4</div>
              <h3 className="text-lg font-bold text-foreground mb-2 uppercase">Start Sharing</h3>
              <p className="text-sm text-muted-foreground">
                Seamless integrations with Google Photos, social platforms, and more. Share your magic effortlessly.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-foreground mb-4 uppercase">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground">
              Professional photo management + monetization in one platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 hover:border-primary transition-colors">
              <Sparkles className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2 uppercase">AI Photo Scoring</h3>
              <p className="text-muted-foreground">
                4-dimensional analysis reveals your best work. Technical, commercial, artistic, emotional scores.
              </p>
            </Card>

            <Card className="p-6 hover:border-primary transition-colors">
              <Shield className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2 uppercase">Smart Organization</h3>
              <p className="text-muted-foreground">
                Elite/Stars/Gems tiers, smart filters, instant search. Find any photo in seconds.
              </p>
            </Card>

            <Card className="p-6 hover:border-primary transition-colors">
              <DollarSign className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2 uppercase">Print Store</h3>
              <p className="text-muted-foreground">
                Built-in storefront with automatic fulfillment. No inventory, no shipping, just profit.
              </p>
            </Card>

            <Card className="p-6 hover:border-primary transition-colors">
              <Zap className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2 uppercase">Social Captions</h3>
              <p className="text-muted-foreground">
                AI-generated captions for Instagram, LinkedIn, Twitter. Complete with hashtags.
              </p>
            </Card>

            <Card className="p-6 hover:border-primary transition-colors">
              <Lock className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2 uppercase">Watermarking</h3>
              <p className="text-muted-foreground">
                Custom watermarks with batch application. Protect your work before sharing.
              </p>
            </Card>

            <Card className="p-6 hover:border-primary transition-colors">
              <TrendingUp className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2 uppercase">Analytics</h3>
              <p className="text-muted-foreground">
                Track best sellers, revenue trends, customer insights. Data-driven decisions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-foreground mb-4 uppercase">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Start free, scale as you grow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <Card className="p-8">
              <div className="text-center">
                <h3 className="text-xl font-black text-foreground mb-2 uppercase">Starter</h3>
                <div className="text-5xl font-black text-foreground mb-1">$19</div>
                <div className="text-muted-foreground mb-6">/month</div>
                
                <Button 
                  className="w-full mb-6"
                  variant="outline"
                  onClick={() => navigate('/auth')}
                >
                  Start Free Trial
                </Button>

                <div className="text-left space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">1,000 photos</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">AI analysis & scoring</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Smart organization</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Social captions</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Creator - POPULAR */}
            <Card className="p-8 border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-black uppercase rounded-full">
                Most Popular
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-black text-primary mb-2 uppercase">Creator</h3>
                <div className="text-5xl font-black text-foreground mb-1">$49</div>
                <div className="text-muted-foreground mb-6">/month</div>
                
                <Button 
                  className="w-full mb-6 font-bold"
                  onClick={() => navigate('/auth')}
                >
                  Start Free Trial
                </Button>

                <div className="text-left space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground font-bold">10,000 photos</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground font-bold">Everything in Starter</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground font-bold">Print store + fulfillment</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground font-bold">Custom watermarks</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground font-bold">Analytics dashboard</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Professional */}
            <Card className="p-8">
              <div className="text-center">
                <h3 className="text-xl font-black text-foreground mb-2 uppercase">Professional</h3>
                <div className="text-5xl font-black text-foreground mb-1">$99</div>
                <div className="text-muted-foreground mb-6">/month</div>
                
                <Button 
                  className="w-full mb-6"
                  variant="outline"
                  onClick={() => navigate('/auth')}
                >
                  Start Free Trial
                </Button>

                <div className="text-left space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Unlimited photos</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Everything in Creator</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Custom domain</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Advanced analytics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Priority support</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground">
              All plans include 7-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-foreground mb-4 uppercase">
              Loved by Photographers
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "VAULT found 50 photos in my archive worth $5K+ I had completely forgotten about. Paid for itself in the first week."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20" />
                <div>
                  <div className="text-sm font-bold text-foreground">Sarah Johnson</div>
                  <div className="text-xs text-muted-foreground">Wedding Photographer</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "The AI analysis taught me more about composition than 3 years of YouTube tutorials. Now I know exactly what makes my photos work."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20" />
                <div>
                  <div className="text-sm font-bold text-foreground">Marcus Chen</div>
                  <div className="text-xs text-muted-foreground">Landscape Photographer</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "Set up my print store in 5 minutes. Made $3,200 in my first month selling prints I didn't know people wanted."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20" />
                <div>
                  <div className="text-sm font-bold text-foreground">Emily Rodriguez</div>
                  <div className="text-xs text-muted-foreground">Portrait Photographer</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6 uppercase">
            Ready to Unlock Your<br />
            Photo <span className="text-primary">Magic</span>?
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Join 1,000+ photographers who've discovered their hidden gems
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="font-bold h-16 px-12 text-xl"
            >
              Start Free 7-Day Trial
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            No credit card required • 7-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <Logo variant="full" size="sm" />
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered photo management and monetization platform for photographers.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-foreground uppercase mb-4">Product</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Features</a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors">API</a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-foreground uppercase mb-4">Company</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors">About</a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Blog</a>
                <a href="/privacy" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Privacy</a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-foreground uppercase mb-4">Support</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Help Center</a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Contact</a>
                <a href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors">Status</a>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            © 2025 VAULT. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
