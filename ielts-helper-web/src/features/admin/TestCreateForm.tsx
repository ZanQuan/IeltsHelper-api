import { useState, type ChangeEvent, type FormEvent } from 'react';
import axios from 'axios';
import apiClient from '@/api/client';

interface QuestionDraft {
  questionText: string;
  options: string[];
  correctIndex: number | null;
}

const MAX_AUDIO_MB = 100; // khớp với giới hạn của máy chủ (AudiosController)

const blankQuestion = (): QuestionDraft => ({ questionText: '', options: ['', '', '', ''], correctIndex: null });

export default function TestCreateForm({ onCreated }: { onCreated: () => void }) {
  const [skill, setSkill] = useState('Reading');
  const [title, setTitle] = useState('');
  const [passage, setPassage] = useState('');
  const [timeLimit, setTimeLimit] = useState(20);
  const [questions, setQuestions] = useState<QuestionDraft[]>([blankQuestion()]);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioName, setAudioName] = useState('');
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const patchQuestion = (qi: number, change: Partial<QuestionDraft>) =>
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, ...change } : q)));

  const setOption = (qi: number, oi: number, text: string) =>
    patchQuestion(qi, { options: questions[qi].options.map((o, i) => (i === oi ? text : o)) });

  async function handlePickAudio(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // cho phép chọn lại đúng file đó lần sau
    if (!file) return;

    setError('');
    if (!/\.(mp3|wav|ogg|m4a)$/i.test(file.name)) {
      setError('Chỉ chấp nhận file audio .mp3, .wav, .ogg hoặc .m4a.');
      return;
    }
    if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
      setError(`File quá lớn (tối đa ${MAX_AUDIO_MB} MB).`);
      return;
    }

    const form = new FormData();
    form.append('file', file);
    setUploadingAudio(true);
    setAudioProgress(0);
    try {
      const res = await apiClient.post<{ url: string }>('/api/Audios/upload', form, {
        timeout: 0, // file lớn có thể mất vài phút
        onUploadProgress: (ev) => {
          if (ev.total) setAudioProgress(Math.round((ev.loaded * 100) / ev.total));
        },
      });
      setAudioUrl(res.data.url);
      setAudioName(file.name);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.error ??
              (err.response?.status === 404 || err.response?.status === 413
                ? `Máy chủ từ chối file (có thể vượt giới hạn ${MAX_AUDIO_MB} MB).`
                : 'Tải audio lên thất bại. Hãy thử lại.')
          : 'Tải audio lên thất bại. Hãy thử lại.',
      );
    } finally {
      setUploadingAudio(false);
    }
  }

  function validate(): string {
    if (!title.trim()) return 'Vui lòng nhập tên đề.';
    if (uploadingAudio) return 'Đang tải audio lên, vui lòng chờ tải xong.';
    if (skill === 'Reading' && !passage.trim()) return 'Vui lòng nhập đoạn văn.';
    if (skill === 'Listening' && !audioUrl && !passage.trim()) return 'Đề Listening cần chọn file audio (hoặc nhập transcript).';
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
        audioUrl: skill === 'Listening' && audioUrl ? audioUrl : null,
        timeLimitMinutes: timeLimit,
        questions: questions.map((q) => ({
          questionText: q.questionText.trim(),
          options: q.options.map((o) => o.trim()),
          correctAnswer: q.options[q.correctIndex!].trim(),
        })),
      });
      setTitle('');
      setPassage('');
      setAudioUrl('');
      setAudioName('');
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
          <select
            className="input"
            value={skill}
            onChange={(e) => {
              setSkill(e.target.value);
              if (e.target.value !== 'Listening') { setAudioUrl(''); setAudioName(''); }
            }}
          >
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
      {skill === 'Listening' && (
        <div className="field">
          <label className="label">File audio bài nghe (MP3, WAV, OGG, M4A, tối đa {MAX_AUDIO_MB} MB)</label>
          <input
            type="file"
            accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,.mp3,.wav,.ogg,.m4a"
            onChange={handlePickAudio}
            disabled={uploadingAudio || saving}
          />
          {uploadingAudio && (
            <p className="muted" style={{ margin: '8px 0 0' }}>
              Đang tải audio lên... {audioProgress}%
              <progress value={audioProgress} max={100} style={{ display: 'block', width: '100%', marginTop: 6 }} />
            </p>
          )}
          {!uploadingAudio && audioUrl && (
            <div style={{ marginTop: 8 }}>
              <p className="muted" style={{ margin: '0 0 6px' }}>Đã tải lên: {audioName}</p>
              <audio controls preload="metadata" src={audioUrl} style={{ width: '100%' }} />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 6 }}
                onClick={() => { setAudioUrl(''); setAudioName(''); }}
              >
                Gỡ file audio
              </button>
            </div>
          )}
        </div>
      )}
      <div className="field">
        <label className="label">
          {skill === 'Listening'
            ? 'Transcript (không bắt buộc nếu đã có audio, học viên sẽ không thấy)'
            : 'Đoạn văn'}
        </label>
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
        <button type="submit" className="btn btn-primary" disabled={saving || uploadingAudio}>
          {saving ? 'Đang lưu...' : 'Tạo đề thi'}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </form>
  );
}