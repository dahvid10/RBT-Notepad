
export interface Goal {
  name: string;
  progress: string;
  methods: string;
}

export interface SessionData {
  clientName: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  peoplePresent: string;
  clientHealth: string;
  goals: Goal[];
  nextSessionPlan: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
