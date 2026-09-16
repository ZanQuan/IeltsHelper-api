import { useState, useEffect, type FormEvent } from 'react';
import apiClient from '../api/client';

interface Vocabulary {
  id: string;
  word: string;
  meaning: string;
  srsLevel: number;
  intervalDays: number;
  nextReviewDate: string | null;
}

export default function VocabularyPage() {
  const [dueWords, setDueWords] = useState<Vocabulary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loadingDue, setLoadingDue] = useState(true);

  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [adding, setAdding] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  async function loadDue() {
    setLoadingDue(true);
    const res = await apiClient.get<Vocabulary[]>('/api/Vocabularies/due');
    setDueWords(res.data);
    setCurrentIndex(0);
    setRevealed(false);
    setLoadingDue(false);
  }

  useEffect(() => {
    loadDue();
  }, []);

  const currentCard = dueWords[currentIndex];
  const total = dueWords.length;
  const done = Math.min(currentIndex, total);
  const progress = total === 0 ? 0 : (done / total) * 100;

  async function handleReview(remembered: boolean) {
    if (!currentCard) return;
    await apiClient.post(`/api/Vocabularies/${currentCard.id}/review`, { remembered });
    setRevealed(false);
    setCurrentIndex((i) => i + 1);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      await apiClient.post('/api/Vocabularies', { word, meaning });
      setWord('');
      setMeaning('');
      setAddedCount((c) => c + 1);
      await loadDue();
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <h2>Ôn từ vựng</h2>
      <p className="muted" style={{ marginBottom: 24 }}>
        Hệ thống tự giãn cách lịch ôn: nhớ được thì lần sau ôn xa hơn, quên thì ôn lại sớm.
      </p>

      {loadingDue ? (
        <p className="muted">Đang tải...</p>
      ) : !currentCard ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
          <h3 style={{ marginBottom: 4 }}>Đã ôn xong tất cả từ đến hạn hôm nay!</h3>
          <p className="muted" style={{ margin: 0 }}>Thêm từ mới bên dưới, hoặc quay lại vào ngày mai.</p>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="badge badge-primary">Còn {total - currentIndex} từ cần ôn</span>
            <span className="muted">{done}/{total}</span>
          </div>
          <div style={{ background: 'var(--border)', borderRadius: 999, height: 6, marginBottom: 20 }}>
            <div
              style={{
                width: `${progress}%`,
                background: 'var(--primary)',
                height: 6,
                borderRadius: 999,
                transition: 'width 0.25s',
              }}
            />
          </div>

          <div
            onClick={() => setRevealed(true)}
            className="card"
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              cursor: revealed ? 'default' : 'pointer',
              border: revealed ? '1.5px solid var(--primary)' : '1.5px dashed var(--border)',
              background: revealed ? 'var(--primary-light)' : 'var(--surface)',
              transition: 'all 0.2s',
            }}
          >
            <h1 style={{ fontSize: 36, marginBottom: 12 }}>{currentCard.word}</h1>
            {revealed ? (
              <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{currentCard.meaning}</p>
            ) : (
              <p className="muted" style={{ margin: 0 }}>Bấm vào thẻ để xem nghĩa</p>
            )}
          </div>

          {revealed && (
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center' }}>
              <button
                onClick={() => handleReview(false)}
                className="btn"
                style={{ background: 'var(--danger-light)', color: 'var(--danger)', minWidth: 140 }}
              >
                Quên rồi
              </button>
              <button
                onClick={() => handleReview(true)}
                className="btn"
                style={{ background: 'var(--success)', color: 'white', minWidth: 140 }}
              >
                Nhớ được
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border)', margin: '36px 0 24px' }} />

      <h3>Thêm từ mới</h3>
      <form onSubmit={handleAdd} className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Từ tiếng Anh</label>
            <input
              className="input"
              placeholder="meticulous"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Nghĩa</label>
            <input
              className="input"
              placeholder="tỉ mỉ, cẩn thận"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              required
            />
          </div>
        </div>
        <button type="submit" disabled={adding} className="btn btn-primary" style={{ marginTop: 16 }}>
          {adding ? 'Đang thêm...' : 'Thêm từ'}
        </button>
        {addedCount > 0 && (
          <p style={{ color: 'var(--success)', fontSize: 14, marginTop: 12, marginBottom: 0 }}>
            Đã thêm {addedCount} từ trong phiên này.
          </p>
        )}
      </form>
    </div>
  );
}
