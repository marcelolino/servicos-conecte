import { useState, useEffect, useRef } from 'react';
import { X, Search, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddressSearchModalProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  onClose: () => void;
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

declare global {
  interface Window {
    google: any;
  }
}

export function AddressSearchModal({ onLocationSelect, onClose, initialQuery = '' }: AddressSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({ lat: -16.6869, lng: -49.2648 });
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  useEffect(() => {
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
  }, []);

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

  // Iniciar busca automática se houver query inicial
  useEffect(() => {
    if (initialQuery && autocompleteServiceRef.current) {
      const timer = setTimeout(() => {
        setIsLoading(true);
        
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: initialQuery,
            componentRestrictions: { country: 'br' },
            types: ['geocode']
          },
          (predictions: PlaceSuggestion[] | null, status: any) => {
            setIsLoading(false);
            
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setSuggestions(predictions.slice(0, 5));
            }
          }
        );
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [initialQuery, autocompleteServiceRef.current]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: selectedLocation,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
      },
    });

    markerRef.current = new window.google.maps.Marker({
      position: selectedLocation,
      map: googleMapRef.current,
      draggable: true,
      title: 'Arraste para ajustar a localização',
    });

    placesServiceRef.current = new window.google.maps.places.PlacesService(googleMapRef.current);

    markerRef.current.addListener('dragend', (event: any) => {
      const newPos = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      setSelectedLocation(newPos);
      reverseGeocode(newPos);
    });

    googleMapRef.current.addListener('click', (event: any) => {
      const newPos = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      setSelectedLocation(newPos);
      markerRef.current.setPosition(newPos);
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
      // Fallback para geocoding se Places Service não estiver disponível
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
              setShowMap(true);
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
          setShowMap(true);
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
          setShowMap(true);
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
          alert('Não foi possível obter sua localização atual.');
        }
      );
    }
  };

  const handleConfirm = () => {
    onLocationSelect({
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      address: selectedAddress || searchQuery
    });
  };

  if (showMap) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMap(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="font-semibold text-gray-900 dark:text-white">ENDEREÇO</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Você está aqui?</span>
                <span className="text-gray-600 dark:text-gray-300">Ajuste a localização</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                {selectedAddress || 'Carregando endereço...'}
              </p>
            </div>
          </div>

          {/* Map Area */}
          <div className="flex-1 relative">
            <div 
              ref={mapRef}
              className="w-full h-full"
              style={{ minHeight: '400px' }}
            />
            
            {!isMapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Carregando mapa...</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirm}
            >
              Confirmar localização
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Buscar Endereço</h3>
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
              placeholder="Digite seu endereço..."
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
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Buscando...</p>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.place_id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {suggestion.structured_formatting.main_text}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {suggestion.structured_formatting.secondary_text}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchQuery && !isLoading && suggestions.length === 0 && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p>Nenhum endereço encontrado</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleUseCurrentLocation}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Usar minha localização atual
          </Button>
        </div>
      </div>
    </div>
  );
}