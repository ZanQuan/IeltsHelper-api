import { useState, useEffect } from 'react';
import apiClient from '../api/client';

interface TestSummary {
  id: string;
  skill: string;
  title: string;
  timeLimitMinutes: number;
}

interface AttemptQuestion {
  id: string;
  questionText: string;
  optionsJson: string | null;
}

interface AttemptData {
  attemptId: string;
  testTitle: string;
  passageOrTranscript: string;
  timeLimitMinutes: number;
  questions: AttemptQuestion[];
}

interface SubmitResult {
  score: number;
  total: number;
  elapsedMinutes: number;
}

export default function TestsPage() {
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiClient.get<TestSummary[]>('/api/Tests').then((res) => {
      setTests(res.data);
      setLoading(false);
    });
  }, []);

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
    const res = await apiClient.post<AttemptData>('/api/Attempts/start', { testId });
    setAttempt(res.data);
    setAnswers({});
    setResult(null);
    setSecondsLeft(res.data.timeLimitMinutes * 60);
  }

  function selectAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    if (!attempt || submitting) return;
    setSubmitting(true);
    const res = await apiClient.post<SubmitResult>(`/api/Attempts/${attempt.attemptId}/submit`, answers);
    setResult(res.data);
    setSubmitting(false);
  }

  function backToList() {
    setAttempt(null);
    setResult(null);
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
      <div className="card" style={{ textAlign: 'center', padding: 48, maxWidth: 480, margin: '0 auto' }}>
        <h2>Kết quả</h2>
        <p style={{ fontSize: 48, fontWeight: 800, color: 'var(--primary)', margin: '16px 0 4px' }}>
          {result.score}<span style={{ fontSize: 24, color: 'var(--text-muted)' }}>/{result.total}</span>
        </p>
        <span className="badge badge-success" style={{ marginBottom: 16 }}>{percent}% chính xác</span>
        <p className="muted">Thời gian làm bài: {result.elapsedMinutes} phút</p>
        <button onClick={backToList} className="btn btn-primary" style={{ marginTop: 16 }}>
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 70,
            background: 'var(--bg)',
            padding: '12px 0',
            zIndex: 5,
          }}
        >
          <div>
            <h2 style={{ marginBottom: 2 }}>{attempt.testTitle}</h2>
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

        <div className="card" style={{ marginBottom: 20, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
          {attempt.passageOrTranscript}
        </div>

        {attempt.questions.map((q, idx) => {
          const options: string[] = q.optionsJson ? JSON.parse(q.optionsJson) : [];
          return (
            <div key={q.id} className="card" style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 700, marginTop: 0 }}>Câu {idx + 1}: {q.questionText}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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

        <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary">
          {submitting ? 'Đang nộp...' : 'Nộp bài'}
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Listening &amp; Reading</h2>
      <p className="muted" style={{ marginBottom: 24 }}>
        Luyện đề có tính giờ giống thi thật, chấm điểm tự động ngay khi nộp.
      </p>
      {tests.length === 0 ? (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            Chưa có đề nào. Tài khoản giáo viên có thể tạo đề qua API.
          </p>
        </div>
      ) : (
        <div>
          {tests.map((t) => (
            <div key={t.id} className="list-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <strong style={{ fontSize: 16 }}>{t.title}</strong>
                  <div style={{ marginTop: 6 }}>
                    <span className="badge badge-primary">{t.skill}</span>
                    <span className="badge badge-accent" style={{ marginLeft: 6 }}>{t.timeLimitMinutes} phút</span>
                  </div>
                </div>
                <button onClick={() => startTest(t.id)} className="btn btn-primary">
                  Bắt đầu làm bài
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
