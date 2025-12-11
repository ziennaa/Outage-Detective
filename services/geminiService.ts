import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

export const analyzeOutage = async (
  logs: string, 
  summary: string = "", 
  topologyImage?: { data: string; mimeType: string }
): Promise<AnalysisResult> => {
  // Ensure the API Key is available before initializing the client
  if (!process.env.API_KEY) {
    throw new Error("API Key not found. Please connect your Google Cloud API Key.");
  }

  // Initialize the client inside the function to ensure process.env.API_KEY is populated 
  // after the user completes the API key selection flow.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Switched to Gemini 3 Pro Preview for advanced reasoning and multimodal capabilities
  const modelId = "gemini-3-pro-preview";

  const systemInstruction = `You are an expert Senior Network Reliability Engineer (SRE). 
  Your job is to analyze network logs, incident summaries, and network topology diagrams to determine the root cause of outages.
  You are precise, technical, and methodical.
  
  You may receive a network topology diagram image.
  1. First, infer the nodes and links from the diagram (device names like switch-core-01, loadbalancer-01, etc.).
  2. When you build the timeline and root-cause hypotheses, explicitly mention the devices and links from the diagram (e.g., "core link between switch-core-01 and switch-edge-04").
  3. If the diagram contradicts the logs, call that out explicitly.
  4. If no diagram is provided, state "Topology diagram not provided" once in the analysis and proceed using logs only.
  
  You will output the analysis in a specific JSON structure containing:
  1. A chronological timeline of key events found in the logs.
  2. A list of root cause hypotheses with confidence levels.
  3. A list of suggested CLI commands (Linux/Cisco/Juniper standard) to run next for verification or mitigation.
  4. A professional postmortem draft in Markdown format.
  `;

  const userTextPrompt = `
  Analyze the following network logs and incident context.
  
  Context/Summary: ${summary ? summary : "No user summary provided."}
  
  --- BEGIN LOGS ---
  ${logs}
  --- END LOGS ---
  `;

  const parts: any[] = [];
  
  if (topologyImage) {
    parts.push({
      inlineData: {
        data: topologyImage.data,
        mimeType: topologyImage.mimeType
      }
    });
  }

  parts.push({ text: userTextPrompt });

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            timeline: {
              type: Type.ARRAY,
              description: "Chronological sequence of important events extracted from logs",
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING, description: "Time of the event (or relative time)" },
                  description: { type: Type.STRING, description: "What happened" }
                },
                required: ["timestamp", "description"]
              }
            },
            hypotheses: {
              type: Type.ARRAY,
              description: "Potential root causes",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Short title of the hypothesis" },
                  description: { type: Type.STRING, description: "Detailed explanation of why this might be the cause" },
                  likelihood: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                },
                required: ["title", "description", "likelihood"]
              }
            },
            nextCommands: {
              type: Type.ARRAY,
              description: "List of terminal commands to run next",
              items: { type: Type.STRING }
            },
            postmortemDraft: {
              type: Type.STRING,
              description: "A drafted postmortem document in Markdown"
            }
          },
          required: ["timeline", "hypotheses", "nextCommands", "postmortemDraft"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from Gemini.");
    }

    try {
      const result = JSON.parse(response.text) as AnalysisResult;
      return result;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, response.text);
      throw new Error("Failed to parse analysis results. The model response was not valid JSON.");
    }

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};