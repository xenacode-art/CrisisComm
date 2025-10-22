// This file is simplified to only handle the loading of the Google Maps bootstrap script.
// The more robust error handling (including for InvalidKeyMapError) is now handled
// in FamilyMapView.tsx using the modern `google.maps.importLibrary()` method.

declare global {
    interface Window {
        google?: {
            maps?: {
                importLibrary: (library: string) => Promise<any>;
            }
        };
    }
}

let googleMapsPromise: Promise<void> | null = null;

export const loadGoogleMapsScript = (): Promise<void> => {
    if (googleMapsPromise) {
        return googleMapsPromise;
    }

    googleMapsPromise = new Promise((resolve, reject) => {
        const GOOGLE_MAPS_API_KEY = process.env.API_KEY;

        if (!GOOGLE_MAPS_API_KEY) {
            return reject(new Error("Google Maps API key is missing from the environment."));
        }

        // If the script is already loaded (e.g., by another component or a previous run)
        if (window.google?.maps?.importLibrary) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        // v=beta is recommended for use with the dynamic importLibrary function
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=beta`;
        script.async = true;
        
        script.onload = () => {
            resolve();
        };

        script.onerror = () => {
            googleMapsPromise = null; // Reset for retry
            reject(new Error("Failed to load Google Maps script. This could be due to a network issue or a content security policy. Check the browser console for more details."));
        };

        document.head.appendChild(script);
    });

    return googleMapsPromise;
};
