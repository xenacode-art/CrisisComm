import React, { useEffect, useState } from 'react';
import { PreparednessPlan, PreparednessItem } from '../types';
import { getPreparednessPlan, updatePreparednessItemStatus } from '../services/preparednessService';
import Spinner from './common/Spinner';
import { ShieldCheckIcon, AlertTriangleIcon } from './icons';
import { usePersistentState } from '../hooks/usePersistentState';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const PreparednessDashboard: React.FC = () => {
    const [plan, setPlan] = usePersistentState<PreparednessPlan | null>('preparednessPlan', null);
    const [isLoading, setIsLoading] = useState(true);
    const isOnline = useOnlineStatus();

    useEffect(() => {
        if (!plan && isOnline) {
            getPreparednessPlan().then(data => {
                setPlan(data);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [plan, isOnline, setPlan]);

    const handleStatusChange = async (item: PreparednessItem, newStatus: 'complete' | 'incomplete') => {
        if (!plan || !isOnline) return;

        // Optimistic update
        const originalItems = plan.items;
        const newItems = plan.items.map(i => i.id === item.id ? { ...i, status: newStatus } : i);
        setPlan({ ...plan, items: newItems });

        try {
            await updatePreparednessItemStatus(item.id, newStatus);
        } catch (error) {
            console.error("Failed to update item status", error);
            // Revert on failure
            setPlan({ ...plan, items: originalItems });
        }
    };
    
    if (isLoading) {
        return <div className="p-4 flex justify-center items-center"><Spinner /></div>;
    }

    if (!plan) {
        return <div className="p-4 text-gray-500 dark:text-gray-400">Could not load preparedness plan. Please check your connection.</div>;
    }

    const completedItems = plan.items.filter(i => i.status === 'complete').length;
    const totalItems = plan.items.length;
    const preparednessScore = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return (
        <div className="bg-white dark:bg-crisis-light p-6 rounded-lg shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{plan.name}</h2>
                <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="font-bold text-2xl text-blue-600 dark:text-blue-400">{preparednessScore}% Complete</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{completedItems} of {totalItems} tasks done</p>
                </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-crisis-accent rounded-full h-2.5">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${preparednessScore}%` }}></div>
            </div>

            <div className="space-y-4">
                {plan.items.map(item => (
                    <div key={item.id} className="bg-gray-50 dark:bg-crisis-dark p-4 rounded-lg flex items-start space-x-4">
                        <input
                            type="checkbox"
                            checked={item.status === 'complete'}
                            onChange={(e) => handleStatusChange(item, e.target.checked ? 'complete' : 'incomplete')}
                            disabled={!isOnline}
                            className="mt-1 h-5 w-5 rounded bg-gray-200 dark:bg-crisis-accent border-gray-400 dark:border-gray-500 text-blue-500 focus:ring-blue-600 disabled:cursor-not-allowed"
                        />
                        <div className="flex-1">
                            <h4 className={`font-semibold text-gray-800 dark:text-gray-200 ${item.status === 'complete' ? 'line-through text-gray-500' : ''}`}>{item.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                        </div>
                         {item.status === 'complete' ?
                            <ShieldCheckIcon className="w-6 h-6 text-status-safe" /> :
                            <AlertTriangleIcon className="w-6 h-6 text-status-help" />
                        }
                    </div>
                ))}
                {!isOnline && <p className="text-center text-sm text-yellow-600 dark:text-yellow-400">You are offline. Status changes will not be saved.</p>}
            </div>
        </div>
    );
};

export default PreparednessDashboard;