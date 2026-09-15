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
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h2>Speaking — ghi âm và chấm bằng AI</h2>

      <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, marginBottom: 32 }}>
        <div>
          <label>Phần thi</label><br />
          <select value={partType} onChange={(e) => setPartType(e.target.value)}>
            <option value="Part 1">Part 1</option>
            <option value="Part 2">Part 2</option>
            <option value="Part 3">Part 3</option>
          </select>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Câu hỏi</label><br />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{ width: '100%' }}
            rows={2}
            placeholder="Ví dụ: Describe your hometown."
          />
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          {!isRecording && !audioUrl && (
            <button onClick={startRecording} style={{ padding: '10px 24px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 6 }}>
              🎙 Bắt đầu ghi âm
            </button>
          )}
          {isRecording && (
            <button onClick={stopRecording} style={{ padding: '10px 24px', background: '#333', color: 'white', border: 'none', borderRadius: 6 }}>
              ⏹ Dừng ghi âm
            </button>
          )}
          {micError && <p style={{ color: 'red' }}>{micError}</p>}

          {audioUrl && !isRecording && (
            <div style={{ marginTop: 12 }}>
              <audio src={audioUrl} controls style={{ width: '100%' }} />
              <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button onClick={resetRecording}>Ghi lại</button>
                <button onClick={handleSubmit} disabled={grading || !prompt}>
                  {grading ? 'Đang xử lý (15-30 giây)...' : 'Nộp bài chấm điểm'}
                </button>
              </div>
              {!prompt && <p style={{ fontSize: 13, color: '#999' }}>Nhập câu hỏi trước khi nộp bài.</p>}
            </div>
          )}
        </div>
        {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
      </div>

      <h3>Lịch sử bài nói</h3>
      {loading ? (
        <p>Đang tải...</p>
      ) : submissions.length === 0 ? (
        <p>Chưa có bài nào.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {submissions.map((s) => (
            <li key={s.id} style={{ padding: 16, border: '1px solid #eee', borderRadius: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{s.partType} — {new Date(s.submittedAt).toLocaleDateString('vi-VN')}</strong>
                {s.estimatedBand != null && (
                  <span style={{ fontWeight: 'bold', fontSize: 18, color: '#2980b9' }}>Band {s.estimatedBand}</span>
                )}
              </div>
              <p style={{ margin: '8px 0', color: '#666' }}>{s.prompt}</p>
              {s.transcript && <p style={{ fontStyle: 'italic', fontSize: 14 }}>"{s.transcript}"</p>}
              {s.feedback && (
                <div style={{ background: '#f7f7f7', padding: 12, borderRadius: 6, marginTop: 8 }}>
                  <strong>Nhận xét AI:</strong>
                  <p style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0' }}>{s.feedback}</p>
                </div>
              )}
              <button onClick={() => handleDelete(s.id)} style={{ marginTop: 8 }}>Xóa</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}