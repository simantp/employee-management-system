const fs = require('fs');
const path = require('path');

const root = 'C:\\Users\\siman\\.gemini\\antigravity\\scratch\\employee-management-system';
const src = path.join(root, 'src');

function write(relPath, content) {
  const fullPath = path.join(src, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log('Wrote:', relPath);
}

// ==========================================
// UTILS (src/lib/utils.ts)
// ==========================================
write('lib/utils.ts', `
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

export function formatSydneyDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function getSydneyTimeParts(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  
  const parts = formatter.formatToParts(date);
  const find = (type: string) => parts.find(p => p.type === type)?.value || '';
  
  const hour24Formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    hour: 'numeric',
    hour12: false,
  });
  const hour24 = parseInt(hour24Formatter.format(date), 10);
  
  return {
    timeString: \`\${find('hour')}:\${find('minute')}:\${find('second')} \${find('dayPeriod')}\`,
    dateString: \`\${find('weekday')}, \${find('day')} \${find('month')} \${find('year')}\`,
    hour24,
    isBefore7AM: hour24 < 7,
  };
}

export function validateAUBSB(bsb: string): boolean {
  // Accepts "123-456" or "123456"
  const clean = bsb.replace(/[^0-9]/g, '');
  return clean.length === 6;
}

export function formatBSB(bsb: string): string {
  const clean = bsb.replace(/[^0-9]/g, '');
  if (clean.length <= 3) return clean;
  return \`\${clean.slice(0, 3)}-\${clean.slice(3, 6)}\`;
}

export function validateTFN(tfn: string): boolean {
  const clean = tfn.replace(/[^0-9]/g, '');
  return clean.length === 8 || clean.length === 9;
}

export function parseDateAU(dateStr: string): Date | null {
  // expects DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  const d1 = parseDateAU(startDateStr);
  const d2 = parseDateAU(endDateStr);
  if (!d1 || !d2) return 1;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function getDaysUntil(targetDateStr: string): number {
  const target = parseDateAU(targetDateStr);
  if (!target) return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
`);

// ==========================================
// CRYPTO (src/lib/crypto.ts)
// ==========================================
write('lib/crypto.ts', `
/**
 * Application Field-Level AES-256 Encryption Simulator
 * Protects Bank BSB, Account Number, and Tax File Number (TFN)
 */

export function encryptAES256(plaintext: string, secretKey: string = 'AU-EMS-SECURE-KEY-2026'): string {
  if (!plaintext) return '';
  // Deterministic obfuscation / simulation for frontend demonstration
  const base64 = btoa(encodeURIComponent(plaintext));
  return \`AES256_GCM:\${base64.split('').reverse().join('')}\`;
}

export function decryptAES256(ciphertext: string, secretKey: string = 'AU-EMS-SECURE-KEY-2026'): string {
  if (!ciphertext || !ciphertext.startsWith('AES256_GCM:')) return ciphertext;
  try {
    const reversed = ciphertext.replace('AES256_GCM:', '').split('').reverse().join('');
    return decodeURIComponent(atob(reversed));
  } catch (err) {
    return '*** Decryption Error ***';
  }
}

export function maskSensitive(value: string, visibleEndCount: number = 4): string {
  if (!value) return '';
  if (value.length <= visibleEndCount) return value;
  const maskedSection = '•'.repeat(value.length - visibleEndCount);
  return \`\${maskedSection}\${value.slice(-visibleEndCount)}\`;
}
`);

console.log('Utils and Crypto written successfully');
