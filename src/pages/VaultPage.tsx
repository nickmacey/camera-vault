import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, Share2, Printer, Edit3, Instagram, Image as ImageIcon, Download, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency, getPhotoValueByScore } from "@/lib/photoValue";
import { AIPhotoSearch } from "@/components/AIPhotoSearch";

interface VaultPhoto {
  id: string;
  filename: string;
  storage_path: string;
  overall_score: number | null;
  description: string | null;
  url?: string;
}

const printPartners = [
  { name: "Mixtiles", logo: "🖼️", description: "Turn photos into stunning wall tiles", status: "Coming Soon" },
  { name: "Printful", logo: "👕", description: "Print on demand for merch & products", status: "Coming Soon" },
  { name: "Printify", logo: "🎨", description: "Custom products & global shipping", status: "Coming Soon" },
];

const socialPlatforms = [
  { name: "Instagram", icon: "📸", color: "bg-gradient-to-r from-purple-500 to-pink-500" },
  { name: "Pinterest", icon: "📌", color: "bg-red-600" },
  { name: "TikTok", icon: "🎵", color: "bg-black" },
];

export default function VaultPage() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<VaultPhoto[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<string[] | null>(null);

  useEffect(() => {
    fetchVaultPhotos();
  }, []);

  const fetchVaultPhotos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('photos')
      .select('id, filename, storage_path, overall_score, description')
      .eq('user_id', user.id)
      .eq('tier', 'vault-worthy')
      .order('overall_score', { ascending: false });

    if (error) {
      toast.error("Failed to load vault photos");
      return;
    }

    const photosWithUrls = await Promise.all(
      (data || []).map(async (photo) => {
        const { data: urlData } = await supabase.storage
          .from('photos')
          .createSignedUrl(photo.storage_path, 3600);
        return { ...photo, url: urlData?.signedUrl || '' };
      })
    );

    setPhotos(photosWithUrls);
    setLoading(false);
  };

  const toggleSelect = (photoId: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const selectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map(p => p.id)));
    }
  };

  const totalValue = photos.reduce((sum, p) => sum + getPhotoValueByScore(p.overall_score), 0);
  const selectedValue = photos
    .filter(p => selectedPhotos.has(p.id))
    .reduce((sum, p) => sum + getPhotoValueByScore(p.overall_score), 0);

  const handlePrintPartnerClick = (partner: string) => {
    toast.info(`${partner} integration coming soon! We're working on partnerships.`);
  };

  const handleSocialShare = (platform: string) => {
    toast.info(`${platform} sharing coming soon!`);
  };

  const handleEditPhotos = () => {
    if (selectedPhotos.size === 0) {
      toast.error("Select photos to edit");
      return;
    }
    toast.info("Photo editing studio coming soon!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-vault-gold/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-vault-gold flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                THE VAULT
              </h1>
              <p className="text-sm text-muted-foreground">Your portfolio-ready assets</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-vault-gold border-vault-gold">
              {photos.length} Assets • {formatCurrency(totalValue)}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* AI Search */}
        <div className="mb-6">
          <AIPhotoSearch
            photos={photos}
            onSearchResults={setSearchResults}
            tier="vault-worthy"
            placeholder="Search vault (e.g., 'sunset photos', 'portraits', 'landscapes')"
          />
          {searchResults && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary">
                Showing {searchResults.length} of {photos.length} photos
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setSearchResults(null)}>
                Clear search
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Gallery - 3 columns */}
          <div className="lg:col-span-3 space-y-6">
            {/* Selection Actions */}
            <div className="flex items-center justify-between bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {selectedPhotos.size === photos.length ? 'Deselect All' : 'Select All'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedPhotos.size} selected
                  {selectedPhotos.size > 0 && ` • ${formatCurrency(selectedValue)}`}
                </span>
              </div>
              {selectedPhotos.size > 0 && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleEditPhotos}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast.info("Download coming soon!")}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </div>

            {/* Photo Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-20">
                <Sparkles className="w-16 h-16 mx-auto text-vault-gold/50 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Your Vault is Empty</h3>
                <p className="text-muted-foreground mb-6">Upload photos to start building your portfolio</p>
                <Button onClick={() => navigate('/app')}>Upload Photos</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(searchResults ? photos.filter(p => searchResults.includes(p.id)) : photos).map((photo) => (
                  <div
                    key={photo.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedPhotos.has(photo.id)
                        ? 'border-vault-gold ring-2 ring-vault-gold/50'
                        : 'border-transparent hover:border-vault-gold/30'
                    }`}
                    onClick={() => toggleSelect(photo.id)}
                  >
                    <div className="aspect-square">
                      <img
                        src={photo.url}
                        alt={photo.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Selection Checkbox */}
                    <div className={`absolute top-2 left-2 transition-opacity ${
                      selectedPhotos.has(photo.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        selectedPhotos.has(photo.id)
                          ? 'bg-vault-gold text-background'
                          : 'bg-black/50 text-white'
                      }`}>
                        {selectedPhotos.has(photo.id) && <Check className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Score Badge */}
                    {photo.overall_score && (
                      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur px-2 py-1 rounded text-xs font-bold text-vault-gold">
                        {photo.overall_score.toFixed(1)}
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-xs text-white/80 truncate">{photo.filename}</p>
                        <p className="text-xs text-vault-gold font-semibold">
                          {formatCurrency(getPhotoValueByScore(photo.overall_score))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Integrations */}
          <div className="space-y-6">
            {/* Print Partners */}
            <Card className="border-vault-gold/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Printer className="w-5 h-5 text-vault-gold" />
                  Print Partners
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {printPartners.map((partner) => (
                  <button
                    key={partner.name}
                    onClick={() => handlePrintPartnerClick(partner.name)}
                    className="w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{partner.logo}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{partner.name}</span>
                          <Badge variant="secondary" className="text-[10px]">{partner.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{partner.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Social Sharing */}
            <Card className="border-vault-gold/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-vault-gold" />
                  Share to Social
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {socialPlatforms.map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => handleSocialShare(platform.name)}
                    disabled={selectedPhotos.size === 0}
                    className={`w-full p-3 rounded-lg ${platform.color} text-white font-medium flex items-center gap-3 transition-opacity ${
                      selectedPhotos.size === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                    }`}
                  >
                    <span className="text-xl">{platform.icon}</span>
                    <span>{platform.name}</span>
                  </button>
                ))}
                {selectedPhotos.size === 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Select photos to share
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Photo Editing */}
            <Card className="border-vault-gold/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-vault-gold" />
                  Photo Studio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleEditPhotos}
                  disabled={selectedPhotos.size === 0}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Edit Selected
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => toast.info("Presets coming soon!")}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Apply Presets
                </Button>
                <p className="text-xs text-muted-foreground">
                  Edit, enhance, and apply presets to your photos before sharing or printing.
                </p>
              </CardContent>
            </Card>

            {/* Automation Teaser */}
            <Card className="border-vault-gold/20 bg-gradient-to-br from-vault-gold/5 to-transparent">
              <CardContent className="pt-4">
                <div className="text-center">
                  <span className="text-3xl mb-2 block">🤖</span>
                  <h4 className="font-semibold text-sm mb-1">Auto-Pipeline</h4>
                  <p className="text-xs text-muted-foreground">
                    Coming soon: Auto-upload, analyze, and list your photos daily
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
