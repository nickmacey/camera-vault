import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Shield, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SignupPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoCount: number;
  bestScore: number;
}

export const SignupPromptModal = ({ 
  open, 
  onOpenChange, 
  photoCount,
  bestScore 
}: SignupPromptModalProps) => {
  const navigate = useNavigate();

  const handleSignup = () => {
    onOpenChange(false);
    navigate("/auth?mode=signup");
  };

  const handleLogin = () => {
    onOpenChange(false);
    navigate("/auth?mode=login");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-2 border-vault-gold">
        <div className="text-center space-y-6 py-4">
          {/* Icon */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-vault-gold/20 blur-xl rounded-full animate-pulse" />
            <div className="relative bg-vault-gold/10 border-2 border-vault-gold rounded-full p-6">
              <Lock className="h-12 w-12 text-vault-gold" />
            </div>
          </div>

          {/* Title */}
          <div>
            <DialogTitle className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground mb-2">
              Save Your Vault
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              You analyzed {photoCount} photo{photoCount !== 1 ? 's' : ''} 
              {bestScore > 0 && ` with a top score of ${bestScore.toFixed(1)}`}
            </DialogDescription>
          </div>

          {/* Benefits */}
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-vault-gold/5 border border-vault-gold/20">
              <Shield className="h-5 w-5 text-vault-gold mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground text-sm">Protect Your Results</p>
                <p className="text-xs text-muted-foreground">Save scores, analysis, and captions forever</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-vault-gold/5 border border-vault-gold/20">
              <Sparkles className="h-5 w-5 text-vault-gold mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground text-sm">Unlimited Analysis</p>
                <p className="text-xs text-muted-foreground">Analyze unlimited photos with AI</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-vault-gold/5 border border-vault-gold/20">
              <Award className="h-5 w-5 text-vault-gold mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground text-sm">Track Your Best Work</p>
                <p className="text-xs text-muted-foreground">Build your vault of high-value assets</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3 pt-2">
            <Button 
              onClick={handleSignup}
              className="w-full bg-vault-gold hover:bg-vault-gold/90 text-vault-black font-black text-base py-6 vault-glow-gold"
            >
              <Lock className="mr-2 h-5 w-5" />
              Create Free Account
            </Button>
            
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">Already have an account?</span>
              <button
                onClick={handleLogin}
                className="text-vault-gold hover:underline font-semibold"
              >
                Sign In
              </button>
            </div>
            
            <Button 
              onClick={() => onOpenChange(false)}
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground text-sm"
            >
              Continue without saving
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/70">
            Free forever • No credit card required
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};