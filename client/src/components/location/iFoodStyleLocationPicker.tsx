import { useState, useEffect, useRef } from 'react';
import { X, Search, MapPin, Navigation, Home, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialQuery?: string;
}

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressDetails {
  number: string;
  complement: string;
  reference: string;
  type: 'casa' | 'trabalho';
}

declare global {
  interface Window {
    google: any;
  }
}

export function IFoodStyleLocationPicker({ isOpen, onClose, onLocationSelect, initialQuery = '' }: LocationPickerProps) {
  const [currentStep, setCurrentStep] = useState<'search' | 'map' | 'details'>('search');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({ lat: -16.6869, lng: -49.2648 });
  const [selectedAddress, setSelectedAddress] = useState('');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [addressDetails, setAddressDetails] = useState<AddressDetails>({
    number: '',
    complement: '',
    reference: '',
    type: 'casa'
  });
  
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const loadGoogleMaps = () => {
      if (window.google) {
        initializeServices();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeServices;
      document.head.appendChild(script);
    };

    const initializeServices = () => {
      if (!window.google) return;
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      geocoderRef.current = new window.google.maps.Geocoder();
    };

    loadGoogleMaps();
  }, [isOpen]);

  useEffect(() => {
    if (!searchQuery.trim() || !autocompleteServiceRef.current) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);
      
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: searchQuery,
          componentRestrictions: { country: 'br' },
          types: ['geocode']
        },
        (predictions: PlaceSuggestion[] | null, status: any) => {
          setIsLoading(false);
          
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.slice(0, 5));
          } else {
            setSuggestions([]);
          }
        }
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: selectedLocation,
      zoom: 16,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
      },
      disableDefaultUI: false,
      clickableIcons: false,
      gestureHandling: 'greedy',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Criar marcador customizado estilo iFood
    markerRef.current = new window.google.maps.Marker({
      position: selectedLocation,
      map: googleMapRef.current,
      draggable: true,
      title: 'Arraste para ajustar a localização',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="48" height="58" viewBox="0 0 48 58" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Shadow -->
            <ellipse cx="24" cy="54" rx="8" ry="3" fill="rgba(0,0,0,0.2)"/>
            <!-- Pin body -->
            <path d="M24 0C10.7452 0 0 10.7452 0 24C0 37.2548 24 58 24 58C24 58 48 37.2548 48 24C48 10.7452 37.2548 0 24 0Z" fill="#E53E3E"/>
            <!-- White circle -->
            <circle cx="24" cy="24" r="12" fill="white"/>
            <!-- Red center dot -->
            <circle cx="24" cy="24" r="6" fill="#E53E3E"/>
            <!-- Highlight -->
            <circle cx="20" cy="20" r="3" fill="rgba(255,255,255,0.4)"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(48, 58),
        anchor: new window.google.maps.Point(24, 58),
      }
    });

    placesServiceRef.current = new window.google.maps.places.PlacesService(googleMapRef.current);

    // Evento quando o marcador é arrastado
    markerRef.current.addListener('dragstart', () => {
      // Adicionar efeito visual durante o arrasto
      markerRef.current.setIcon({
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="48" height="58" viewBox="0 0 48 58" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Shadow larger during drag -->
            <ellipse cx="24" cy="54" rx="12" ry="4" fill="rgba(0,0,0,0.3)"/>
            <!-- Pin body with elevation -->
            <path d="M24 0C10.7452 0 0 10.7452 0 24C0 37.2548 24 58 24 58C24 58 48 37.2548 48 24C48 10.7452 37.2548 0 24 0Z" fill="#E53E3E" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.3))"/>
            <!-- White circle -->
            <circle cx="24" cy="24" r="12" fill="white"/>
            <!-- Red center dot -->
            <circle cx="24" cy="24" r="6" fill="#E53E3E"/>
            <!-- Highlight -->
            <circle cx="20" cy="20" r="3" fill="rgba(255,255,255,0.4)"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(48, 58),
        anchor: new window.google.maps.Point(24, 58),
      });
    });

    markerRef.current.addListener('dragend', (event: any) => {
      const newPos = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      setSelectedLocation(newPos);
      
      // Restaurar ícone normal
      markerRef.current.setIcon({
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="48" height="58" viewBox="0 0 48 58" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Shadow -->
            <ellipse cx="24" cy="54" rx="8" ry="3" fill="rgba(0,0,0,0.2)"/>
            <!-- Pin body -->
            <path d="M24 0C10.7452 0 0 10.7452 0 24C0 37.2548 24 58 24 58C24 58 48 37.2548 48 24C48 10.7452 37.2548 0 24 0Z" fill="#E53E3E"/>
            <!-- White circle -->
            <circle cx="24" cy="24" r="12" fill="white"/>
            <!-- Red center dot -->
            <circle cx="24" cy="24" r="6" fill="#E53E3E"/>
            <!-- Highlight -->
            <circle cx="20" cy="20" r="3" fill="rgba(255,255,255,0.4)"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(48, 58),
        anchor: new window.google.maps.Point(24, 58),
      });
      
      reverseGeocode(newPos);
    });

    googleMapRef.current.addListener('click', (event: any) => {
      const newPos = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      setSelectedLocation(newPos);
      
      // Animar o movimento do marcador
      markerRef.current.setPosition(newPos);
      
      // Adicionar pequena animação de "bounce"
      setTimeout(() => {
        markerRef.current.setAnimation(window.google.maps.Animation.BOUNCE);
        setTimeout(() => {
          markerRef.current.setAnimation(null);
        }, 700);
      }, 100);
      
      reverseGeocode(newPos);
    });

    setIsMapLoaded(true);
  };

  const reverseGeocode = (location: { lat: number; lng: number }) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode(
      { location: location },
      (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          setSelectedAddress(results[0].formatted_address);
        }
      }
    );
  };

  const handleSuggestionClick = (suggestion: PlaceSuggestion) => {
    setSearchQuery(suggestion.description);
    setSuggestions([]);
    
    if (!placesServiceRef.current) {
      if (geocoderRef.current) {
        geocoderRef.current.geocode(
          { address: suggestion.description },
          (results: any, status: any) => {
            if (status === 'OK' && results[0]) {
              const location = results[0].geometry.location;
              const newPos = {
                lat: location.lat(),
                lng: location.lng()
              };
              setSelectedLocation(newPos);
              setSelectedAddress(suggestion.description);
              setCurrentStep('map');
              setTimeout(initializeMap, 100);
            }
          }
        );
      }
      return;
    }

    placesServiceRef.current.getDetails(
      {
        placeId: suggestion.place_id,
        fields: ['geometry', 'formatted_address']
      },
      (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
          const location = place.geometry.location;
          const newPos = {
            lat: location.lat(),
            lng: location.lng()
          };
          setSelectedLocation(newPos);
          setSelectedAddress(place.formatted_address || suggestion.description);
          setCurrentStep('map');
          setTimeout(initializeMap, 100);
        }
      }
    );
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setSelectedLocation(newPos);
          setCurrentStep('map');
          setTimeout(() => {
            initializeMap();
            if (googleMapRef.current && markerRef.current) {
              googleMapRef.current.setCenter(newPos);
              markerRef.current.setPosition(newPos);
              reverseGeocode(newPos);
            }
          }, 100);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          toast({
            title: "Erro",
            description: "Não foi possível obter sua localização atual.",
            variant: "destructive"
          });
        }
      );
    }
  };

  const handleConfirmLocation = () => {
    setCurrentStep('details');
  };

  const saveAddressToProfile = async () => {
    try {
      const fullAddress = `${selectedAddress}${addressDetails.number ? ', ' + addressDetails.number : ''}${addressDetails.complement ? ', ' + addressDetails.complement : ''}`;
      
      const locationData = {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        address: fullAddress
      };

      // Se o usuário estiver logado, salvar no perfil
      if (user) {
        try {
          await apiRequest({
            url: '/api/users/profile',
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              address: fullAddress,
              latitude: selectedLocation.lat.toString(),
              longitude: selectedLocation.lng.toString(),
            }),
          });

          toast({
            title: "Sucesso",
            description: "Endereço salvo no seu perfil!",
          });
        } catch (error) {
          console.error('Erro ao salvar no perfil:', error);
          // Mesmo que falhe ao salvar no perfil, continuar salvando em memória
          toast({
            title: "Aviso",
            description: "Endereço salvo temporariamente. Faça login para salvar permanentemente.",
            variant: "default"
          });
        }
      } else {
        // Se não estiver logado, salvar apenas em memória
        toast({
          title: "Endereço salvo",
          description: "Endereço salvo temporariamente. Faça login para salvar permanentemente.",
        });
      }

      // Sempre salvar em localStorage como backup
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      
      // Chamar callback com a localização
      onLocationSelect(locationData);

      onClose();
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o endereço. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  // Etapa 1: Busca de endereço (estilo iFood primeira imagem)
  if (currentStep === 'search') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md p-0">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Escolha um endereço</h3>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Input */}
          <div className="p-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-red-600" />
              <Input
                placeholder="Rua, bairro ou CEP"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-16"
              />
              <Button 
                className="absolute right-1 top-1 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1 h-8"
                onClick={() => suggestions.length > 0 && handleSuggestionClick(suggestions[0])}
              >
                Buscar
              </Button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="flex-1 max-h-[400px] overflow-y-auto">
            {isLoading && (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Buscando...</p>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="divide-y">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.place_id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {suggestion.structured_formatting.main_text}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {suggestion.structured_formatting.secondary_text}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchQuery && !isLoading && suggestions.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-gray-500">Nenhum endereço encontrado</p>
              </div>
            )}
          </div>

          {/* Footer with "Não achei meu endereço" */}
          <div className="p-4 border-t">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:text-red-700"
              onClick={handleUseCurrentLocation}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Não achei meu endereço
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Etapa 2: Confirmação no mapa (estilo iFood segunda imagem)
  if (currentStep === 'map') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep('search')}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="font-semibold text-gray-900">ENDEREÇO</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Map Area */}
          <div className="flex-1 relative" style={{ height: '400px' }}>
            <div 
              ref={mapRef}
              className="w-full h-full"
            />
            
            {!isMapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Carregando mapa...</p>
                </div>
              </div>
            )}

            {/* Location confirmation overlay */}
            <div className="absolute top-4 left-4 right-4 bg-white rounded-lg p-3 shadow-lg">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Você está aqui?</span>
                <span className="text-gray-600">Ajuste a localização</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                {selectedAddress || 'Carregando endereço...'}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmLocation}
            >
              Confirmar localização
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Etapa 3: Detalhes do endereço (estilo iFood terceira imagem)
  if (currentStep === 'details') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md p-0">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep('map')}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="font-semibold text-gray-900">ENDEREÇO</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Address Details Form */}
          <div className="p-4 space-y-4">
            {/* Main address display */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedAddress}
              </p>
            </div>

            {/* Number and Complement inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  placeholder="Número"
                  value={addressDetails.number}
                  onChange={(e) => setAddressDetails(prev => ({ ...prev, number: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">Apartamento/Bloco/Casa</p>
              </div>
              <div>
                <Input
                  placeholder="Complemento"
                  value={addressDetails.complement}
                  onChange={(e) => setAddressDetails(prev => ({ ...prev, complement: e.target.value }))}
                />
              </div>
            </div>

            {/* Reference point */}
            <div>
              <Input
                placeholder="Ponto de referência"
                value={addressDetails.reference}
                onChange={(e) => setAddressDetails(prev => ({ ...prev, reference: e.target.value }))}
              />
            </div>

            {/* Address type selection */}
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Favoritar como</p>
              <div className="flex gap-2">
                <Button
                  variant={addressDetails.type === 'casa' ? 'default' : 'outline'}
                  onClick={() => setAddressDetails(prev => ({ ...prev, type: 'casa' }))}
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Casa
                </Button>
                <Button
                  variant={addressDetails.type === 'trabalho' ? 'default' : 'outline'}
                  onClick={() => setAddressDetails(prev => ({ ...prev, type: 'trabalho' }))}
                  className="flex-1"
                >
                  <Building className="h-4 w-4 mr-2" />
                  Trabalho
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={saveAddressToProfile}
            >
              Salvar endereço
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}