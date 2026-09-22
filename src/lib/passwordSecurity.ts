import bcrypt from 'bcryptjs';

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Validates if a string is formatted as a valid bcrypt hash.
 */
export function isBcryptHash(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  // Matches $2a$, $2b$, $2y$ standard bcrypt formats with cost 10-31
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value.trim());
}

/**
 * Hashes a plaintext password using bcrypt with adaptive cost factor 12 and cryptographic salt.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Invalid password provided for hashing.');
  }
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Verifies a plaintext password against a stored hash (or legacy plaintext during migration).
 * Returns whether the password matches and if it needs an automatic upgrade/re-hash.
 */
export async function verifyPassword(
  plainPassword: string,
  storedHashOrPlain?: string | null
): Promise<{ isValid: boolean; needsRehash: boolean }> {
  if (!plainPassword || !storedHashOrPlain) {
    return { isValid: false, needsRehash: false };
  }

  const cleanStored = storedHashOrPlain.trim();

  // 1. If stored value is already a bcrypt hash
  if (isBcryptHash(cleanStored)) {
    try {
      const isValid = await bcrypt.compare(plainPassword, cleanStored);
      return { isValid, needsRehash: false };
    } catch {
      return { isValid: false, needsRehash: false };
    }
  }

  // 2. Legacy fallback / migration: Constant-time string comparison for legacy plain passwords
  const isMatch = timingSafeEqualString(plainPassword, cleanStored);
  return { isValid: isMatch, needsRehash: isMatch };
}

/**
 * Constant-time string comparison to defend against timing side-channel attacks.
 */
function timingSafeEqualString(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const lenA = Buffer.byteLength(a);
  const lenB = Buffer.byteLength(b);
  
  let mismatch = lenA === lenB ? 0 : 1;
  const maxLen = Math.max(lenA, lenB);
  
  const bufA = Buffer.alloc(maxLen);
  const bufB = Buffer.alloc(maxLen);
  bufA.write(a);
  bufB.write(b);

  for (let i = 0; i < maxLen; i++) {
    mismatch |= bufA[i] ^ bufB[i];
  }

  return mismatch === 0;
}

/**
 * Strips password and password hashes from user objects before returning in API responses.
 */
export function sanitizeUser<T extends Record<string, any>>(user: T): Omit<T, 'password' | 'password_hash' | 'passwordHash'> {
  if (!user) return user;
  const sanitized = { ...user };
  delete (sanitized as any).password;
  delete (sanitized as any).password_hash;
  delete (sanitized as any).passwordHash;
  return sanitized;
}
