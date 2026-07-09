export interface Hospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  estimatedEtaMin: number;
  phone?: string;
  address?: string;
  hasEmergencyDept: boolean;
  source: 'overpass' | 'cached' | 'mock';
}

export interface PlacesSearchConfig {
  searchRadiusM: number;
  maxResults: number;
  overpassEndpoint: string;
  fallbackToCached: boolean;
}

export const DEFAULT_PLACES_CONFIG: PlacesSearchConfig = {
  searchRadiusM: 15000,
  maxResults: 3,
  overpassEndpoint: 'https://overpass-api.de/api/interpreter',
  fallbackToCached: true,
};

export type PlacesSearchCallback = (hospitals: Hospital[]) => void;