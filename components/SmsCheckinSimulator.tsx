import React, { useState } from 'react';
import { Member, StatusType } from '../types';
import { parseSmsMessage } from '../services/geminiService';
import { updateMemberStatus } from '../services/mockApiService';
import Spinner from './common/Spinner';
import { MessageCircleIcon } from './icons';

interface SmsCheckinSimulatorProps {
  members: Member[];
  onMemberUpdate: (updatedMember: Member) => void;
}

interface MessageLog {
    id: number;
    name: string;
    originalMessage: string;
    parsedStatus: StatusType;
    parsedSummary: string;
    timestamp: string;
}

const SmsCheckinSimulator: React.FC<SmsCheckinSimulatorProps> = ({ members, onMemberUpdate }) => {
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageLog, setMessageLog] = useState<MessageLog[]>([]);
  
  const defaultMessages = [
    "I'm safe at home. Power is out but we're okay.",
    "Help, we're stuck at the bridge on 5th street. The road is flooded.",
    "I fell and hurt my leg pretty bad. I'm at the library. Need medical attention.",
    "we are fine",
  ];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedMemberId) {
        setError("Please select a member and enter a message.");
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
        const { status, summary } = await parseSmsMessage(message);
        const updatedMember = await updateMemberStatus(selectedMemberId, status, summary);
        onMemberUpdate(updatedMember);

        // Add to log
        const logEntry: MessageLog = {
            id: Date.now(),
            name: updatedMember.name,
            originalMessage: message,
            parsedStatus: status,
            parsedSummary: summary,
            timestamp: new Date().toLocaleTimeString(),
        };
        setMessageLog(prevLog => [logEntry, ...prevLog]);
        setMessage(''); // Clear input on success

    } catch (err) {
        setError((err as Error).message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-crisis-light p-6 rounded-lg shadow-lg space-y-6">
      <div className="text-center">
        <MessageCircleIcon className="w-12 h-12 mx-auto text-blue-500 dark:text-blue-400 mb-2" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">SMS Check-in Simulator</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Simulate a family member sending an SMS check-in. The AI will parse the message and update their status automatically.
        </p>
      </div>

      <form onSubmit={handleSendMessage} className="space-y-4">
        <div>
          <label htmlFor="member-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            From
          </label>
          <select
            id="member-select"
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full bg-gray-50 dark:bg-crisis-accent border border-gray-300 dark:border-gray-600 rounded-md p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <div>
            <label htmlFor="message-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SMS Message
            </label>
            <textarea
                id="message-input"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g., 'I'm okay, at the office.' or 'Need help, road is blocked.'"
                className="w-full bg-gray-50 dark:bg-crisis-accent border border-gray-300 dark:border-gray-600 rounded-md p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
        </div>
        
        <div className="flex flex-wrap gap-2">
            {defaultMessages.map(msg => (
                <button type="button" key={msg} onClick={() => setMessage(msg)} className="text-xs bg-gray-200 dark:bg-crisis-accent/50 hover:bg-gray-300 dark:hover:bg-crisis-accent text-gray-700 dark:text-gray-300 rounded-full px-3 py-1 transition">
                    "{msg}"
                </button>
            ))}
        </div>

        {error && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition"
        >
          {isLoading ? <Spinner /> : 'Simulate Receiving SMS'}
        </button>
      </form>
      
      {messageLog.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-crisis-accent">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Incoming Message Log</h3>
            <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                {messageLog.map(log => (
                    <div key={log.id} className="bg-gray-50 dark:bg-crisis-dark p-3 rounded-lg">
                        <p className="text-sm italic text-gray-700 dark:text-gray-200">"{log.originalMessage}"</p>
                        <div className="text-xs mt-2 text-gray-500 dark:text-gray-400 flex justify-between items-center">
                            <span>From: <strong>{log.name}</strong> at {log.timestamp}</span>
                            <span className={`font-bold px-2 py-0.5 rounded-full ${
                                log.parsedStatus === StatusType.SAFE ? 'bg-status-safe/20 text-status-safe' : 'bg-status-help/20 text-status-help'
                            }`}>
                                AI Parsed Status: {log.parsedStatus}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default SmsCheckinSimulator;
