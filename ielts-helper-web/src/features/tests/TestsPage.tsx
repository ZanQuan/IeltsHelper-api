import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import apiClient from '@/api/client';
import type { TestAttempt, TestSummary } from '@/types';
import './tests.css';

interface AttemptQuestion {
  id: string;
  questionText: string;
  optionsJson: string | null;
}

interface AttemptData {
  attemptId: string;
  testTitle: string;
  passageOrTranscript: string;
  audioUrl?: string | null;
  timeLimitMinutes: number;
  questions: AttemptQuestion[];
}

interface SubmitResult {
  score: number;
  total: number;
  elapsedMinutes: number;
}

const PASS_PERCENT = 70; // một đề được tính là "đạt" khi điểm cao nhất từ 70% trở lên

interface TestStat {
  attempts: number;
  bestScore: number;
  bestTotal: number;
  bestPercent: number;
  lastAt: string | null;
}

function percentOf(score: number, total: number) {
  return total === 0 ? 0 : Math.round((score / total) * 100);
}

function ProgressBar({ value, tone = 'primary', label }: { value: number; tone?: 'primary' | 'success' | 'accent'; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v}>
      <div className={`progress-fill progress-${tone}`} style={{ width: `${v}%` }} />
    </div>
  );
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) return err.response?.data?.error ?? fallback;
  return fallback;
}

export default function TestsPage() {
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadAttempts = useCallback(
    () =>
      apiClient
        .get<TestAttempt[]>('/api/Attempts')
        .then((res) => setAttempts(res.data))
        .catch(() => setAttempts([])),
    [],
  );

  useEffect(() => {
    Promise.all([
      apiClient.get<TestSummary[]>('/api/Tests').then((res) => setTests(res.data)),
      loadAttempts(),
    ])
      .catch(() => setError('Không tải được danh sách đề, vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, [loadAttempts]);

  // Thống kê theo từng đề: chỉ tính các lượt đã nộp
  const statsByTest = useMemo(() => {
    const map = new Map<string, TestStat>();
    for (const a of attempts) {
      if (!a.submittedAt || a.score === null) continue;
      const pct = percentOf(a.score, a.totalQuestions);
      const cur = map.get(a.testId);
      if (!cur) {
        map.set(a.testId, { attempts: 1, bestScore: a.score, bestTotal: a.totalQuestions, bestPercent: pct, lastAt: a.submittedAt });
        continue;
      }
      cur.attempts += 1;
      if (pct > cur.bestPercent) {
        cur.bestScore = a.score;
        cur.bestTotal = a.totalQuestions;
        cur.bestPercent = pct;
      }
      if (!cur.lastAt || new Date(a.submittedAt).getTime() > new Date(cur.lastAt).getTime()) cur.lastAt = a.submittedAt;
    }
    return map;
  }, [attempts]);

  // Tổng hợp tiến trình: đã làm, đã đạt, điểm trung bình (theo điểm cao nhất mỗi đề), và theo từng kỹ năng
  const summary = useMemo(() => {
    const isPassed = (id: string) => (statsByTest.get(id)?.bestPercent ?? 0) >= PASS_PERCENT;
    const attempted = tests.filter((t) => statsByTest.has(t.id));
    const avgBest =
      attempted.length === 0
        ? 0
        : Math.round(attempted.reduce((sum, t) => sum + (statsByTest.get(t.id)?.bestPercent ?? 0), 0) / attempted.length);
    const skills = Array.from(new Set(tests.map((t) => t.skill))).map((skill) => {
      const inSkill = tests.filter((t) => t.skill === skill);
      const done = inSkill.filter((t) => statsByTest.has(t.id));
      return { skill, total: inSkill.length, done: done.length, passed: done.filter((t) => isPassed(t.id)).length };
    });
    return {
      total: tests.length,
      done: attempted.length,
      passed: attempted.filter((t) => isPassed(t.id)).length,
      avgBest,
      skills,
    };
  }, [tests, statsByTest]);

  useEffect(() => {
    if (!attempt || result) return;
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, secondsLeft, result]);

  async function startTest(testId: string) {
    setError('');
    try {
      const res = await apiClient.post<AttemptData>('/api/Attempts/start', { testId });
      setAttempt(res.data);
      setAnswers({});
      setResult(null);
      setSecondsLeft(res.data.timeLimitMinutes * 60);
    } catch (err) {
      setError(getErrorMessage(err, 'Không bắt đầu được bài thi, vui lòng thử lại.'));
    }
  }

  function selectAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    if (!attempt || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await apiClient.post<SubmitResult>(`/api/Attempts/${attempt.attemptId}/submit`, answers);
      setResult(res.data);
    } catch (err) {
      const message = getErrorMessage(err, 'Nộp bài thất bại, vui lòng thử lại.');
      // 400: bài đã nộp hoặc đã hết giờ -> không thể nộp nữa, quay lại danh sách
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        backToList();
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function backToList() {
    setAttempt(null);
    setResult(null);
    loadAttempts(); // cập nhật lại tiến trình sau khi vừa làm bài
  }

  function formatTime(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (loading) return <p className="muted">Đang tải...</p>;

  if (result) {
    const percent = result.total === 0 ? 0 : Math.round((result.score / result.total) * 100);
    return (
      <div className="card test-result-card">
        <h2>Kết quả</h2>
        <p className="test-score">
          {result.score}<span className="test-score-total">/{result.total}</span>
        </p>
        <span className="badge badge-success mb-16">{percent}% chính xác</span>
        <p className="muted">Thời gian làm bài: {result.elapsedMinutes} phút</p>
        <button onClick={backToList} className="btn btn-primary mt-16">
          Quay lại danh sách đề
        </button>
      </div>
    );
  }

  if (attempt) {
    const answeredCount = Object.keys(answers).length;
    const lowTime = secondsLeft < 60;

    return (
      <div>
        <div className="test-sticky-bar">
          <div>
            <h2 className="mb-2">{attempt.testTitle}</h2>
            <span className="muted">Đã trả lời {answeredCount}/{attempt.questions.length} câu</span>
          </div>
          <span
            className="badge"
            style={{
              fontSize: 18,
              padding: '10px 20px',
              background: lowTime ? 'var(--danger-light)' : 'var(--primary-light)',
              color: lowTime ? 'var(--danger)' : 'var(--primary)',
            }}
          >
            {formatTime(secondsLeft)}
          </span>
        </div>

        {attempt.audioUrl ? (
          <div className="card test-audio">
            <p className="test-audio-title">Nghe đoạn ghi âm rồi trả lời các câu hỏi bên dưới.</p>
            <audio controls preload="metadata" controlsList="nodownload" src={attempt.audioUrl} style={{ width: '100%' }} />
          </div>
        ) : (
          <div className="card test-passage">
            {attempt.passageOrTranscript}
          </div>
        )}

        {attempt.questions.map((q, idx) => {
          const options: string[] = q.optionsJson ? JSON.parse(q.optionsJson) : [];
          return (
            <div key={q.id} className="card mb-16">
              <p className="test-question">Câu {idx + 1}: {q.questionText}</p>
              <div className="test-options">
                {options.map((opt) => {
                  const selected = answers[q.id] === opt;
                  return (
                    <label
                      key={opt}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)',
                        border: selected ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                        background: selected ? 'var(--primary-light)' : 'var(--surface)',
                        cursor: 'pointer',
                        fontWeight: selected ? 600 : 400,
                      }}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={selected}
                        onChange={() => selectAnswer(q.id, opt)}
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        {error && <p className="error-text">{error}</p>}
        <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary">
          {submitting ? 'Đang nộp...' : 'Nộp bài'}
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Listening &amp; Reading</h2>
      <p className="muted mb-24">
        Luyện đề có tính giờ giống thi thật, chấm điểm tự động ngay khi nộp.
      </p>
      {error && <p className="error-text">{error}</p>}
      {tests.length > 0 && (
        <div className="card test-progress-card">
          <h3 className="m-0">Tiến trình luyện thi của bạn</h3>

          <div className="test-progress-row">
            <div className="test-progress-head">
              <span>Đã học</span>
              <strong>
                {summary.done}/{summary.total} đề ({percentOf(summary.done, summary.total)}%)
              </strong>
            </div>
            <ProgressBar value={percentOf(summary.done, summary.total)} label="Số đề đã làm" />
          </div>

          <div className="test-progress-row">
            <div className="test-progress-head">
              <span>Đạt được</span>
              <strong>
                {summary.passed}/{summary.total} đề đạt
                {summary.done > 0 ? ` · điểm trung bình ${summary.avgBest}%` : ''}
              </strong>
            </div>
            <ProgressBar value={percentOf(summary.passed, summary.total)} tone="success" label="Số đề đạt" />
          </div>

          {summary.skills.length > 1 &&
            summary.skills.map((s) => (
              <div key={s.skill} className="test-progress-row">
                <div className="test-progress-head test-progress-skill">
                  <span>{s.skill}</span>
                  <span>
                    đã làm {s.done}/{s.total} · đạt {s.passed}
                  </span>
                </div>
                <ProgressBar value={percentOf(s.done, s.total)} label={`Số đề ${s.skill} đã làm`} />
              </div>
            ))}

          <p className="test-progress-note">
            Một đề được tính là "đạt" khi điểm cao nhất của bạn từ {PASS_PERCENT}% trở lên.
          </p>
        </div>
      )}
      {tests.length === 0 ? (
        <div className="card">
          <p className="muted m-0">
            Chưa có đề nào. Tài khoản giáo viên có thể tạo đề qua API.
          </p>
        </div>
      ) : (
        <div>
          {tests.map((t) => {
            const stat = statsByTest.get(t.id);
            const passed = !!stat && stat.bestPercent >= PASS_PERCENT;
            return (
              <div key={t.id} className="list-item">
                <div className="test-footer-bar">
                  <div>
                    <strong className="fs-16">{t.title}</strong>
                    <div className="mt-6">
                      <span className="badge badge-primary">{t.skill}</span>
                      <span className="badge badge-accent ml-6">{t.timeLimitMinutes} phút</span>
                      {stat ? (
                        <span className={`badge ml-6 ${passed ? 'badge-success' : 'badge-accent'}`}>
                          {passed ? 'Đạt' : 'Chưa đạt'}
                        </span>
                      ) : (
                        <span className="badge ml-6 test-badge-new">Chưa làm</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => startTest(t.id)} className="btn btn-primary">
                    {stat ? 'Làm lại' : 'Bắt đầu làm bài'}
                  </button>
                </div>
                {stat && (
                  <div className="test-item-progress">
                    <div className="test-progress-head">
                      <span>
                        Điểm cao nhất: <strong>{stat.bestScore}/{stat.bestTotal}</strong> ({stat.bestPercent}%)
                      </span>
                      <span className="muted">
                        Đã làm {stat.attempts} lần
                        {stat.lastAt ? ` · gần nhất ${new Date(stat.lastAt).toLocaleDateString('vi-VN')}` : ''}
                      </span>
                    </div>
                    <ProgressBar
                      value={stat.bestPercent}
                      tone={passed ? 'success' : 'accent'}
                      label={`Điểm cao nhất của ${t.title}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}