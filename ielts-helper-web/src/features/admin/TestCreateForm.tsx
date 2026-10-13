import { useState, type FormEvent } from 'react';
import axios from 'axios';
import apiClient from '@/api/client';

interface QuestionDraft {
  questionText: string;
  options: string[];
  correctIndex: number | null;
}

const blankQuestion = (): QuestionDraft => ({ questionText: '', options: ['', '', '', ''], correctIndex: null });

export default function TestCreateForm({ onCreated }: { onCreated: () => void }) {
  const [skill, setSkill] = useState('Reading');
  const [title, setTitle] = useState('');
  const [passage, setPassage] = useState('');
  const [timeLimit, setTimeLimit] = useState(20);
  const [questions, setQuestions] = useState<QuestionDraft[]>([blankQuestion()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const patchQuestion = (qi: number, change: Partial<QuestionDraft>) =>
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, ...change } : q)));

  const setOption = (qi: number, oi: number, text: string) =>
    patchQuestion(qi, { options: questions[qi].options.map((o, i) => (i === oi ? text : o)) });

  function validate(): string {
    if (!title.trim()) return 'Vui lòng nhập tên đề.';
    if (!passage.trim()) return 'Vui lòng nhập đoạn văn / transcript.';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return `Câu ${i + 1}: chưa nhập nội dung câu hỏi.`;
      if (q.options.some((o) => !o.trim())) return `Câu ${i + 1}: có đáp án còn trống.`;
      if (q.correctIndex === null) return `Câu ${i + 1}: hãy chọn đáp án đúng.`;
    }
    return '';
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);

    setSaving(true);
    setError('');
    try {
      await apiClient.post('/api/Tests', {
        skill,
        title: title.trim(),
        passageOrTranscript: passage.trim(),
        timeLimitMinutes: timeLimit,
        questions: questions.map((q) => ({
          questionText: q.questionText.trim(),
          options: q.options.map((o) => o.trim()),
          correctAnswer: q.options[q.correctIndex!].trim(),
        })),
      });
      setTitle('');
      setPassage('');
      setQuestions([blankQuestion()]);
      onCreated();
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error ?? 'Không tạo được đề thi.' : 'Không tạo được đề thi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card mb-24">
      <h3>Tạo đề thi mới</h3>
      <div className="grid-2col">
        <div className="field">
          <label className="label">Kỹ năng</label>
          <select className="input" value={skill} onChange={(e) => setSkill(e.target.value)}>
            <option value="Reading">Reading</option>
            <option value="Listening">Listening</option>
          </select>
        </div>
        <div className="field">
          <label className="label">Thời gian (phút)</label>
          <input className="input" type="number" min={1} max={180} value={timeLimit}
                 onChange={(e) => setTimeLimit(Number(e.target.value))} />
        </div>
      </div>
      <div className="field">
        <label className="label">Tên đề</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="field">
        <label className="label">Đoạn văn / Transcript</label>
        <textarea className="input" rows={5} value={passage} onChange={(e) => setPassage(e.target.value)} />
      </div>

      {questions.map((q, qi) => (
        <div key={qi} className="list-item">
          <div className="field">
            <label className="label">Câu {qi + 1}</label>
            <input className="input" value={q.questionText}
                   onChange={(e) => patchQuestion(qi, { questionText: e.target.value })} />
          </div>
          {q.options.map((opt, oi) => (
            <div key={oi} className="row-center-10 mb-8">
              <input type="radio" name={`correct-${qi}`} checked={q.correctIndex === oi}
                     onChange={() => patchQuestion(qi, { correctIndex: oi })} title="Đáp án đúng" />
              <input className="input" placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`} value={opt}
                     onChange={(e) => setOption(qi, oi, e.target.value)} />
            </div>
          ))}
          {questions.length > 1 && (
            <button type="button" className="btn btn-ghost btn-sm"
                    onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qi))}>
              Xóa câu
            </button>
          )}
        </div>
      ))}

      <div className="row-wrap-10">
        <button type="button" className="btn btn-ghost"
                onClick={() => setQuestions((prev) => [...prev, blankQuestion()])}>
          + Thêm câu hỏi
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Đang lưu...' : 'Tạo đề thi'}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </form>
  );
}