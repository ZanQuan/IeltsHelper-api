export interface Vocabulary {
  id: string;
  word: string;
  meaning: string;
  srsLevel: number;
  intervalDays: number;
  nextReviewDate: string | null;
}
