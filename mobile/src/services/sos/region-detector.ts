import { PakistaniRegion } from './types';

interface RegionBoundary {
  region: PakistaniRegion;
  label: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const BOUNDARIES: RegionBoundary[] = [
  { region: 'karachi', label: 'Karachi', minLat: 24.75, maxLat: 25.45, minLng: 66.85, maxLng: 67.65 },
  { region: 'punjab', label: 'Punjab', minLat: 27.7, maxLat: 34.0, minLng: 69.3, maxLng: 74.6 },
  { region: 'islamabad', label: 'Islamabad Capital Territory', minLat: 33.55, maxLat: 33.85, minLng: 72.85, maxLng: 73.35 },
  { region: 'kpk', label: 'Khyber Pakhtunkhwa', minLat: 31.0, maxLat: 37.1, minLng: 69.3, maxLng: 74.0 },
  { region: 'sindh', label: 'Sindh', minLat: 23.5, maxLat: 28.5, minLng: 66.5, maxLng: 71.2 },
  { region: 'balochistan', label: 'Balochistan', minLat: 25.0, maxLat: 32.0, minLng: 60.5, maxLng: 70.5 },
  { region: 'gilgit', label: 'Gilgit-Baltistan', minLat: 34.5, maxLat: 37.5, minLng: 72.5, maxLng: 77.5 },
  { region: 'ajk', label: 'Azad Jammu & Kashmir', minLat: 32.5, maxLat: 35.5, minLng: 73.0, maxLng: 75.5 },
];

export function detectRegion(lat: number, lng: number): { region: PakistaniRegion; label: string } {
  for (const b of BOUNDARIES) {
    if (lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng) {
      return { region: b.region, label: b.label };
    }
  }
  return { region: 'default', label: 'Pakistan (Default)' };
}

export function getRegionLabel(region: PakistaniRegion): string {
  const found = BOUNDARIES.find((b) => b.region === region);
  return found?.label || 'Pakistan (Default)';
}