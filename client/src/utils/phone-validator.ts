/**
 * Validates Brazilian phone numbers
 * Supports both landline (10 digits) and mobile (11 digits) numbers
 */

// Remove all non-digit characters
export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

// Format phone with parentheses and dash ((xx) xxxxx-xxxx or (xx) xxxx-xxxx)
export function formatPhone(phone: string): string {
  const clean = cleanPhone(phone);
  
  if (clean.length <= 2) return clean;
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length <= 10) {
    // Landline format: (xx) xxxx-xxxx
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  } else {
    // Mobile format: (xx) xxxxx-xxxx
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
  }
}

// Validate Brazilian phone number
export function validatePhone(phone: string): boolean {
  const clean = cleanPhone(phone);
  
  // Must have 10 digits (landline) or 11 digits (mobile)
  if (clean.length !== 10 && clean.length !== 11) return false;
  
  // First two digits must be a valid area code (11-99)
  const areaCode = parseInt(clean.slice(0, 2));
  if (areaCode < 11 || areaCode > 99) return false;
  
  // For mobile numbers (11 digits), the third digit must be 9
  if (clean.length === 11 && clean[2] !== '9') return false;
  
  // For landline numbers (10 digits), the third digit cannot be 0 or 1
  if (clean.length === 10 && (clean[2] === '0' || clean[2] === '1')) return false;
  
  return true;
}

// Get phone validation error message
export function getPhoneErrorMessage(phone: string): string | null {
  const clean = cleanPhone(phone);
  
  if (!phone.trim()) return 'Telefone é obrigatório';
  if (clean.length < 10) return 'Telefone deve ter pelo menos 10 dígitos';
  if (clean.length > 11) return 'Telefone deve ter no máximo 11 dígitos';
  if (!validatePhone(phone)) return 'Número de telefone inválido';
  
  return null;
}

// Check if phone format looks like mobile (11 digits starting with 9)
export function isMobilePhone(phone: string): boolean {
  const clean = cleanPhone(phone);
  return clean.length === 11 && clean[2] === '9';
}

// Check if phone format looks like landline (10 digits)
export function isLandlinePhone(phone: string): boolean {
  const clean = cleanPhone(phone);
  return clean.length === 10;
}