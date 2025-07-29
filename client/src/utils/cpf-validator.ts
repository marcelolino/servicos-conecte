/**
 * Validates Brazilian CPF (Cadastro de Pessoas Físicas)
 * CPF is an 11-digit number with specific validation rules
 */

// Remove all non-digit characters
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

// Format CPF with dots and dash (xxx.xxx.xxx-xx)
export function formatCPF(cpf: string): string {
  const clean = cleanCPF(cpf);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

// Validate CPF using official algorithm
export function validateCPF(cpf: string): boolean {
  const clean = cleanCPF(cpf);
  
  // Must have exactly 11 digits
  if (clean.length !== 11) return false;
  
  // Cannot be all same digits (like 111.111.111-11)
  if (/^(\d)\1{10}$/.test(clean)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(clean[9])) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(clean[10])) return false;
  
  return true;
}

// Generate a valid CPF for testing purposes
export function generateValidCPF(): string {
  // Generate first 9 digits randomly
  const digits = [];
  for (let i = 0; i < 9; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }
  
  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  digits.push(remainder);
  
  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  digits.push(remainder);
  
  return formatCPF(digits.join(''));
}

// Get CPF validation error message
export function getCPFErrorMessage(cpf: string): string | null {
  const clean = cleanCPF(cpf);
  
  if (!cpf.trim()) return 'CPF é obrigatório';
  if (clean.length !== 11) return 'CPF deve ter 11 dígitos';
  if (/^(\d)\1{10}$/.test(clean)) return 'CPF não pode ter todos os dígitos iguais';
  if (!validateCPF(cpf)) return 'CPF inválido';
  
  return null;
}