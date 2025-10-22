import React, { useEffect } from 'react';
import { ShieldCheckIcon, AlertTriangleIcon } from '../icons';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const config = {
  success: {
    bgColor: 'bg-green-100 dark:bg-green-900/50',
    borderColor: 'border-green-400 dark:border-green-600',
    textColor: 'text-green-800 dark:text-green-200',
    icon: <ShieldCheckIcon className="w-6 h-6" />,
  },
  error: {
    bgColor: 'bg-red-100 dark:bg-red-900/50',
    borderColor: 'border-red-400 dark:border-red-600',
    textColor: 'text-red-800 dark:text-red-200',
    icon: <AlertTriangleIcon className="w-6 h-6" />,
  },
};

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const typeConfig = config[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 7000); // Auto-dismiss after 7 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-5 right-5 w-full max-w-sm p-4 rounded-lg shadow-lg border ${typeConfig.borderColor} ${typeConfig.bgColor} flex items-start space-x-3 z-50 animate-fade-in-down`}>
      <div className={`flex-shrink-0 ${typeConfig.textColor}`}>
        {typeConfig.icon}
      </div>
      <div className="flex-1">
        <p className={`font-semibold ${typeConfig.textColor}`}>{type === 'success' ? 'Success' : 'Error'}</p>
        <p className={`text-sm ${typeConfig.textColor}`}>{message}</p>
      </div>
      <button onClick={onClose} className={`-mt-2 -mr-2 p-2 rounded-full ${typeConfig.textColor} hover:bg-black/10`}>
         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
       <style>{`
        @keyframes fade-in-down {
            0% {
                opacity: 0;
                transform: translateY(-10px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .animate-fade-in-down {
            animation: fade-in-down 0.3s ease-out forwards;
        }
       `}</style>
    </div>
  );
};

export default Notification;
