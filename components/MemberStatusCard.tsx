import React, { useState } from 'react';
import { Member, StatusType } from '../types';
import { ShieldCheckIcon, AlertTriangleIcon, UserIcon, MapIcon } from './icons';
import VoiceNoteHandler from './VoiceNoteHandler';
import { updateMemberLocationSharing } from '../services/mockApiService';

interface MemberStatusCardProps {
  member: Member;
  onMemberUpdate: (updatedMember: Member) => void;
}

const statusConfig = {
  [StatusType.SAFE]: {
    bgColor: 'bg-status-safe/20',
    textColor: 'text-status-safe',
    borderColor: 'border-status-safe',
    icon: <ShieldCheckIcon className="w-6 h-6" />,
    text: 'Safe',
  },
  [StatusType.HELP]: {
    bgColor: 'bg-status-help/20',
    textColor: 'text-status-help',
    borderColor: 'border-status-help',
    icon: <AlertTriangleIcon className="w-6 h-6" />,
    text: 'Needs Help',
  },
  [StatusType.INJURED]: {
    bgColor: 'bg-status-help/20',
    textColor: 'text-status-help',
    borderColor: 'border-status-help',
    icon: <AlertTriangleIcon className="w-6 h-6" />,
    text: 'Injured',
  },
  [StatusType.UNKNOWN]: {
    bgColor: 'bg-status-unknown/20',
    textColor: 'text-status-unknown',
    borderColor: 'border-status-unknown',
    icon: <UserIcon className="w-6 h-6" />,
    text: 'Unknown',
  },
};

const MemberStatusCard: React.FC<MemberStatusCardProps> = ({ member, onMemberUpdate }) => {
  const config = statusConfig[member.status];
  const [isLocationToggleDisabled, setIsLocationToggleDisabled] = useState(false);

  const handleToggleLocation = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isShared = e.target.checked;
    setIsLocationToggleDisabled(true);
    try {
        const updatedMember = await updateMemberLocationSharing(member.id, isShared);
        onMemberUpdate(updatedMember);
    } catch (error) {
        console.error("Failed to update location sharing status", error);
        // In a real app, you might show a toast notification here.
    } finally {
        setIsLocationToggleDisabled(false);
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${config.borderColor} flex flex-col space-y-3 shadow-lg bg-white dark:bg-crisis-light`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{member.name}</h3>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-semibold ${config.bgColor} ${config.textColor}`}>
          {config.icon}
          <span>{config.text}</span>
        </div>
      </div>
      {member.message && (
        <p className="text-gray-600 dark:text-gray-300 italic">"{member.message}"</p>
      )}

      <VoiceNoteHandler member={member} onUpdate={onMemberUpdate} />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
            <MapIcon className="w-4 h-4" />
            <span>Share Location</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={member.isLocationShared}
            onChange={handleToggleLocation}
            disabled={isLocationToggleDisabled}
            className="sr-only peer"
            aria-label={`Share location for ${member.name}`}
          />
          <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
        </label>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-crisis-accent/50">
        Last update: {new Date(member.last_update).toLocaleString()}
      </div>
    </div>
  );
};

export default MemberStatusCard;