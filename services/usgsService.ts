import { CrisisEvent, Coordinates } from '../types';

// Simple in-memory cache to avoid spamming the API
const cache = {
  data: null as CrisisEvent[] | null,
  timestamp: 0,
  location: null as Coordinates | null,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Calculates a simple severity string based on earthquake magnitude.
 * @param magnitude The magnitude of the earthquake.
 * @returns A severity level string.
 */
function getSeverityFromMagnitude(magnitude: number): 'minor' | 'moderate' | 'major' | 'catastrophic' {
  if (magnitude < 4.5) return 'minor';
  if (magnitude < 5.5) return 'moderate';
  if (magnitude < 6.5) return 'major';
  return 'catastrophic';
}

/**
 * Provides a simplified aftershock probability.
 * In a real-world scenario, this would involve a more complex model.
 * @param magnitude The magnitude of the main shock.
 * @returns A string describing the aftershock probability.
 */
function calculateAftershockRisk(magnitude: number): string {
  if (magnitude < 5.0) return 'Low (less than 30%)';
  if (magnitude < 6.0) return 'Moderate (30-60%)';
  if (magnitude < 7.0) return 'High (60-85%)';
  return 'Very High (>85%)';
}

/**
 * Fetches recent earthquake data from the USGS API for a given location.
 * @param location The central coordinates to search around.
 * @param radiusKm The search radius in kilometers.
 * @param minMagnitude The minimum magnitude to include in results.
 * @returns A promise that resolves to an array of CrisisEvent objects.
 */
export const fetchEarthquakeData = async (
  location: Coordinates,
  radiusKm: number = 100,
  minMagnitude: number = 4.0
): Promise<CrisisEvent[]> => {
  const now = Date.now();

  // Check cache validity
  if (
    cache.data &&
    (now - cache.timestamp < CACHE_DURATION) &&
    JSON.stringify(cache.location) === JSON.stringify(location)
  ) {
    console.log("Returning cached USGS earthquake data.");
    return cache.data;
  }

  const startTime = new Date(now - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime}&latitude=${location.lat}&longitude=${location.lng}&maxradiuskm=${radiusKm}&minmagnitude=${minMagnitude}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`USGS API responded with status: ${response.status}`);
    }

    const data = await response.json();

    const crisisEvents: CrisisEvent[] = data.features.map((feature: any) => {
      const { properties, geometry } = feature;
      const magnitude = properties.mag;
      return {
        id: feature.id,
        type: 'earthquake',
        title: properties.title,
        severity: getSeverityFromMagnitude(magnitude),
        location: {
          lat: geometry.coordinates[1],
          lng: geometry.coordinates[0],
        },
        time: new Date(properties.time).toISOString(),
        details: {
          magnitude: magnitude,
          depth_km: geometry.coordinates[2],
          aftershock_probability_24h: calculateAftershockRisk(magnitude),
          tsunami_warning: properties.tsunami === 1,
          source_url: properties.url,
          source: 'USGS',
        },
      };
    });

    // Update cache
    cache.data = crisisEvents;
    cache.timestamp = now;
    cache.location = location;

    console.log(`Fetched ${crisisEvents.length} new earthquake events from USGS.`);
    return crisisEvents;

  } catch (error) {
    console.error("Failed to fetch USGS earthquake data:", error);
    // Return empty array on error to prevent app crash
    return [];
  }
};
