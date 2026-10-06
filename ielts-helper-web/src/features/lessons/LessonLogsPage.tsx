import { useState, useEffect, Fragment, type FormEvent } from 'react';
import { FaBook, FaFileWord, FaNoteSticky, FaSpellCheck } from 'react-icons/fa6';
import apiClient from '@/api/client';
import type { LessonLog } from '@/types';
import './lessons.css';

const fetchLogs = () => apiClient.get<LessonLog[]>('/api/LessonLogs').then((res) => res.data);

export default function LessonLogsPage() {
  const [logs, setLogs] = useState<LessonLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [lessonDate, setLessonDate] = useState('');
  const [skillFocus, setSkillFocus] = useState('Speaking');
  const [summary, setSummary] = useState('');
  const [homework, setHomework] = useState('');
  const [selfRating, setSelfRating] = useState(3);
  const [newVocabulary, setNewVocabulary] = useState('');
  const [grammarNotes, setGrammarNotes] = useState('');
  const [otherNotes, setOtherNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [exportingId, setExportingId] = useState<string | 'all' | null>(null);

  async function loadLogs() {
    setLoading(true);
    setLogs(await fetchLogs());
    setLoading(false);
  }

  async function downloadWord(url: string, fileName: string, key: string | 'all') {
    setExportingId(key);
    try {
      const res = await apiClient.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } finally {
      setExportingId(null);
    }
  }

  useEffect(() => {
    fetchLogs().then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/api/LessonLogs', {
        lessonDate,
        skillFocus,
        summary,
        homework: homework || null,
        selfRating,
        newVocabulary: newVocabulary || null,
        grammarNotes: grammarNotes || null,
        otherNotes: otherNotes || null,
      });
      setLessonDate('');
      setSummary('');
      setHomework('');
      setSelfRating(3);
      setNewVocabulary('');
      setGrammarNotes('');
      setOtherNotes('');
      await loadLogs();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa buổi học này?')) return;
    await apiClient.delete(`/api/LessonLogs/${id}`);
    await loadLogs();
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const hasNotes = (log: LessonLog) => log.newVocabulary || log.grammarNotes || log.otherNotes;

  return (
    <div>
      <h2>Nhật ký buổi học</h2>
      <p className="muted mb-24">
        Ghi lại mỗi buổi học với giáo viên — cả tóm tắt lẫn nội dung chi tiết đã học, để xem lại bất cứ lúc nào.
      </p>

      <form onSubmit={handleSubmit} className="card mb-32">
        <h3>Ghi buổi học mới</h3>
        <div className="grid-2col">
          <div className="field">
            <label className="label">Ngày học</label>
            <input className="input" type="date" value={lessonDate} onChange={(e) => setLessonDate(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Kỹ năng trọng tâm</label>
            <select className="input" value={skillFocus} onChange={(e) => setSkillFocus(e.target.value)}>
              <option value="Speaking">Speaking</option>
              <option value="Writing">Writing</option>
              <option value="Listening">Listening</option>
              <option value="Reading">Reading</option>
              <option value="Grammar">Grammar</option>
              <option value="Vocabulary">Vocabulary</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label className="label">Tóm tắt buổi học</label>
          <textarea className="input" value={summary} onChange={(e) => setSummary(e.target.value)} required rows={2} />
        </div>

        <div className="lesson-details-block">
          <p className="label lesson-details-label">
            Nội dung chi tiết đã học (không bắt buộc, nhưng nên ghi ngay sau buổi học để nhớ lâu)
          </p>

          <div className="field">
            <label className="label"><FaBook className="ico" />Từ vựng mới</label>
            <textarea
              className="input"
              value={newVocabulary}
              onChange={(e) => setNewVocabulary(e.target.value)}
              rows={4}
              placeholder={'Mỗi dòng 1 từ, theo dạng: từ - nghĩa - câu ví dụ\nví dụ: controversial (adj) - gây tranh cãi - The topic was controversial.'}
            />
          </div>

          <div className="field">
            <label className="label"><FaSpellCheck className="ico" />Ngữ pháp / Cấu trúc</label>
            <textarea
              className="input"
              value={grammarNotes}
              onChange={(e) => setGrammarNotes(e.target.value)}
              rows={4}
              placeholder={'Cấu trúc + cách dùng + ví dụ\nví dụ: "Not only... but also..." dùng để nhấn mạnh 2 ý — Not only did she study hard, but she also passed with distinction.'}
            />
          </div>

          <div className="field">
            <label className="label"><FaNoteSticky className="ico" />Ghi chú khác</label>
            <textarea
              className="input"
              value={otherNotes}
              onChange={(e) => setOtherNotes(e.target.value)}
              rows={3}
              placeholder="Lỗi phát âm cần sửa, nhận xét của giáo viên, mẹo làm bài..."
            />
          </div>
        </div>

        <div className="field maxw-160">
          <label className="label">Tự đánh giá hiểu bài (1-5)</label>
          <input className="input" type="number" min={1} max={5} value={selfRating} onChange={(e) => setSelfRating(Number(e.target.value))} />
        </div>
        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting ? 'Đang lưu...' : 'Lưu buổi học'}
        </button>
      </form>

      <div className="lesson-list-head">
        <h3 className="m-0">Danh sách buổi học</h3>
        {logs.length > 0 && (
          <button
            onClick={() => downloadWord('/api/LessonLogs/export-word', `NhatKyBuoiHoc_${Date.now()}.docx`, 'all')}
            disabled={exportingId === 'all'}
            className="btn btn-accent lesson-export-btn"
          >
            {exportingId === 'all' ? 'Đang xuất...' : <><FaFileWord className="ico" />Xuất tất cả ra Word</>}
          </button>
        )}
      </div>

      {loading ? (
        <p className="muted">Đang tải...</p>
      ) : logs.length === 0 ? (
        <p className="muted">Chưa có buổi học nào.</p>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Ngày học</th>
                <th>Kỹ năng</th>
                <th>Tóm tắt</th>
                <th>Hiểu bài</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <Fragment key={log.id}>
                  <tr className="clickable" onClick={() => toggleExpand(log.id)}>
                    <td className="ws-nowrap">{new Date(log.lessonDate).toLocaleDateString('vi-VN')}</td>
                    <td><span className="badge badge-primary">{log.skillFocus}</span></td>
                    <td>
                      {log.summary}
                      {hasNotes(log) && <span className="badge badge-accent ml-6">Có ghi chú</span>}
                    </td>
                    <td><span className="badge badge-success">{log.selfRating}/5</span></td>
                    <td className="ws-nowrap">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpand(log.id); }}
                        className="btn btn-ghost lesson-toggle-btn"
                      >
                        {expandedId === log.id ? 'Thu gọn' : 'Chi tiết'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr>
                      <td className="bg-bg" colSpan={5}>
                        {log.homework && (
                          <p className="muted lesson-homework">Bài tập: {log.homework}</p>
                        )}
                        {log.newVocabulary && (
                          <div className="mb-12">
                            <p className="label"><FaBook className="ico" />Từ vựng mới</p>
                            <p className="pre-text">{log.newVocabulary}</p>
                          </div>
                        )}
                        {log.grammarNotes && (
                          <div className="mb-12">
                            <p className="label"><FaSpellCheck className="ico" />Ngữ pháp / Cấu trúc</p>
                            <p className="pre-text">{log.grammarNotes}</p>
                          </div>
                        )}
                        {log.otherNotes && (
                          <div className="mb-12">
                            <p className="label"><FaNoteSticky className="ico" />Ghi chú khác</p>
                            <p className="pre-text">{log.otherNotes}</p>
                          </div>
                        )}
                        {!hasNotes(log) && !log.homework && (
                          <p className="muted m-0">Buổi học này chưa có ghi chú chi tiết.</p>
                        )}
                        <div className="lesson-actions">
                          <button
                            onClick={() => downloadWord(`/api/LessonLogs/${log.id}/export-word`, `BuoiHoc_${log.lessonDate}.docx`, log.id)}
                            disabled={exportingId === log.id}
                            className="btn btn-ghost btn-sm"
                          >
                            {exportingId === log.id ? 'Đang xuất...' : <><FaFileWord className="ico" />Xuất Word</>}
                          </button>
                          <button onClick={() => handleDelete(log.id)} className="btn btn-ghost btn-sm">
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}