import { useEffect, useMemo, useState } from 'react';
import { CITIES_API, LS_CITIES } from '../config';

function readCachedCities() {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(LS_CITIES);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCachedCities(cities) {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(LS_CITIES, JSON.stringify(cities));
  } catch {
    /* ignore quota issues */
  }
}

function extractCityName(record = {}) {
  const possibleKeys = ['שם_ישוב', 'שם יישוב', 'שם ישוב', 'cityName', 'name'];
  for (const key of possibleKeys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

export function useCities() {
  const [cities, setCities] = useState(() => readCachedCities());
  const [loading, setLoading] = useState(() => cities.length === 0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCities() {
      setError(null);
      if (cities.length === 0) {
        setLoading(true);
      }
      try {
        const response = await fetch(CITIES_API);
        if (!response.ok) {
          throw new Error('שגיאה בטעינת רשימת הערים מהשרת');
        }
        const payload = await response.json();
        const records = payload?.result?.records || [];
        const list = Array.from(
          new Set(
            records
              .map((record) => extractCityName(record))
              .filter((value) => typeof value === 'string' && value.length > 0),
          ),
        ).sort((a, b) => a.localeCompare(b, 'he'));

        if (!cancelled && list.length > 0) {
          setCities(list);
          writeCachedCities(list);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'אי אפשר לטעון את רשימת הערים');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCities();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const options = useMemo(() => cities, [cities]);

  return { cities: options, loading, error };
}
