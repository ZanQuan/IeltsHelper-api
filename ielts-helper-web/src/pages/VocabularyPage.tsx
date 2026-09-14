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
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2>Ôn từ vựng</h2>

      {loadingDue ? (
        <p>Đang tải...</p>
      ) : !currentCard ? (
        <div style={{ padding: 32, textAlign: 'center', border: '1px solid #ddd', borderRadius: 8 }}>
          <p>🎉 Đã ôn xong tất cả từ đến hạn hôm nay!</p>
        </div>
      ) : (
        <div>
          <p style={{ color: '#666' }}>Còn {dueWords.length - currentIndex} từ cần ôn</p>
          <div
            onClick={() => setRevealed(true)}
            style={{
              padding: 40,
              textAlign: 'center',
              border: '2px solid #333',
              borderRadius: 12,
              cursor: revealed ? 'default' : 'pointer',
              minHeight: 120,
            }}
          >
            <h1>{currentCard.word}</h1>
            {revealed ? (
              <p style={{ fontSize: 18, marginTop: 16 }}>{currentCard.meaning}</p>
            ) : (
              <p style={{ color: '#999' }}>(bấm vào đây để xem nghĩa)</p>
            )}
          </div>

          {revealed && (
            <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center' }}>
              <button
                onClick={() => handleReview(false)}
                style={{ padding: '8px 24px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 6 }}
              >
                Quên
              </button>
              <button
                onClick={() => handleReview(true)}
                style={{ padding: '8px 24px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 6 }}
              >
                Nhớ
              </button>
            </div>
          )}
        </div>
      )}

      <hr style={{ margin: '32px 0' }} />

      <h3>Thêm từ mới</h3>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8 }}>
        <input placeholder="Từ" value={word} onChange={(e) => setWord(e.target.value)} required style={{ flex: 1 }} />
        <input placeholder="Nghĩa" value={meaning} onChange={(e) => setMeaning(e.target.value)} required style={{ flex: 1 }} />
        <button type="submit" disabled={adding}>{adding ? 'Đang thêm...' : 'Thêm'}</button>
      </form>
      {addedCount > 0 && <p style={{ color: '#27ae60' }}>Đã thêm {addedCount} từ trong phiên này.</p>}
    </div>
  );
}