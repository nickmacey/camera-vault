import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { ExternalLink } from 'lucide-react';

interface GoogleMapProps {
  latitude: number;
  longitude: number;
  className?: string;
}

export const GoogleMap = ({ latitude, longitude, className = '' }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
          version: 'weekly',
        });

        const google = await (loader as any).load();

        if (!mapRef.current) return;

        const position = { lat: latitude, lng: longitude };

        const map = new google.maps.Map(mapRef.current, {
          center: position,
          zoom: 14,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        new google.maps.Marker({
          map,
          position,
        });
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError(true);
      }
    };

    initMap();
  }, [latitude, longitude]);

  if (error) {
    return (
      <div className={`bg-vault-dark-gray rounded-lg flex items-center justify-center border border-vault-mid-gray ${className}`}>
        <a
          href={`https://www.google.com/maps?q=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-vault-gold hover:underline flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          View on Google Maps
        </a>
      </div>
    );
  }

  return <div ref={mapRef} className={`rounded-lg border border-vault-mid-gray ${className}`} />;
};
