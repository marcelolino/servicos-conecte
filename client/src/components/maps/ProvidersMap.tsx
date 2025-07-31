import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MapPin, Star, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Provider {
  id: number;
  user: {
    name: string;
    city?: string;
    latitude?: string;
    longitude?: string;
    phone?: string;
  };
  rating: string;
  totalReviews: number;
  description?: string;
  distance: number;
  services?: Array<{
    id: number;
    name: string;
    category: {
      name: string;
    };
  }>;
}

interface ProvidersMapProps {
  providers: Provider[];
  userLocation: { lat: number; lng: number; address: string };
  onProviderSelect?: (provider: Provider) => void;
  height?: string;
}

export function ProvidersMap({ 
  providers, 
  userLocation, 
  onProviderSelect,
  height = "400px" 
}: ProvidersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
          version: "weekly",
          libraries: ["places"]
        });

        const { Map } = await loader.importLibrary("maps");
        const { Marker } = await loader.importLibrary("marker");

        if (!mapRef.current) return;

        // Initialize map centered on user location
        const map = new Map(mapRef.current, {
          center: { lat: userLocation.lat, lng: userLocation.lng },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapInstanceRef.current = map;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Add user location marker
        const userMarker = new Marker({
          position: { lat: userLocation.lat, lng: userLocation.lng },
          map: map,
          title: "Sua localização",
          icon: {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="white" stroke-width="4"/>
                <circle cx="20" cy="20" r="6" fill="white"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
          }
        });

        // Add provider markers
        providers.forEach((provider, index) => {
          const lat = parseFloat(provider.user.latitude || '0');
          const lng = parseFloat(provider.user.longitude || '0');

          if (lat === 0 || lng === 0) return;

          const marker = new Marker({
            position: { lat, lng },
            map: map,
            title: provider.user.name,
            icon: {
              url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="14" fill="#10B981" stroke="white" stroke-width="4"/>
                  <text x="16" y="21" text-anchor="middle" fill="white" font-size="12" font-weight="bold">
                    ${provider.user.name.charAt(0)}
                  </text>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16)
            }
          });

          marker.addListener("click", () => {
            setSelectedProvider(provider);
            if (onProviderSelect) {
              onProviderSelect(provider);
            }
          });

          markersRef.current.push(marker);
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading map:", error);
        setError("Erro ao carregar o mapa. Verifique sua conexão e tente novamente.");
        setIsLoading(false);
      }
    };

    if (mapRef.current) {
      initializeMap();
    }

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [providers, userLocation, onProviderSelect]);

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Carregando mapa...</p>
          </div>
        </div>
      )}
      
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
      />

      {/* Selected provider info card */}
      {selectedProvider && (
        <Card className="absolute bottom-4 left-4 right-4 max-w-sm mx-auto shadow-lg z-20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {selectedProvider.user.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-sm">{selectedProvider.user.name}</CardTitle>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{selectedProvider.rating || "5.0"}</span>
                    <span>({selectedProvider.totalReviews || 0})</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProvider(null)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center space-x-1 text-xs text-blue-600 mb-2">
              <MapPin className="h-3 w-3" />
              <span>{selectedProvider.distance} km de distância</span>
            </div>
            
            {selectedProvider.services && selectedProvider.services.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {selectedProvider.services.slice(0, 2).map((service) => (
                    <Badge key={service.id} variant="secondary" className="text-xs">
                      {service.category.name}
                    </Badge>
                  ))}
                  {selectedProvider.services.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{selectedProvider.services.length - 2} mais
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                <span>{selectedProvider.user.city || "Região"}</span>
              </div>
              <div className="flex gap-2">
                {selectedProvider.user.phone && (
                  <Button size="sm" variant="outline" className="h-6 text-xs">
                    <Phone className="h-3 w-3 mr-1" />
                    Ligar
                  </Button>
                )}
                <Button size="sm" className="h-6 text-xs">
                  Ver Perfil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}