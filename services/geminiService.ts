
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { KPI, ImpactLevel, FunctionLevel, ImportanceLevel, Job } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please set the API_KEY environment variable.");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Single Icon Generator ---
export const suggestIconForText = async (text: string) => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `Suggest a single relevant Emoji that best represents this text: "${text}".\nReturn ONLY the emoji character, nothing else.`,
      config: {
        responseMimeType: 'text/plain'
      }
    });
    return response.text.trim();
  } catch (e) {
    console.error("Icon Gen Error", e);
    return "🔹"; // Default fallback
  }
};

// --- Job Description Suggestion (formerly KPI) ---
export const suggestKPIsForJob = async (jobTitle: string, customPrompt?: string) => {
  const ai = getAiClient();

  const defaultPrompt = `
    Analyze the job title: "${jobTitle}".
    List 5 key responsibilities, tasks, or duties for this job description.
    
    Output Language: Persian (Farsi).
    Format: JSON Array with 'title', 'description', and 'icon' (a single emoji).
  `;

  const finalPrompt = customPrompt || defaultPrompt;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: finalPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "The job description item text in Persian" },
              description: { type: Type.STRING, description: "Optional extra info" },
              icon: { type: Type.STRING, description: "A single emoji representing this responsibility" }
            },
            required: ['title', 'icon']
          }
        }
      }
    });

    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr) as { title: string; description: string; icon: string }[];
  } catch (error) {
    console.error("Gemini API Error (Job Desc):", error);
    throw error;
  }
};

// --- Competency Suggestion ---
export const suggestCompetenciesForKPI = async (kpi: KPI, existingCompetencies: string[] = [], customPrompt?: string) => {
  const ai = getAiClient();
  
  // Strict instructions that should never be overridden by user prompt
  const baseInstructions = `
    OBJECTIVE: ${customPrompt || `Analyze the following Job Description item: "${kpi.title}". Based on professional HR standards, suggest 3 key Competencies required to fulfill this responsibility.`}

    CRITICAL CONSTRAINT - NO DUPLICATES:
    You MUST NOT suggest any competency that is already present in the system or is semantically similar to them.
    Existing Competencies in the system: [${existingCompetencies.join(', ')}]
    
    Check your suggestions against this list. If a suggestion is similar (e.g., "Teamwork" vs "Collaborative Skills"), you MUST discard it and provide a different, unique professional competency.
    
    LANGUAGE & FORMAT RULES:
    1. 'title', 'description', and 'reasoning' MUST be in PERSIAN (FARSI).
    2. 'functionLevel', 'impactLevel', and 'importance' MUST be in ENGLISH from the provided enums.
    3. 'icon' MUST be a single relevant emoji.

    Allowed Enums:
    - functionLevel: ['Individual', 'Team', 'Organizational', 'Social']
    - impactLevel: ['Input', 'Process', 'Product', 'Output', 'Outcome', 'Impact']
    - importance: ['Very High', 'High', 'Low', 'Very Low']
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: baseInstructions,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Competency title in Persian" },
              description: { type: Type.STRING, description: "Short description in Persian" },
              icon: { type: Type.STRING, description: "A single emoji representing this competency" },
              functionLevel: { type: Type.STRING, enum: ['Individual', 'Team', 'Organizational', 'Social'] },
              impactLevel: { type: Type.STRING, enum: ['Input', 'Process', 'Product', 'Output', 'Outcome', 'Impact'] },
              importance: { type: Type.STRING, enum: ['Very High', 'High', 'Low', 'Very Low'] },
              reasoning: { type: Type.STRING, description: "Strong logical reasoning in Persian explaining why this competency maps to the job description and how it differs from existing ones" }
            },
            required: ['title', 'functionLevel', 'impactLevel', 'importance', 'reasoning', 'icon']
          }
        }
      }
    });

    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr) as {
      title: string;
      description: string;
      functionLevel: FunctionLevel;
      impactLevel: ImpactLevel;
      importance: ImportanceLevel;
      reasoning: string;
      icon: string;
    }[];

  } catch (error) {
    console.error("Gemini API Error (Competencies):", error);
    throw error;
  }
};

// --- Chat Bot Session ---
export const createChatSession = (): Chat => {
  const ai = getAiClient();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
        systemInstruction: "You are an intelligent HR assistant helping a user design a Competency Matrix. You are helpful, professional, and concise. Answer in Persian.",
    }
  });
};
