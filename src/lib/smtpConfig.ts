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
 * Resolves SMTP configuration from environment variables (.env files and process.env)
 * with support for all standard aliases (Hostinger, cPanel, Docker, Next.js).
 */
export function getEnvSmtpConfig(): SmtpResolvedConfig | null {
  const env = getAllEnvironmentVariables();

  // 1. Host aliases
  const host = (
    env.SMTP_HOST ||
    env.EMAIL_HOST ||
    env.MAIL_HOST ||
    env.SMTP_SERVER ||
    ''
  ).trim();

  // 2. User / Username aliases
  const user = (
    env.SMTP_USER ||
    env.SMTP_USERNAME ||
    env.EMAIL_USER ||
    env.EMAIL_USERNAME ||
    env.MAIL_USER ||
    env.MAIL_USERNAME ||
    ''
  ).trim();

  // 3. Password aliases
  const pass = (
    env.SMTP_PASS ||
    env.SMTP_PASSWORD ||
    env.EMAIL_PASS ||
    env.EMAIL_PASSWORD ||
    env.MAIL_PASS ||
    env.MAIL_PASSWORD ||
    ''
  ).trim();

  if (!host || !user || !pass) {
    return null;
  }

  // 4. Port aliases
  const rawPort = env.SMTP_PORT || env.EMAIL_PORT || env.MAIL_PORT || '465';
  const port = parseInt(rawPort, 10) || (host.includes('hostinger') ? 465 : 587);

  // 5. Secure (SSL/TLS)
  const rawSecure = env.SMTP_SECURE || env.EMAIL_SECURE || env.MAIL_SECURE || env.SMTP_SSL;
  let secure = port === 465;
  if (rawSecure !== undefined) {
    secure = rawSecure === 'true' || rawSecure === '1' || rawSecure === 'yes' || port === 465;
  }

  // 6. From Email & Name
  const fromEmail = (
    env.EMAIL_FROM ||
    env.SMTP_FROM ||
    env.MAIL_FROM ||
    env.SMTP_FROM_EMAIL ||
    env.EMAIL_FROM_ADDRESS ||
    user
  ).trim();

  const fromName = (
    env.EMAIL_FROM_NAME ||
    env.SMTP_FROM_NAME ||
    env.MAIL_FROM_NAME ||
    'HsCreations Sydney'
  ).trim();

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
