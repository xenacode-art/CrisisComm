import React, { useState } from 'react';
import { FamilyCircle } from '../types';
import { createFamilyCircle } from '../services/mockApiService';
import Spinner from './common/Spinner';
import { UsersIcon, PlusIcon, TrashIcon } from './icons';

interface FamilyCircleSetupProps {
  onCircleCreated: (circle: FamilyCircle) => void;
}

const FamilyCircleSetup: React.FC<FamilyCircleSetupProps> = ({ onCircleCreated }) => {
  const [circleName, setCircleName] = useState('The Johnsons');
  const [members, setMembers] = useState<{ name: string; phone: string }[]>([
    { name: 'Mike Johnson', phone: '+14155551235' },
    { name: 'Emma Johnson', phone: '+15555551236' },
    { name: 'Grandma May', phone: '+14155551237' },
    { name: 'You', phone: '+14155551234' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMember = () => {
    setMembers([...members, { name: '', phone: '' }]);
  };

  const handleMemberChange = (index: number, field: 'name' | 'phone', value: string) => {
    const newMembers = [...members];
    newMembers[index][field] = value;
    setMembers(newMembers);
  };

  const handleRemoveMember = (index: number) => {
    const newMembers = members.filter((_, i) => i !== index);
    setMembers(newMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!circleName.trim() || members.some(m => !m.name.trim() || !m.phone.trim())) {
      setError('Please fill in all fields for the circle and its members.');
      return;
    }
    setIsLoading(true);
    try {
      const newCircle = await createFamilyCircle(circleName, members);
      onCircleCreated(newCircle);
    } catch (err) {
      setError('Failed to create family circle. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-crisis-dark">
      <div className="w-full max-w-2xl mx-auto bg-white dark:bg-crisis-light shadow-2xl rounded-2xl p-8 space-y-8">
        <div className="text-center">
            <UsersIcon className="w-16 h-16 mx-auto text-blue-500 dark:text-blue-400 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Create Your Family Circle</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Establish a communication hub for your loved ones in case of an emergency.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="circleName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Family/Circle Name
            </label>
            <input
              id="circleName"
              type="text"
              value={circleName}
              onChange={(e) => setCircleName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-crisis-accent border border-gray-300 dark:border-gray-600 rounded-md p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="e.g., The Johnson Family"
              required
            />
          </div>

          <div className="space-y-4">
             <h3 className="text-lg font-medium text-gray-800 dark:text-gray-300">Members</h3>
            {members.map((member, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-gray-100 dark:bg-crisis-accent/50 p-3 rounded-lg">
                <input
                  type="text"
                  placeholder="Name"
                  value={member.name}
                  onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                  className="w-full sm:flex-1 bg-white dark:bg-crisis-dark border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone (e.g., +1...)"
                  value={member.phone}
                  onChange={(e) => handleMemberChange(index, 'phone', e.target.value)}
                  className="w-full sm:flex-1 bg-white dark:bg-crisis-dark border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => handleRemoveMember(index)}
                  className="p-2 self-center sm:self-auto text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10"
                  aria-label="Remove member"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddMember}
              className="w-full flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400 border-2 border-dashed border-gray-400 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-700 dark:hover:text-white hover:bg-blue-500/10 rounded-lg p-3 transition"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Member</span>
            </button>
          </div>
          
          {error && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-4 px-4 rounded-lg text-lg transition-transform transform hover:scale-105"
          >
            {isLoading ? <Spinner /> : 'Create Circle & Send Invites'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FamilyCircleSetup;