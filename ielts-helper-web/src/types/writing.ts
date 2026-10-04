export interface WritingSubmission {
  id: string;
  taskType: string;
  prompt: string;
  essayText: string;
  submittedAt: string;
  estimatedBand: number | null;
  feedback: string | null;
}
