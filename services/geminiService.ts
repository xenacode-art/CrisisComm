

import { GoogleGenAI, Type } from '@google/genai';
import { FamilyCircle, CrisisData, Coordinates, MultiAgentAIResponse, StatusType } from '../types';

// Per guidelines, use GoogleGenAI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schemas based on types.ts
const coordinatesSchema = {
    type: Type.OBJECT,
    properties: {
        lat: { type: Type.NUMBER },
        lng: { type: Type.NUMBER },
    },
    required: ['lat', 'lng'],
};

const routeInfoSchema = {
    type: Type.OBJECT,
    properties: {
        duration: { type: Type.STRING, description: "Estimated travel time, e.g., '25 min drive'." },
        distance: { type: Type.STRING, description: "Estimated travel distance, e.g., '4.5 mi'." },
        traffic_level: { type: Type.STRING, description: "Qualitative traffic assessment, e.g., 'Heavy', 'Severe', 'Light'." },
        hazards: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific hazards on the route, e.g., 'Bridge closure', 'Road flooding'." },
        viable: { type: Type.BOOLEAN, description: "A boolean indicating if the route is considered safe and possible to travel." },
    },
    required: ['duration', 'distance', 'traffic_level', 'hazards', 'viable'],
};

const memberRouteSchema = {
    type: Type.OBJECT,
    properties: {
        memberName: { type: Type.STRING },
        route: routeInfoSchema,
    },
    required: ['memberName', 'route'],
};

const meetupPointSchema = {
    type: Type.OBJECT,
    properties: {
        rank: { type: Type.NUMBER, description: "The priority rank of the meetup point, with 1 being the highest." },
        name: { type: Type.STRING, description: "A descriptive name for the meetup point, e.g., 'City Library Park'." },
        address: { type: Type.STRING, description: "The full street address of the meetup point." },
        reason: { type: Type.STRING, description: "A brief justification for why this point was chosen, considering safety and accessibility." },
        routes: { type: Type.ARRAY, items: memberRouteSchema, description: "Route analysis for each family member to this meetup point." },
        coordinates: coordinatesSchema,
    },
    required: ['rank', 'name', 'address', 'reason', 'routes', 'coordinates'],
};

const multiAgentResponseSchema = {
    type: Type.OBJECT,
    properties: {
        triage_analysis: {
            type: Type.OBJECT,
            properties: {
                priority_list: {
                    type: Type.ARRAY,
                    description: "A ranked list of family members who need the most immediate attention or confirmation of safety.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            reason: { type: Type.STRING, description: "Explanation for their priority (e.g., 'Last status was HELP', 'Located near crisis epicenter')." }
                        },
                        required: ['name', 'reason'],
                    }
                },
                assessment: { type: Type.STRING, description: "A brief, overall summary of the family's situation based on member statuses." }
            },
            required: ['priority_list', 'assessment'],
        },
        logistics_plan: {
            type: Type.OBJECT,
            properties: {
                meetup_points: {
                    type: Type.ARRAY,
                    description: "A ranked list of safe, viable meetup points.",
                    items: meetupPointSchema
                },
                movement_plan: { type: Type.STRING, description: "High-level instructions on when and how to move. Should advise staying put if no viable routes exist." },
                supply_recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of essential supplies to gather based on the crisis type." }
            },
            required: ['meetup_points', 'movement_plan', 'supply_recommendations'],
        },
        medical_assessment: {
            type: Type.OBJECT,
            properties: {
                member_assessments: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            needs: { type: Type.STRING, description: "Inferred medical needs based on status (e.g., 'Potential injury, monitor symptoms')." },
                            instructions: { type: Type.STRING, description: "Simple, actionable first-aid or monitoring advice." }
                        },
                        required: ['name', 'needs', 'instructions'],
                    }
                },
                overall_recommendation: { type: Type.STRING, description: "A summary of the family's medical situation and general advice." }
            },
            required: ['member_assessments', 'overall_recommendation'],
        },
        prediction_forecast: {
            type: Type.OBJECT,
            properties: {
                timeline: {
                    type: Type.ARRAY,
                    description: "A projected timeline of events for the next few hours.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            time: { type: Type.STRING, description: "A relative time, e.g., 'Next 30 Mins', '1-2 Hours'." },
                            prediction: { type: Type.STRING, description: "A prediction of what might happen (e.g., 'Aftershocks possible', 'Heavy rain expected')." }
                        },
                        required: ['time', 'prediction'],
                    }
                },
                secondary_hazards: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of potential secondary hazards to be aware of (e.g., 'Gas leaks', 'Flooding')." }
            },
            required: ['timeline', 'secondary_hazards'],
        },
        synthesized_plan: {
            type: Type.OBJECT,
            properties: {
                urgency_level: { type: Type.STRING, description: "An overall urgency level: 'IMMEDIATE', 'URGENT', 'MODERATE', or 'LOW'." },
                priority_actions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The top 3-5 most critical actions the family should take immediately." },
                reassurance_message: { type: Type.STRING, description: "A calm, reassuring message to build confidence and reduce panic." }
            },
            required: ['urgency_level', 'priority_actions', 'reassurance_message'],
        },
    },
    required: [
        'triage_analysis',
        'logistics_plan',
        'medical_assessment',
        'prediction_forecast',
        'synthesized_plan'
    ],
};

const smsParsingSchema = {
    type: Type.OBJECT,
    properties: {
        status: { 
            type: Type.STRING, 
            description: "The inferred status of the person.",
            enum: [StatusType.SAFE, StatusType.HELP, StatusType.INJURED] 
        },
        summary: { 
            type: Type.STRING, 
            description: "A concise summary of the person's situation based on their message." 
        },
    },
    required: ['status', 'summary'],
};

export const generateMultiAgentResponse = async (
    familyCircle: FamilyCircle,
    crisisData: CrisisData,
    userLocation: Coordinates
): Promise<MultiAgentAIResponse> => {
    const prompt = `
    You are a multi-agent AI crisis management system for a family. Your goal is to provide a clear, actionable, and reassuring plan.
    Analyze the provided family and crisis data to generate a comprehensive response.

    **AGENT ROLES:**
    1.  **Triage Agent:** Prioritize family members based on their status, location relative to hazards, and last message.
    2.  **Logistics Agent:** Determine safe meetup locations, analyze routes for each member, and recommend supplies. Routes must be analyzed individually considering the member's start location. A viable route is one that is likely clear of immediate, known crisis-related blockages.
    3.  **Medical Agent:** Assess potential medical needs based on reported statuses like 'INJURED' and provide simple, clear instructions.
    4.  **Prediction Agent:** Forecast the crisis's evolution over the next few hours, including potential secondary hazards.
    5.  **Synthesis Agent:** Combine the outputs of all agents into a single, cohesive plan with clear, prioritized actions and a reassuring message.

    **INPUT DATA:**
    - **Current User Location (for context):** ${JSON.stringify(userLocation)}
    - **Family Circle Information:** ${JSON.stringify(familyCircle, null, 2)}
    - **Live Crisis Events:** ${JSON.stringify(crisisData.live_crisis_events, null, 2)}

    **INSTRUCTIONS:**
    - Base your entire analysis on the provided data.
    - Be realistic. If a route passes through a crisis epicenter, it is likely not viable. Mention specific hazards.
    - Meetup points should be logical public places (parks, libraries, etc.) that are away from the immediate crisis zones. Propose 2-3 ranked options.
    - The final output MUST be a single JSON object that strictly adheres to the provided schema. Do not include any explanatory text, markdown formatting, or any content outside the JSON structure.
    `;

    try {
        const response = await ai.models.generateContent({
            // Per guidelines, complex tasks should use gemini-2.5-pro
            model: 'gemini-2.5-pro', 
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: multiAgentResponseSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating multi-agent AI response:", error);
        throw new Error("The AI crisis team could not generate a plan. The situation may be complex or there was a network issue. Please try again in a moment.");
    }
};

export const parseSmsMessage = async (
    message: string
): Promise<{ status: StatusType; summary: string }> => {
    const prompt = `
    You are an SMS parsing service for an emergency response app. Your job is to analyze an incoming SMS message and determine the person's status and a summary of their situation.

    **Instructions:**
    1. Read the message carefully to understand the sender's condition.
    2. Determine the status. It MUST be one of the following exact values: 'SAFE', 'HELP', or 'INJURED'.
        - 'SAFE': The person is okay, not in immediate danger.
        - 'HELP': The person needs assistance but is not explicitly stating an injury (e.g., stuck, needs rescue).
        - 'INJURED': The person explicitly mentions being hurt, wounded, or having a medical emergency.
    3. Create a brief, one-sentence summary of their message.

    **SMS Message to Analyze:**
    "${message}"

    The output MUST be a single JSON object that strictly adheres to the provided schema. Do not include any explanatory text, markdown formatting, or any content outside the JSON structure.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: smsParsingSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        
        // Validate that status is a valid StatusType
        if (!Object.values(StatusType).includes(parsed.status)) {
            throw new Error(`Invalid status received from AI: ${parsed.status}`);
        }
        
        return parsed;

    } catch (error) {
        console.error("Error parsing SMS message with AI:", error);
        throw new Error("The AI could not understand the message. Please try a clearer message or update the status manually.");
    }
};
