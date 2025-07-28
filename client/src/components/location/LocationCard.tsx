import { useState, useEffect } from 'react';
import { MapPin, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationRequestModal } from './LocationRequestModal';
import { LocationPermissionBanner } from './LocationPermissionBanner';

interface LocationCardProps {
  onLocationChange?: (location: { lat: number; lng: number; address: string } | null) => void;
}

export function LocationCard({ onLocationChange }: LocationCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [shouldShow, setShouldShow] = useState(true);
  const [showPermissionBanner, setShowPermissionBanner] = useState(true);

  useEffect(() => {
    // Verificar se já temos localização salva
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setCurrentLocation(location);
        setShouldShow(false);
        onLocationChange?.(location);
      } catch (error) {
        console.error('Erro ao carregar localização salva:', error);
      }
    }
  }, [onLocationChange]);

  const handleLocationSet = (location: { lat: number; lng: number; address: string }) => {
    setCurrentLocation(location);
    localStorage.setItem('userLocation', JSON.stringify(location));
    setShouldShow(false);
    onLocationChange?.(location);
  };

  const handleClearLocation = () => {
    setCurrentLocation(null);
    localStorage.removeItem('userLocation');
    setShouldShow(true);
    onLocationChange?.(null);
  };

  const handleLocationPermission = (granted: boolean) => {
    if (granted) {
      // Solicitar localização automaticamente
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const mockAddress = `R. 3 Q R, 0 - Vila Isaura, Goiânia - GO, 74653-050, Brazil`;
            
            const location = {
              lat: latitude,
              lng: longitude,
              address: mockAddress
            };
            
            handleLocationSet(location);
          },
          (error) => {
            console.error('Erro ao obter localização:', error);
            setIsModalOpen(true); // Abrir modal manual se falhar
          }
        );
      }
    }
    setShowPermissionBanner(false);
  };

  // Se já temos localização e o card não deve aparecer, mostrar versão compacta
  if (currentLocation && !shouldShow) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200 truncate">
              {currentLocation.address.length > 50 
                ? `${currentLocation.address.substring(0, 50)}...` 
                : currentLocation.address
              }
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-green-600 hover:text-green-700 h-6 px-2"
            >
              Alterar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearLocation}
              className="text-gray-500 hover:text-gray-700 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <LocationRequestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onLocationSet={handleLocationSet}
        />
      </div>
    );
  }

  // Se não temos localização, mostrar card completo
  if (!currentLocation && shouldShow) {
    return (
      <>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Saiba sua localização
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Para encontrar os melhores serviços perto de você
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Permitir
            </Button>
          </div>
        </div>

        <LocationRequestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onLocationSet={handleLocationSet}
        />
      </>
    );
  }

  return (
    <>
      {showPermissionBanner && (
        <LocationPermissionBanner onLocationPermission={handleLocationPermission} />
      )}
    </>
  );
}