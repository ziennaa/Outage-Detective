export interface TimelineEvent {
  timestamp: string;
  description: string;
}

export interface Hypothesis {
  title: string;
  description: string;
  likelihood: "High" | "Medium" | "Low";
}

export interface AnalysisResult {
  timeline: TimelineEvent[];
  hypotheses: Hypothesis[];
  nextCommands: string[];
  postmortemDraft: string;
}

export interface AnalysisRequest {
  logs: string;
  summary?: string;
}