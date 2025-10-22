import React from 'react';
import { Member, CrisisEvent, MeetupPoint, StatusType } from '../types';
import { MapIcon } from './icons';

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

// Simple hashing function to create a deterministic, pseudo-random position for each marker
const getPosition = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
  
    // Use the hash to generate coordinates within a 10% to 90% range of the map
    const x = (Math.abs(hash) % 80) + 10;
    // Use a different calculation for y to avoid points lining up diagonally
    const y = (Math.abs(hash * 31) % 80) + 10;
  
    return { top: `${y}%`, left: `${x}%` };
};


const FamilyMapView: React.FC<FamilyMapViewProps> = ({ members, crisisEvents, meetupPoints }) => {
    return (
        <div className="h-full w-full bg-gray-200 dark:bg-crisis-dark flex flex-col p-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 text-blue-800 dark:text-blue-200 p-3 rounded-lg mb-4 text-center">
                <h3 className="font-bold text-md flex items-center justify-center gap-2"><MapIcon className="w-5 h-5" /> Demo Map View</h3>
                <p className="text-sm mt-1">This is a non-interactive preview. A valid Google Maps API key is required for the live map.</p>
            </div>

            <div className="relative flex-1 w-full bg-gray-300 dark:bg-crisis-accent/50 rounded-lg overflow-hidden border border-gray-400 dark:border-crisis-accent">
                {/* Placeholder for map background details */}
                 <div className="absolute top-1/2 left-0 w-full h-px bg-gray-400/50 dark:bg-gray-500/50"></div>
                 <div className="absolute left-1/2 top-0 h-full w-px bg-gray-400/50 dark:bg-gray-500/50"></div>

                {members.filter(m => m.isLocationShared).map(member => (
                    <div
                        key={member.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={getPosition(member.id)}
                        title={`${member.name} (${member.status})`}
                    >
                        <img src={getMemberMarkerIcon(statusColors[member.status])} alt={`${member.name} location`} className="w-9 h-9 drop-shadow-lg" />
                    </div>
                ))}
                
                {crisisEvents.map(event => (
                    <div
                        key={event.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={getPosition(event.id)}
                        title={event.title}
                    >
                         <img src={getCrisisMarkerIcon(crisisColors[event.type] || crisisColors.default)} alt={`${event.title}`} className="w-10 h-10 drop-shadow-lg animate-pulse" />
                    </div>
                ))}

                {meetupPoints.map(point => (
                    <div
                        key={point.rank}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={getPosition(point.address)}
                        title={`Meetup: ${point.name}`}
                    >
                        <img src={getMeetupMarkerIcon()} alt={`Meetup point: ${point.name}`} className="w-12 h-12 drop-shadow-lg" />
                    </div>
                ))}

            </div>
        </div>
    );
};

export default FamilyMapView;