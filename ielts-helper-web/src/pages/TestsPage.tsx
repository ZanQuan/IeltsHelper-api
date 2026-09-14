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

  if (loading) return <p>Đang tải...</p>;

  if (result) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <h2>Kết quả</h2>
        <p style={{ fontSize: 32, fontWeight: 'bold' }}>{result.score} / {result.total}</p>
        <p>Thời gian làm bài: {result.elapsedMinutes} phút</p>
        <button onClick={backToList} style={{ marginTop: 16 }}>Quay lại danh sách đề</button>
      </div>
    );
  }

  if (attempt) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>{attempt.testTitle}</h2>
          <span style={{ fontSize: 20, fontWeight: 'bold', color: secondsLeft < 60 ? 'red' : 'black' }}>
            ⏱ {formatTime(secondsLeft)}
          </span>
        </div>

        <div style={{ padding: 12, background: '#f7f7f7', borderRadius: 8, marginBottom: 16, whiteSpace: 'pre-wrap' }}>
          {attempt.passageOrTranscript}
        </div>

        {attempt.questions.map((q, idx) => {
          const options: string[] = q.optionsJson ? JSON.parse(q.optionsJson) : [];
          return (
            <div key={q.id} style={{ marginBottom: 16, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
              <p><strong>Câu {idx + 1}:</strong> {q.questionText}</p>
              {options.map((opt) => (
                <label key={opt} style={{ display: 'block', marginTop: 4 }}>
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => selectAnswer(q.id, opt)}
                  />{' '}
                  {opt}
                </label>
              ))}
            </div>
          );
        })}

        <button onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Đang nộp...' : 'Nộp bài'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h2>Listening & Reading</h2>
      {tests.length === 0 ? (
        <p>Chưa có đề nào — tạo thử 1 đề bằng API (xem bước 4 bên dưới).</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tests.map((t) => (
            <li key={t.id} style={{ padding: 16, border: '1px solid #eee', borderRadius: 8, marginBottom: 12 }}>
              <strong>{t.title}</strong> <span style={{ color: '#666' }}>({t.skill}, {t.timeLimitMinutes} phút)</span>
              <div>
                <button onClick={() => startTest(t.id)} style={{ marginTop: 8 }}>Bắt đầu làm bài</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}