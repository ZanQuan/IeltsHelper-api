export interface LiveClass {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  durationMinutes: number;
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
  canManage: boolean;
}

export interface LiveClassesResponse {
  serverNow: string;
  items: LiveClass[];
}

export interface LiveJoinInfo {
  id: string;
  title: string;
  roomName: string;
  teacherName: string;
  isModerator: boolean;
}

export type LiveStatus = 'upcoming' | 'live' | 'ended';

export const EARLY_JOIN_MS = 10 * 60 * 1000;

export function getLiveStatus(
  c: LiveClass,
  nowMs: number
): LiveStatus {
  const start = Date.parse(c.scheduledAt);
  const end = start + c.durationMinutes * 60_000;

  if (nowMs < start) return 'upcoming';

  if (nowMs < end) return 'live';

  return 'ended';
}