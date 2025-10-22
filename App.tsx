import React, { useState, useEffect, useCallback, useMemo, Dispatch, SetStateAction, useRef } from 'react';
import FamilyCircleSetup from './components/FamilyCircleSetup';
import { FamilyCircle, CrisisData, MultiAgentAIResponse, Coordinates, Member, CrisisEvent } from './types';
import { getFamilyCircle, startCrisisSimulation } from './services/mockApiService';
import { fetchEarthquakeData } from './services/usgsService';
import { generateMultiAgentResponse } from './services/geminiService';
import { usePersistentState } from './hooks/usePersistentState';
import { useOnlineStatus } from './hooks/useOnlineStatus';

import Spinner from './components/common/Spinner';
import MemberStatusCard from './components/MemberStatusCard';
import FamilyMapView from './components/FamilyMapView';
import AiPlanView from './components/AiPlanView';
import { AiIcon, SunIcon, MoonIcon, AlertTriangleIcon, UsersIcon, MapIcon, RssIcon, MessageCircleIcon, LogOutIcon } from './components/icons';
import PreparednessDashboard from './components/PreparednessDashboard';
import LiveCrisisDataView from './components/LiveCrisisDataView';
import OfflineIndicator from './components/OfflineIndicator';
import SmsCheckinSimulator from './components/SmsCheckinSimulator';
import Notification from './components/common/Notification';

const DEFAULT_LOCATION: Coordinates = { lat: 37.7749, lng: -122.4194 }; // San Francisco City Hall

type View = 'crisis' | 'preparedness';
type CrisisTab = 'status' | 'sms' | 'map' | 'ai' | 'data';

const useTheme = (): [string, () => void] => {
    const [theme, setTheme] = usePersistentState<string>('theme', 'dark');

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    return [theme, toggleTheme];
};

const App: React.FC = () => {
  const [familyCircle, setFamilyCircle] = usePersistentState<FamilyCircle | null>('familyCircle', null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const isOnline = useOnlineStatus();
  const [theme, toggleTheme] = useTheme();

  // Ref to hold the simulation cleanup function to prevent race conditions on exit.
  const stopSimulationRef = useRef<(() => void) | null>(null);

  const handleCircleCreated = (circle: FamilyCircle) => {
    const invitedMembers = circle.members
        .filter(m => m.name.toLowerCase() !== 'you')
        .map(m => m.name);
    
    let message = 'Circle created successfully!';
    if (invitedMembers.length > 0) {
        message += ` Simulated SMS invitations have been sent to ${invitedMembers.join(', ')}.`;
    }

    setNotification(message);
    setFamilyCircle(circle);
  };

  const handleExit = () => {
      // 1. Manually and synchronously stop the simulation to prevent race conditions.
      if (stopSimulationRef.current) {
          stopSimulationRef.current();
          stopSimulationRef.current = null;
      }
      // 2. Clear the family circle to return to the setup screen.
      setFamilyCircle(null);
  };

  // Effect for initial family circle loading
  useEffect(() => {
    if (familyCircle) {
        setIsLoading(false);
    } else {
        getFamilyCircle().then(circle => {
            if (circle) setFamilyCircle(circle);
            setIsLoading(false);
        });
    }
  }, [familyCircle, setFamilyCircle]);

  // Effect for fetching user location based on online status
  useEffect(() => {
    setIsLocationLoading(true);
    if (isOnline && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
                setIsLocationLoading(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                setLocationError("Could not get your location, using a default. Enable location services for better results.");
                setUserLocation(DEFAULT_LOCATION);
                setIsLocationLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        if (!isOnline) {
             setLocationError("Location services unavailable offline. Using last known or default location.");
        } else {
             setLocationError("Geolocation is not supported by your browser. Using a default location.");
        }
        setUserLocation(DEFAULT_LOCATION);
        setIsLocationLoading(false);
    }
  }, [isOnline]);

  // Subscribe to the background data simulation when the dashboard is active.
  const hasCircle = !!familyCircle;
  useEffect(() => {
    if (hasCircle && isOnline) {
      // The service will "push" updates to us via this callback.
      // Store the cleanup function in the ref.
      stopSimulationRef.current = startCrisisSimulation((updatedCircle) => {
        setFamilyCircle(updatedCircle);
      });
    }
    // The cleanup function will run when the dependencies change,
    // or when the component unmounts.
    return () => {
      if (stopSimulationRef.current) {
          stopSimulationRef.current();
          stopSimulationRef.current = null;
      }
    };
  }, [hasCircle, isOnline, setFamilyCircle]);

  if (isLoading || isLocationLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-crisis-dark flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-crisis-dark text-gray-800 dark:text-gray-200 font-sans">
      {notification && <Notification message={notification} type="success" onClose={() => setNotification(null)} />}
      {!isOnline && <OfflineIndicator />}
      {familyCircle ? (
        <DashboardContainer 
            familyCircle={familyCircle}
            onFamilyCircleUpdate={setFamilyCircle}
            userLocation={userLocation!}
            locationError={locationError}
            onExit={handleExit}
            theme={theme}
            toggleTheme={toggleTheme}
        />
      ) : (
        <FamilyCircleSetup onCircleCreated={handleCircleCreated} />
      )}
    </div>
  );
};

const DashboardContainer: React.FC<{ 
    familyCircle: FamilyCircle,
    onFamilyCircleUpdate: Dispatch<SetStateAction<FamilyCircle | null>>,
    userLocation: Coordinates,
    locationError: string | null,
    onExit: () => void;
    theme: string;
    toggleTheme: () => void;
}> = ({ familyCircle, onFamilyCircleUpdate, userLocation, locationError, onExit, theme, toggleTheme }) => {
    const [view, setView] = useState<View>('crisis');

    return (
        <main className="p-4 lg:p-6 space-y-6">
            <header className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 text-center sm:text-left">Crisis Command Center: <span className="text-blue-600 dark:text-blue-400">{familyCircle.name}</span></h1>
                <div className="flex items-center space-x-2">
                    <nav className="flex space-x-2 p-1 bg-gray-200 dark:bg-crisis-accent rounded-lg">
                        <button onClick={() => setView('crisis')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${view === 'crisis' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-crisis-light'}`}>
                            Live Crisis View
                        </button>
                        <button onClick={() => setView('preparedness')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${view === 'preparedness' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-crisis-light'}`}>
                            Preparedness Plan
                        </button>
                    </nav>
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg bg-gray-200 dark:bg-crisis-accent text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-crisis-light transition"
                        aria-label="Toggle theme"
                    >
                        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={onExit}
                        className="p-2 rounded-lg bg-gray-200 dark:bg-crisis-accent text-gray-700 dark:text-gray-300 hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-500/20 transition"
                        aria-label="Exit and Reset Circle"
                        title="Exit and Reset Circle"
                    >
                        <LogOutIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>
            {locationError && (
                 <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg flex items-center gap-3">
                    <AlertTriangleIcon className="w-5 h-5" />
                    <p className="text-sm font-medium">{locationError}</p>
                 </div>
            )}
            {view === 'crisis' ? <CrisisView familyCircle={familyCircle} onFamilyCircleUpdate={onFamilyCircleUpdate} userLocation={userLocation} /> : <PreparednessDashboard />}
        </main>
    )
}

const TabButton: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }> = ({ icon, label, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-all duration-200 ${
                isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-crisis-accent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-crisis-light'
            }`}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
};


const CrisisView: React.FC<{ 
    familyCircle: FamilyCircle, 
    onFamilyCircleUpdate: Dispatch<SetStateAction<FamilyCircle | null>>,
    userLocation: Coordinates 
}> = ({ familyCircle, onFamilyCircleUpdate, userLocation }) => {
    const [crisisData, setCrisisData] = usePersistentState<CrisisData>('crisisData', { live_crisis_events: [] });
    const [aiResponse, setAiResponse] = usePersistentState<MultiAgentAIResponse | null>('aiResponse', null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isCrisisDataLoading, setIsCrisisDataLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<CrisisTab>('status');
    const isOnline = useOnlineStatus();

    const fetchCrisisData = useCallback(async () => {
        if (!isOnline) {
            setIsCrisisDataLoading(false);
            return;
        }
        setIsCrisisDataLoading(true);
        const earthquakeEvents = await fetchEarthquakeData(userLocation);
        // const weatherEvents = await fetchWeatherAlerts(userLocation);
        setCrisisData({ live_crisis_events: [...earthquakeEvents] });
        setIsCrisisDataLoading(false);
    }, [userLocation, isOnline, setCrisisData]);

    // Fetch live crisis data
    useEffect(() => {
        fetchCrisisData();
    }, [fetchCrisisData]);

    const handleGeneratePlan = useCallback(async () => {
        if (!isOnline) {
            alert("Cannot generate AI plan while offline.");
            return;
        }
        setIsAiLoading(true);
        try {
            const response = await generateMultiAgentResponse(familyCircle, crisisData, userLocation);
            setAiResponse(response);
            setActiveTab('ai'); // Switch to AI tab after generation
        } catch (error) {
            console.error(error);
            alert((error as Error).message);
        } finally {
            setIsAiLoading(false);
        }
    }, [familyCircle, crisisData, userLocation, isOnline, setAiResponse]);
    
    const handleMemberUpdate = (updatedMember: Member) => {
        onFamilyCircleUpdate(currentCircle => {
            if (!currentCircle) return null;
            return {
                ...currentCircle,
                members: currentCircle.members.map(m => m.id === updatedMember.id ? updatedMember : m),
            };
        });
    };

    const meetupPoints = useMemo(() => aiResponse?.logistics_plan.meetup_points || [], [aiResponse]);
    
    const renderContent = () => {
        switch (activeTab) {
            case 'status':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {familyCircle.members.map(member => (
                            <MemberStatusCard key={member.id} member={member} onMemberUpdate={handleMemberUpdate} />
                        ))}
                    </div>
                );
            case 'sms':
                return <SmsCheckinSimulator members={familyCircle.members} onMemberUpdate={handleMemberUpdate} />;
            case 'map':
                return (
                    <div className="h-[55vh] sm:h-[65vh] bg-white dark:bg-crisis-light rounded-lg overflow-hidden shadow-lg">
                        {(isCrisisDataLoading && isOnline) ? <Spinner /> : <FamilyMapView members={familyCircle.members} crisisEvents={crisisData.live_crisis_events} meetupPoints={meetupPoints} />}
                    </div>
                );
            case 'ai':
                 return <AiPlanView response={aiResponse} isLoading={isAiLoading} onRegenerate={handleGeneratePlan} />;
            case 'data':
                return <LiveCrisisDataView crisisEvents={crisisData.live_crisis_events} userLocation={userLocation} isLoading={isCrisisDataLoading && isOnline} onRefresh={fetchCrisisData} />;
            default:
                return null;
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-crisis-light p-4 rounded-lg shadow-md space-y-4">
                 <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                     <nav className="w-full md:w-auto flex items-center gap-2 p-2 bg-gray-200/50 dark:bg-crisis-dark/50 rounded-xl">
                        <TabButton icon={<UsersIcon className="w-5 h-5"/>} label="Status" isActive={activeTab === 'status'} onClick={() => setActiveTab('status')} />
                        <TabButton icon={<MessageCircleIcon className="w-5 h-5"/>} label="SMS" isActive={activeTab === 'sms'} onClick={() => setActiveTab('sms')} />
                        <TabButton icon={<MapIcon className="w-5 h-5"/>} label="Map" isActive={activeTab === 'map'} onClick={() => setActiveTab('map')} />
                        <TabButton icon={<AiIcon className="w-5 h-5"/>} label="AI Plan" isActive={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
                        <TabButton icon={<RssIcon className="w-5 h-5"/>} label="Data Feed" isActive={activeTab === 'data'} onClick={() => setActiveTab('data')} />
                     </nav>
                     <button 
                        onClick={handleGeneratePlan}
                        disabled={isAiLoading || !isOnline}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition"
                        title={!isOnline ? "Unavailable while offline" : ""}
                    >
                        <AiIcon className="w-5 h-5" />
                        {isAiLoading ? 'Analyzing...' : (aiResponse ? 'Regenerate AI Plan' : 'Generate AI Plan')}
                     </button>
                </div>
            </div>

            <div className="mt-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default App;