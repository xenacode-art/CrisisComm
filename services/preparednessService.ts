
import { PreparednessPlan, PreparednessItem } from '../types';

const mockPlan: PreparednessPlan = {
  id: 'plan_1',
  name: 'Family Earthquake Preparedness Plan',
  items: [
    {
      id: 'item_1',
      category: 'Supplies',
      name: '72-Hour Emergency Kit',
      status: 'incomplete',
      description: 'A kit with water, non-perishable food, flashlight, radio, first-aid supplies, and medications for at least 3 days.',
    },
    {
      id: 'item_2',
      category: 'Supplies',
      name: 'Water Storage',
      status: 'incomplete',
      description: 'Store at least one gallon of water per person, per day for three days.',
    },
    {
      id: 'item_3',
      category: 'Home Safety',
      name: 'Secure Heavy Furniture',
      status: 'complete',
      description: 'Anchor bookcases, entertainment centers, and other tall furniture to wall studs.',
    },
    {
      id: 'item_4',
      category: 'Communication',
      name: 'Out-of-State Contact',
      status: 'complete',
      description: 'Designate a relative or friend outside the area as a central contact point for all family members to check in with.',
    },
    {
      id: 'item_5',
      category: 'Drills',
      name: 'Drop, Cover, and Hold On Drill',
      status: 'incomplete',
      description: 'Practice this drill with all family members at least twice a year.',
    },
    {
        id: 'item_6',
        category: 'Documents',
        name: 'Emergency Document Copies',
        status: 'incomplete',
        description: 'Keep digital and physical copies of important documents (ID, insurance, bank records) in a waterproof container.',
    },
  ],
};

export const getPreparednessPlan = (): Promise<PreparednessPlan> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockPlan);
    }, 500);
  });
};

export const updatePreparednessItemStatus = (
  itemId: string,
  status: 'complete' | 'incomplete'
): Promise<PreparednessItem> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const item = mockPlan.items.find((i) => i.id === itemId);
      if (item) {
        item.status = status;
        resolve(item);
      } else {
        reject(new Error('Item not found'));
      }
    }, 300);
  });
};
