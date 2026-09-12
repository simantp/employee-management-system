import { IpLockSettings, LockedIpRecord } from '@/types';

// =========================================================================
// DEFAULT LOCKED WORKSTATION IPS
// =========================================================================

export const INITIAL_LOCKED_IPS: LockedIpRecord[] = [
  {
    id: 'ip-riverwood-kiosk',
    ip: '192.168.1.100',
    label: 'Sydney Riverwood Plant Kiosk (Terminal 1)',
    addedAt: '17 Aug 2026',
    addedBy: 'Super Admin',
    isActive: true,
    notes: 'Main floor shift punch terminal',
  },
  {
    id: 'ip-office-reception',
    ip: '203.0.113.50',
    label: 'Head Office Reception Workstation',
    addedAt: '17 Aug 2026',
    addedBy: 'Super Admin',
    isActive: true,
    notes: 'Front reception management desk',
  },
  {
    id: 'ip-rockdale-hub',
    ip: '192.168.2.105',
    label: 'Rockdale Production Hub Terminal',
    addedAt: '17 Aug 2026',
    addedBy: 'Super Admin',
    isActive: true,
    notes: 'Rockdale dispatch station',
  },
];

export const INITIAL_IP_LOCK_SETTINGS: IpLockSettings = {
  enabled: true, // Master lock active by default
  lockedIps: INITIAL_LOCKED_IPS,
};

// =========================================================================
// DEMO / TESTING WORKSTATION IP PRESETS
// =========================================================================

export interface IpPreset {
  id: string;
  ip: string;
  label: string;
  workstationName: string;
  isAuthorizedExpected: boolean;
}

export const DEMO_IP_PRESETS: IpPreset[] = [
  {
    id: 'preset-plant',
    ip: '192.168.1.100',
    label: 'Riverwood Plant Kiosk',
    workstationName: 'Sydney Riverwood Plant Kiosk (Terminal 1)',
    isAuthorizedExpected: true,
  },
  {
    id: 'preset-office',
    ip: '203.0.113.50',
    label: 'Head Office Terminal',
    workstationName: 'Head Office Reception Workstation',
    isAuthorizedExpected: true,
  },
  {
    id: 'preset-rockdale',
    ip: '192.168.2.105',
    label: 'Rockdale Hub Terminal',
    workstationName: 'Rockdale Production Hub Terminal',
    isAuthorizedExpected: true,
  },
  {
    id: 'preset-unauthorized',
    ip: '101.50.22.4',
    label: 'Unauthorized Home/Mobile IP (101.50.22.4)',
    workstationName: 'Unregistered Personal Device',
    isAuthorizedExpected: false,
  },
];

// =========================================================================
// IP MATCHING & ACCESS EVALUATION ENGINE
// =========================================================================

export interface IpEvaluationResult {
  isAllowed: boolean;
  status: 'LOCKED_IP_AUTHORIZED' | 'UNAUTHORIZED_IP' | 'UNRESTRICTED';
  matchedRecord?: LockedIpRecord;
  workstationLabel: string;
  clientIp: string;
  message: string;
}

/**
 * Normalizes an IP string (handles localhost ::1, 127.0.0.1, whitespace, and IPv6 prefixes)
 */
export function normalizeIp(ip?: string): string {
  if (!ip) return '127.0.0.1';
  let clean = ip.trim();
  if (clean === '::1' || clean === '::ffff:127.0.0.1') return '127.0.0.1';
  if (clean.startsWith('::ffff:')) return clean.replace('::ffff:', '');
  return clean;
}

/**
 * Evaluates whether a client IP is authorized according to active IP lock settings
 */
export function evaluateIpAccess(
  clientIp: string | undefined | null,
  settings: IpLockSettings
): IpEvaluationResult {
  const normalized = normalizeIp(clientIp);

  // If IP locking is disabled, allow all workstations
  if (!settings.enabled) {
    return {
      isAllowed: true,
      status: 'UNRESTRICTED',
      workstationLabel: 'Workstation (IP Lock Inactive)',
      clientIp: normalized,
      message: 'Shift punch registered without workstation IP restrictions.',
    };
  }

  // Active locked IPs
  const activeRecords = settings.lockedIps.filter(r => r.isActive);

  // Check exact IP match or localhost equivalent
  const matched = activeRecords.find(record => {
    const recordNormalized = normalizeIp(record.ip);
    if (recordNormalized === normalized) return true;
    
    // Subnet CIDR match basic check (e.g. 192.168.1.0/24 or 192.168.1.*)
    if (record.ip.includes('/') || record.ip.includes('*')) {
      const prefix = record.ip.split('/')[0].replace('.0', '').replace('*', '').trim();
      if (prefix && normalized.startsWith(prefix)) return true;
    }
    
    // If running in development local test, accept 127.0.0.1 or localhost if any local IP is registered
    if ((normalized === '127.0.0.1' || normalized === 'localhost') && (recordNormalized === '127.0.0.1' || record.ip.includes('192.168.') || record.ip.includes('localhost'))) {
      return true;
    }
    
    return false;
  });

  if (matched) {
    return {
      isAllowed: true,
      status: 'LOCKED_IP_AUTHORIZED',
      matchedRecord: matched,
      workstationLabel: matched.label,
      clientIp: normalized,
      message: `Workstation authorized: ${matched.label} (${normalized}).`,
    };
  }

  // Unauthorized IP
  return {
    isAllowed: false,
    status: 'UNAUTHORIZED_IP',
    workstationLabel: 'Unregistered Workstation',
    clientIp: normalized,
    message: `Punch blocked: Current workstation IP (${normalized}) is not registered in the authorized workstation whitelist. Shift punches must be performed from an authorized plant or office workstation.`,
  };
}

// =========================================================================
// BROWSER & CLIENT IP DETECTION UTILITY
// =========================================================================

let cachedDetectedIp: string | null = null;

export async function detectWorkstationIp(): Promise<string> {
  if (cachedDetectedIp) return cachedDetectedIp;

  try {
    // 1. First attempt to call local Next.js server route
    const res = await fetch('/api/ip', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.ip && data.ip !== '127.0.0.1' && data.ip !== '::1') {
        cachedDetectedIp = data.ip;
        return data.ip;
      }
    }
  } catch (e) {
    // ignore
  }

  try {
    // 2. Fallback attempt to public IP service
    const externalRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    if (externalRes.ok) {
      const externalData = await externalRes.json();
      if (externalData.ip) {
        cachedDetectedIp = externalData.ip;
        return externalData.ip;
      }
    }
  } catch (e) {
    // ignore
  }

  // 3. Fallback default for development
  cachedDetectedIp = '203.0.113.50';
  return cachedDetectedIp;
}

export function getDeviceDescription(customUserAgent?: string): string {
  if (typeof window === 'undefined' && !customUserAgent) return 'Workstation (Server)';
  const ua = customUserAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');

  let os = 'Windows';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'macOS';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Chrome';
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const platform = isMobile ? 'Mobile Terminal' : 'Desktop Workstation';

  return `${browser} on ${os} (${platform})`;
}
