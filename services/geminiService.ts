
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { SessionData } from '../types';

export const AI_MODELS = {
  FLASH: 'gemini-2.5-flash',
  PRO: 'gemini-2.5-pro',
};

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
    1.  **Objective and Observable:** Describe specific actions and behaviors. Do not use subjective or vague terms like "happy," "good," "well," or "struggled." Instead of "Alex struggled with his math problems," write "Alex correctly answered 2 of 10 math problems and required frequent prompting to remain on task."
    2.  **Measurable:** Incorporate all provided data points and quantitative measures.
    3.  **Professional Language:** Use clinical and precise terminology appropriate for a session note.
    4.  **Structure:** 
        - Start with a conclusive summary of the session logistics (venue, time, people present) and the client's health/appearance.
        - Detail the work on each goal, tying observations directly to the interventions and instructional methods used.
        - Conclude with the plan for the next session.
    5.  **Format:** Produce a clean, well-structured note in paragraph form. Avoid lists unless detailing specific, sequential steps taken.

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


export const buildIdeasPrompt = (data: SessionData): string => {
    const goalsText = data.goals
      .map(
        (goal) => `
  - **Goal:** "${goal.name}"
    - **Client's Progress:** ${goal.progress}
    - **Methods Used:** ${goal.methods}`
      )
      .join('');
  
    return `
      As an expert Board Certified Behavior Analyst (BCBA) supervising an RBT, your task is to generate creative and actionable ideas to enhance the next therapy session's effectiveness. Based on the session summary below, provide 3-5 concrete suggestions.
  
      **Guiding Principles for Your Suggestions:**
      1.  **Enhance Engagement:** Propose novel materials, activities, or ways to incorporate the client's interests.
      2.  **Promote Generalization:** Suggest how to practice skills in different settings or with different people/materials.
      3.  **Increase Skill Acquisition:** Recommend slight modifications to teaching procedures (e.g., changing prompting, reinforcement schedules).
      4.  **Be Practical:** Ideas should be feasible for an RBT to implement in a typical session setting (${data.venue}).
  
      **Session Summary:**
      - **Client:** ${data.clientName}
      - **Goals Worked On:** ${goalsText}
      - **Venue:** ${data.venue}
      - **Plan for Next Session:** ${data.nextSessionPlan}
  
      Now, provide a list of creative and practical ideas to enhance the next session. After you provide the ideas, ask me a follow-up question to keep the conversation going.
    `;
}


export const generateRbtNote = async (data: SessionData, ai: GoogleGenAI): Promise<string> => {
  const prompt = buildNotePrompt(data);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: AI_MODELS.FLASH,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating note from Gemini API:", error);
    // Propagate a more user-friendly error message
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error("Invalid API Key. Please check your configuration.");
    }
    throw new Error("Failed to generate note. The AI service may be experiencing issues or the request may have been blocked.");
  }
};
