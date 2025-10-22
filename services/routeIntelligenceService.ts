
import { GoogleGenAI, Type } from '@google/genai';
import { Coordinates, CrisisData, RouteInfo } from '../types';

// FIX: Define the JSON schema for the RouteInfo response to ensure structured output.
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

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes the viability of a travel route during a crisis using AI.
 * This function is not currently used but provides a structure for future implementation.
 */
export const getRouteIntelligence = async (
    memberName: string,
    startLocation: Coordinates,
    endLocation: Coordinates,
    crisisData: CrisisData
): Promise<RouteInfo> => {
    const prompt = `
        Act as a crisis route intelligence analyst.
        Your task is to analyze the viability of a travel route for a specific person during an active crisis.

        **Crisis Context:**
        ${JSON.stringify(crisisData.live_crisis_events, null, 2)}

        **Route Details:**
        - Person: ${memberName}
        - Start Location: ${JSON.stringify(startLocation)}
        - Destination: ${JSON.stringify(endLocation)}

        Based on the crisis events (e.g., earthquake location, severity), infer potential road closures, traffic congestion, and specific hazards. Provide a realistic assessment of the route's viability.

        The output MUST be a single JSON object that strictly adheres to the schema provided. Do not include any explanatory text or markdown formatting.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Flash is suitable for this focused task
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: routeInfoSchema,
            },
        });

        const jsonResponse = response.text;
        const parsedResponse: RouteInfo = JSON.parse(jsonResponse);
        return parsedResponse;
    } catch (error) {
        console.error(`Error getting route intelligence for ${memberName}:`, error);
        // Return a default "non-viable" route on error for safety
        return {
            duration: "Unknown",
            distance: "Unknown",
            traffic_level: "Severe",
            hazards: ["AI analysis failed, assume route is not viable."],
            viable: false,
        };
    }
};
