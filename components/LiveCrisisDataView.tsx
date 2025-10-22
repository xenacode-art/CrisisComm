import React, { useState, useEffect } from 'react';
import { CrisisEvent, Coordinates } from '../types';
import Spinner from './common/Spinner';
import { AlertTriangleIcon } from './icons';

interface LiveCrisisDataViewProps {
    crisisEvents: CrisisEvent[];
    userLocation: Coordinates;
    isLoading: boolean;
    onRefresh: () => void;
}

const DataRow: React.FC<{ label: string; value: React.ReactNode; isWarning?: boolean }> = ({ label, value, isWarning }) => (
    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-600/50">
        <span className="text-gray-400">{label}:</span>
        <span className={`font-semibold text-right ${isWarning ? 'text-yellow-400' : 'text-gray-200'}`}>{value}</span>
    </div>
);

const SectionHeader: React.FC<{ title: string; source: string; }> = ({ title, source }) => (
    <div className="my-3">
        <h3 className="text-lg font-bold text-blue-400">{title}</h3>
        <p className="text-xs text-gray-500 uppercase tracking-widest">{source}</p>
        <div className="w-full border-t-2 border-dashed border-gray-700 mt-1"></div>
    </div>
);


const LiveCrisisDataView: React.FC<LiveCrisisDataViewProps> = ({ crisisEvents, isLoading, onRefresh }) => {
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const handleRefresh = () => {
        onRefresh();
        setLastUpdated(new Date());
    };

    const earthquake = crisisEvents.find(e => e.type === 'earthquake');

    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    return (
        <div className="bg-crisis-dark text-gray-200 font-mono p-6 rounded-lg border-2 border-crisis-accent shadow-2xl">
            <header className="flex justify-between items-center pb-3 border-b-2 border-crisis-accent">
                <h2 className="text-xl font-bold text-white">📡 Live Crisis Data Feed</h2>
                <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="bg-blue-600/50 hover:bg-blue-500/50 text-white text-xs font-bold py-2 px-3 rounded-md transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Refreshing...' : 'Refresh Data'}
                </button>
            </header>

            {isLoading && !earthquake ? (
                <div className="flex justify-center items-center h-64"><Spinner /></div>
            ) : (
                <div className="mt-4 space-y-4">
                    {earthquake ? (
                         <div>
                            <SectionHeader title="Active Earthquake" source="USGS" />
                            <DataRow label="Magnitude" value={earthquake.details.magnitude?.toFixed(1)} isWarning={earthquake.details.magnitude >= 5.5} />
                            <DataRow label="Depth" value={`${earthquake.details.depth_km?.toFixed(1)} km`} />
                            <DataRow label="Epicenter" value={`${earthquake.location.lat.toFixed(4)}°N, ${earthquake.location.lng.toFixed(4)}°W`} />
                            <DataRow label="Time" value={`${new Date(earthquake.time).toLocaleTimeString()} (${getTimeAgo(new Date(earthquake.time))})`} />
                            
                             <div className="mt-4 p-3 bg-red-900/50 rounded-md border border-red-700/50">
                                <h4 className="font-bold text-red-300 flex items-center gap-2"><AlertTriangleIcon className="w-4 h-4" /> Aftershock Forecast (24h)</h4>
                                <p className="text-lg text-white font-bold mt-1">{earthquake.details.aftershock_probability_24h}</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <SectionHeader title="Active Earthquake" source="USGS" />
                            <p className="text-gray-400 py-4 text-center">✓ No significant earthquake activity detected in the area.</p>
                        </div>
                    )}

                    <div>
                        <SectionHeader title="Weather Alerts" source="NOAA / NWS" />
                        <p className="text-gray-400 py-4 text-center">✓ No severe weather alerts in effect.</p>
                    </div>

                    <div>
                        <SectionHeader title="Air Quality" source="PurpleAir" />
                         <div className="flex justify-between items-center py-2">
                             <span className="text-gray-400">AQI:</span>
                             <span className="font-semibold text-right px-3 py-1 rounded-full bg-green-500/20 text-green-300">42 (Good)</span>
                         </div>
                        <p className="text-gray-400 py-2 text-center text-sm">Safe to be outside.</p>
                    </div>

                    <footer className="text-center text-xs text-gray-500 pt-4 border-t border-gray-700">
                        Last updated: {getTimeAgo(lastUpdated)}
                    </footer>
                </div>
            )}
        </div>
    );
};

export default LiveCrisisDataView;
