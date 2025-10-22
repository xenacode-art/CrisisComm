import React, { useEffect, useRef, useState } from 'react';
import { Member, CrisisEvent, MeetupPoint, StatusType } from '../types';
import { loadGoogleMapsScript } from '../services/googleMapsLoader';
import Spinner from './common/Spinner';
import { MapIcon, TrophyIcon, UserIcon } from './icons';

// FIX: Add a declaration for the 'google' global variable to resolve TypeScript errors.
// Replaced `declare const google: any;` with a more specific `declare global` block for `google.maps`
declare global {
  namespace google.maps {
    class Map {
      constructor(el: HTMLElement, opts: any);
      fitBounds(bounds: LatLngBounds, padding: number): void;
    }
    class Circle {
      constructor(opts: any);
      setMap(map: Map | null): void;
    }
    namespace marker {
      class AdvancedMarkerElement {
        constructor(opts: any);
        set map(map: Map | null);
        get map(): Map | null;
      }
    }
    class LatLngBounds {
      constructor(sw?: any, ne?: any);
      extend(point: any): void;
      isEmpty(): boolean;
    }
  }
}

// Define a type for the loaded library classes to ensure type safety.
type MapLibraries = {
    Map: typeof google.maps.Map;
    Circle: typeof google.maps.Circle;
    AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
    LatLngBounds: typeof google.maps.LatLngBounds;
};

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
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [mapLibraries, setMapLibraries] = useState<MapLibraries | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
    const circlesRef = useRef<google.maps.Circle[]>([]);

    // Effect for ONE-TIME map and library initialization
    useEffect(() => {
        const initMap = async () => {
            try {
                await loadGoogleMapsScript();
                
                if (!window.google?.maps?.importLibrary) {
                    throw new Error("Google Maps script loaded, but `importLibrary` is not available.");
                }

                const [mapsLib, markerLib, coreLib] = await Promise.all([
                    window.google.maps.importLibrary("maps"),
                    window.google.maps.importLibrary("marker"),
                    window.google.maps.importLibrary("core"),
                ]);

                const loadedLibs: MapLibraries = {
                    Map: mapsLib.Map,
                    Circle: mapsLib.Circle,
                    AdvancedMarkerElement: markerLib.AdvancedMarkerElement,
                    LatLngBounds: coreLib.LatLngBounds,
                };
                
                if (Object.values(loadedLibs).some(lib => !lib)) {
                    throw new Error("Failed to load necessary Google Maps components. This may be due to an API key issue.");
                }

                setMapLibraries(loadedLibs);
                
                if (mapRef.current) {
                    const newMap = new loadedLibs.Map(mapRef.current, {
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
                let userMessage = "An unknown error occurred while loading the map.";
                const errorMessage = e.message.toLowerCase();

                if (errorMessage.includes("invalidkey") || errorMessage.includes("apinotactivated") || errorMessage.includes("key issue")) {
                    userMessage = "The interactive map could not be loaded. The API key may be invalid or not configured for the 'Maps JavaScript API'.";
                } else if (errorMessage.includes("referer")) {
                    userMessage = "The interactive map could not be loaded. This website is not authorized to use the provided API key.";
                }
                setError(userMessage);
            } finally {
                setIsLoading(false);
            }
        };

        initMap();
    }, []);

    // Effect for UPDATING markers when data changes
    useEffect(() => {
        if (!map || !mapLibraries) return;

        try {
            markersRef.current.forEach(marker => { marker.map = null; });
            markersRef.current = [];
            circlesRef.current.forEach(circle => circle.setMap(null));
            circlesRef.current = [];

            const { AdvancedMarkerElement, LatLngBounds, Circle } = mapLibraries;

            const bounds = new LatLngBounds();
            
            members.filter(m => m.isLocationShared && m.location).forEach(member => {
                const icon = document.createElement('img');
                icon.src = getMemberMarkerIcon(statusColors[member.status]);
                const marker = new AdvancedMarkerElement({
                    position: member.location,
                    map,
                    title: `${member.name} (${member.status})`,
                    content: icon,
                });
                markersRef.current.push(marker);
                bounds.extend(member.location!);

                if (member.location?.accuracy && member.location.accuracy > 0) {
                    const accuracyCircle = new Circle({
                        strokeColor: '#4A90E2',
                        strokeOpacity: 0.8,
                        strokeWeight: 1,
                        fillColor: '#4A90E2',
                        fillOpacity: 0.2,
                        map,
                        center: member.location,
                        radius: member.location.accuracy,
                    });
                    circlesRef.current.push(accuracyCircle);
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
            setError("An error occurred while displaying locations on the map. The map library may be unstable due to an API key issue.");
        }

    }, [map, mapLibraries, members, crisisEvents, meetupPoints]);

    if (error) {
        const membersToList = members.filter(m => m.isLocationShared && m.location);
        return (
            <div className="flex flex-col h-full bg-white dark:bg-crisis-dark text-gray-700 dark:text-gray-300 p-4 overflow-hidden">
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 text-red-800 dark:text-red-200 p-4 rounded-lg mb-4 text-center">
                    <h3 className="font-bold text-lg flex items-center justify-center gap-2"><MapIcon className="w-6 h-6" /> Live Map Unavailable</h3>
                    <p className="text-sm mt-2">{error}</p>
                </div>
                
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-4">
                    While the interactive map is down, here is the last known location information:
                </p>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {meetupPoints.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-md mb-2 sticky top-0 bg-white dark:bg-crisis-dark py-1">
                                AI-Recommended Meetup Points
                            </h4>
                            <ul className="space-y-2">
                                {meetupPoints.map(point => (
                                    <li key={point.rank} className="bg-gray-50 dark:bg-crisis-light p-3 rounded-md shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <TrophyIcon className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-blue-700 dark:text-blue-300">{point.rank}. {point.name}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{point.address}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                     {membersToList.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-md mb-2 mt-4 sticky top-0 bg-white dark:bg-crisis-dark py-1">
                                Last Known Member Locations
                            </h4>
                             <ul className="space-y-2">
                                {membersToList.map(member => (
                                    <li key={member.name} className="bg-gray-50 dark:bg-crisis-light p-3 rounded-md shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <UserIcon className="w-5 h-5 mt-1 flex-shrink-0" style={{color: statusColors[member.status]}} />
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-200">{member.name} (<span className="font-normal" style={{color: statusColors[member.status]}}>{member.status}</span>)</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Lat: {member.location!.lat.toFixed(4)}, Lng: {member.location!.lng.toFixed(4)}
                                                    {member.location!.accuracy && ` (±${member.location!.accuracy}m accuracy)`}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {membersToList.length === 0 && meetupPoints.length === 0 && (
                         <div className="text-center text-gray-500 dark:text-gray-400 pt-10">
                            <p>No location data available to display.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    
    return (
        <div className="h-full w-full relative">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-crisis-dark/80 z-10">
                    <Spinner />
                </div>
            )}
            <div ref={mapRef} className="h-full w-full" />
        </div>
    );
};

export default FamilyMapView;
