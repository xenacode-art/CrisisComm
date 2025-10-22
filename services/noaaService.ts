import { CrisisEvent, Coordinates } from '../types';

// Simple in-memory cache to avoid spamming the API
const cache = {
  data: null as CrisisEvent[] | null,
  timestamp: 0,
  location: null as Coordinates | null,
};

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for weather alerts

/**
 * Fetches recent weather alerts (mocked) for a given location.
 * In a real application, this would call the NOAA or another weather API.
 * @param location The central coordinates to search around.
 * @returns A promise that resolves to an array of CrisisEvent objects.
 */
export const fetchWeatherAlerts = async (
  location: Coordinates
): Promise<CrisisEvent[]> => {
  const now = Date.now();

  // Check cache validity
  if (
    cache.data &&
    (now - cache.timestamp < CACHE_DURATION) &&
    JSON.stringify(cache.location) === JSON.stringify(location)
  ) {
    console.log("Returning cached NOAA weather data.");
    return cache.data;
  }
  
  // MOCK DATA - In a real app, this would be an API call.
  const mockAlerts: CrisisEvent[] = [
    {
      id: `noaa_${now}`,
      type: 'weather_alert',
      title: 'Severe Thunderstorm Warning',
      severity: 'moderate',
      location: {
        lat: location.lat + 0.1,
        lng: location.lng - 0.1,
      },
      time: new Date().toISOString(),
      details: {
        event: 'Severe Thunderstorm Warning',
        headline: 'A severe thunderstorm was located near your area, moving east at 30 mph.',
        description: 'Expect quarter-sized hail and wind gusts up to 60 mph. Seek shelter in a sturdy building.',
        instruction: 'Move to an interior room on the lowest floor of a building. Avoid windows.',
        source: 'Mock NOAA/NWS Data',
      },
    },
  ];
  
  return new Promise((resolve) => {
      setTimeout(() => {
        console.log("Fetched mock weather alerts.");
        cache.data = mockAlerts;
        cache.timestamp = now;
        cache.location = location;
        resolve(mockAlerts);
      }, 700); // Simulate network delay
  });
};
