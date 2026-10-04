export interface SpeakingSubmission {
  id: string;
  partType: string;
  prompt: string;
  transcript: string | null;
  estimatedBand: number | null;
  feedback: string | null;
  submittedAt: string;
}
