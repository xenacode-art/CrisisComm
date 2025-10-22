
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FamilyCircleSetup from './components/FamilyCircleSetup';
import { FamilyCircle, CrisisData, MultiAgentAIResponse, Coordinates, Member } from './types';
import { getFamilyCircle, startCrisisSimulation } from './services/mockApiService';
import { fetchEarthquakeData } from './services/usgsService';
// import { fetchWeatherAlerts } from './services/noaaService';
import { generateMultiAgentResponse } from './services/geminiService';

import Spinner from './components/common/Spinner';
import MemberStatusCard from './components/MemberStatusCard';
import FamilyMapView from './components/FamilyMapView';
import AiPlanView from './components/AiPlanView';
import { AiIcon } from './components/icons';
import PreparednessDashboard from './components/PreparednessDashboard';

const USER_LOCATION: Coordinates = { lat: 37.7749, lng: -122.4194 }; // San Francisco City Hall

type View = 'crisis' | 'preparedness';

const App: React.FC = () => {
  const [familyCircle, setFamilyCircle] = useState<FamilyCircle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getFamilyCircle().then(circle => {
      setFamilyCircle(circle);
      setIsLoading(false);
    });
  }, []);

  const handleCircleCreated = (circle: FamilyCircle) => {
    setFamilyCircle(circle);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-crisis-dark flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-crisis-dark text-gray-200 font-sans">
      {familyCircle ? (
        <DashboardContainer initialFamilyCircle={familyCircle} />
      ) : (
        <FamilyCircleSetup onCircleCreated={handleCircleCreated} />
      )}
    </div>
  );
};

const DashboardContainer: React.FC<{ initialFamilyCircle: FamilyCircle }> = ({ initialFamilyCircle }) => {
    const [view, setView] = useState<View>('crisis');

    return (
        <main className="p-4 lg:p-6 space-y-6">
            <header className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <h1 className="text-3xl font-bold text-gray-100">Crisis Command Center: <span className="text-blue-400">{initialFamilyCircle.name}</span></h1>
                <nav className="flex space-x-2 p-1 bg-crisis-accent rounded-lg">
                    <button onClick={() => setView('crisis')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${view === 'crisis' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-crisis-light'}`}>
                        Live Crisis View
                    </button>
                    <button onClick={() => setView('preparedness')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${view === 'preparedness' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-crisis-light'}`}>
                        Preparedness Plan
                    </button>
                </nav>
            </header>
            {view === 'crisis' ? <CrisisView familyCircle={initialFamilyCircle} /> : <PreparednessDashboard />}
        </main>
    )
}

const CrisisView: React.FC<{ familyCircle: FamilyCircle }> = ({ familyCircle: initialFamilyCircle }) => {
    const [familyCircle, setFamilyCircle] = useState<FamilyCircle>(initialFamilyCircle);
    const [crisisData, setCrisisData] = useState<CrisisData>({ live_crisis_events: [] });
    const [aiResponse, setAiResponse] = useState<MultiAgentAIResponse | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isCrisisDataLoading, setIsCrisisDataLoading] = useState(true);
    
    // Simulate live member status updates
    useEffect(() => {
        const stopSimulation = startCrisisSimulation(initialFamilyCircle);
        const interval = setInterval(() => {
            getFamilyCircle().then(circle => {
                if (circle) setFamilyCircle(c => ({...c, members: c.members.map(m => circle.members.find(nm => nm.id === m.id) || m) }));
            });
        }, 2000);

        return () => {
            stopSimulation();
            clearInterval(interval);
        };
    }, [initialFamilyCircle]);

    // Fetch live crisis data
    useEffect(() => {
        const fetchCrisisData = async () => {
            setIsCrisisDataLoading(true);
            const earthquakeEvents = await fetchEarthquakeData(USER_LOCATION);
            // const weatherEvents = await fetchWeatherAlerts(USER_LOCATION);
            setCrisisData({ live_crisis_events: [...earthquakeEvents] });
            setIsCrisisDataLoading(false);
        };
        fetchCrisisData();
    }, []);

    const handleGeneratePlan = useCallback(async () => {
        setIsAiLoading(true);
        try {
            const response = await generateMultiAgentResponse(familyCircle, crisisData, USER_LOCATION);
            setAiResponse(response);
        } catch (error) {
            console.error(error);
            alert((error as Error).message);
        } finally {
            setIsAiLoading(false);
        }
    }, [familyCircle, crisisData]);
    
    const handleMemberUpdate = (updatedMember: Member) => {
        setFamilyCircle(currentCircle => ({
            ...currentCircle,
            members: currentCircle.members.map(m => m.id === updatedMember.id ? updatedMember : m),
        }));
    };

    const meetupPoints = useMemo(() => aiResponse?.logistics_plan.meetup_points || [], [aiResponse]);

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                 <button 
                    onClick={handleGeneratePlan}
                    disabled={isAiLoading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                    <AiIcon className="w-5 h-5" />
                    {isAiLoading ? 'Analyzing...' : (aiResponse ? 'Regenerate AI Plan' : 'Generate AI Plan')}
                 </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="lg:col-span-1 space-y-4">
                     <h2 className="text-xl font-semibold text-gray-300 border-b-2 border-crisis-accent pb-2">Family Status</h2>
                    {familyCircle.members.map(member => (
                        <MemberStatusCard key={member.id} member={member} onMemberUpdate={handleMemberUpdate} />
                    ))}
                </section>
                
                <section className="lg:col-span-2 space-y-4">
                     <h2 className="text-xl font-semibold text-gray-300 border-b-2 border-crisis-accent pb-2">Live Situation Map</h2>
                     <div className="h-[500px] bg-crisis-light rounded-lg overflow-hidden shadow-lg">
                        {isCrisisDataLoading ? <Spinner /> : <FamilyMapView members={familyCircle.members} crisisEvents={crisisData.live_crisis_events} meetupPoints={meetupPoints} />}
                     </div>
                </section>
            </div>
            
             <section className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-300 border-b-2 border-crisis-accent pb-2">AI-Generated Action Plan</h2>
                <AiPlanView response={aiResponse} isLoading={isAiLoading} onRegenerate={handleGeneratePlan} />
             </section>
        </div>
    );
};

export default App;