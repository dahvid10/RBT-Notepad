import { GoogleGenAI } from "@google/genai";
import type { SessionData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function buildNotePrompt(data: SessionData): string {
  const goalsText = data.goals
    .map(
      (goal, index) => `
Goal ${index + 1}: ${goal.name}
Client's Performance/Progress: ${goal.progress}
Instructional Methods Used: ${goal.methods}
`
    )
    .join('');

  return `
    As a professional Registered Behavior Technician (RBT), generate a comprehensive and objective session note based on the following details.

    **Key RBT Note Principles to Apply:**
    1.  **Objective and Observable:** Describe specific actions and behaviors. Do not use subjective or vague terms like "happy," "good," "well," or "struggled."
    2.  **Measurable:** Incorporate all provided data points and quantitative measures.
    3.  **Professional Language:** Use clinical and precise terminology appropriate for a session note.
    4.  **Structure:** 
        - Start with a conclusive summary of the session logistics (venue, time, people present) and the client's health/appearance.
        - Detail the work on each goal, tying observations directly to the interventions and instructional methods used.
        - Conclude with the plan for the next session.
    5.  **Format:** Produce a clean, well-structured note in paragraph form.

    **Session Details:**
    - **Client Name:** ${data.clientName}
    - **Session Date:** ${data.sessionDate}
    - **Session Time:** ${data.startTime} - ${data.endTime}
    - **Venue:** ${data.venue}
    - **People Present:** ${data.peoplePresent}
    - **Client's Health & Appearance:** ${data.clientHealth}
    - **Goals & Interventions:** ${goalsText}
    - **Plan for Next Session:** ${data.nextSessionPlan}

    Now, generate the complete session note.
  `;
}

export const generateRbtNote = async (data: SessionData): Promise<string> => {
  const prompt = buildNotePrompt(data);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating note from Gemini API:", error);
    throw new Error("Failed to generate note. The AI service may be experiencing issues.");
  }
};
