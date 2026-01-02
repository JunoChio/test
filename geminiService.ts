
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini API client safely
const getAI = () => {
  try {
    // 檢查 process 是否存在，防止本地 file 協議下報錯
    const env = typeof process !== 'undefined' ? process.env : (window as any).process?.env;
    const apiKey = env?.API_KEY;
    
    if (!apiKey) {
      console.warn("API Key is missing. AI features will be disabled.");
      return null;
    }
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error("AI Initialization failed:", e);
    return null;
  }
};

export const generateDebateTopic = async (theme: string) => {
  const ai = getAI();
  if (!ai) return [];
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `請針對「${theme}」生成三個具備專業深度且適合辯論的題目。請使用繁體中文。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["topic", "description"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Generate topic failed:", e);
    return [];
  }
};

export const getPhaseTips = async (phaseName: string) => {
  const ai = getAI();
  if (!ai) return "請檢查 API 配置以獲取 AI 建議。";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `你是一位資深的辯論裁判。目前正在進行「${phaseName}」環節。請給出一段不超過50字的關鍵致勝建議。`,
    });
    return response.text || "";
  } catch (e) {
    return "無法聯網獲取 AI 建議。";
  }
};
