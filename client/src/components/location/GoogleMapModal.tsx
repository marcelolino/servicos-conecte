import { useState, useEffect, useRef } from 'react';
import { X, Navigation, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoogleMapModalProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  onClose: () => void;
}

export function GoogleMapModal({ onLocationSelect, onClose }: GoogleMapModalProps) {
  const [selectedLocation, setSelectedLocation] = useState({ lat: -16.6869, lng: -49.2648 });
  const [selectedAddress, setSelectedAddress] = useState("R. Iracema, 278 - Vila Romana, Goiânia - GO, 74656-005, Brazil");
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);

  useEffect(() => {
    // Simular Google Maps com iframe embed
    // Em produção, seria necessário usar a Google Maps JavaScript API
    
    // Para demonstração, vou criar uma versão que simula o comportamento do Google Maps
    initializeMap();
  }, []);

  const initializeMap = () => {
    // Simular inicialização do Google Maps
    console.log('Inicializando Google Maps...');
  };

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Converter coordenadas de pixel para lat/lng
    const lat = -16.6869 + (y / rect.height - 0.5) * 0.01;
    const lng = -49.2648 + (x / rect.width - 0.5) * 0.01;
    
    setSelectedLocation({ lat, lng });
    
    // Simular busca de endereço
    const addresses = [
      "R. Iracema, 278 - Vila Romana, Goiânia - GO, 74656-005, Brazil",
      "Av. Goiás, 123 - Centro, Goiânia - GO, 74015-010, Brazil",
      "R. 8, 456 - Setor Central, Goiânia - GO, 74030-020, Brazil",
      "Av. Anhanguera, 789 - Setor Norte, Goiânia - GO, 74110-010, Brazil",
      "R. 3 Q R, 0 - Vila Isaura, Goiânia - GO, 74653-050, Brazil"
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
              {selectedAddress}
            </p>
          </div>
        </div>

        {/* Map Area com Google Maps Embed */}
        <div className="flex-1 relative">
          {/* Usar iframe do Google Maps para demonstração */}
          <div className="w-full h-full relative">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3822.6!2d-49.2648!3d-16.6869!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTbCsDQxJzEyLjgiUyA0OcKwMTUnNTMuMyJX!5e0!3m2!1spt-BR!2sbr!4v1647875000000!5m2!1spt-BR!2sbr"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Maps"
              className="rounded-lg"
            />
            
            {/* Overlay clicável para simular seleção */}
            <div 
              className="absolute inset-0 cursor-crosshair"
              onClick={handleMapClick}
              style={{ backgroundColor: 'transparent' }}
            >
              {/* Instruções */}
              <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-800/95 rounded-lg p-3 shadow-lg max-w-xs">
                <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Clique no mapa para selecionar sua localização
                </p>
              </div>

              {/* Controles */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white/95 hover:bg-white shadow-lg"
                  onClick={handleUseCurrentLocation}
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Minha Localização
                </Button>
              </div>

              {/* Marcador central fixo do Google Maps */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-10 pointer-events-none">
                <div className="relative">
                  <div className="w-6 h-6 bg-red-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-600"></div>
                </div>
              </div>
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
            Localizar no mapa
          </Button>
        </div>
      </div>
    </div>
  );
}