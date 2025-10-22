import React from 'react';

const OfflineIndicator: React.FC = () => {
    return (
        <div className="bg-yellow-500 text-black text-center p-2 font-semibold text-sm">
            You are currently offline. Some features may be unavailable.
        </div>
    );
};

export default OfflineIndicator;
