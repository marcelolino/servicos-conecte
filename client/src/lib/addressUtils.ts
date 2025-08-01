// Utility functions for parsing and extracting address components

// Brazilian states mapping for accurate state detection
const brazilianStates = {
  'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
  'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES',
  'Goiás': 'GO', 'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
  'Minas Gerais': 'MG', 'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR',
  'Pernambuco': 'PE', 'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
  'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC',
  'São Paulo': 'SP', 'Sergipe': 'SE', 'Tocantins': 'TO'
};

export interface AddressComponents {
  city: string;
  state: string;
  cep?: string;
}

/**
 * Extracts city, state, and CEP from a formatted address string
 * Works with OpenStreetMap/Nominatim formatted addresses
 */
export function extractAddressComponents(address: string): AddressComponents {
  const parts = address.split(',').map(part => part.trim());
  
  let city = '';
  let state = '';
  let cep = '';
  
  // Extract CEP (format: XXXXX-XXX or XXXXXXXX)
  for (const part of parts) {
    const cepMatch = part.match(/\b\d{5}-?\d{3}\b/);
    if (cepMatch) {
      // Manter o formato com hífen se já existir, senão adicionar
      const rawCep = cepMatch[0];
      cep = rawCep.includes('-') ? rawCep : rawCep.replace(/(\d{5})(\d{3})/, '$1-$2');
      break;
    }
  }
  
  // Extract state - first check for full state names, then abbreviations
  for (const part of parts) {
    const cleanPart = part.trim();
    
    // Check for exact state name match
    for (const [stateName, stateCode] of Object.entries(brazilianStates)) {
      if (cleanPart.toLowerCase() === stateName.toLowerCase()) {
        state = stateCode;
        break;
      }
      // Check if part starts with state name
      if (cleanPart.toLowerCase().startsWith(stateName.toLowerCase())) {
        state = stateCode;
        break;
      }
    }
    
    // If no full name match, check for state abbreviations
    if (!state) {
      for (const stateCode of Object.values(brazilianStates)) {
        if (cleanPart.toUpperCase() === stateCode || cleanPart.toUpperCase().includes(` ${stateCode}`)) {
          state = stateCode;
          break;
        }
      }
    }
    if (state) break;
  }
  
  // Extract city - usually the main city name before regions/geographic areas
  if (parts.length >= 2) {
    // Look for the main city name (avoid geographic regions)
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      
      // Skip if it's a region description
      if (part.toLowerCase().includes('região')) continue;
      if (part.toLowerCase().includes('centro-oeste')) continue;
      if (part.toLowerCase().includes('nordeste')) continue;
      if (part.toLowerCase().includes('sudeste')) continue;
      if (part.toLowerCase().includes('sul')) continue;
      if (part.toLowerCase().includes('norte')) continue;
      if (part.toLowerCase().includes('geográfica')) continue;
      if (part.toLowerCase().includes('brasil')) continue;
      
      // Skip CEP and state
      if (part.match(/\b\d{5}-?\d{3}\b/)) continue;
      if (Object.values(brazilianStates).includes(part.toUpperCase())) continue;
      if (Object.keys(brazilianStates).some(name => part.toLowerCase() === name.toLowerCase())) continue;
      
      // If it looks like a city name (not a street or neighborhood), use it
      if (!part.match(/^(rua|avenida|av\.|r\.|travessa|praça|largo|estrada)/i) && 
          !part.match(/^\d+/) && 
          part.length > 2 &&
          !part.toLowerCase().includes('setor') &&
          !part.toLowerCase().includes('vila') &&
          !part.toLowerCase().includes('jardim') &&
          !part.toLowerCase().includes('bairro')) {
        city = part;
        break;
      }
    }
    
    // Fallback: use a likely city name from the address parts
    if (!city) {
      // Look for Goiânia, São Paulo, Rio de Janeiro, etc.
      for (const part of parts) {
        if (part.match(/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç\s]+$/)) {
          // Skip obvious non-city parts
          if (!part.toLowerCase().includes('região') && 
              !part.toLowerCase().includes('setor') &&
              !part.match(/^\d/) &&
              part.length > 3) {
            city = part;
            break;
          }
        }
      }
    }
    
    // Last resort: clean up the first reasonable part
    if (!city && parts.length > 1) {
      city = parts[1].replace(/,.*$/, '').trim();
    }
  }
  
  // Final cleanup
  city = city.replace(/,.*$/, '').trim();
  
  return { 
    city: city || 'Cidade não identificada', 
    state: state || 'N/A',
    cep: cep || ''
  };
}

/**
 * Legacy function for extracting city and state with simpler logic
 * Used for backward compatibility
 */
export function extractCityState(address: string): { city: string; state: string } {
  const components = extractAddressComponents(address);
  return {
    city: components.city,
    state: components.state
  };
}