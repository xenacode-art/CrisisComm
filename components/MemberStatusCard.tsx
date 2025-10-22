
import React from 'react';
import { Member, StatusType } from '../types';
import { ShieldCheckIcon, AlertTriangleIcon, UserIcon } from './icons';
import VoiceNoteHandler from './VoiceNoteHandler';

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

  return (
    <div className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor} flex flex-col space-y-3 shadow-lg`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-100">{member.name}</h3>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-semibold ${config.bgColor} ${config.textColor}`}>
          {config.icon}
          <span>{config.text}</span>
        </div>
      </div>
      {member.message && (
        <p className="text-gray-300 italic">"{member.message}"</p>
      )}

      <VoiceNoteHandler member={member} onUpdate={onMemberUpdate} />

      <div className="text-xs text-gray-400 pt-2 border-t border-crisis-accent/50">
        Last update: {new Date(member.last_update).toLocaleString()}
      </div>
    </div>
  );
};

export default MemberStatusCard;