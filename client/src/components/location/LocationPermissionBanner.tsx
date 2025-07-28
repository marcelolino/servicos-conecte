import { useState, useEffect } from 'react';
import { MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LocationPermissionBannerProps {
  onLocationPermission: (granted: boolean) => void;
}

export function LocationPermissionBanner({ onLocationPermission }: LocationPermissionBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar se já pedimos permissão antes
    const hasAskedPermission = localStorage.getItem('locationPermissionAsked');
    const hasLocation = localStorage.getItem('userLocation');
    
    // Só mostrar se nunca perguntamos e não temos localização salva
    if (!hasAskedPermission && !hasLocation) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000); // Aparecer após 2 segundos
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handlePermission = (granted: boolean) => {
    localStorage.setItem('locationPermissionAsked', 'true');
    setIsVisible(false);
    onLocationPermission(granted);
  };

  const handleBlock = () => {
    handlePermission(false);
  };

  const handleOnlyOnce = () => {
    handlePermission(false);
  };

  const handleAllow = () => {
    handlePermission(true);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 text-white rounded-lg shadow-xl p-4 max-w-sm w-full mx-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-sm">Qammart-react.6amtech.com quer</p>
            <p className="text-sm opacity-75">Saiba sua localização</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white p-1 h-auto"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs bg-transparent border-gray-600 text-white hover:bg-gray-700"
          onClick={handleBlock}
        >
          Bloquear
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs bg-transparent border-gray-600 text-white hover:bg-gray-700"
          onClick={handleOnlyOnce}
        >
          Somente dessa vez
        </Button>
        <Button
          size="sm"
          className="flex-1 text-xs bg-blue-600 hover:bg-blue-700"
          onClick={handleAllow}
        >
          Permitir
        </Button>
      </div>
    </div>
  );
}