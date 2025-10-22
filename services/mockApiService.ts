
import { FamilyCircle, Member, StatusType } from '../types';

let mockFamilyCircle: FamilyCircle | null = null;

const initialMemberData: Omit<Member, 'id' | 'phone' | 'name'>[] = [
    {
        status: StatusType.UNKNOWN,
        isLocationShared: true,
        last_update: new Date().toISOString(),
        location: { lat: 37.79, lng: -122.41, accuracy: 50 }, // Near Coit Tower, 50m accuracy
        message: "Haven't heard anything yet."
    },
    {
        status: StatusType.UNKNOWN,
        isLocationShared: true,
        last_update: new Date().toISOString(),
        location: { lat: 37.77, lng: -122.45, accuracy: 150 }, // Near Golden Gate Park, 150m accuracy
        message: "Haven't heard anything yet."
    },
    {
        status: StatusType.UNKNOWN,
        isLocationShared: true,
        last_update: new Date().toISOString(),
        location: { lat: 37.75, lng: -122.42, accuracy: 25 }, // Mission District, 25m accuracy
        message: "Haven't heard anything yet."
    },
    {
        status: StatusType.UNKNOWN,
        isLocationShared: true,
        last_update: new Date().toISOString(),
        location: { lat: 37.80, lng: -122.43, accuracy: 500 }, // Marina, 500m accuracy (poor)
        message: "Haven't heard anything yet."
    },
];

export const createFamilyCircle = (
    name: string,
    members: { name: string; phone: string }[]
): Promise<FamilyCircle> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newMembers: Member[] = members.map((m, i) => ({
                id: `member_${i + 1}`,
                name: m.name,
                phone: m.phone,
                ...(initialMemberData[i] || initialMemberData[0]),
            }));
            
            mockFamilyCircle = {
                id: 'circle_123',
                name,
                members: newMembers,
            };
            resolve(mockFamilyCircle);
        }, 1000);
    });
};

// Simulate live updates for member statuses during a crisis.
export const startCrisisSimulation = (circle: FamilyCircle): (() => void) => {
    const intervalId = setInterval(() => {
        if (!mockFamilyCircle) return;

        // Simulate Mike checking in as SAFE
        const mike = mockFamilyCircle.members.find(m => m.name.includes('Mike'));
        if (mike && mike.status === StatusType.UNKNOWN) {
            mike.status = StatusType.SAFE;
            mike.message = "I'm okay, at home. Shaken up but safe.";
            mike.last_update = new Date().toISOString();
            if (mike.location) mike.location.accuracy = 15; // Improved accuracy on check-in
        }

        // Simulate Emma needing HELP after some time
        const emma = mockFamilyCircle.members.find(m => m.name.includes('Emma'));
        if (emma && emma.status !== StatusType.HELP) {
            const shouldUpdate = Math.random() > 0.7;
            if (shouldUpdate) {
                emma.status = StatusType.HELP;
                emma.message = "Stuck near the office, roads are blocked. Can anyone see a clear path?";
                emma.last_update = new Date().toISOString();
            }
        }
        
        // Simulate Grandma being found by a neighbor as INJURED
        const grandma = mockFamilyCircle.members.find(m => m.name.includes('Grandma'));
        if (grandma && grandma.status !== StatusType.INJURED) {
             const shouldUpdate = Math.random() > 0.85;
            if (shouldUpdate) {
                grandma.status = StatusType.INJURED;
                grandma.message = "Neighbor called. Said she fell and hurt her arm. Needs assistance.";
                grandma.last_update = new Date().toISOString();
            }
        }

    }, 5000); // Update every 5 seconds

    return () => clearInterval(intervalId);
};

export const getFamilyCircle = (): Promise<FamilyCircle | null> => {
    return Promise.resolve(mockFamilyCircle);
};

export const updateMemberVoiceNote = (memberId: string, voiceNoteUrl: string): Promise<Member> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (mockFamilyCircle) {
                const member = mockFamilyCircle.members.find(m => m.id === memberId);
                if (member) {
                    member.voiceNoteUrl = voiceNoteUrl;
                    member.last_update = new Date().toISOString();
                    // If a voice note is added/deleted, clear the old text message for clarity
                    if (voiceNoteUrl) {
                        member.message = "Sent a voice note.";
                    }
                    resolve(member);
                } else {
                    reject(new Error("Member not found"));
                }
            } else {
                reject(new Error("Family circle not found"));
            }
        }, 300);
    });
};

export const updateMemberLocationSharing = (memberId: string, isShared: boolean): Promise<Member> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (mockFamilyCircle) {
                const member = mockFamilyCircle.members.find(m => m.id === memberId);
                if (member) {
                    member.isLocationShared = isShared;
                    member.last_update = new Date().toISOString();
                    resolve(member);
                } else {
                    reject(new Error("Member not found"));
                }
            } else {
                reject(new Error("Family circle not found"));
            }
        }, 300);
    });
};
