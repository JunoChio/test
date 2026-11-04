
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates controversial and engaging debate topics using Gemini.
 */
export const generateDebateTopic = async () => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate 5 interesting and controversial debate topics for high school or college students.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: 'A debate topic statement.'
          }
        },
      },
    });
    
    const text = response.text;
    if (text) {
      return JSON.parse(text.trim());
    }
    return [];
  } catch (error) {
    console.error("Error generating debate topics:", error);
    return [];
  }
};

/**
 * Gets concicse and high-impact tips for a specific debate phase using Gemini.
 */
export const getPhaseTips = async (phaseName: string) => {
  if (!phaseName) return "";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide 3 concise, high-impact tips for the debate phase: "${phaseName}". Format as a simple bulleted list.`,
    });
    return response.text || "No tips available for this phase.";
  } catch (error) {
    console.error("Error getting phase tips:", error);
    return "Error fetching tips from Gemini.";
  }
};
