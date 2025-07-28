import { useState, useEffect } from 'react';
import { MapPin, X, Search, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddressSearchModal } from './AddressSearchModal';

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
    setShowMap(true);
  };

  const handleMapSelection = () => {
    setShowMap(true);
  };

  if (showMap) {
    return (
      <AddressSearchModal 
        onLocationSelect={(location) => {
          onLocationSet(location);
          onClose();
        }}
        onClose={() => setShowMap(false)}
        initialQuery={searchQuery}
      />
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
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-red-600" />
            <Input
              placeholder="Digite seu endereço..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-20"
              onKeyPress={(e) => e.key === 'Enter' && handleMapSelection()}
            />
            <Button 
              className="absolute right-1 top-1 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 h-8"
              onClick={handleMapSelection}
            >
              Buscar
            </Button>
          </div>
          
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleGeolocation}
              disabled={isLocating}
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isLocating ? 'Localizando...' : 'Usar minha localização atual'}
            </Button>
            
            <Button 
              variant="outline"
              className="w-full justify-start"
              onClick={handleMapSelection}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Escolher no mapa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}