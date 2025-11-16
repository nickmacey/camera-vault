import { motion } from "framer-motion";
import { ArrowLeft, ShoppingBag, Instagram, Image, Palette, Frame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VaultPortalsProps {
  selectedPhoto: any | null;
  onBack: () => void;
}

export const VaultPortals = ({ selectedPhoto, onBack }: VaultPortalsProps) => {
  const portals = [
    {
      id: "shopify",
      title: "SHOPIFY",
      icon: ShoppingBag,
      description: "Your image as a product. Price: $450. Framed print. Ready to ship.",
      color: "from-green-500/20 to-green-700/20",
      borderColor: "border-green-500/50",
      action: () => toast.info("Shopify integration coming soon"),
    },
    {
      id: "getty",
      title: "GETTY",
      icon: Image,
      description: "Your image in their marketplace. Licensing options. Royalty projections.",
      color: "from-red-500/20 to-red-700/20",
      borderColor: "border-red-500/50",
      action: () => toast.info("Getty Images integration coming soon"),
    },
    {
      id: "instagram",
      title: "INSTAGRAM",
      icon: Instagram,
      description: "Your image as a carousel post. Engagement predictions. Optimal caption.",
      color: "from-pink-500/20 to-purple-700/20",
      borderColor: "border-pink-500/50",
      action: () => toast.info("Instagram integration coming soon"),
    },
    {
      id: "midjourney",
      title: "MIDJOURNEY",
      icon: Palette,
      description: "Your image as a style reference. Generate 100 variations. Auto-scored.",
      color: "from-blue-500/20 to-cyan-700/20",
      borderColor: "border-blue-500/50",
      action: () => toast.info("Midjourney integration coming soon"),
    },
    {
      id: "gallery",
      title: "GALLERY",
      icon: Frame,
      description: "Your image on a white wall. Track lighting. Museum placard. Exhibition-ready.",
      color: "from-yellow-500/20 to-amber-700/20",
      borderColor: "border-yellow-500/50",
      action: () => toast.info("Gallery feature coming soon"),
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-8">
      <Button
        onClick={onBack}
        variant="outline"
        className="fixed top-8 left-8 z-50"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Gallery
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl font-bold text-white mb-4">DEPLOYMENT PORTALS</h2>
        <p className="text-vault-light-gray text-lg">
          Choose where your work will live
        </p>
      </motion.div>

      {/* Selected photo preview */}
      {selectedPhoto && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12"
        >
          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.filename}
            className="w-64 h-48 object-cover rounded-lg shadow-2xl border-2 border-vault-gold"
          />
        </motion.div>
      )}

      {/* Portals grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
        {portals.map((portal, index) => (
          <motion.div
            key={portal.id}
            initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            className="relative group cursor-pointer"
            onClick={portal.action}
          >
            <div className={`relative h-80 rounded-xl border-2 ${portal.borderColor} bg-gradient-to-br ${portal.color} backdrop-blur-sm overflow-hidden`}>
              {/* Portal glow */}
              <div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Preview area */}
              <div className="h-2/3 flex items-center justify-center p-6">
                {selectedPhoto ? (
                  <div className="relative w-full h-full">
                    <img
                      src={selectedPhoto.url}
                      alt=""
                      className="w-full h-full object-contain rounded opacity-60 group-hover:opacity-100 transition-opacity"
                    />
                    {/* Platform-specific overlay effects */}
                    {portal.id === "shopify" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/90 px-4 py-2 rounded shadow-lg">
                          <p className="text-black font-bold">$450</p>
                        </div>
                      </div>
                    )}
                    {portal.id === "gallery" && (
                      <div className="absolute bottom-0 left-0 right-0 bg-white p-2 text-black text-xs">
                        <p className="font-bold">{selectedPhoto.filename}</p>
                        <p>Limited Edition Print</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <portal.icon className="w-24 h-24 text-white/50 group-hover:text-white transition-colors" />
                )}
              </div>

              {/* Portal info */}
              <div className="absolute bottom-0 left-0 right-0 bg-vault-black/80 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <portal.icon className="w-5 h-5 text-white" />
                  <h3 className="text-white font-bold text-lg">{portal.title}</h3>
                </div>
                <p className="text-vault-light-gray text-sm">{portal.description}</p>
              </div>

              {/* Hover effect border pulse */}
              <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/30 rounded-xl transition-colors pointer-events-none" />
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-vault-light-gray text-sm mt-12 max-w-2xl text-center">
        Select a portal to deploy your image. Each platform is optimized for your work's success.
      </p>
    </div>
  );
};
