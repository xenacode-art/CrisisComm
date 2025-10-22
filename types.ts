
export enum StatusType {
  SAFE = 'SAFE',
  HELP = 'HELP',
  INJURED = 'INJURED',
  UNKNOWN = 'UNKNOWN',
}

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number; // Accuracy in meters
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  status: StatusType;
  isLocationShared: boolean;
  message?: string;
  voiceNoteUrl?: string;
  location?: Coordinates;
  last_update: string;
}

export interface FamilyCircle {
  id: string;
  name: string;
  members: Member[];
}

export interface CrisisEvent {
  id: string;
  type: 'earthquake' | 'weather_alert' | 'fire' | 'flood' | string;
  title: string;
  severity: 'minor' | 'moderate' | 'major' | 'catastrophic' | string;
  location: Coordinates;
  time: string;
  details: Record<string, any>;
}

export interface CrisisData {
  live_crisis_events: CrisisEvent[];
}

export interface RouteInfo {
  duration: string;
  distance: string;
  traffic_level: string;
  hazards: string[];
  viable: boolean;
}

export interface MemberRoute {
  memberName: string;
  route: RouteInfo;
}

export interface MeetupPoint {
  rank: number;
  name: string;
  address: string;
  reason: string;
  routes: MemberRoute[];
  coordinates: Coordinates;
}

export interface MultiAgentAIResponse {
  triage_analysis: {
    priority_list: {
      name: string;
      reason: string;
    }[];
    assessment: string;
  };
  logistics_plan: {
    meetup_points: MeetupPoint[];
    movement_plan: string;
    supply_recommendations: string[];
  };
  medical_assessment: {
    member_assessments: {
      name:string;
      needs: string;
      instructions: string;
    }[];
    overall_recommendation: string;
  };
  prediction_forecast: {
    timeline: {
      time: string;
      prediction: string;
    }[];
    secondary_hazards: string[];
  };
  synthesized_plan: {
    urgency_level: string;
    priority_actions: string[];
    reassurance_message: string;
  };
}

export interface PreparednessItem {
  id: string;
  category: string;
  name: string;
  status: 'complete' | 'incomplete';
  description: string;
}

export interface PreparednessPlan {
  id: string;
  name: string;
  items: PreparednessItem[];
}
