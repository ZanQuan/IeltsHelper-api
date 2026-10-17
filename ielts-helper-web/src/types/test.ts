export interface TestAttempt {
  id: string;
  testId: string;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  totalQuestions: number;
}

export interface TestSummary {
  id: string;
  skill: string;
  title: string;
  timeLimitMinutes: number;
}
