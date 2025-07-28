import { useState, useEffect } from 'react';
import { MapPin, X, Search, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GoogleMapModal } from './GoogleMapModal';

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
      <GoogleMapModal 
        onLocationSelect={(location) => {
          onLocationSet(location);
          onClose();
        }}
        onClose={() => setShowMap(false)}
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