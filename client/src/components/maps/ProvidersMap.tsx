import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon, divIcon } from "leaflet";
import { MapPin, Star, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";

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

// Create custom icons for markers
const createUserIcon = () => {
  return divIcon({
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: #3B82F6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createProviderIcon = (name: string) => {
  return divIcon({
    html: `
      <div style="
        width: 36px;
        height: 36px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="36" height="36" viewBox="0 0 36 36" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <circle cx="18" cy="18" r="16" fill="#10B981" stroke="white" stroke-width="3"/>
          <path d="M18 8c-5.5 0-10 4.5-10 10 0 3 1.4 5.8 3.6 7.6l6.4 6.1 6.4-6.1c2.2-1.8 3.6-4.6 3.6-7.6 0-5.5-4.5-10-10-10z" fill="white"/>
          <circle cx="18" cy="17" r="4" fill="#10B981"/>
          <rect x="12" y="24" width="12" height="2" rx="1" fill="white"/>
        </svg>
        <div style="
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(16, 185, 129, 0.9);
          color: white;
          font-size: 8px;
          font-weight: bold;
          padding: 1px 3px;
          border-radius: 2px;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          ${name.charAt(0).toUpperCase()}
        </div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

export function ProvidersMap({ 
  providers, 
  userLocation, 
  onProviderSelect,
  height = "400px" 
}: ProvidersMapProps) {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const handleProviderClick = (provider: Provider) => {
    setSelectedProvider(provider);
    if (onProviderSelect) {
      onProviderSelect(provider);
    }
  };

  return (
    <div className="relative">
      <div style={{ height }} className="w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <MapContainer
          center={[userLocation.lat, userLocation.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User location marker */}
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createUserIcon()}
          >
            <Popup>
              <div className="text-center">
                <div className="font-semibold">Sua Localização</div>
                <div className="text-sm text-gray-600">{userLocation.address}</div>
              </div>
            </Popup>
          </Marker>

          {/* Provider markers */}
          {providers.map((provider) => {
            const lat = parseFloat(provider.user.latitude || '0');
            const lng = parseFloat(provider.user.longitude || '0');

            if (lat === 0 || lng === 0) return null;

            return (
              <Marker
                key={provider.id}
                position={[lat, lng]}
                icon={createProviderIcon(provider.user.name)}
                eventHandlers={{
                  click: () => handleProviderClick(provider),
                }}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {provider.user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold">{provider.user.name}</div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{provider.rating || "5.0"}</span>
                          <span>({provider.totalReviews || 0})</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-sm text-blue-600 mb-2">
                      <MapPin className="h-3 w-3" />
                      <span>{provider.distance} km de distância</span>
                    </div>
                    
                    {provider.services && provider.services.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-500 mb-1">Serviços:</div>
                        <div className="flex flex-wrap gap-1">
                          {provider.services.slice(0, 2).map((service) => (
                            <Badge key={service.id} variant="secondary" className="text-xs">
                              {service.category.name}
                            </Badge>
                          ))}
                          {provider.services.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{provider.services.length - 2} mais
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      {provider.user.phone && (
                        <Button size="sm" variant="outline" className="text-xs">
                          <Phone className="h-3 w-3 mr-1" />
                          Ligar
                        </Button>
                      )}
                      <Button size="sm" className="text-xs">
                        Ver Perfil
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Selected provider info card (bottom overlay) */}
      {selectedProvider && (
        <Card className="absolute bottom-4 left-4 right-4 max-w-sm mx-auto shadow-lg z-[1000]">
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