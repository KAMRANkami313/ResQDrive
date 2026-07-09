import { useEffect, useState } from 'react';
import { hospitalService } from '@services/places';
import { Hospital } from '@services/places';

export function useHospitals(lat: number | null, lng: number | null) {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat === null || lng === null) {
      setHospitals([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    hospitalService
      .findNearest(lat, lng)
      .then((results) => {
        if (!cancelled) {
          setHospitals(results);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return { hospitals, loading, error };
}