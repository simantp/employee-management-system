import { GeofenceSettings, GeofenceLocation, LocationVerificationStatus, Employee } from '@/types';

// =========================================================================
// INITIAL COMPANY GEOFENCE CONFIGURATION
// =========================================================================

export const INITIAL_GEOFENCE_LOCATIONS: GeofenceLocation[] = [
  {
    id: 'loc-riverwood',
    name: 'Sydney Riverwood Plant (Main Facility)',
    address: '14 Belmore Road, Riverwood NSW 2210',
    latitude: -33.9482,
    longitude: 151.0505,
    radiusMeters: 500,
    isActive: true,
  },
  {
    id: 'loc-rockdale',
    name: 'Rockdale Production Hub',
    address: '45 Princes Highway, Rockdale NSW 2216',
    latitude: -33.9528,
    longitude: 151.1394,
    radiusMeters: 500,
    isActive: true,
  },
  {
    id: 'loc-alexandria',
    name: 'Alexandria Creative Studio',
    address: '88 Euston Road, Alexandria NSW 2015',
    latitude: -33.9067,
    longitude: 151.1947,
    radiusMeters: 300,
    isActive: true,
  },
];

export const INITIAL_GEOFENCE_SETTINGS: GeofenceSettings = {
  enabled: true,
  mode: 'WARN_AND_FLAG', // 'STRICT_BLOCK' | 'WARN_AND_FLAG' | 'DISABLED'
  enforcementMode: 'WARN_AND_FLAG',
  requireIpWhitelist: false,
  whitelistedIps: ['192.168.1.0/24', '10.0.0.0/8', '203.0.113.50'],
  ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8', '203.0.113.50'],
  locations: INITIAL_GEOFENCE_LOCATIONS,
};

// =========================================================================
// DEMO / TESTING LOCATION PRESETS
// =========================================================================

export interface LocationPreset {
  id: string;
  label: string;
  name?: string;
  badge: string;
  latitude: number;
  longitude: number;
  coords?: { latitude: number; longitude: number };
  isInsideExpected: boolean;
}

export const DEMO_LOCATION_PRESETS: LocationPreset[] = [
  {
    id: 'preset-riverwood',
    label: 'Riverwood Plant',
    name: 'Riverwood Plant',
    badge: 'On-Site (12m)',
    latitude: -33.9481,
    longitude: 151.0506,
    coords: { latitude: -33.9481, longitude: 151.0506 },
    isInsideExpected: true,
  },
  {
    id: 'preset-rockdale',
    label: 'Rockdale Hub',
    name: 'Rockdale Hub',
    badge: 'On-Site (20m)',
    latitude: -33.9527,
    longitude: 151.1392,
    coords: { latitude: -33.9527, longitude: 151.1392 },
    isInsideExpected: true,
  },
  {
    id: 'preset-alexandria',
    label: 'Alexandria Studio',
    name: 'Alexandria Studio',
    badge: 'On-Site (15m)',
    latitude: -33.9066,
    longitude: 151.1945,
    coords: { latitude: -33.9066, longitude: 151.1945 },
    isInsideExpected: true,
  },
  {
    id: 'preset-bondi',
    label: 'Bondi Beach',
    name: 'Bondi Beach',
    badge: 'Out-of-Bounds (18.4km)',
    latitude: -33.8915,
    longitude: 151.2767,
    coords: { latitude: -33.8915, longitude: 151.2767 },
    isInsideExpected: false,
  },
  {
    id: 'preset-parramatta',
    label: 'Parramatta CBD',
    name: 'Parramatta CBD',
    badge: 'Out-of-Bounds (14.2km)',
    latitude: -33.8150,
    longitude: 151.0011,
    coords: { latitude: -33.8150, longitude: 151.0011 },
    isInsideExpected: false,
  },
];

// =========================================================================
// HAVERSINE DISTANCE FORMULA (in meters)
// =========================================================================

export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// =========================================================================
// PUNCH LOCATION EVALUATION ENGINE
// =========================================================================

export interface LocationEvaluationResult {
  isAllowed: boolean;
  status: LocationVerificationStatus;
  nearestSiteName: string;
  matchedSiteName: string;
  distanceMeters: number;
  allowedRadiusMeters: number;
  isWithinGeofence: boolean;
  message: string;
}

export function evaluatePunchLocation(
  coords: { latitude: number; longitude: number } | null | undefined,
  settings: GeofenceSettings,
  isRemoteExemptOrEmployee: boolean | Employee | undefined = false
): LocationEvaluationResult {
  const isRemoteExempt = typeof isRemoteExemptOrEmployee === 'object'
    ? Boolean(isRemoteExemptOrEmployee?.isRemoteAllowed)
    : Boolean(isRemoteExemptOrEmployee);

  const effectiveMode = settings.mode || settings.enforcementMode || 'WARN_AND_FLAG';
  // If remote work exemption is granted for this employee
  if (isRemoteExempt) {
    return {
      isAllowed: true,
      status: 'REMOTE_EXEMPT',
      nearestSiteName: 'Remote Work Authorisation',
      matchedSiteName: 'Remote Work Authorisation',
      distanceMeters: 0,
      allowedRadiusMeters: 0,
      isWithinGeofence: true,
      message: 'Punch verified under approved remote work agreement.',
    };
  }

  // If geofencing is disabled
  if (!settings.enabled || effectiveMode === 'DISABLED') {
    return {
      isAllowed: true,
      status: 'VERIFIED_ON_SITE',
      nearestSiteName: 'Company Facility (Geofencing Inactive)',
      matchedSiteName: 'Company Facility (Geofencing Inactive)',
      distanceMeters: 0,
      allowedRadiusMeters: 500,
      isWithinGeofence: true,
      message: 'Punch registered without active radius enforcement.',
    };
  }

  // If GPS coordinates unavailable
  if (!coords || isNaN(coords.latitude) || isNaN(coords.longitude)) {
    if (effectiveMode === 'STRICT_BLOCK') {
      return {
        isAllowed: false,
        status: 'GPS_UNAVAILABLE',
        nearestSiteName: 'Unknown',
        matchedSiteName: 'Unknown',
        distanceMeters: -1,
        allowedRadiusMeters: 500,
        isWithinGeofence: false,
        message: 'GPS location acquisition failed. Geofence verification is required to punch.',
      };
    } else {
      return {
        isAllowed: true,
        status: 'GPS_UNAVAILABLE',
        nearestSiteName: 'GPS Unconfirmed',
        matchedSiteName: 'GPS Unconfirmed',
        distanceMeters: -1,
        allowedRadiusMeters: 500,
        isWithinGeofence: false,
        message: 'Punch logged without GPS lock (flagged for review).',
      };
    }
  }

  // Evaluate against all active worksites
  const activeLocations = settings.locations.filter(loc => loc.isActive);
  if (activeLocations.length === 0) {
    return {
      isAllowed: true,
      status: 'VERIFIED_ON_SITE',
      nearestSiteName: 'Sydney Facility (Default)',
      matchedSiteName: 'Sydney Facility (Default)',
      distanceMeters: 0,
      allowedRadiusMeters: 500,
      isWithinGeofence: true,
      message: 'No active geofence zones defined.',
    };
  }

  let minDistance = Infinity;
  let nearestSite = activeLocations[0];

  for (const loc of activeLocations) {
    const d = calculateHaversineDistance(coords.latitude, coords.longitude, loc.latitude, loc.longitude);
    if (d < minDistance) {
      minDistance = d;
      nearestSite = loc;
    }
  }

  const isWithinGeofence = minDistance <= nearestSite.radiusMeters;

  if (isWithinGeofence) {
    return {
      isAllowed: true,
      status: 'VERIFIED_ON_SITE',
      nearestSiteName: nearestSite.name,
      matchedSiteName: nearestSite.name,
      distanceMeters: minDistance,
      allowedRadiusMeters: nearestSite.radiusMeters,
      isWithinGeofence: true,
      message: `Verified on-site at ${nearestSite.name} (${minDistance}m from center).`,
    };
  }

  // Out of bounds: evaluate policy mode
  const distanceKm = (minDistance / 1000).toFixed(1);
  if (effectiveMode === 'STRICT_BLOCK') {
    return {
      isAllowed: false,
      status: 'OUT_OF_BOUNDS',
      nearestSiteName: nearestSite.name,
      matchedSiteName: nearestSite.name,
      distanceMeters: minDistance,
      allowedRadiusMeters: nearestSite.radiusMeters,
      isWithinGeofence: false,
      message: `Punch blocked: You are ${minDistance > 1000 ? `${distanceKm}km` : `${minDistance}m`} from ${nearestSite.name} (Max allowed radius: ${nearestSite.radiusMeters}m).`,
    };
  } else {
    // WARN_AND_FLAG mode
    return {
      isAllowed: true,
      status: 'OUT_OF_BOUNDS',
      nearestSiteName: nearestSite.name,
      matchedSiteName: nearestSite.name,
      distanceMeters: minDistance,
      allowedRadiusMeters: nearestSite.radiusMeters,
      isWithinGeofence: false,
      message: `Out of bounds warning: Punched ${minDistance > 1000 ? `${distanceKm}km` : `${minDistance}m`} from ${nearestSite.name}. Timecard flagged for administrator review.`,
    };
  }
}

// =========================================================================
// BROWSER & DEVICE DETECTION UTILITIES
// =========================================================================

export function getDeviceDescription(customUserAgent?: string): string {
  if (typeof window === 'undefined' && !customUserAgent) return 'Server / Automated';
  const ua = customUserAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');

  let os = 'Unknown OS';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'macOS';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Browser';
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const platform = isMobile ? 'Mobile Terminal' : 'Workstation';

  return `${browser} on ${os} (${platform})`;
}

export function formatDistanceDisplay(meters?: number): string {
  if (meters === undefined || meters === null || meters < 0) return 'Distance Unconfirmed';
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
