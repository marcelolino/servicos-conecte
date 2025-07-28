import { useState, useEffect, useRef } from 'react';
import { X, Navigation, Target, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoogleMapModalProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  onClose: () => void;
}

export function GoogleMapModal({ onLocationSelect, onClose }: GoogleMapModalProps) {
  const [selectedLocation, setSelectedLocation] = useState({ lat: -16.6869, lng: -49.2648 });
  const [selectedAddress, setSelectedAddress] = useState("R. Iracema, 278 - Vila Romana, Goiânia - GO, 74656-005, Brazil");
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

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
    if (isDragging) return; // Não selecionar se estiver arrastando
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Converter coordenadas de pixel para lat/lng considerando a posição do mapa
    const lat = -16.6869 + ((y - mapPosition.y) / rect.height - 0.5) * 0.01 / zoom;
    const lng = -49.2648 + ((x - mapPosition.x) / rect.width - 0.5) * 0.01 / zoom;
    
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

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({
      x: event.clientX - mapPosition.x,
      y: event.clientY - mapPosition.y
    });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const newX = event.clientX - dragStart.x;
    const newY = event.clientY - dragStart.y;
    
    // Limitar o movimento do mapa
    const maxMove = 100;
    const limitedX = Math.max(-maxMove, Math.min(maxMove, newX));
    const limitedY = Math.max(-maxMove, Math.min(maxMove, newY));
    
    setMapPosition({ x: limitedX, y: limitedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
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

        {/* Map Area com Google Maps Interativo */}
        <div className="flex-1 relative overflow-hidden">
          {/* Container do mapa com movimento */}
          <div 
            className="w-full h-full relative"
            style={{
              transform: `translate(${mapPosition.x}px, ${mapPosition.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out'
            }}
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3822.6!2d-49.2648!3d-16.6869!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTbCsDQxJzEyLjgiUyA0OcKwMTUnNTMuMyJX!5e0!3m2!1spt-BR!2sbr!4v1647875000000!5m2!1spt-BR!2sbr"
              width="120%"
              height="120%"
              style={{ border: 0, marginLeft: '-10%', marginTop: '-10%' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Maps"
              className="rounded-lg"
            />
          </div>
            
          {/* Overlay interativo para arrastar e selecionar */}
          <div 
            className={`absolute inset-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleMapClick}
            onWheel={handleWheel}
            style={{ backgroundColor: 'transparent' }}
          >
            {/* Instruções */}
            <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-800/95 rounded-lg p-3 shadow-lg max-w-xs pointer-events-none">
              <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Move className="h-4 w-4" />
                Arraste para mover o mapa, clique para selecionar
              </p>
            </div>

            {/* Controles */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-auto">
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-white/95 hover:bg-white shadow-lg"
                onClick={handleUseCurrentLocation}
              >
                <Navigation className="h-4 w-4 mr-1" />
                Minha Localização
              </Button>
              
              {/* Controles de Zoom */}
              <div className="flex flex-col bg-white/95 rounded-lg shadow-lg">
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="rounded-b-none border-b"
                  onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
                >
                  +
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="rounded-t-none"
                  onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}
                >
                  -
                </Button>
              </div>
              
              {/* Reset posição */}
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-white/95 hover:bg-white shadow-lg"
                onClick={() => {
                  setMapPosition({ x: 0, y: 0 });
                  setZoom(1);
                }}
              >
                Centralizar
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