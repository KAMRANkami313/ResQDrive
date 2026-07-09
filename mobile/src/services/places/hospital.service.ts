import { Linking, Platform } from 'react-native';
import {
  DEFAULT_PLACES_CONFIG,
  Hospital,
  PlacesSearchCallback,
  PlacesSearchConfig,
} from './types';
import { CACHED_HOSPITALS } from './hospital-data';

class HospitalService {
  private config: PlacesSearchConfig = DEFAULT_PLACES_CONFIG;
  private callbacks: Set<PlacesSearchCallback> = new Set();

  onResults(callback: PlacesSearchCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  async findNearest(lat: number, lng: number): Promise<Hospital[]> {
    console.log('[hospital] searching near:', lat, lng);
    try {
      const overpassResults = await this.queryOverpass(lat, lng);
      if (overpassResults.length > 0) {
        const ranked = this.rankByDistance(overpassResults, lat, lng);
        const top3 = ranked.slice(0, this.config.maxResults);
        this.callbacks.forEach((cb) => cb(top3));
        return top3;
      }
    } catch (err) {
      console.warn('[hospital] overpass failed, falling back to cached:', err);
    }

    const cachedResults = this.getCachedHospitals(lat, lng);
    const top3 = cachedResults.slice(0, this.config.maxResults);
    this.callbacks.forEach((cb) => cb(top3));
    return top3;
  }

  private async queryOverpass(lat: number, lng: number): Promise<Hospital[]> {
    const query = `
      [out:json][timeout:15];
      (
        node["amenity"="hospital"]["emergency"="yes"](around:${this.config.searchRadiusM},${lat},${lng});
        node["amenity"="hospital"](around:${this.config.searchRadiusM},${lat},${lng});
        node["amenity"="clinic"]["emergency"="yes"](around:${this.config.searchRadiusM},${lat},${lng});
      );
      out body 30;
    `;

    const response = await fetch(this.config.overpassEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
    });

    if (!response.ok) {
      throw new Error(`Overpass HTTP ${response.status}`);
    }

    const data = await response.json();
    const hospitals: Hospital[] = [];

    for (const element of data.elements || []) {
      if (element.type !== 'node' || !element.lat || !element.lon) continue;

      const tags = element.tags || {};
      const name = tags.name || tags['name:en'] || tags['name:ur'] || 'Unnamed Hospital';
      const hasEmergency = tags.emergency === 'yes' || tags['emergency'] === 'true';

      hospitals.push({
        id: `osm-${element.id}`,
        name,
        latitude: element.lat,
        longitude: element.lon,
        distanceKm: 0,
        estimatedEtaMin: 0,
        phone: tags.phone || tags['contact:phone'] || undefined,
        address: this.formatAddress(tags),
        hasEmergencyDept: hasEmergency,
        source: 'overpass',
      });
    }

    const unique = new Map<string, Hospital>();
    for (const h of hospitals) {
      if (!unique.has(h.id)) {
        unique.set(h.id, h);
      }
    }

    return Array.from(unique.values());
  }

  private getCachedHospitals(lat: number, lng: number): Hospital[] {
    const hospitals: Hospital[] = CACHED_HOSPITALS.map((h) => ({
      ...h,
      distanceKm: 0,
      estimatedEtaMin: 0,
    }));
    return this.rankByDistance(hospitals, lat, lng);
  }

  private rankByDistance(hospitals: Hospital[], lat: number, lng: number): Hospital[] {
    return hospitals
      .map((h) => ({
        ...h,
        distanceKm: this.haversine(lat, lng, h.latitude, h.longitude),
        estimatedEtaMin: this.estimateEta(this.haversine(lat, lng, h.latitude, h.longitude)),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }

  private estimateEta(distanceKm: number): number {
    const avgSpeedKmh = 30;
    return Math.ceil((distanceKm / avgSpeedKmh) * 60);
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  private formatAddress(tags: any): string {
    const parts = [];
    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:city']) parts.push(tags['addr:city']);
    return parts.join(', ');
  }

  async openNavigation(hospital: Hospital): Promise<boolean> {
    try {
      const { latitude, longitude } = hospital;
      const label = encodeURIComponent(hospital.name);

      const url = Platform.select({
        ios: `maps://app?daddr=${latitude},${longitude}&q=${label}`,
        android: `google.navigation:q=${latitude},${longitude}&mode=d`,
        default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`,
      });

      if (!url) return false;
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        if (Platform.OS === 'web') {
          window.open(url, '_blank');
          return true;
        }
        return false;
      }
      await Linking.openURL(url);
      return true;
    } catch (err) {
      console.error('[hospital] openNavigation failed:', err);
      return false;
    }
  }

  async callHospital(phone: string): Promise<boolean> {
    try {
      const cleanPhone = phone.replace(/\s/g, '');
      const url = Platform.OS === 'ios' ? `telprompt:${cleanPhone}` : `tel:${cleanPhone}`;

      if (Platform.OS === 'web') {
        window.alert(`Cannot make phone calls on web. Please dial manually: ${phone}`);
        return false;
      }

      const supported = await Linking.canOpenURL(url);
      if (!supported) return false;
      await Linking.openURL(url);
      return true;
    } catch (err) {
      console.error('[hospital] call failed:', err);
      return false;
    }
  }
}

export const hospitalService = new HospitalService();
export { DEFAULT_PLACES_CONFIG } from './types';
export type { Hospital, PlacesSearchConfig } from './types';