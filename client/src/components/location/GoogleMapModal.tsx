import { useState, useEffect, useRef } from 'react';
import { X, Navigation, MapPin, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoogleMapModalProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export function GoogleMapModal({ onLocationSelect, onClose }: GoogleMapModalProps) {
  const [selectedAddress, setSelectedAddress] = useState("Carregando localização...");
  const [selectedLocation, setSelectedLocation] = useState({ lat: -16.6869, lng: -49.2648 });
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  useEffect(() => {
    // Carrega o script do Google Maps
    const loadGoogleMaps = () => {
      if (window.google) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google) return;

      // Inicializa o geocoder
      geocoderRef.current = new window.google.maps.Geocoder();

      // Cria o mapa
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

      // Cria o marcador
      markerRef.current = new window.google.maps.Marker({
        position: selectedLocation,
        map: googleMapRef.current,
        draggable: true,
        title: 'Arraste para escolher a localização',
      });

      // Evento de arrastar do marcador
      markerRef.current.addListener('dragend', (event: any) => {
        const newPos = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };
        setSelectedLocation(newPos);
        reverseGeocode(newPos);
      });

      // Evento de clique no mapa
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
      reverseGeocode(selectedLocation);
    };

    loadGoogleMaps();
  }, []);

  const reverseGeocode = (location: { lat: number; lng: number }) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode(
      { location: location },
      (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          setSelectedAddress(results[0].formatted_address);
        } else {
          setSelectedAddress(`${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`);
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
          
          if (googleMapRef.current) {
            googleMapRef.current.setCenter(newPos);
            markerRef.current.setPosition(newPos);
            reverseGeocode(newPos);
          }
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          alert('Não foi possível obter sua localização atual.');
        }
      );
    }
  };

  const handleCenterMap = () => {
    const goianiaCenter = { lat: -16.6869, lng: -49.2648 };
    setSelectedLocation(goianiaCenter);
    
    if (googleMapRef.current) {
      googleMapRef.current.setCenter(goianiaCenter);
      markerRef.current.setPosition(goianiaCenter);
      reverseGeocode(goianiaCenter);
    }
  };

  const handleConfirm = () => {
    onLocationSelect({
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      address: selectedAddress
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Escolher local</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Compartilhar sua localização precisa aumenta a precisão nos resultados de pesquisa e estimativas de entrega, 
            garantindo a entrega de pedidos sem esforço.
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {typeof selectedAddress === 'object' && selectedAddress !== null 
                ? JSON.stringify(selectedAddress)
                : String(selectedAddress || 'Localização não selecionada')
              }
            </p>
          </div>
        </div>

        {/* Map Area com Google Maps Real */}
        <div className="flex-1 relative">
          <div className="w-full h-full relative">
            {/* Mapa do Google Maps */}
            <div 
              ref={mapRef}
              className="w-full h-full rounded-lg"
              style={{ minHeight: '400px' }}
            />
            
            {!isMapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Carregando mapa...</p>
                </div>
              </div>
            )}

            {/* Instruções */}
            {isMapLoaded && (
              <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-800/95 rounded-lg p-2 shadow-lg">
                <p className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Arraste o marcador ou clique no mapa para selecionar
                </p>
              </div>
            )}

            {/* Controles */}
            {isMapLoaded && (
              <div className="absolute top-4 right-4 flex flex-col gap-1">
                <button 
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-1 shadow-sm text-xs flex items-center gap-1 text-gray-700 dark:text-gray-300"
                  onClick={handleUseCurrentLocation}
                >
                  <Navigation className="h-3 w-3" />
                  Minha Localização
                </button>
                
                <button 
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-1 shadow-sm text-xs flex items-center gap-1 text-gray-700 dark:text-gray-300"
                  onClick={handleCenterMap}
                >
                  <RotateCcw className="h-3 w-3" />
                  Centralizar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleConfirm}
          >
            Confirmar Localização
          </Button>
        </div>
      </div>
    </div>
  );
}