import { useState, useEffect } from 'react';
import { MapPin, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationRequestModal } from './LocationRequestModal';
import { LocationPermissionBanner } from './LocationPermissionBanner';
import { IFoodStyleLocationPicker } from './iFoodStyleLocationPicker';
import { useLocation } from '@/contexts/LocationContext';

interface LocationCardProps {
  onLocationChange?: (location: { lat: number; lng: number; address: string } | null) => void;
}

export function LocationCard({ onLocationChange }: LocationCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIFoodModalOpen, setIsIFoodModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [shouldShow, setShouldShow] = useState(true);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const { selectedCity, setSelectedCity } = useLocation();

  // Função para extrair cidade e estado do endereço
  const formatLocationDisplay = (address: string): string => {
    try {
      // Separar por vírgula e limpar espaços
      const parts = address.split(',').map(part => part.trim());
      
      // Procurar pela parte que contém o estado (formato: Cidade - UF)
      for (const part of parts) {
        if (part.includes(' - ')) {
          const segments = part.split(' - ');
          if (segments.length === 2 && segments[1].match(/^[A-Z]{2}$/)) {
            return part.trim();
          }
        }
      }
      
      // Procurar cidade e estado em partes separadas
      let city = '';
      let state = '';
      
      // Primeiro, encontrar o estado (formato: "Nome - UF" ou só "UF")
      for (const part of parts) {
        if (part.match(/^[A-Z]{2}$/)) {
          state = part;
          break;
        } else if (part.includes(' - ') && part.match(/[A-Z]{2}$/)) {
          const segments = part.split(' - ');
          if (segments[segments.length - 1].match(/^[A-Z]{2}$/)) {
            state = segments[segments.length - 1];
            city = segments.slice(0, -1).join(' - ');
            return `${city} - ${state}`;
          }
        }
      }
      
      // Se encontrou o estado, procurar a cidade
      if (state) {
        // A cidade geralmente está na penúltima posição ou em uma posição anterior
        const statePart = parts.find(part => part.includes(state));
        const stateIndex = parts.indexOf(statePart || '');
        
        if (stateIndex > 0) {
          city = parts[stateIndex - 1];
        } else {
          // Procurar por uma parte que pareça ser uma cidade
          city = parts.find(part => 
            part.length > 2 && 
            !part.match(/^\d/) && 
            !part.includes('CEP') &&
            !part.includes('Brazil') &&
            part !== state
          ) || '';
        }
        
        if (city) {
          return `${city} - ${state}`;
        }
      }
      
      // Fallback: procurar padrões comuns
      const relevantParts = parts.filter(part => 
        part.length > 2 && 
        !part.match(/^\d/) && 
        !part.includes('CEP') &&
        !part.includes('Brazil') &&
        !part.match(/^\d{5}-?\d{3}$/) // Remove CEPs
      );
      
      if (relevantParts.length >= 2) {
        // Pegar os dois últimos elementos relevantes (provavelmente cidade e estado)
        const lastTwo = relevantParts.slice(-2);
        return lastTwo.join(' - ');
      }
      
      // Último fallback: primeiro elemento significativo
      return relevantParts[0] || parts[0] || address.substring(0, 20);
      
    } catch (error) {
      console.error('Erro ao formatar localização:', error);
      return address.length > 20 ? `${address.substring(0, 20)}...` : address;
    }
  };

  useEffect(() => {
    const checkLocationStatus = async () => {
      // Verificar se já temos localização salva
      const savedLocation = localStorage.getItem('userLocation');
      const selectedCityData = localStorage.getItem('selectedCity');
      
      if (savedLocation) {
        try {
          const location = JSON.parse(savedLocation);
          setCurrentLocation(location);
          setShouldShow(false);
          onLocationChange?.(location);
          return; // Já temos localização, não mostrar banner
        } catch (error) {
          console.error('Erro ao carregar localização salva:', error);
        }
      }

      // Se temos uma cidade selecionada, não mostrar banner
      if (selectedCityData) {
        setShouldShow(false);
        return;
      }

      // Verificar permissão do browser
      try {
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          
          // Se já foi negada permanentemente, não mostrar banner
          if (permission.state === 'denied') {
            return;
          }
          
          // Se já foi concedida, tentar obter localização automaticamente
          if (permission.state === 'granted') {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const location = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  address: `Localização atual`
                };
                handleLocationSet(location);
              },
              (error) => {
                console.error('Erro ao obter localização automática:', error);
                // Mostrar banner se falhar
                setShowPermissionBanner(true);
              }
            );
            return;
          }
        }

        // Verificar se já perguntamos antes
        const hasAskedPermission = localStorage.getItem('locationPermissionAsked');
        
        // Só mostrar banner se nunca perguntamos antes
        if (!hasAskedPermission) {
          setShowPermissionBanner(true);
        }
      } catch (error) {
        // Fallback para browsers sem suporte a navigator.permissions
        const hasAskedPermission = localStorage.getItem('locationPermissionAsked');
        if (!hasAskedPermission) {
          setShowPermissionBanner(true);
        }
      }
    };

    checkLocationStatus();
  }, [onLocationChange]);

  const handleLocationSet = (location: { lat: number; lng: number; address: string }) => {
    setCurrentLocation(location);
    localStorage.setItem('userLocation', JSON.stringify(location));
    setShouldShow(false);
    onLocationChange?.(location);
    
    // Extrair cidade e estado e salvar no contexto
    const formattedLocation = formatLocationDisplay(location.address);
    const cityStateParts = formattedLocation.split(' - ');
    if (cityStateParts.length === 2) {
      setSelectedCity({
        city: cityStateParts[0].trim(),
        state: cityStateParts[1].trim()
      });
    }
  };

  const handleClearLocation = () => {
    setCurrentLocation(null);
    localStorage.removeItem('userLocation');
    setShouldShow(true);
    onLocationChange?.(null);
    setSelectedCity(null);
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
              {formatLocationDisplay(currentLocation.address)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsIFoodModalOpen(true)}
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
        
        <IFoodStyleLocationPicker
          isOpen={isIFoodModalOpen}
          onClose={() => setIsIFoodModalOpen(false)}
          onLocationSelect={handleLocationSet}
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
              onClick={() => setIsIFoodModalOpen(true)}
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
        
        <IFoodStyleLocationPicker
          isOpen={isIFoodModalOpen}
          onClose={() => setIsIFoodModalOpen(false)}
          onLocationSelect={handleLocationSet}
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