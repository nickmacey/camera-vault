import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThroughMyLens } from "@/components/ThroughMyLens";
import { FeatureNav } from "@/components/FeatureNav";

export default function LensPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                <Eye className="w-6 h-6" />
                THROUGH MY LENS
              </h1>
              <p className="text-sm text-muted-foreground">Discover your photography identity</p>
            </div>
          </div>
        </div>
      </header>

      {/* Feature Navigation */}
      <div className="py-4 border-b border-border bg-card/30">
        <FeatureNav />
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Introduction */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
              How Do You See the World?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your photos reveal a unique perspective. Let AI analyze your collection 
              to uncover your visual identity, signature style, and the stories you tell 
              through your lens.
            </p>
          </div>

          {/* Through My Lens Component */}
          <ThroughMyLens />
        </div>
      </main>
    </div>
  );
}
