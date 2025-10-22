import React, { useState } from 'react';
import { MultiAgentAIResponse } from '../types';
import Spinner from './common/Spinner';
import { ShieldCheckIcon, AlertTriangleIcon, UserIcon, MapIcon, RouteIcon, AiIcon, PlusIcon, TrashIcon, TrophyIcon, UsersIcon } from './icons';

interface AiPlanViewProps {
  response: MultiAgentAIResponse | null;
  isLoading: boolean;
  onRegenerate: () => void;
}

const Section: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="bg-white dark:bg-crisis-dark rounded-lg overflow-hidden border border-gray-200 dark:border-transparent">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 bg-gray-100 dark:bg-crisis-accent/50">
                <div className="flex items-center space-x-3">
                    {icon}
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h4>
                </div>
                <svg className={`w-6 h-6 text-gray-500 dark:text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && <div className="p-4 space-y-3">{children}</div>}
        </div>
    );
};

const AiPlanView: React.FC<AiPlanViewProps> = ({ response, isLoading, onRegenerate }) => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-10 bg-gray-50 dark:bg-crisis-light rounded-lg">
                <Spinner />
                <p className="mt-4 text-gray-700 dark:text-gray-300">AI Crisis Team is analyzing the situation...</p>
                <p className="text-sm text-gray-500">This may take a moment.</p>
            </div>
        );
    }

    if (!response) {
        return (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-crisis-light rounded-lg">
                <p>No AI plan generated yet. Click the button to get an assessment.</p>
                <button onClick={onRegenerate} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Generate Plan
                </button>
            </div>
        );
    }
    
    const { triage_analysis, logistics_plan, medical_assessment, prediction_forecast, synthesized_plan } = response;

    return (
        <div className="bg-white dark:bg-crisis-light p-6 rounded-lg shadow-lg space-y-6">
            <div className="p-4 rounded-lg bg-red-100/50 dark:bg-red-900/50 border border-red-200 dark:border-red-700">
                <h3 className={`text-xl font-bold mb-3 text-red-800 dark:text-red-300`}>
                    Urgency: {synthesized_plan.urgency_level} - Top Priority Actions
                </h3>
                <ul className="list-decimal list-inside space-y-2 text-gray-800 dark:text-gray-200 font-semibold">
                    {synthesized_plan.priority_actions.map((action, i) => <li key={i}>{action}</li>)}
                </ul>
                 <p className="mt-4 text-gray-600 dark:text-gray-400 italic">{synthesized_plan.reassurance_message}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Section title="Triage Assessment" icon={<UsersIcon className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />}>
                     <p className="text-gray-600 dark:text-gray-400 italic mb-3">{triage_analysis.assessment}</p>
                    {triage_analysis.priority_list.map(p => (
                        <div key={p.name} className="border-l-4 border-gray-300 dark:border-crisis-accent pl-3">
                            <p className="font-bold text-gray-800 dark:text-gray-200">{p.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{p.reason}</p>
                        </div>
                    ))}
                </Section>

                <Section title="Medical Needs" icon={<PlusIcon className="w-6 h-6 text-red-500 dark:text-red-400" />}>
                    <p className="text-gray-600 dark:text-gray-400 italic mb-3">{medical_assessment.overall_recommendation}</p>
                    {medical_assessment.member_assessments.map(m => (
                         <div key={m.name} className="border-l-4 border-red-500/30 dark:border-red-500/50 pl-3">
                            <p className="font-bold text-gray-800 dark:text-gray-200">{m.name}: <span className="font-normal text-red-700 dark:text-red-300">{m.needs}</span></p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Instruction: {m.instructions}</p>
                        </div>
                    ))}
                </Section>
                
                <Section title="Logistics & Evacuation" icon={<RouteIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" />}>
                     <p className="text-gray-600 dark:text-gray-400 italic mb-3">{logistics_plan.movement_plan}</p>
                     <h5 className="font-semibold text-gray-700 dark:text-gray-300 mt-4">Recommended Meetup Point:</h5>
                     {logistics_plan.meetup_points.map(p => (
                         <div key={p.rank} className="p-3 bg-gray-50 dark:bg-crisis-dark/50 rounded-md">
                            <p className="font-bold text-blue-700 dark:text-blue-300">{p.rank}. {p.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{p.address}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 italic">Reason: {p.reason}</p>
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-crisis-accent/50">
                                <h6 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Routes</h6>
                                <div className="space-y-2 mt-1">
                                    {p.routes.map(memberRoute => (
                                        <div key={memberRoute.memberName} className={`p-2 rounded-md ${memberRoute.route.viable ? 'bg-green-100 dark:bg-green-500/10' : 'bg-red-100 dark:bg-red-500/10'}`}>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-bold text-gray-800 dark:text-gray-200">{memberRoute.memberName}</span>
                                                {memberRoute.route.viable 
                                                    ? <span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-1"><ShieldCheckIcon className="w-4 h-4" /> Viable</span>
                                                    : <span className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1"><AlertTriangleIcon className="w-4 h-4" /> Not Viable</span>
                                                }
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {memberRoute.route.duration}, {memberRoute.route.distance}, Traffic: {memberRoute.route.traffic_level}
                                            </p>
                                            {memberRoute.route.hazards.length > 0 && (
                                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                    Hazards: {memberRoute.route.hazards.join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                         </div>
                     ))}
                </Section>
                
                <Section title="Forecast &amp; Hazards" icon={<AlertTriangleIcon className="w-6 h-6 text-purple-500 dark:text-purple-400" />}>
                    <h5 className="font-semibold text-gray-700 dark:text-gray-300">Timeline:</h5>
                    {prediction_forecast.timeline.map(t => (
                        <p key={t.time} className="text-sm text-gray-600 dark:text-gray-400"><span className="font-bold text-gray-800 dark:text-gray-300">{t.time}:</span> {t.prediction}</p>
                    ))}
                    <h5 className="font-semibold text-gray-700 dark:text-gray-300 mt-4">Secondary Hazards:</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{prediction_forecast.secondary_hazards.join(', ')}</p>
                </Section>
            </div>
        </div>
    );
};

export default AiPlanView;