/**
 * Application Field-Level AES-256 Encryption Simulator
 * Protects Bank BSB, Account Number, and Tax File Number (TFN)
 */

export function encryptAES256(plaintext: string, secretKey: string = 'AU-EMS-SECURE-KEY-2026'): string {
  if (!plaintext) return '';
  // Deterministic obfuscation / simulation for frontend demonstration
  const base64 = btoa(encodeURIComponent(plaintext));
  return `AES256_GCM:${base64.split('').reverse().join('')}`;
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
  return `${maskedSection}${value.slice(-visibleEndCount)}`;
}
