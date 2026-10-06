import { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa6';
import apiClient from '@/api/client';
import type { SpeakingSubmission } from '@/types';
import './speaking.css';

const fetchSubmissions = () => apiClient.get<SpeakingSubmission[]>('/api/SpeakingSubmissions').then((res) => res.data);

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
    setSubmissions(await fetchSubmissions());
    setLoading(false);
  }

  useEffect(() => {
    fetchSubmissions().then((data) => {
      setSubmissions(data);
      setLoading(false);
    });
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
      <p className="muted mb-24">
        Ghi âm câu trả lời, AI chuyển thành văn bản và chấm điểm. Phần phát âm chỉ là ước lượng — nên nhờ giáo viên
        nghe lại định kỳ.
      </p>

      <div className="card mb-32">
        <div className="field">
          <label className="label">Phần thi</label>
          <div className="row-gap-8">
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

        <div className="speak-start-row">
          {!isRecording && !audioUrl && (
            <button
              onClick={startRecording}
              className="btn speak-start-btn"
            >
              <FaMicrophone className="ico" />Bắt đầu ghi âm
            </button>
          )}

          {isRecording && (
            <div>
              <div className="speak-recording-badge">
                <span className="speak-rec-dot" />
                Đang ghi âm · {formatTime(elapsed)}
              </div>
              <div>
                <button
                  onClick={stopRecording}
                  className="btn speak-stop-btn"
                >
                  <FaStop className="ico" />Dừng ghi âm
                </button>
              </div>
            </div>
          )}

          {micError && <p className="error-text">{micError}</p>}

          {audioUrl && !isRecording && (
            <div>
              <audio className="w-100pct" src={audioUrl} controls />
              <div className="speak-result-actions">
                <button onClick={resetRecording} className="btn btn-ghost">Ghi lại</button>
                <button onClick={handleSubmit} disabled={grading || !prompt} className="btn btn-primary">
                  {grading ? 'Đang xử lý (15-30 giây)...' : 'Nộp bài chấm điểm'}
                </button>
              </div>
              {!prompt && <p className="muted mt-8">Nhập câu hỏi trước khi nộp bài.</p>}
            </div>
          )}
        </div>
        {error && <p className="error-text mt-12">{error}</p>}
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
              <div className="row-between">
                <div>
                  <span className="badge badge-primary">{s.partType}</span>
                  <span className="muted ml-10">
                    {new Date(s.submittedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                {s.estimatedBand != null && <span className="band-score">Band {s.estimatedBand}</span>}
              </div>
              <p className="muted m-10-0">{s.prompt}</p>
              {s.transcript && (
                <p className="speak-transcript">
                  "{s.transcript}"
                </p>
              )}
              {s.feedback && (
                <div className="info-box">
                  <p className="label c-primary">Nhận xét từ AI</p>
                  <p className="pre-text">{s.feedback}</p>
                </div>
              )}
              <button
                onClick={() => handleDelete(s.id)}
                className="btn btn-ghost btn-sm mt-12"
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
