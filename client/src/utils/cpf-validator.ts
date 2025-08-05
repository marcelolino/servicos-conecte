/**
 * Validates Brazilian CPF (Cadastro de Pessoas Físicas) and CNPJ (Cadastro Nacional da Pessoa Jurídica)
 * CPF is an 11-digit number and CNPJ is a 14-digit number with specific validation rules
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

// CNPJ validation functions
export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

// Format CNPJ with dots, slash and dash (xx.xxx.xxx/xxxx-xx)
export function formatCNPJ(cnpj: string): string {
  const clean = cleanCNPJ(cnpj);
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
  if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
  if (clean.length <= 12) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
}

// Validate CNPJ using official algorithm
export function validateCNPJ(cnpj: string): boolean {
  const clean = cleanCNPJ(cnpj);
  
  // Must have exactly 14 digits
  if (clean.length !== 14) return false;
  
  // Cannot be all same digits
  if (/^(\d)\1{13}$/.test(clean)) return false;
  
  // Validate first check digit
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;
  if (firstDigit !== parseInt(clean[12])) return false;
  
  // Validate second check digit
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(clean[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;
  if (secondDigit !== parseInt(clean[13])) return false;
  
  return true;
}

// Validate CPF or CNPJ
export function validateCpfCnpj(document: string): boolean {
  const clean = document.replace(/\D/g, '');
  
  if (clean.length === 11) {
    return validateCPF(document);
  } else if (clean.length === 14) {
    return validateCNPJ(document);
  }
  
  return false;
}

// Format CPF or CNPJ automatically
export function formatCpfCnpj(document: string): string {
  const clean = document.replace(/\D/g, '');
  
  if (clean.length <= 11) {
    return formatCPF(document);
  } else {
    return formatCNPJ(document);
  }
}

// Get CPF or CNPJ validation error message
export function getCpfCnpjErrorMessage(document: string): string | null {
  const clean = document.replace(/\D/g, '');
  
  if (!document.trim()) return 'CPF/CNPJ é obrigatório';
  if (clean.length !== 11 && clean.length !== 14) return 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos';
  if (/^(\d)\1{10}$/.test(clean) || /^(\d)\1{13}$/.test(clean)) return 'CPF/CNPJ não pode ter todos os dígitos iguais';
  if (!validateCpfCnpj(document)) return 'CPF/CNPJ inválido';
  
  return null;
}