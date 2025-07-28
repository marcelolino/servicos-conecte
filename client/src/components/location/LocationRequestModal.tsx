import { useState, useEffect } from 'react';
import { MapPin, X, Search, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LocationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet: (location: { lat: number; lng: number; address: string }) => void;
}

export function LocationRequestModal({ isOpen, onClose, onLocationSet }: LocationRequestModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const handleGeolocation = () => {
    setIsLocating(true);
    
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Simulando busca de endereço (em produção usaria Google Maps Geocoding API)
        const mockAddress = `R. 3 Q R, 0 - Vila Isaura, Goiânia - GO, 74653-050, Brazil`;
        
        onLocationSet({
          lat: latitude,
          lng: longitude,
          address: mockAddress
        });
        
        setIsLocating(false);
        onClose();
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        alert('Não foi possível obter sua localização. Tente pesquisar manualmente.');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    // Simulando busca de endereço
    const mockResult = {
      lat: -16.6869,
      lng: -49.2648,
      address: searchQuery
    };
    
    onLocationSet(mockResult);
    onClose();
  };

  const handleMapSelection = () => {
    setShowMap(true);
  };

  if (showMap) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] p-0">
          <div className="relative h-[600px] bg-gray-900 rounded-lg overflow-hidden">
            <div className="absolute top-4 left-4 right-4 z-10">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
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
                    4B Kamal Ataturk Ave, Dhaka 1212, Bangladesh
                  </p>
                </div>
              </div>
            </div>
            
            {/* Simulação do mapa */}
            <div className="w-full h-full bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center">
              <div className="text-center text-white">
                <MapPin className="h-16 w-16 mx-auto mb-4 text-green-400" />
                <p className="text-lg font-semibold">Mapa Interativo</p>
                <p className="text-sm opacity-75">Clique para selecionar sua localização</p>
                <Button 
                  className="mt-4 bg-green-600 hover:bg-green-700" 
                  onClick={() => {
                    onLocationSet({
                      lat: -16.6869,
                      lng: -49.2648,
                      address: "4B Kamal Ataturk Ave, Dhaka 1212, Bangladesh"
                    });
                    onClose();
                  }}
                >
                  Confirmar Localização
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            Saiba sua localização
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Pesquise o local aqui..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 justify-start"
              onClick={handleGeolocation}
              disabled={isLocating}
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isLocating ? 'Localizando...' : 'Localize-me'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleMapSelection}
            >
              Escolher no mapa
            </Button>
          </div>
          
          <Button 
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
          >
            Explorar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}