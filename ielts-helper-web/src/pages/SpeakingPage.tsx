import { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';

interface SpeakingSubmission {
  id: string;
  partType: string;
  prompt: string;
  transcript: string | null;
  estimatedBand: number | null;
  feedback: string | null;
  submittedAt: string;
}

export default function SpeakingPage() {
  const [submissions, setSubmissions] = useState<SpeakingSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const [partType, setPartType] = useState('Part 1');
  const [prompt, setPrompt] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState('');
  const [micError, setMicError] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function loadSubmissions() {
    setLoading(true);
    const res = await apiClient.get<SpeakingSubmission[]>('/api/SpeakingSubmissions');
    setSubmissions(res.data);
    setLoading(false);
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  function formatTime(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  async function startRecording() {
    setMicError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setElapsed(0);
      setIsRecording(true);
    } catch {
      setMicError('Không truy cập được microphone — kiểm tra quyền truy cập trình duyệt đã cho phép chưa.');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  function resetRecording() {
    setAudioBlob(null);
    setAudioUrl(null);
    setElapsed(0);
  }

  async function handleSubmit() {
    if (!audioBlob) return;
    setGrading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('partType', partType);
      formData.append('prompt', prompt);
      formData.append('audioFile', audioBlob, 'recording.webm');

      await apiClient.post('/api/SpeakingSubmissions', formData);
      resetRecording();
      setPrompt('');
      await loadSubmissions();
    } catch {
      setError('Chấm bài thất bại — kiểm tra lại kết nối hoặc thử lại sau.');
    } finally {
      setGrading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa bài nói này?')) return;
    await apiClient.delete(`/api/SpeakingSubmissions/${id}`);
    await loadSubmissions();
  }

  return (
    <div>
      <h2>Speaking</h2>
      <p className="muted" style={{ marginBottom: 24 }}>
        Ghi âm câu trả lời, AI chuyển thành văn bản và chấm điểm. Phần phát âm chỉ là ước lượng — nên nhờ giáo viên
        nghe lại định kỳ.
      </p>

      <div className="card" style={{ marginBottom: 32 }}>
        <div className="field">
          <label className="label">Phần thi</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Part 1', 'Part 2', 'Part 3'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPartType(p)}
                className="badge"
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  fontFamily: 'var(--font-sans)',
                  padding: '8px 20px',
                  background: partType === p ? 'var(--primary)' : 'var(--primary-light)',
                  color: partType === p ? 'white' : 'var(--primary)',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label">Câu hỏi</label>
          <textarea
            className="input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            placeholder="Ví dụ: Describe your hometown."
          />
        </div>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          {!isRecording && !audioUrl && (
            <button
              onClick={startRecording}
              className="btn"
              style={{ background: 'var(--danger)', color: 'white', padding: '14px 32px', fontSize: 16 }}
            >
              🎙 Bắt đầu ghi âm
            </button>
          )}

          {isRecording && (
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 20px',
                  borderRadius: 999,
                  background: 'var(--danger-light)',
                  color: 'var(--danger)',
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--danger)',
                    display: 'inline-block',
                  }}
                />
                Đang ghi âm · {formatTime(elapsed)}
              </div>
              <div>
                <button
                  onClick={stopRecording}
                  className="btn"
                  style={{ background: 'var(--text)', color: 'white', padding: '14px 32px', fontSize: 16 }}
                >
                  ⏹ Dừng ghi âm
                </button>
              </div>
            </div>
          )}

          {micError && <p className="error-text">{micError}</p>}

          {audioUrl && !isRecording && (
            <div>
              <audio src={audioUrl} controls style={{ width: '100%' }} />
              <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={resetRecording} className="btn btn-ghost">Ghi lại</button>
                <button onClick={handleSubmit} disabled={grading || !prompt} className="btn btn-primary">
                  {grading ? 'Đang xử lý (15-30 giây)...' : 'Nộp bài chấm điểm'}
                </button>
              </div>
              {!prompt && <p className="muted" style={{ marginTop: 8 }}>Nhập câu hỏi trước khi nộp bài.</p>}
            </div>
          )}
        </div>
        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
      </div>

      <h3>Lịch sử bài nói</h3>
      {loading ? (
        <p className="muted">Đang tải...</p>
      ) : submissions.length === 0 ? (
        <p className="muted">Chưa có bài nào.</p>
      ) : (
        <div>
          {submissions.map((s) => (
            <div key={s.id} className="list-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-primary">{s.partType}</span>
                  <span className="muted" style={{ marginLeft: 10 }}>
                    {new Date(s.submittedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                {s.estimatedBand != null && <span className="band-score">Band {s.estimatedBand}</span>}
              </div>
              <p className="muted" style={{ margin: '10px 0' }}>{s.prompt}</p>
              {s.transcript && (
                <p
                  style={{
                    fontStyle: 'italic',
                    fontSize: 14,
                    borderLeft: '3px solid var(--border)',
                    paddingLeft: 12,
                    margin: '8px 0',
                  }}
                >
                  "{s.transcript}"
                </p>
              )}
              {s.feedback && (
                <div
                  style={{
                    background: 'var(--primary-light)',
                    padding: 16,
                    borderRadius: 'var(--radius-sm)',
                    marginTop: 8,
                  }}
                >
                  <p className="label" style={{ color: 'var(--primary)' }}>Nhận xét từ AI</p>
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{s.feedback}</p>
                </div>
              )}
              <button
                onClick={() => handleDelete(s.id)}
                className="btn btn-ghost"
                style={{ padding: '6px 14px', fontSize: 13, marginTop: 12 }}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
