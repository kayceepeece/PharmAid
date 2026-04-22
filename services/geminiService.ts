import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

// 1. Grounded Q&A on notes
export async function runGroundedQA(noteContent: string, question: string): Promise<string> {
  const prompt = `You are an expert pharmacy tutor. Using ONLY the provided context below, answer the question. If the answer cannot be found in the context, state "I cannot answer this question based on the provided context."

Context:
---
${noteContent}
---

Question: ${question}
`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Error in runGroundedQA:", error);
    return "Sorry, I encountered an error answering your question.";
  }
}

// 2. Drug interaction analysis
export interface DrugInteraction {
  drugs: string[];
  severity: 'Minor' | 'Moderate' | 'Major' | 'Critical';
  description: string;
}

export interface InteractionAnalysisResults {
  overallRiskLevel: 'Low' | 'Moderate' | 'High' | 'Very High' | 'N/A' | 'Undetermined';
  summary: string;
  interactions: DrugInteraction[];
  managementRecommendations: string[];
}

export async function analyzeInteractions(drugList: string[]): Promise<InteractionAnalysisResults> {
  if (drugList.length < 2) {
    return {
      overallRiskLevel: 'N/A',
      summary: 'Please provide at least two drugs to analyze interactions.',
      interactions: [],
      managementRecommendations: []
    };
  }

  const prompt = `Analyze the following list of drugs for interactions: ${drugList.join(', ')}.
  Provide a detailed clinical analysis of potential interactions in standard JSON format.
  Use the following schema:
  {
    "overallRiskLevel": "Low" | "Moderate" | "High" | "Very High" | "Undetermined",
    "summary": "Brief summary of the findings",
    "interactions": [
      {
        "drugs": ["Drug A", "Drug B"],
        "severity": "Minor" | "Moderate" | "Major" | "Critical",
        "description": "Mechanism and clinical consequence of the interaction"
      }
    ],
    "managementRecommendations": ["list of strings with clinical advice"]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });
    
    // Attempt to parse JSON safely, sometimes AI wraps it in markdown blocks
    let rawResult = response.text || "{}";
    if (rawResult.startsWith('\`\`\`json')) {
      rawResult = rawResult.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    }
    return JSON.parse(rawResult);
  } catch (error) {
    console.error("Error in analyzeInteractions:", error);
    throw new Error("Failed to analyze text. Please ensure valid input.");
  }
}

// 3. Generate patient scenario
export interface Scenario {
  id?: string;
  title: string;
  description: string;
  patientProfile: string;
  initialMessageFromPatient: string;
}

export async function generateScenarioWithAI(): Promise<Scenario> {
  const prompt = `Generate a realistic patient scenario for a pharmacy student to practice counseling. 
  Output as JSON using this exact schema:
  {
    "title": "Short title of scenario (e.g., Asthma Inhaler Counseling)",
    "description": "Brief instruction for the pharmacist.",
    "patientProfile": "Background information on the patient (age, conditions, current meds).",
    "initialMessageFromPatient": "What the patient says to initiate the conversation."
  }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    let rawResult = response.text || "{}";
    if (rawResult.startsWith('\`\`\`json')) {
      rawResult = rawResult.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    }
    return JSON.parse(rawResult);
  } catch (error) {
    console.error("Error in generateScenarioWithAI:", error);
    throw new Error("Failed to generate scenario.");
  }
}

export interface SimulateChatMessage {
  role: 'user' | 'model'; // 'user' is Pharmacist, 'model' is Patient
  content: string;
}

// 4. Get patient response in simulation
export async function getSimulationResponse(scenario: Scenario, history: SimulateChatMessage[]): Promise<string> {
  const promptParts = [
    `You are roleplaying as a patient in a pharmacy. Act naturally and concisely, staying in-character.`,
    `Patient Profile: ${scenario.patientProfile}`,
    `Scenario Context: ${scenario.description}`,
    `Previous conversation:`
  ];

  for (const msg of history) {
    promptParts.push(`${msg.role === 'user' ? 'Pharmacist' : 'Patient'}: ${msg.content}`);
  }
  
  promptParts.push(`Respond as the Patient to the Pharmacist's last message. Do not include prefix like "Patient:". Just the dialogue.`);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptParts.join('\\n'),
    });
    return response.text || "";
  } catch (error) {
    console.error("Error in getSimulationResponse:", error);
    return "I'm not sure what you mean.";
  }
}

export interface Badge {
  name: string;
  description: string;
  icon: string;
}

export interface FeedbackResponse {
  score: number;
  maxScore: number;
  objectivesMet: string[];
  empathyFeedback: string;
  accuracyFeedback: string;
  constructiveFeedback: string;
  badgesEarned: Badge[];
}

export async function getSimulationFeedback(scenario: Scenario, history: SimulateChatMessage[]): Promise<FeedbackResponse> {
  const prompt = `Analyze the following pharmacist-patient simulation and provide gamified feedback.
  
  Scenario: ${scenario.description}
  Patient Profile: ${scenario.patientProfile}
  
  Conversation:
  ${history.map(msg => `${msg.role === 'user' ? 'Pharmacist' : 'Patient'}: ${msg.content}`).join('\n')}
  
  Evaluate the pharmacist (user) on:
  1. Meeting counseling objectives
  2. Demonstrating empathy
  3. Providing accurate information
  
  Output JSON strictly format:
  {
    "score": <number 0-100>,
    "maxScore": 100,
    "objectivesMet": ["list of objectives met successfully"],
    "empathyFeedback": "Feedback on empathy",
    "accuracyFeedback": "Feedback on clinical accuracy",
    "constructiveFeedback": "Areas to improve",
    "badgesEarned": [
      {
        "name": "Select from: Active Listener, Clarity Champion, Empathy Expert, Objective Master",
        "description": "Why they earned it",
        "icon": "Ear" // Choose 'Ear', 'Star', 'Heart', 'Shield', 'CheckCircle' or 'Award'
      }
    ]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    let rawResult = response.text || "{}";
    if (rawResult.startsWith('\`\`\`json')) {
      rawResult = rawResult.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    }
    return JSON.parse(rawResult);
  } catch (error) {
    console.error("Error in getSimulationFeedback:", error);
    throw new Error("Failed to generate feedback.");
  }
}

