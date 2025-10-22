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
        // This global function is called by the Google Maps script if authentication fails.
        gm_authFailure?: () => void;
    }
}

let googleMapsPromise: Promise<void> | null = null;

export const loadGoogleMapsScript = (): Promise<void> => {
    if (googleMapsPromise) {
        return googleMapsPromise;
    }

    googleMapsPromise = new Promise((resolve, reject) => {
        // Set up the authentication failure callback *before* inserting the script.
        window.gm_authFailure = () => {
            googleMapsPromise = null; // Reset promise for potential retries.
            reject(new Error("Google Maps authentication failed. This is typically caused by an invalid or misconfigured API key. Please check the browser console for an 'InvalidKeyMapError'."));
        };

        const GOOGLE_MAPS_API_KEY = process.env.API_KEY;

        // FIX: Add a more robust check for placeholder API keys based on user feedback.
        if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.includes('YOUR_API_KEY') || GOOGLE_MAPS_API_KEY.includes('ACTUAL_API_KEY')) {
            window.gm_authFailure = undefined; // Clean up before rejecting.
            googleMapsPromise = null; // Reset promise.
            return reject(new Error("Google Maps API key is missing or appears to be a placeholder. Please ensure a valid API key is provided in the environment."));
        }

        // If the script is already loaded (e.g., by another component or a previous run)
        if (window.google?.maps?.importLibrary) {
            window.gm_authFailure = undefined; // Clean up the global handler
            resolve();
            return;
        }

        const script = document.createElement('script');
        // v=beta is recommended for use with the dynamic importLibrary function
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=beta`;
        script.async = true;
        
        script.onload = () => {
            // Once the script is loaded successfully, the auth failure callback is no longer needed
            // for this specific load attempt.
            window.gm_authFailure = undefined;
            resolve();
        };

        script.onerror = () => {
            googleMapsPromise = null; // Reset for retry
            window.gm_authFailure = undefined; // Clean up the global handler
            reject(new Error("Failed to load Google Maps script. This could be due to a network issue or a content security policy. Check the browser console for more details."));
        };

        document.head.appendChild(script);
    });

    return googleMapsPromise;
};