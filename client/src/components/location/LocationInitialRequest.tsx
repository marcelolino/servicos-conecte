import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RegisterWithLocationFlow } from "@/components/auth/RegisterWithLocationFlow";
import { MapPin, X } from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";

interface LocationInitialRequestProps {
  onLocationGranted?: (location: { lat: number; lng: number; address: string }) => void;
}

interface LocationInitialRequestWithRegisterProps extends LocationInitialRequestProps {
  showRegisterAfterLocation?: boolean;
}

export function LocationInitialRequest({ onLocationGranted }: LocationInitialRequestProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [detectedLocationData, setDetectedLocationData] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const { setSelectedCity } = useLocation();

  useEffect(() => {
    const checkAndShowLocationRequest = async () => {
      // Verificar se já pedimos permissão antes
      const hasAskedPermission = localStorage.getItem('locationPermissionAsked');
      const hasLocation = localStorage.getItem('selectedCity') || localStorage.getItem('userLocation');
      
      // Verificar permissão atual do browser
      let hasGeolocationPermission = false;
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          hasGeolocationPermission = permission.state === 'granted';
        } catch (error) {
          console.log('Permission API not supported');
        }
      }

      // Mostrar modal se nunca perguntamos e não temos localização ou permissão
      if (!hasAskedPermission && !hasLocation && !hasGeolocationPermission) {
        // Aguardar um pouco para a página carregar
        setTimeout(() => {
          setIsOpen(true);
        }, 1500);
      }
    };

    checkAndShowLocationRequest();
  }, []);

  const handleLocationRequest = () => {
    setIsRequestingLocation(true);
    
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador');
      setIsRequestingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Fazer reverse geocoding para obter o endereço
        reverseGeocode(latitude, longitude)
          .then((address) => {
            // Processar endereço para extrair dados estruturados
            const addressParts = address.split(',').map(part => part.trim());
            
            let street = '';
            let city = '';
            let state = '';
            
            // Extrair informações mais organizadas
            if (addressParts.length >= 3) {
              street = addressParts[0] || '';
              
              // Mapeamento de estados para suas siglas
              const stateMapping = {
                'goiás': 'GO', 'goias': 'GO',
                'são paulo': 'SP', 'sao paulo': 'SP',
                'rio de janeiro': 'RJ',
                'minas gerais': 'MG',
                'bahia': 'BA',
                'paraná': 'PR', 'parana': 'PR',
                'rio grande do sul': 'RS',
                'pernambuco': 'PE',
                'ceará': 'CE', 'ceara': 'CE',
                'pará': 'PA', 'para': 'PA',
                'santa catarina': 'SC',
                'maranhão': 'MA', 'maranhao': 'MA',
                'paraíba': 'PB', 'paraiba': 'PB',
                'espírito santo': 'ES', 'espirito santo': 'ES',
                'piauí': 'PI', 'piaui': 'PI',
                'alagoas': 'AL',
                'rio grande do norte': 'RN',
                'mato grosso': 'MT',
                'mato grosso do sul': 'MS',
                'distrito federal': 'DF',
                'sergipe': 'SE',
                'rondônia': 'RO', 'rondonia': 'RO',
                'acre': 'AC',
                'amazonas': 'AM',
                'roraima': 'RR',
                'amapá': 'AP', 'amapa': 'AP',
                'tocantins': 'TO'
              };

              // Procurar por cidade e estado nas partes do endereço
              for (let i = addressParts.length - 1; i >= 0; i--) {
                const part = addressParts[i].replace(/,?\s*Brasil$/, '').trim().toLowerCase();
                
                // Procurar por estado usando o mapeamento
                for (const [stateName, stateCode] of Object.entries(stateMapping)) {
                  if (!state && part.includes(stateName)) {
                    state = stateCode;
                    break;
                  }
                }
                
                // Se encontrou estado, procurar cidade na parte anterior
                if (!city && state && i > 0 && addressParts[i-1]) {
                  const cityCandidate = addressParts[i-1].trim();
                  // Verificar se não é uma região geográfica
                  if (!cityCandidate.toLowerCase().includes('região') && 
                      !cityCandidate.toLowerCase().includes('imediata') &&
                      !cityCandidate.toLowerCase().includes('intermediária')) {
                    city = cityCandidate;
                  }
                }
              }
              
              // Fallback se não encontrou cidade/estado
              if (!city && addressParts.length >= 2) {
                city = addressParts[addressParts.length - 2] || '';
              }
              if (!state && addressParts.length >= 1) {
                state = addressParts[addressParts.length - 1]?.replace(/,?\s*Brasil$/, '').trim() || '';
              }
            } else {
              street = address;
            }

            // Salvar localização estruturada
            const locationData = {
              lat: latitude,
              lng: longitude,
              address: street,
              city: city,
              state: state,
              originalAddress: address,
              isDetected: true
            };
            
            localStorage.setItem('userLocation', JSON.stringify(locationData));
            localStorage.setItem('locationPermissionAsked', 'granted');
            
            setDetectedLocationData(locationData);
            
            if (onLocationGranted) {
              onLocationGranted(locationData);
            }
            
            setIsOpen(false);
            setIsRequestingLocation(false);
            
            // Don't show register modal automatically, it's now in the register page
          })
          .catch(() => {
            // Fallback sem reverse geocoding
            const locationData = {
              lat: latitude,
              lng: longitude,
              address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            };
            
            localStorage.setItem('userLocation', JSON.stringify(locationData));
            localStorage.setItem('locationPermissionAsked', 'granted');
            
            if (onLocationGranted) {
              onLocationGranted(locationData);
            }
            
            setIsOpen(false);
            setIsRequestingLocation(false);
          });
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        localStorage.setItem('locationPermissionAsked', 'denied');
        setIsOpen(false);
        setIsRequestingLocation(false);
        
        // Se o usuário negou, mostrar uma mensagem amigável
        if (error.code === error.PERMISSION_DENIED) {
          // Não mostrar alert, apenas fechar silenciosamente
          console.log('Usuário negou permissão de localização');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Usar serviço de geocoding gratuito
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
    } catch (error) {
      console.error('Erro no reverse geocoding:', error);
    }
    
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const handleBlock = () => {
    localStorage.setItem('locationPermissionAsked', 'blocked');
    setIsOpen(false);
  };

  const handleOnlyOnce = () => {
    localStorage.setItem('locationPermissionAsked', 'once');
    handleLocationRequest();
  };

  const handleAllow = () => {
    localStorage.setItem('locationPermissionAsked', 'granted');
    handleLocationRequest();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[425px] p-0 gap-0 bg-slate-800 border-slate-700 text-white">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-slate-300">
                  {window.location.host.includes('replit.dev') ? window.location.host : 'Qserviços'} quer
                </p>
                <p className="text-sm font-medium">Saber sua localização</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBlock}
              className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-4">
            <div className="flex justify-between gap-2">
              <Button
                variant="ghost"
                onClick={handleBlock}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white border-0"
                disabled={isRequestingLocation}
              >
                Bloquear
              </Button>
              <Button
                variant="ghost"
                onClick={handleOnlyOnce}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white border-0"
                disabled={isRequestingLocation}
              >
                {isRequestingLocation ? 'Obtendo...' : 'Somente dessa vez'}
              </Button>
              <Button
                onClick={handleAllow}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-0"
                disabled={isRequestingLocation}
              >
                {isRequestingLocation ? 'Obtendo...' : 'Permitir'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Modal - Only shown when explicitly requested */}
      {showRegister && (
        <RegisterWithLocationFlow
          isOpen={showRegister}
          onClose={() => setShowRegister(false)}
          onComplete={(userData) => {
            console.log('Registration completed:', userData);
            setShowRegister(false);
          }}
          detectedLocation={detectedLocationData}
        />
      )}
    </>
  );
}