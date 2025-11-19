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
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [mapPosition, setMapPosition] = useState<[number, number]>([-16.6869, -49.2648]); // Goiânia como padrão
  const [showMap, setShowMap] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  // Limpar estado quando fechar modal
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSuggestions([]);
      setSelectedLocation(null);
      setMapPosition([-16.6869, -49.2648]);
      setShowMap(false);
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
          setShowMap(true);
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
    const rawAddress = result.display_name;
    const addressParts = rawAddress.split(',').map(part => part.trim());
    
    // Mapeamento de estados para suas siglas
    const stateMapping: Record<string, string> = {
      'goiás': 'GO', 'goias': 'GO',
      'são paulo': 'SP', 'sao paulo': 'SP',
      'rio de janeiro': 'RJ',
      'minas gerais': 'MG',
      'bahia': 'BA',
      'paraná': 'PR', 'parana': 'PR',
      'rio grande do sul': 'RS',
      'pernambuco': 'PE',
      'ceará': 'CE', 'ceara': 'CE',
      'pará': 'PA', 'para': 'PA',
      'santa catarina': 'SC',
      'maranhão': 'MA', 'maranhao': 'MA',
      'paraíba': 'PB', 'paraiba': 'PB',
      'espírito santo': 'ES', 'espirito santo': 'ES',
      'piauí': 'PI', 'piaui': 'PI',
      'alagoas': 'AL',
      'rio grande do norte': 'RN',
      'mato grosso': 'MT',
      'mato grosso do sul': 'MS',
      'distrito federal': 'DF',
      'sergipe': 'SE',
      'rondônia': 'RO', 'rondonia': 'RO',
      'acre': 'AC',
      'amazonas': 'AM',
      'roraima': 'RR',
      'amapá': 'AP', 'amapa': 'AP',
      'tocantins': 'TO'
    };

    let street = '';
    let city = '';
    let state = '';
    let stateIndex = -1;

    // Extrair rua (primeira parte)
    if (addressParts.length >= 1) {
      street = addressParts[0] || '';
    }

    // Encontrar o estado
    for (let i = addressParts.length - 1; i >= 0; i--) {
      const part = addressParts[i].replace(/,?\s*Brasil$/, '').trim().toLowerCase();
      
      for (const [stateName, stateCode] of Object.entries(stateMapping)) {
        if (part.includes(stateName)) {
          state = stateCode;
          stateIndex = i;
          break;
        }
      }
      
      if (state) break;
    }
    
    // Procurar cidade antes do estado
    if (stateIndex > 0) {
      for (let i = stateIndex - 1; i >= 1; i--) {
        const cityCandidate = addressParts[i].trim();
        
        // Verificar se não é uma região geográfica
        const isNotRegion = !cityCandidate.toLowerCase().includes('região') && 
                           !cityCandidate.toLowerCase().includes('imediata') &&
                           !cityCandidate.toLowerCase().includes('intermediária') &&
                           !cityCandidate.toLowerCase().includes('metropolitana');
        
        // Verificar se parece uma cidade
        const seemsLikeCity = cityCandidate.length > 2 && 
                             !/^\d+$/.test(cityCandidate) &&
                             !cityCandidate.toLowerCase().includes('setor');
        
        if (isNotRegion && seemsLikeCity) {
          city = cityCandidate;
          break;
        }
      }
    }
    
    // Fallback para cidade
    if (!city && addressParts.length >= 3) {
      const fallbackCity = addressParts[1].trim();
      if (fallbackCity && fallbackCity.length > 2 && !fallbackCity.toLowerCase().includes('região')) {
        city = fallbackCity;
      }
    }
    
    const location = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: street || rawAddress,
      parsedStreet: street,
      parsedCity: city,
      parsedState: state
    };
    
    setSelectedLocation(location);
    setMapPosition([location.lat, location.lng]);
    setShowMap(true);
  };

  // Função para atualizar localização no mapa
  const handleMapLocationChange = async (lat: number, lng: number) => {
    const rawAddress = await reverseGeocode(lat, lng);
    
    // Processar endereço para extrair dados organizados com sigla do estado
    const addressParts = rawAddress.split(',').map(part => part.trim());
    
    // Mapeamento de estados para suas siglas
    const stateMapping = {
      'goiás': 'GO', 'goias': 'GO',
      'são paulo': 'SP', 'sao paulo': 'SP',
      'rio de janeiro': 'RJ',
      'minas gerais': 'MG',
      'bahia': 'BA',
      'paraná': 'PR', 'parana': 'PR',
      'rio grande do sul': 'RS',
      'pernambuco': 'PE',
      'ceará': 'CE', 'ceara': 'CE',
      'pará': 'PA', 'para': 'PA',
      'santa catarina': 'SC',
      'maranhão': 'MA', 'maranhao': 'MA',
      'paraíba': 'PB', 'paraiba': 'PB',
      'espírito santo': 'ES', 'espirito santo': 'ES',
      'piauí': 'PI', 'piaui': 'PI',
      'alagoas': 'AL',
      'rio grande do norte': 'RN',
      'mato grosso': 'MT',
      'mato grosso do sul': 'MS',
      'distrito federal': 'DF',
      'sergipe': 'SE',
      'rondônia': 'RO', 'rondonia': 'RO',
      'acre': 'AC',
      'amazonas': 'AM',
      'roraima': 'RR',
      'amapá': 'AP', 'amapa': 'AP',
      'tocantins': 'TO'
    };

    let street = '';
    let city = '';
    let state = '';

    // Extrair informações organizadas
    if (addressParts.length >= 2) {
      street = addressParts[0] || '';
      
      let stateIndex = -1;
      
      // Primeiro, encontrar o índice do estado
      for (let i = addressParts.length - 1; i >= 0; i--) {
        const part = addressParts[i].replace(/,?\s*Brasil$/, '').trim().toLowerCase();
        
        for (const [stateName, stateCode] of Object.entries(stateMapping)) {
          if (part.includes(stateName)) {
            state = stateCode;
            stateIndex = i;
            break;
          }
        }
        
        if (state) break;
      }
      
      // Agora procurar pela cidade antes do estado
      if (stateIndex > 0) {
        // Procurar cidade nas partes anteriores ao estado
        for (let i = stateIndex - 1; i >= 1; i--) {
          const cityCandidate = addressParts[i].trim();
          
          // Verificar se não é uma região geográfica ou outro tipo de divisão administrativa
          const isNotRegion = !cityCandidate.toLowerCase().includes('região') && 
                             !cityCandidate.toLowerCase().includes('imediata') &&
                             !cityCandidate.toLowerCase().includes('intermediária') &&
                             !cityCandidate.toLowerCase().includes('metropolitana') &&
                             !cityCandidate.toLowerCase().includes('microrregião');
          
          // Verificar se tem características de cidade (não é só números ou muito genérico)
          const seemsLikeCity = cityCandidate.length > 2 && 
                               !/^\d+$/.test(cityCandidate) &&
                               !cityCandidate.toLowerCase().includes('setor') &&
                               !cityCandidate.toLowerCase().includes('quadra');
          
          if (isNotRegion && seemsLikeCity) {
            city = cityCandidate;
            break;
          }
        }
      }
      
      // Fallback: se não encontrou cidade e tem pelo menos 3 partes, usar a segunda parte
      if (!city && addressParts.length >= 3) {
        const fallbackCity = addressParts[1].trim();
        if (fallbackCity && fallbackCity.length > 2 && !fallbackCity.toLowerCase().includes('região')) {
          city = fallbackCity;
        }
      }
      
      // Se ainda não encontrou cidade, usar uma parte intermediária válida
      if (!city && addressParts.length >= 3) {
        for (let i = 1; i < addressParts.length - 1; i++) {
          const candidate = addressParts[i].trim();
          if (candidate && 
              candidate.length > 2 && 
              !candidate.toLowerCase().includes('região') &&
              !candidate.toLowerCase().includes(state.toLowerCase()) &&
              !/^\d+$/.test(candidate)) {
            city = candidate;
            break;
          }
        }
      }
      
      // Se ainda não tem estado, tentar fallback
      if (!state && addressParts.length >= 1) {
        const lastPart = addressParts[addressParts.length - 1]?.replace(/,?\s*Brasil$/, '').trim().toLowerCase() || '';
        for (const [stateName, stateCode] of Object.entries(stateMapping)) {
          if (lastPart.includes(stateName)) {
            state = stateCode;
            break;
          }
        }
      }
    } else {
      street = rawAddress;
    }

    // Debug para verificar o que foi extraído
    console.log('Debug - Raw address:', rawAddress);
    console.log('Debug - Address parts:', addressParts);
    console.log('Debug - Extracted street:', street);
    console.log('Debug - Extracted city:', city);
    console.log('Debug - Extracted state:', state);
    
    // Criar endereço organizado para retorno
    const organizedAddress = street || rawAddress;
    
    const location = { 
      lat, 
      lng, 
      address: organizedAddress,
      // Adicionar dados estruturados para usar no registro
      parsedStreet: street,
      parsedCity: city,
      parsedState: state
    };
    
    setSelectedLocation(location);
    setMapPosition([lat, lng]);
  };

  // Função para salvar localização no perfil do usuário
  const saveLocationToProfile = async () => {
    if (!selectedLocation || !user) return;

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
          <DialogTitle className="text-lg font-semibold">
            Buscar Endereço
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {!showMap ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite seu endereço"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-address"
                />
              </div>

              {isLoading && (
                <div className="text-center py-4">
                  <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {suggestions.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto border border-border rounded-lg">
                  {suggestions.map((result) => (
                    <div
                      key={result.place_id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors p-3 border-b border-border last:border-b-0"
                      onClick={() => selectLocation(result)}
                      data-testid={`suggestion-${result.place_id}`}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground mb-1">
                            {result.display_name.split(',')[0]}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {result.display_name}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 mt-4">
                <Button
                  onClick={detectCurrentLocation}
                  disabled={isDetecting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
                  data-testid="button-detect-location"
                >
                  {isDetecting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Detectando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4" />
                      Usar minha localização
                    </div>
                  )}
                </Button>
                <Button
                  onClick={async () => {
                    if (!selectedLocation) {
                      const defaultLat = -16.6869;
                      const defaultLng = -49.2648;
                      
                      // Obter endereço real das coordenadas padrão
                      const address = await reverseGeocode(defaultLat, defaultLng);
                      
                      setSelectedLocation({
                        lat: defaultLat,
                        lng: defaultLng,
                        address: address
                      });
                      setMapPosition([defaultLat, defaultLng]);
                    }
                    setShowMap(true);
                  }}
                  variant="outline"
                  className="w-full h-11"
                  data-testid="button-show-map"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Escolher no mapa
                  </div>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Ajuste sua localização</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Clique no mapa para ajustar sua localização exata
                </p>
              </div>

              <div className="h-64 rounded-lg overflow-hidden border border-border">
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

              <div className="bg-accent/20 dark:bg-accent/10 border border-accent/30 dark:border-accent/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-foreground dark:text-foreground">
                  <Move className="h-4 w-4" />
                  <span>Clique no mapa ou arraste o marcador</span>
                </div>
              </div>

              {selectedLocation && (
                <div className="bg-muted dark:bg-muted rounded-lg p-3">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Endereço selecionado:</div>
                  <div className="text-sm text-foreground">{selectedLocation.address}</div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowMap(false)}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-back-search"
                >
                  Voltar
                </Button>
                <Button
                  onClick={confirmLocation}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  data-testid="button-confirm-location"
                >
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Confirmar
                  </div>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}