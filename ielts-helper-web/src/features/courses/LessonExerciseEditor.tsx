import { useState } from 'react';
import apiClient from '@/api/client';

interface EditableQuestion {
  id?: string;
  prompt: string;
  options: string[];
  correctIndexes: number[];
}

interface Props {
  courseId: string;
  lessonId: string;
}

const blankQuestion = (): EditableQuestion => ({ prompt: '', options: ['', ''], correctIndexes: [] });

/** Giáo viên soạn / sửa bài tập trắc nghiệm của một bài học. */
export default function LessonExerciseEditor({ courseId, lessonId }: Props) {
  const url = `/api/Courses/${courseId}/lessons/${lessonId}/exercises`;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await apiClient.get<EditableQuestion[]>(url);
      setQuestions(res.data);
    } catch {
      setError('Không tải được bài tập. Có thể bạn không phải giáo viên của khóa này.');
    } finally {
      setLoading(false);
    }
  }

  function patch(qi: number, change: Partial<EditableQuestion>) {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, ...change } : q)));
  }

  function setOption(qi: number, oi: number, text: string) {
    const q = questions[qi];
    patch(qi, { options: q.options.map((o, i) => (i === oi ? text : o)) });
  }

  function addOption(qi: number) {
    const q = questions[qi];
    if (q.options.length >= 6) return;
    patch(qi, { options: [...q.options, ''] });
  }

  function removeOption(qi: number, oi: number) {
    const q = questions[qi];
    if (q.options.length <= 2) return;
    patch(qi, {
      options: q.options.filter((_, i) => i !== oi),
      // bỏ đáp án bị xóa, dồn lại vị trí các đáp án đúng phía sau
      correctIndexes: q.correctIndexes.filter((c) => c !== oi).map((c) => (c > oi ? c - 1 : c)),
    });
  }

  function toggleCorrect(qi: number, oi: number) {
    const q = questions[qi];
    patch(qi, {
      correctIndexes: q.correctIndexes.includes(oi)
        ? q.correctIndexes.filter((c) => c !== oi)
        : [...q.correctIndexes, oi].sort((a, b) => a - b),
    });
  }

  function validate(): string {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) return `Câu ${i + 1}: chưa nhập nội dung câu hỏi.`;
      if (q.options.some((o) => !o.trim())) return `Câu ${i + 1}: có đáp án còn trống.`;
      if (q.correctIndexes.length === 0) return `Câu ${i + 1}: hãy tick ít nhất 1 đáp án đúng.`;
    }
    return '';
  }

  async function save() {
    const problem = validate();
    if (problem) {
      setError(problem);
      setMessage('');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await apiClient.put(url, questions);
      setMessage(
        questions.length === 0 ? 'Đã xóa toàn bộ bài tập của bài này.' : `Đã lưu ${questions.length} câu hỏi.`,
      );
    } catch {
      setError('Không lưu được, hãy thử lại.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginTop: 10 }}>
      <button type="button" className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 13 }} onClick={toggle}>
        {open ? 'Đóng bài tập' : 'Soạn bài tập'}
      </button>

      {open && (
        <div className="card" style={{ marginTop: 10 }}>
          {loading ? (
            <p className="muted">Đang tải...</p>
          ) : (
            <>
              {questions.length === 0 && (
                <p className="muted" style={{ marginTop: 0 }}>Bài này chưa có câu hỏi nào.</p>
              )}

              {questions.map((q, qi) => (
                <div key={q.id ?? `new-${qi}`} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong>Câu {qi + 1}</strong>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '4px 12px', fontSize: 12 }}
                      onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qi))}
                    >
                      Xóa câu
                    </button>
                  </div>

                  <div className="field">
                    <label className="label">Nội dung câu hỏi</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={q.prompt}
                      onChange={(e) => patch(qi, { prompt: e.target.value })}
                    />
                  </div>

                  <label className="label">Các đáp án (tick vào ô để chọn đáp án đúng)</label>
                  {q.options.map((opt, oi) => (
                    <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <input
                        type="checkbox"
                        checked={q.correctIndexes.includes(oi)}
                        onChange={() => toggleCorrect(qi, oi)}
                        title="Đáp án đúng"
                      />
                      <strong style={{ width: 20 }}>{String.fromCharCode(65 + oi)}</strong>
                      <input
                        className="input"
                        style={{ flex: 1 }}
                        value={opt}
                        onChange={(e) => setOption(qi, oi, e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        disabled={q.options.length <= 2}
                        onClick={() => removeOption(qi, oi)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: '4px 12px', fontSize: 13 }}
                    disabled={q.options.length >= 6}
                    onClick={() => addOption(qi)}
                  >
                    + Thêm đáp án
                  </button>
                  <p className="muted" style={{ fontSize: 12, margin: '8px 0 0' }}>
                    {q.correctIndexes.length > 1
                      ? 'Câu này có nhiều đáp án đúng, học viên sẽ thấy ô chọn nhiều.'
                      : 'Tick 2 đáp án trở lên nếu câu cho phép chọn nhiều.'}
                  </p>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setQuestions((prev) => [...prev, blankQuestion()])}
                >
                  + Thêm câu hỏi
                </button>
                <button type="button" className="btn btn-primary" disabled={saving} onClick={save}>
                  {saving ? 'Đang lưu...' : 'Lưu bài tập'}
                </button>
              </div>

              {error && <p className="error-text" style={{ marginBottom: 0 }}>{error}</p>}
              {message && <p style={{ color: '#22a55b', marginBottom: 0 }}>{message}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}