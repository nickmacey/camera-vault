import { useState, useEffect } from "react";
import { VaultEntrance } from "@/components/VaultEntrance";
import { VaultSanctuary } from "@/components/VaultSanctuary";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type ExperienceMode = "entrance" | "sanctuary";

const Index = () => {
  const [mode, setMode] = useState<ExperienceMode>("entrance");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      // If authenticated and has photos, skip entrance
      if (session) {
        checkUserPhotos(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUserPhotos = async (userId: string) => {
    const { data: photos } = await supabase
      .from("photos")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (photos && photos.length > 0) {
      setMode("sanctuary");
    }
  };

  const handleEnterVault = () => {
    if (!isAuthenticated) {
      navigate("/auth");
    } else {
      setMode("sanctuary");
    }
  };

  if (mode === "entrance") {
    return <VaultEntrance onEnter={handleEnterVault} />;
  }

  return <VaultSanctuary />;
};

export default Index;
