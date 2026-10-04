export interface Assignment {
  id: string;
  studentId: string;
  title: string;
  instructions: string;
  skill: string;
  dueDate: string | null;
  createdAt: string;
  answerText: string | null;
  submittedAt: string | null;
  score: number | null;
  feedback: string | null;
  gradedAt: string | null;
}

/** Bài đã nộp nhưng giáo viên chưa chấm */
export interface ToGradeItem {
  id: string;
  title: string;
  skill: string;
  submittedAt: string;
  dueDate: string | null;
  studentId: string;
  studentName: string;
}
