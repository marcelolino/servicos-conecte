import { useState, useEffect, useRef } from 'react';
import { MapPin, X, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InteractiveMapProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  onClose: () => void;
}

export function InteractiveMap({ onLocationSelect, onClose }: InteractiveMapProps) {
  const [selectedLocation, setSelectedLocation] = useState({ lat: -16.6869, lng: -49.2648 });
  const [selectedAddress, setSelectedAddress] = useState("4B Kamal Ataturk Ave, Dhaka 1212, Bangladesh");
  const mapRef = useRef<HTMLDivElement>(null);

  // Simular coordenadas de Goiânia para demonstração
  const goianiaCoords = { lat: -16.6869, lng: -49.2648 };

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Converter coordenadas de pixel para lat/lng (simulação)
    const lat = goianiaCoords.lat + (y / rect.height - 0.5) * 0.1;
    const lng = goianiaCoords.lng + (x / rect.width - 0.5) * 0.1;
    
    setSelectedLocation({ lat, lng });
    
    // Simular busca de endereço baseado nas coordenadas
    const addresses = [
      "R. 3 Q R, 0 - Vila Isaura, Goiânia - GO, 74653-050, Brazil",
      "Av. Goiás, 123 - Centro, Goiânia - GO, 74015-010, Brazil",
      "R. 8, 456 - Setor Central, Goiânia - GO, 74030-020, Brazil",
      "Av. Anhanguera, 789 - Setor Norte, Goiânia - GO, 74110-010, Brazil"
    ];
    
    const randomAddress = addresses[Math.floor(Math.random() * addresses.length)];
    setSelectedAddress(randomAddress);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSelectedLocation({ lat: latitude, lng: longitude });
          setSelectedAddress("Sua localização atual - Goiânia, GO, Brazil");
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

        {/* Map Area */}
        <div className="flex-1 relative">
          <div 
            ref={mapRef}
            className="w-full h-full bg-gradient-to-br from-green-200 via-green-300 to-green-400 cursor-crosshair relative overflow-hidden"
            onClick={handleMapClick}
            style={{
              backgroundImage: `
                linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
                linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.1) 75%),
                linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.1) 75%)
              `,
              backgroundSize: '30px 30px',
              backgroundPosition: '0 0, 0 15px, 15px -15px, -15px 0px'
            }}
          >
            {/* Grid lines para simular mapa */}
            <div className="absolute inset-0 opacity-20">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={`h-${i}`} 
                     className="absolute w-full border-t border-gray-600" 
                     style={{ top: `${i * 5}%` }} />
              ))}
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={`v-${i}`} 
                     className="absolute h-full border-l border-gray-600" 
                     style={{ left: `${i * 5}%` }} />
              ))}
            </div>

            {/* Pontos de interesse simulados */}
            <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-blue-600 rounded-full shadow-lg"></div>
            <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-red-600 rounded-full shadow-lg"></div>
            <div className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-yellow-600 rounded-full shadow-lg"></div>
            <div className="absolute bottom-1/4 right-1/3 w-3 h-3 bg-purple-600 rounded-full shadow-lg"></div>

            {/* Marcador de localização selecionada */}
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-full transition-all duration-200"
              style={{ 
                left: `${50 + (selectedLocation.lng - goianiaCoords.lng) * 1000}%`, 
                top: `${50 + (selectedLocation.lat - goianiaCoords.lat) * 1000}%` 
              }}
            >
              <MapPin className="h-8 w-8 text-red-600 drop-shadow-lg animate-bounce" fill="currentColor" />
            </div>

            {/* Instruções */}
            <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 rounded-lg p-3 shadow-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Clique no mapa para selecionar sua localização
              </p>
            </div>

            {/* Controles */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-white/90 hover:bg-white"
                onClick={handleUseCurrentLocation}
              >
                <Navigation className="h-4 w-4 mr-1" />
                Minha Localização
              </Button>
            </div>
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