import { useState, useEffect, useRef } from 'react';
import { X, Navigation, MapPin, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoogleMapModalProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  onClose: () => void;
}

export function GoogleMapModal({ onLocationSelect, onClose }: GoogleMapModalProps) {
  const [selectedAddress, setSelectedAddress] = useState("Av. Goiás, 123 - Centro, Goiânia - GO, 74015-010, Brazil");
  const mapRef = useRef<HTMLDivElement>(null);

  const handleMapClick = () => {
    // Simular mudança de endereço ao clicar no mapa
    const addresses = [
      "Av. Goiás, 123 - Centro, Goiânia - GO, 74015-010, Brazil",
      "R. 8, 456 - Setor Central, Goiânia - GO, 74030-020, Brazil", 
      "Av. Anhanguera, 789 - Setor Norte, Goiânia - GO, 74110-010, Brazil",
      "R. 3 Q R, 0 - Vila Isaura, Goiânia - GO, 74653-050, Brazil",
      "R. T-27, 123 - Setor Bueno, Goiânia - GO, 74210-040, Brazil"
    ];
    
    const randomAddress = addresses[Math.floor(Math.random() * addresses.length)];
    setSelectedAddress(randomAddress);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
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
      lat: -16.6869,
      lng: -49.2648,
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

        {/* Map Area com Google Maps */}
        <div className="flex-1 relative">
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
            
            {/* Overlay para clique */}
            <div 
              className="absolute inset-0 cursor-pointer"
              onClick={handleMapClick}
              style={{ backgroundColor: 'transparent' }}
            >
              {/* Instruções */}
              <div className="absolute top-4 left-4 bg-white/95 rounded-lg p-2 shadow-lg">
                <p className="text-xs text-gray-700 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Arraste para mover o mapa, clique para selecionar
                </p>
              </div>

              {/* Controles */}
              <div className="absolute top-4 right-4 flex flex-col gap-1">
                <button 
                  className="bg-white hover:bg-gray-50 border border-gray-300 rounded p-1 shadow-sm text-xs flex items-center gap-1"
                  onClick={handleUseCurrentLocation}
                >
                  <Navigation className="h-3 w-3" />
                  Minha Localização
                </button>
                
                <button 
                  className="bg-white hover:bg-gray-50 border border-gray-300 rounded p-1 shadow-sm text-xs flex items-center gap-1"
                  onClick={() => setSelectedAddress("Av. Goiás, 123 - Centro, Goiânia - GO, 74015-010, Brazil")}
                >
                  <RotateCcw className="h-3 w-3" />
                  Centralizar
                </button>
              </div>

              {/* Marcador central fixo */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-10">
                <div className="relative">
                  <div className="w-5 h-5 bg-red-600 rounded-full border-2 border-white shadow-lg"></div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-red-600"></div>
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
            Confirmar Localização
          </Button>
        </div>
      </div>
    </div>
  );
}