import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LocationContextType {
  selectedCity: { city: string; state: string } | null;
  setSelectedCity: (location: { city: string; state: string } | null) => void;
  isLocationSet: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [selectedCity, setSelectedCityState] = useState<{ city: string; state: string } | null>(null);

  useEffect(() => {
    // Carregar cidade salva do localStorage
    const savedCity = localStorage.getItem('selectedCity');
    if (savedCity) {
      try {
        const cityData = JSON.parse(savedCity);
        setSelectedCityState(cityData);
      } catch (error) {
        console.error('Erro ao carregar cidade salva:', error);
      }
    }
  }, []);

  const setSelectedCity = (location: { city: string; state: string } | null) => {
    setSelectedCityState(location);
    if (location) {
      localStorage.setItem('selectedCity', JSON.stringify(location));
    } else {
      localStorage.removeItem('selectedCity');
    }
  };

  return (
    <LocationContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        isLocationSet: !!selectedCity,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}