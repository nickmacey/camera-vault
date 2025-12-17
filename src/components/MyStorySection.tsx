import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';
import { Camera, MapPin, Pencil, Check, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Coordinate {
  lat: number;
  lng: number;
}

const DEFAULT_LENS_STORY = "Every photograph captures a moment, a feeling, a piece of the world as I see it. These are the places I've been, the stories I've witnessed, and the memories I've preserved.";

export const MyStorySection = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [profile, setProfile] = useState<{ firstName: string; avatarUrl: string | null; lensStory: string | null }>({ firstName: '', avatarUrl: null, lensStory: null });
  const [locationCount, setLocationCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  // Convert DMS array to decimal
  const dmsToDecimal = (dms: number[] | number): number | null => {
    if (typeof dms === 'number') return dms;
    if (!Array.isArray(dms) || dms.length < 3) return null;
    const [degrees, minutes, seconds] = dms;
    return degrees + (minutes / 60) + (seconds / 3600);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, avatar_url, lens_story')
        .eq('id', session.user.id)
        .single();

      if (profileData) {
        setProfile({
          firstName: profileData.first_name || 'Photographer',
          avatarUrl: profileData.avatar_url,
          lensStory: profileData.lens_story
        });
      }

      // Fetch photo locations
      const { data: photos } = await supabase
        .from('photos')
        .select('location_data')
        .eq('user_id', session.user.id)
        .not('location_data', 'is', null);

      if (photos && photos.length > 0) {
        const coords: Coordinate[] = [];
        
        photos.forEach((photo) => {
          const locData = photo.location_data as any;
          if (locData) {
            let lat: number | null = null;
            let lng: number | null = null;
            
            if (Array.isArray(locData.latitude)) {
              lat = dmsToDecimal(locData.latitude);
            } else if (typeof locData.latitude === 'number') {
              lat = locData.latitude;
            } else if (typeof locData.lat === 'number') {
              lat = locData.lat;
            }
            
            if (Array.isArray(locData.longitude)) {
              lng = dmsToDecimal(locData.longitude);
            } else if (typeof locData.longitude === 'number') {
              lng = locData.longitude;
            } else if (typeof locData.lng === 'number' || typeof locData.lon === 'number') {
              lng = locData.lng || locData.lon;
            }
            
            if (lat !== null && lng !== null) {
              coords.push({ lat, lng });
            }
          }
        });

        setCoordinates(coords);
        setLocationCount(new Set(coords.map(c => `${c.lat.toFixed(2)},${c.lng.toFixed(2)}`)).size);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleStartEdit = () => {
    setEditText(profile.lensStory || DEFAULT_LENS_STORY);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText('');
  };

  const handleSaveEdit = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('profiles')
        .update({ lens_story: editText.trim() || null })
        .eq('id', session.user.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, lensStory: editText.trim() || null }));
      setIsEditing(false);
      toast.success('Photography statement saved');
    } catch (error) {
      console.error('Error saving lens story:', error);
      toast.error('Failed to save');
    }
  };

  useEffect(() => {
    if (coordinates.length === 0) return;
    
    const initMap = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          setMapError(true);
          return;
        }

        const loader = new Loader({
          apiKey,
          version: 'weekly',
        });

        const google = await (loader as any).load();
        if (!mapRef.current) return;

        // Calculate bounds to fit all markers
        const bounds = new google.maps.LatLngBounds();
        coordinates.forEach(coord => {
          bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
        });

        const map = new google.maps.Map(mapRef.current, {
          center: bounds.getCenter(),
          zoom: 2,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d0d0d" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a2a" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
          ],
        });

        // Fit map to show all markers
        if (coordinates.length > 1) {
          map.fitBounds(bounds, 50);
        }

        // Add markers with custom gold styling
        coordinates.forEach((coord) => {
          new google.maps.Marker({
            map,
            position: { lat: coord.lat, lng: coord.lng },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#D4AF37',
              fillOpacity: 0.9,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              scale: 8,
            },
          });
        });
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setMapError(true);
      }
    };

    initMap();
  }, [coordinates]);

  return (
    <section className="relative py-24 px-6 bg-gradient-to-b from-background via-vault-dark-gray/50 to-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl tracking-[0.3em] text-foreground mb-4">
            MY STORY
          </h2>
          <div className="w-24 h-px bg-vault-gold mx-auto" />
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Profile Portrait & Through My Lens */}
          <div className="flex flex-col items-center text-center space-y-8">
            {/* Portrait Photo Frame */}
            <div className="relative">
              {/* Decorative frame */}
              <div className="absolute -inset-4 border-2 border-vault-gold/30 rounded-sm" />
              <div className="absolute -inset-2 border border-vault-gold/50 rounded-sm" />
              
              {/* Portrait container - taller aspect ratio */}
              <div className="relative w-64 h-80 overflow-hidden bg-vault-dark-gray">
                {profile.avatarUrl ? (
                  <img 
                    src={profile.avatarUrl} 
                    alt={`${profile.firstName}'s portrait`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-16 h-16 text-vault-gold/30" />
                  </div>
                )}
              </div>
              
              {/* Corner accents */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-vault-gold" />
              <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-vault-gold" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-vault-gold" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-vault-gold" />
            </div>

            {/* Through My Lens Text */}
            <div className="space-y-4 w-full max-w-sm">
              <div className="flex items-center justify-center gap-2">
                <h3 className="font-display text-2xl md:text-3xl tracking-[0.2em] text-vault-gold">
                  THROUGH MY LENS
                </h3>
                {!isEditing && (
                  <button
                    onClick={handleStartEdit}
                    className="p-1.5 rounded-full hover:bg-vault-gold/10 transition-colors group"
                    aria-label="Edit photography statement"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground group-hover:text-vault-gold transition-colors" />
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Write your personal photography statement..."
                    className="min-h-[120px] text-center bg-vault-dark-gray border-vault-mid-gray focus:border-vault-gold resize-none"
                    maxLength={500}
                  />
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      className="bg-vault-gold text-background hover:bg-vault-gold/90"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{editText.length}/500</p>
                </div>
              ) : (
                <p className="text-muted-foreground leading-relaxed">
                  {profile.lensStory || DEFAULT_LENS_STORY}
                </p>
              )}
              
              <div className="flex items-center justify-center gap-2 text-vault-gold/80">
                <MapPin className="w-4 h-4" />
                <span className="text-sm tracking-wider">
                  {locationCount} {locationCount === 1 ? 'location' : 'locations'} explored
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Globe/Map */}
          <div className="relative">
            {/* Map container with decorative border */}
            <div className="relative">
              <div className="absolute -inset-2 border border-vault-gold/20 rounded-lg" />
              
              {mapError || coordinates.length === 0 ? (
                <div className="w-full h-[400px] md:h-[500px] bg-vault-dark-gray rounded-lg flex items-center justify-center border border-vault-mid-gray">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-vault-gold/30" />
                    <p>Map loading...</p>
                    {coordinates.length === 0 && (
                      <p className="text-sm mt-2">Upload photos with location data to see your journey</p>
                    )}
                  </div>
                </div>
              ) : (
                <div 
                  ref={mapRef} 
                  className="w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden"
                />
              )}

              {/* Overlay gradient for visual effect */}
              <div className="absolute inset-0 pointer-events-none rounded-lg border border-vault-gold/10" />
            </div>

            {/* Map caption */}
            <p className="text-center text-xs text-muted-foreground mt-4 tracking-wider uppercase">
              My photographic journey around the world
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
