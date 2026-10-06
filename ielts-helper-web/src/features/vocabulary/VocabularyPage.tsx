import { useState, useEffect, type FormEvent } from 'react';
import { FaCircleCheck } from 'react-icons/fa6';
import apiClient from '@/api/client';
import type { Vocabulary } from '@/types';
import './vocabulary.css';

const fetchDue = () => apiClient.get<Vocabulary[]>('/api/Vocabularies/due').then((res) => res.data);

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
    setDueWords(await fetchDue());
    setCurrentIndex(0);
    setRevealed(false);
    setLoadingDue(false);
  }

  useEffect(() => {
    fetchDue().then((data) => {
      setDueWords(data);
      setLoadingDue(false);
    });
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
      <p className="muted mb-24">
        Hệ thống tự giãn cách lịch ôn: nhớ được thì lần sau ôn xa hơn, quên thì ôn lại sớm.
      </p>

      {loadingDue ? (
        <p className="muted">Đang tải...</p>
      ) : !currentCard ? (
        <div className="card vocab-done-card">
          <div className="vocab-done-icon"><FaCircleCheck /></div>
          <h3 className="mb-4">Đã ôn xong tất cả từ đến hạn hôm nay!</h3>
          <p className="muted m-0">Thêm từ mới bên dưới, hoặc quay lại vào ngày mai.</p>
        </div>
      ) : (
        <div>
          <div className="vocab-card-head">
            <span className="badge badge-primary">Còn {total - currentIndex} từ cần ôn</span>
            <span className="muted">{done}/{total}</span>
          </div>
          <div className="vocab-progress-track">
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
            <h1 className="vocab-word">{currentCard.word}</h1>
            {revealed ? (
              <p className="vocab-meaning">{currentCard.meaning}</p>
            ) : (
              <p className="muted m-0">Bấm vào thẻ để xem nghĩa</p>
            )}
          </div>

          {revealed && (
            <div className="vocab-actions">
              <button
                onClick={() => handleReview(false)}
                className="btn vocab-forgot-btn"
              >
                Quên rồi
              </button>
              <button
                onClick={() => handleReview(true)}
                className="btn vocab-remember-btn"
              >
                Nhớ được
              </button>
            </div>
          )}
        </div>
      )}

      <div className="vocab-add-divider" />

      <h3>Thêm từ mới</h3>
      <form onSubmit={handleAdd} className="card">
        <div className="grid-2col">
          <div className="field mb-0">
            <label className="label">Từ tiếng Anh</label>
            <input
              className="input"
              placeholder="meticulous"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              required
            />
          </div>
          <div className="field mb-0">
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
        <button type="submit" disabled={adding} className="btn btn-primary mt-16">
          {adding ? 'Đang thêm...' : 'Thêm từ'}
        </button>
        {addedCount > 0 && (
          <p className="vocab-added-note">
            Đã thêm {addedCount} từ trong phiên này.
          </p>
        )}
      </form>
    </div>
  );
}
