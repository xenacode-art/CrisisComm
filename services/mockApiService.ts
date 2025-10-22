
import { FamilyCircle, Member, StatusType, VoiceNote } from '../types';

let mockFamilyCircle: FamilyCircle | null = null;

const initialMemberData: Omit<Member, 'id' | 'phone' | 'name'>[] = [
    {
        status: StatusType.UNKNOWN,
        isLocationShared: true,
        last_update: new Date().toISOString(),
        location: { lat: 37.79, lng: -122.41, accuracy: 50 }, // Near Coit Tower, 50m accuracy
        message: "Haven't heard anything yet.",
        voiceNotes: [],
    },
    {
        status: StatusType.UNKNOWN,
        isLocationShared: true,
        last_update: new Date().toISOString(),
        location: { lat: 37.77, lng: -122.45, accuracy: 150 }, // Near Golden Gate Park, 150m accuracy
        message: "Haven't heard anything yet.",
        voiceNotes: [],
    },
    {
        status: StatusType.UNKNOWN,
        isLocationShared: true,
        last_update: new Date().toISOString(),
        location: { lat: 37.75, lng: -122.42, accuracy: 25 }, // Mission District, 25m accuracy
        message: "Haven't heard anything yet.",
        voiceNotes: [],
    },
    {
        status: StatusType.UNKNOWN,
        isLocationShared: true,
        last_update: new Date().toISOString(),
        location: { lat: 37.80, lng: -122.43, accuracy: 500 }, // Marina, 500m accuracy (poor)
        message: "Haven't heard anything yet.",
        voiceNotes: [],
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

        let membersChanged = false;
        
        const newMembers = mockFamilyCircle.members.map(member => {
            let updatedMember = { ...member }; // Start with a shallow copy

            // Simulate Mike checking in as SAFE
            if (member.name.includes('Mike') && member.status === StatusType.UNKNOWN) {
                updatedMember.status = StatusType.SAFE;
                updatedMember.message = "I'm okay, at home. Shaken up but safe.";
                updatedMember.last_update = new Date().toISOString();
                if (updatedMember.location) {
                    updatedMember.location = { ...updatedMember.location, accuracy: 15 };
                }
                membersChanged = true;
            }

            // Simulate Emma needing HELP after some time
            if (member.name.includes('Emma') && member.status !== StatusType.HELP) {
                if (Math.random() > 0.7) {
                    updatedMember.status = StatusType.HELP;
                    updatedMember.message = "Stuck near the office, roads are blocked. Can anyone see a clear path?";
                    updatedMember.last_update = new Date().toISOString();
                    membersChanged = true;
                }
            }
            
            // Simulate Grandma being found by a neighbor as INJURED
            if (member.name.includes('Grandma') && member.status !== StatusType.INJURED) {
                 if (Math.random() > 0.85) {
                    updatedMember.status = StatusType.INJURED;
                    updatedMember.message = "Neighbor called. Said she fell and hurt her arm. Needs assistance.";
                    updatedMember.last_update = new Date().toISOString();
                    membersChanged = true;
                }
            }
            
            return updatedMember;
        });

        if (membersChanged) {
             mockFamilyCircle = {
                ...mockFamilyCircle,
                members: newMembers,
            };
        }

    }, 5000); // Update every 5 seconds

    return () => clearInterval(intervalId);
};

export const getFamilyCircle = (): Promise<FamilyCircle | null> => {
    // Return a deep copy to prevent accidental mutation of the mock source
    return Promise.resolve(mockFamilyCircle ? JSON.parse(JSON.stringify(mockFamilyCircle)) : null);
};

export const addMemberVoiceNote = (memberId: string, voiceNoteUrl: string): Promise<Member> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (mockFamilyCircle) {
                let updatedMember: Member | null = null;
                const newMembers = mockFamilyCircle.members.map(m => {
                    if (m.id === memberId) {
                        const newVoiceNote: VoiceNote = {
                            id: `vn_${Date.now()}`,
                            url: voiceNoteUrl,
                            createdAt: new Date().toISOString(),
                        };
                        updatedMember = {
                            ...m,
                            voiceNotes: [...(m.voiceNotes || []), newVoiceNote],
                            last_update: new Date().toISOString(),
                            message: "Sent a new voice note.",
                        };
                        return updatedMember;
                    }
                    return m;
                });

                if (updatedMember) {
                    mockFamilyCircle = {
                        ...mockFamilyCircle,
                        members: newMembers,
                    };
                    resolve(updatedMember);
                } else {
                    reject(new Error("Member not found"));
                }
            } else {
                reject(new Error("Family circle not found"));
            }
        }, 300);
    });
};

export const deleteMemberVoiceNote = (memberId: string, voiceNoteId: string): Promise<Member> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (mockFamilyCircle) {
                let updatedMember: Member | null = null;
                const newMembers = mockFamilyCircle.members.map(m => {
                    if (m.id === memberId && m.voiceNotes) {
                        const newVoiceNotes = m.voiceNotes.filter(vn => vn.id !== voiceNoteId);
                        updatedMember = {
                            ...m,
                            voiceNotes: newVoiceNotes,
                            last_update: new Date().toISOString(),
                            message: newVoiceNotes.length === 0 && m.message?.includes("voice note")
                                ? "Cleared voice notes."
                                : m.message,
                        };
                        return updatedMember;
                    }
                    return m;
                });
                
                if (updatedMember) {
                    mockFamilyCircle = {
                        ...mockFamilyCircle,
                        members: newMembers,
                    };
                    resolve(updatedMember);
                } else {
                    reject(new Error("Member or voice note not found"));
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
                let updatedMember: Member | null = null;
                const newMembers = mockFamilyCircle.members.map(m => {
                    if (m.id === memberId) {
                        updatedMember = {
                            ...m,
                            isLocationShared: isShared,
                            last_update: new Date().toISOString(),
                        };
                        return updatedMember;
                    }
                    return m;
                });

                if (updatedMember) {
                    mockFamilyCircle = {
                        ...mockFamilyCircle,
                        members: newMembers,
                    };
                    resolve(updatedMember);
                } else {
                    reject(new Error("Member not found"));
                }
            } else {
                reject(new Error("Family circle not found"));
            }
        }, 300);
    });
};

export const updateMemberStatus = (memberId: string, status: StatusType, message: string): Promise<Member> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (mockFamilyCircle) {
                let updatedMember: Member | null = null;
                const newMembers = mockFamilyCircle.members.map(m => {
                    if (m.id === memberId) {
                        updatedMember = {
                            ...m,
                            status,
                            message,
                            last_update: new Date().toISOString(),
                        };
                        return updatedMember;
                    }
                    return m;
                });

                if (updatedMember) {
                    mockFamilyCircle = {
                        ...mockFamilyCircle,
                        members: newMembers,
                    };
                    resolve(updatedMember);
                } else {
                    reject(new Error("Member not found"));
                }
            } else {
                reject(new Error("Family circle not found"));
            }
        }, 300);
    });
};
