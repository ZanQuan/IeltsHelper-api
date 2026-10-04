export interface LessonLog {
  id: string;
  lessonDate: string;
  skillFocus: string;
  summary: string;
  homework: string | null;
  selfRating: number;
  newVocabulary: string | null;
  grammarNotes: string | null;
  otherNotes: string | null;
}
