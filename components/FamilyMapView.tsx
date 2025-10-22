import React, { useEffect, useRef, useState } from 'react';
import { Member, CrisisEvent, MeetupPoint, StatusType } from '../types';
import { loadGoogleMapsScript } from '../services/googleMapsLoader';
import Spinner from './common/Spinner';
import { MapIcon } from './icons';

// Add necessary type definitions for Google Maps to be used in this component.
// These are simplified and scoped for what's used below.
// FIX: Removed incorrect type aliases that caused errors. The full google.maps types will be used directly.
declare global {
    namespace google.maps {
        class Map {
            constructor(mapDiv: HTMLElement | null, opts?: any);
            fitBounds(bounds: LatLngBounds, padding?: number): void;
        }
        class LatLngBounds {
            constructor(sw?: any, ne?: any);
            extend(point: any): void;
            isEmpty(): boolean;
        }
        namespace marker {
            class AdvancedMarkerElement {
                constructor(options?: any);
                map: Map | null;
            }
        }
    }
}


interface FamilyMapViewProps {
    members: Member[];
    crisisEvents: CrisisEvent[];
    meetupPoints: MeetupPoint[];
}

// SVG templates for map markers with dynamic colors
const getMemberMarkerIcon = (color: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36px" height="36px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/><circle cx="12" cy="9.5" r="2.5" fill="white"/></svg>`
)}`;

const getCrisisMarkerIcon = (color: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="40px" height="40px"><path d="M12 2.16l-9.11 15.84h18.22l-9.11-15.84zm-1.11 11.84h2.22v2.22h-2.22v-2.22zm0-4.44h2.22v3.33h-2.22v-3.33z"/></svg>`
)}`;

const getMeetupMarkerIcon = () => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1D4ED8" width="48px" height="48px"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 12.5L11 13V7h1.5v5.25l3.5 1.75l-.5 1z" stroke="white" stroke-width="0.5" /></svg>`
)}`;

const statusColors: Record<StatusType, string> = {
    [StatusType.SAFE]: '#22C55E', // green-500
    [StatusType.HELP]: '#F97316', // orange-500
    [StatusType.INJURED]: '#EF4444', // red-500
    [StatusType.UNKNOWN]: '#6B7280', // gray-500
};

const crisisColors: Record<string, string> = {
    earthquake: '#9333EA', // purple-600
    weather_alert: '#F59E0B', // amber-500
    fire: '#DC2626', // red-600
    flood: '#3B82F6', // blue-500
    default: '#DC2626', // red-600
};

const FamilyMapView: React.FC<FamilyMapViewProps> = ({ members, crisisEvents, meetupPoints }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    // FIX: Use full google.maps.Map type.
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // FIX: Use full google.maps.marker.AdvancedMarkerElement type.
    const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

    useEffect(() => {
        const initMap = async () => {
            try {
                await loadGoogleMapsScript();
                
                if (!window.google?.maps?.importLibrary) {
                    throw new Error("Google Maps script loaded, but `importLibrary` is not available.");
                }

                // FIX: Cast to the correct constructor type `typeof google.maps.Map`. The type alias `GoogleMap` referred to an instance, not the class.
                const { Map } = await window.google.maps.importLibrary("maps") as { Map: typeof google.maps.Map };
                
                if (mapRef.current) {
                    const newMap = new Map(mapRef.current, {
                        center: { lat: 37.7749, lng: -122.4194 },
                        zoom: 10,
                        mapId: 'CRISIS_MAP_ID',
                        disableDefaultUI: true,
                        zoomControl: true,
                    });
                    setMap(newMap);
                }
            } catch (e: any) {
                console.error("Failed to initialize Google Map:", e);
                // This catch block now handles authentication errors from importLibrary
                let userMessage = "An unknown error occurred while loading the map.";
                const errorMessage = e.message.toLowerCase();

                if (errorMessage.includes("invalidkey") || errorMessage.includes("apinotactivated")) {
                    userMessage = "The interactive map could not be loaded. The API key must be enabled for the 'Maps JavaScript API' in your Google Cloud project.";
                } else if (errorMessage.includes("referer")) {
                    userMessage = "The interactive map could not be loaded. The current website is not authorized to use this API key.";
                }
                setError(userMessage);
            } finally {
                setIsLoading(false);
            }
        };

        initMap();
    }, []);

    useEffect(() => {
        if (!map) return;

        const setupMarkers = async () => {
            try {
                if (!window.google?.maps?.importLibrary) return;

                // FIX: Cast to the correct constructor type `typeof google.maps.marker.AdvancedMarkerElement`. The type alias `GoogleAdvancedMarkerElement` referred to an instance, not the class.
                const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker") as { AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement };
                // FIX: Cast to the correct constructor type `typeof google.maps.LatLngBounds`. The type alias `GoogleLatLngBounds` referred to an instance, not the class.
                const { LatLngBounds } = await window.google.maps.importLibrary("core") as { LatLngBounds: typeof google.maps.LatLngBounds };

                markersRef.current.forEach(marker => {
                    marker.map = null;
                });
                markersRef.current = [];
        
                const bounds = new LatLngBounds();
        
                members.forEach(member => {
                    if (member.location) {
                        const icon = document.createElement('img');
                        icon.src = getMemberMarkerIcon(statusColors[member.status]);
                        const marker = new AdvancedMarkerElement({
                            position: member.location,
                            map,
                            title: `${member.name} (${member.status})`,
                            content: icon,
                        });
                        markersRef.current.push(marker);
                        bounds.extend(member.location);
                    }
                });
        
                crisisEvents.forEach(event => {
                    const icon = document.createElement('img');
                    icon.src = getCrisisMarkerIcon(crisisColors[event.type] || crisisColors.default);
                    const marker = new AdvancedMarkerElement({
                        position: event.location,
                        map,
                        title: event.title,
                        content: icon,
                    });
                    markersRef.current.push(marker);
                    bounds.extend(event.location);
                });
                
                meetupPoints.forEach(point => {
                    const icon = document.createElement('img');
                    icon.src = getMeetupMarkerIcon();
                    const marker = new AdvancedMarkerElement({
                        position: point.coordinates,
                        map,
                        title: `Meetup: ${point.name}`,
                        content: icon,
                    });
                    markersRef.current.push(marker);
                    bounds.extend(point.coordinates);
                });
        
                if (!bounds.isEmpty()) {
                    map.fitBounds(bounds, 100);
                }
            } catch (e) {
                console.error("Error setting up map markers:", e);
                setError("Could not display locations on the map.");
            }
        };

        setupMarkers();

    }, [map, members, crisisEvents, meetupPoints]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-crisis-dark text-gray-400 p-4 text-center">
                <div className="bg-red-900/50 text-red-300 p-4 rounded-lg mb-4 w-full">
                    <h3 className="font-bold text-lg flex items-center justify-center"><MapIcon className="w-6 h-6 mr-2" /> Live Map Unavailable</h3>
                    <p className="text-sm mt-2">{error}</p>
                </div>
                <p className="mb-4">While the interactive map is down, here is the critical location information:</p>
                <div className="w-full text-left space-y-4 max-h-80 overflow-y-auto p-2">
                    {meetupPoints.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-white text-lg mb-2">Recommended Meetup Points</h4>
                            <ul className="space-y-2">
                                {meetupPoints.map(point => (
                                    <li key={point.rank} className="bg-crisis-light p-3 rounded-md">
                                        <p className="font-bold text-blue-300">{point.rank}. {point.name}</p>
                                        <p className="text-sm">{point.address}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                     {members.filter(m => m.location).length > 0 && (
                        <div>
                            <h4 className="font-semibold text-white text-lg mb-2 mt-4">Last Known Member Locations</h4>
                             <ul className="space-y-2">
                                {members.filter(m => m.location).map(member => (
                                    <li key={member.name} className="bg-crisis-light p-3 rounded-md">
                                        <p className="font-bold text-gray-200">{member.name} (<span style={{color: statusColors[member.status]}}>{member.status}</span>)</p>
                                        <p className="text-sm">Lat: {member.location!.lat.toFixed(4)}, Lng: {member.location!.lng.toFixed(4)}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    
    return (
        <div className="h-full w-full relative">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-crisis-dark/80 z-10">
                    <Spinner />
                </div>
            )}
            <div ref={mapRef} className="h-full w-full" />
        </div>
    );
};

export default FamilyMapView;