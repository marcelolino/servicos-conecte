import { useState, useEffect, useRef } from 'react';
import { X, Search, MapPin, Navigation, Home, Building, Check, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { extractAddressComponents } from '@/lib/addressUtils';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
}

interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
}

interface AddressDetails {
  number: string;
  complement: string;
  reference: string;
  type: 'casa' | 'trabalho';
}

// Configurar ícone personalizado para o marcador
const customIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#dc2626" stroke="#ffffff" stroke-width="3"/>
      <circle cx="20" cy="20" r="8" fill="#ffffff"/>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

// Componente para capturar cliques no mapa
function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Componente para centralizar o mapa
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 16);
  }, [center, map]);
  
  return null;
}

export function OpenStreetMapLocationPicker({ isOpen, onClose, onLocationSelect }: LocationPickerProps) {
  const [currentStep, setCurrentStep] = useState<'detect' | 'search' | 'map' | 'confirm'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [mapPosition, setMapPosition] = useState<[number, number]>([-16.6869, -49.2648]); // Goiânia como padrão
  const [isSavingToProfile, setIsSavingToProfile] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  // Limpar estado quando fechar modal
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('search');
      setSearchQuery('');
      setSuggestions([]);
      setSelectedLocation(null);
      setMapPosition([-16.6869, -49.2648]);
    }
  }, [isOpen]);

  // Função para buscar endereços no OpenStreetMap Nominatim
  const searchAddresses = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Priorizando endereços no Brasil
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&limit=8&addressdetails=1&extratags=1&namedetails=1`
      );
      
      if (response.ok) {
        const results = await response.json();
        setSuggestions(results);
      } else {
        console.error('Erro ao buscar endereços:', response.statusText);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAddresses(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Função para obter endereço através de reverse geocoding
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=pt-BR`
      );
      
      if (response.ok) {
        const result = await response.json();
        console.log('DEBUG - Reverse geocode result:', result);
        
        // Usar display_name que tem formato completo com CEP
        const fullAddress = result.display_name || `${lat}, ${lng}`;
        console.log('DEBUG - Full address from reverse geocode:', fullAddress);
        
        return fullAddress;
      }
    } catch (error) {
      console.error('Erro no reverse geocoding:', error);
    }
    
    return `${lat}, ${lng}`;
  };

  // Função para detectar localização atual
  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocalização não suportada",
        description: "Seu navegador não suporta geolocalização.",
        variant: "destructive"
      });
      return;
    }

    setIsDetecting(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const address = await reverseGeocode(latitude, longitude);
          const location = {
            lat: latitude,
            lng: longitude,
            address: address
          };
          
          setSelectedLocation(location);
          setMapPosition([latitude, longitude]);
          setCurrentStep('confirm');
        } catch (error) {
          console.error('Erro ao obter endereço:', error);
          toast({
            title: "Erro ao obter endereço",
            description: "Não foi possível obter o endereço da sua localização.",
            variant: "destructive"
          });
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        setIsDetecting(false);
        let message = "Erro ao obter localização.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Permissão de localização negada. Por favor, permita o acesso à localização.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Localização não disponível.";
            break;
          case error.TIMEOUT:
            message = "Tempo limite para obter localização.";
            break;
        }
        
        toast({
          title: "Erro de Localização",
          description: message,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Função para selecionar uma localização da busca
  const selectLocation = (result: NominatimResult) => {
    const location = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name
    };
    
    setSelectedLocation(location);
    setMapPosition([location.lat, location.lng]);
    setCurrentStep('map');
  };

  // Função para atualizar localização no mapa
  const handleMapLocationChange = async (lat: number, lng: number) => {
    const address = await reverseGeocode(lat, lng);
    const location = { lat, lng, address };
    setSelectedLocation(location);
    setMapPosition([lat, lng]);
  };

  // Função para salvar localização no perfil do usuário
  const saveLocationToProfile = async () => {
    if (!selectedLocation || !user) return;

    setIsSavingToProfile(true);
    try {
      const addressComponents = extractAddressComponents(selectedLocation.address);
      console.log('DEBUG - Address:', selectedLocation.address);
      console.log('DEBUG - Address components:', addressComponents);
      
      await apiRequest('PUT', '/api/users/profile/location', {
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        address: selectedLocation.address,
        ...addressComponents
      });

      // Invalidar cache do usuário para recarregar dados atualizados
      const { queryClient } = await import('@/lib/queryClient');
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "Localização salva!",
        description: "Sua localização foi salva no seu perfil com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar localização:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a localização no seu perfil.",
        variant: "destructive"
      });
    } finally {
      setIsSavingToProfile(false);
    }
  };

  // Função para confirmar e usar localização
  const confirmLocation = async () => {
    if (!selectedLocation) return;

    // Extrair componentes do endereço
    const addressComponents = extractAddressComponents(selectedLocation.address);
    
    // Criar objeto com localização e componentes extraídos
    const locationData = {
      ...selectedLocation,
      ...addressComponents
    };

    // Salvar dados na memória localStorage para uso no cadastro
    localStorage.setItem('detectedLocation', JSON.stringify(locationData));

    // Salvar no perfil se usuário estiver logado
    if (user) {
      await saveLocationToProfile();
    }

    // Retornar localização para o componente pai
    onLocationSelect(locationData);
    onClose();
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Buscar Endereço
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4">
          {currentStep === 'detect' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-4">
                  Você está aqui?
                </div>
                <div className="text-sm font-medium mb-6">
                  Rua 205 - Setor Coimbra, Goiânia - GO, Brasil
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={detectCurrentLocation}
                  disabled={isDetecting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white h-12"
                >
                  {isDetecting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Detectando localização...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4" />
                      Confirmar localização
                    </div>
                  )}
                </Button>

                <Button
                  onClick={() => setCurrentStep('search')}
                  variant="outline"
                  className="w-full h-12"
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Ajustar a localização
                  </div>
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Digite seu endereço"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {isLoading && (
                <div className="text-center py-4">
                  <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {suggestions.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {suggestions.map((result) => (
                    <div
                      key={result.place_id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors p-3 border-b border-gray-100 last:border-b-0"
                      onClick={() => selectLocation(result)}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {result.display_name.split(',')[0]}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-2">
                            {result.display_name}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 mt-4">
                <div className="flex gap-2">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1 h-10"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={detectCurrentLocation}
                    disabled={isDetecting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 disabled:bg-blue-400"
                  >
                    <div className="flex items-center gap-2">
                      {isDetecting ? (
                        <div className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Navigation className="h-3 w-3" />
                      )}
                      {isDetecting ? 'Detectando...' : 'Detectar localização'}
                    </div>
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    // Simular confirmação sem localização específica
                    confirmLocation();
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white h-11"
                >
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    Confirmar localização
                  </div>
                </Button>
                <Button
                  onClick={() => {
                    // Definir localização padrão para mostrar o mapa
                    if (!selectedLocation) {
                      setSelectedLocation({
                        lat: -16.6869,
                        lng: -49.2648,
                        address: 'Goiânia - GO, Brasil'
                      });
                      setMapPosition([-16.6869, -49.2648]);
                    }
                    setCurrentStep('map');
                  }}
                  variant="outline"
                  className="w-full h-11"
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Ajustar no Mapa
                  </div>
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'map' && selectedLocation && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Você está aqui?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Arraste o marcador para ajustar sua localização exata
                </p>
              </div>

              <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                <MapContainer
                  center={mapPosition}
                  zoom={16}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapCenterUpdater center={mapPosition} />
                  <MapClickHandler onLocationChange={handleMapLocationChange} />
                  <Marker
                    position={mapPosition}
                    icon={customIcon}
                    draggable={true}
                    eventHandlers={{
                      dragend: async (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        await handleMapLocationChange(position.lat, position.lng);
                      },
                    }}
                  />
                </MapContainer>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                  <Move className="h-4 w-4" />
                  <span>Clique no mapa ou arraste o marcador para ajustar a localização</span>
                </div>
              </div>

              {selectedLocation && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço selecionado:</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">{selectedLocation.address}</div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentStep('search')}
                  variant="outline"
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => setCurrentStep('confirm')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirmar localização
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'confirm' && selectedLocation && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-green-800 dark:text-green-200">
                      Localização confirmada
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                      {selectedLocation.address}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                    </div>
                  </div>
                </div>
              </div>

              {user && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                    <Home className="h-4 w-4" />
                    <span>Esta localização será salva no seu perfil</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentStep('map')}
                  variant="outline"
                  className="flex-1"
                >
                  Ajustar no Mapa
                </Button>
                <Button
                  onClick={confirmLocation}
                  disabled={isSavingToProfile}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSavingToProfile ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Confirmar
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}