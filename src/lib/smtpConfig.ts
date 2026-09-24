import fs from 'fs';
import path from 'path';

export interface SmtpResolvedConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  isConfigured: boolean;
  isEnvConfigured?: boolean;
  enableSmtp?: boolean;
  source: 'ENV_VARS' | 'SETTINGS_DB' | 'NONE';
}

/**
 * Reads and parses key-value pairs from an env file without throwing
 */
function readEnvFile(filepath: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    if (fs.existsSync(filepath)) {
      const content = fs.readFileSync(filepath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.substring(0, eqIdx).trim();
          let val = trimmed.substring(eqIdx + 1).trim();
          // Remove surrounding quotes
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          result[key] = val;
        }
      }
    }
  } catch (err) {
    // Silently continue if file read is not permitted
  }
  return result;
}

/**
 * Loads all environment variables from process.env and disk files (.env, .env.local, .env.production)
 */
export function getAllEnvironmentVariables(): Record<string, string> {
  const envFromDisk: Record<string, string> = {};

  try {
    const cwd = process.cwd();
    // Prioritize in order: .env.production -> .env.local -> .env
    const envPaths = [
      path.join(cwd, '.env'),
      path.join(cwd, '.env.local'),
      path.join(cwd, '.env.production')
    ];

    for (const p of envPaths) {
      const parsed = readEnvFile(p);
      Object.assign(envFromDisk, parsed);
    }
  } catch (e) {}

  // Merge process.env on top
  const combined: Record<string, string> = { ...envFromDisk };
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined && v !== null && v !== '') {
      combined[k] = v;
    }
  }

  return combined;
}

/**
 * Case-insensitive environment variable lookup with multiple alias support
 */
export function getEnvVar(env: Record<string, string>, ...keys: string[]): string {
  // First check exact matches
  for (const k of keys) {
    if (env[k] !== undefined && env[k] !== '') {
      return env[k].trim();
    }
  }

  // Second check case-insensitive and stripped underscores/hyphens
  const normalizedEnv: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) {
    normalizedEnv[k.toLowerCase().replace(/[-_]/g, '')] = v;
  }

  for (const k of keys) {
    const normKey = k.toLowerCase().replace(/[-_]/g, '');
    if (normalizedEnv[normKey] !== undefined && normalizedEnv[normKey] !== '') {
      return normalizedEnv[normKey].trim();
    }
  }

  return '';
}

/**
 * Resolves SMTP configuration from environment variables (.env files and process.env)
 * with support for all standard aliases (Hostinger, cPanel, Docker, Next.js).
 */
export function getEnvSmtpConfig(): SmtpResolvedConfig | null {
  const env = getAllEnvironmentVariables();

  // 1. Host aliases (Hostinger default is smtp.hostinger.com)
  const host = getEnvVar(
    env,
    'SMTP_HOST',
    'EMAIL_HOST',
    'MAIL_HOST',
    'SMTP_SERVER',
    'MAIL_SERVER',
    'SMTPHOST'
  );

  // 2. User / Username aliases (usually the full email address)
  const user = getEnvVar(
    env,
    'SMTP_USER',
    'SMTP_USERNAME',
    'EMAIL_USER',
    'EMAIL_USERNAME',
    'MAIL_USER',
    'MAIL_USERNAME',
    'SMTPUSER'
  );

  // 3. Password aliases
  const pass = getEnvVar(
    env,
    'SMTP_PASS',
    'SMTP_PASSWORD',
    'EMAIL_PASS',
    'EMAIL_PASSWORD',
    'MAIL_PASS',
    'MAIL_PASSWORD',
    'SMTPPASSWORD',
    'SMTP_KEY'
  );

  if (!host || !user || !pass) {
    return null;
  }

  // 4. Port aliases
  const rawPort = getEnvVar(env, 'SMTP_PORT', 'EMAIL_PORT', 'MAIL_PORT', 'SMTPPORT');
  const port = parseInt(rawPort, 10) || (host.toLowerCase().includes('hostinger') ? 465 : 587);

  // 5. Secure (SSL/TLS): Port 465 is direct SSL, 587 is STARTTLS
  const rawSecure = getEnvVar(env, 'SMTP_SECURE', 'EMAIL_SECURE', 'MAIL_SECURE', 'SMTP_SSL', 'MAIL_ENCRYPTION');
  let secure = port === 465;
  if (rawSecure) {
    const s = rawSecure.toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes' || s === 'ssl') {
      secure = true;
    } else if (s === 'false' || s === '0' || s === 'no' || s === 'tls' || s === 'starttls') {
      secure = false;
    }
  }

  // 6. From Email & Name
  let fromEmail = getEnvVar(
    env,
    'EMAIL_FROM',
    'SMTP_FROM',
    'MAIL_FROM',
    'SMTP_FROM_EMAIL',
    'EMAIL_FROM_ADDRESS',
    'MAIL_FROM_ADDRESS'
  );

  let fromName = getEnvVar(
    env,
    'EMAIL_FROM_NAME',
    'SMTP_FROM_NAME',
    'MAIL_FROM_NAME',
    'FROM_NAME'
  );

  // If fromEmail contains format '"Display Name" <email@example.com>', extract both
  if (fromEmail) {
    const angleMatch = fromEmail.match(/<([^>]+)>/);
    if (angleMatch) {
      const namePart = fromEmail.substring(0, fromEmail.indexOf('<')).replace(/["']/g, '').trim();
      if (namePart && !fromName) {
        fromName = namePart;
      }
      fromEmail = angleMatch[1].trim();
    }
  }

  // If fromEmail is not set, or contains generic dummy domain, default to the authenticated user email
  if (!fromEmail || fromEmail.includes('company.com.au') || !fromEmail.includes('@')) {
    fromEmail = user;
  }

  if (!fromName) {
    fromName = 'HsCreations Sydney';
  }

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromEmail,
    fromName,
    isConfigured: true,
    isEnvConfigured: true,
    enableSmtp: true,
    source: 'ENV_VARS',
  };
}
