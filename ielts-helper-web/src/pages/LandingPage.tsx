import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './landing.css';

/* ---- Icon nhỏ, tự vẽ, không phụ thuộc thư viện ngoài ---- */

function IconWriting() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
function IconMic() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 19v3" />
    </svg>
  );
}
function IconHeadphones() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14v-2a9 9 0 0 1 18 0v2" />
      <rect x="3" y="14" width="5" height="7" rx="1.5" />
      <rect x="16" y="14" width="5" height="7" rx="1.5" />
    </svg>
  );
}
function IconLayers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 2 8l10 5 10-5-10-5Z" />
      <path d="m2 13 10 5 10-5" />
    </svg>
  );
}
function IconClipboard() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="m9 13 2 2 4-4" />
    </svg>
  );
}
function IconNotebook() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function IconBolt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c1-3.5 3.4-5.5 6.5-5.5s5.5 2 6.5 5.5" />
      <circle cx="17.5" cy="8.5" r="2.4" />
      <path d="M15.5 14.3c2.4.4 4 2.1 4.8 5.2" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}
function IconCamera() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h3l2-2h6l2 2h3v11H4Z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

function WaveDivider({ flip = false, fill }: { flip?: boolean; fill: string }) {
  return (
    <svg
      className="lp-wave"
      viewBox="0 0 1440 90"
      preserveAspectRatio="none"
      style={{ transform: flip ? 'scaleY(-1)' : undefined }}
    >
      <path
        fill={fill}
        d="M0,32 C240,80 480,0 720,24 C960,48 1200,88 1440,40 L1440,90 L0,90 Z"
      />
    </svg>
  );
}

const FEATURES = [
  { icon: <IconWriting />, title: 'AI chấm Writing', desc: 'Nộp bài luận, nhận điểm theo 4 tiêu chí IELTS kèm nhận xét chi tiết chỉ trong vài giây.' },
  { icon: <IconMic />, title: 'AI chấm Speaking', desc: 'Luyện nói theo từng Part, nhận phản hồi và điểm ước tính ngay sau khi nộp bài.' },
  { icon: <IconHeadphones />, title: 'Đề thi thử Nghe & Đọc', desc: 'Làm đề Listening, Reading theo đúng định dạng thi thật, chấm điểm tự động.' },
  { icon: <IconLayers />, title: 'Từ vựng thông minh', desc: 'Lưu từ mới theo từng buổi học, ôn đúng lúc nhờ hệ thống lặp ngắt quãng (SRS).' },
  { icon: <IconClipboard />, title: 'Bài tập & chấm điểm', desc: 'Giáo viên giao bài riêng cho từng học viên, học viên nộp bài và xem điểm ngay trên hệ thống.' },
  { icon: <IconNotebook />, title: 'Nhật ký buổi học', desc: 'Mỗi buổi học được ghi lại nội dung, lỗi sai thường gặp và mức độ hiểu bài.' },
];

const STEPS = [
  { title: 'Đăng ký tài khoản', desc: 'Tạo tài khoản học viên miễn phí chỉ trong chưa đầy một phút.' },
  { title: 'Liên kết với giáo viên', desc: 'Nhập email giáo viên đang dạy bạn để họ theo dõi tiến trình và giao bài tập riêng.' },
  { title: 'Luyện tập & nhận phản hồi', desc: 'Làm bài Writing, Speaking, đề thi thử mỗi ngày — nhận điểm từ AI và bài được giáo viên chấm.' },
];

const WHY = [
  { icon: <IconBolt />, title: 'Phản hồi tức thì, mọi lúc', desc: 'Không cần chờ đến buổi học tiếp theo mới biết mình sai ở đâu.' },
  { icon: <IconUsers />, title: 'Giáo viên đồng hành thật', desc: 'Không chỉ có AI — giáo viên của bạn vẫn trực tiếp giao bài và chấm điểm.' },
  { icon: <IconChart />, title: 'Theo dõi tiến bộ rõ ràng', desc: 'Nhật ký buổi học, lỗi sai, điểm số — tất cả ở một nơi duy nhất.' },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="lp-nav">
        <div className="lp-shell lp-nav-inner">
          <div className="lp-nav-brand">
            <img src={logo} alt="Whale English" />
            <span>Whale English</span>
          </div>
          <nav className="lp-nav-links">
            <a href="#features">Tính năng</a>
            <a href="#how-it-works">Cách hoạt động</a>
            <a href="#why-us">Vì sao chọn chúng tôi</a>
          </nav>
          <div className="lp-nav-actions">
            <Link to="/login" className="lp-btn lp-btn-ghost-light">Đăng nhập</Link>
            <Link to="/register" className="lp-btn lp-btn-primary">Bắt đầu miễn phí</Link>
          </div>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-shell lp-hero-inner">
          <div>
            <span className="lp-hero-eyebrow">Whale English — By Ms. An's English Hub</span>
            <h1>Học tiếng Anh có lộ trình, có giáo viên, có AI chấm điểm</h1>
            <p className="lp-lead">
              Kết hợp bài học từ giáo viên với công cụ luyện Writing, Speaking, Nghe &amp; Đọc được AI
              chấm điểm ngay lập tức — để bạn biết chính xác mình đang ở đâu, mỗi ngày.
            </p>
            <div className="lp-hero-cta">
              <Link to="/register" className="lp-btn lp-btn-primary lp-btn-lg">Bắt đầu miễn phí</Link>
              <a href="#features" className="lp-btn lp-btn-ghost-light lp-btn-lg">Xem tính năng</a>
            </div>
            <div className="lp-chip-row">
              <span className="lp-chip"><IconCheck /> AI chấm Writing &amp; Speaking</span>
              <span className="lp-chip"><IconCheck /> Đề thi thử Nghe – Đọc</span>
              <span className="lp-chip"><IconCheck /> Giáo viên riêng theo sát</span>
            </div>
          </div>

          <div className="lp-hero-visual">
            <div className="lp-mock-card lp-mock-writing">
              <div className="lp-mock-head">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Writing Task 2</div>
                  <div className="lp-mock-band-label">Chấm bởi AI</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="lp-mock-band">7.5</div>
                  <div className="lp-mock-band-label">Overall</div>
                </div>
              </div>
              <p className="lp-mock-essay">
                Many people believe technology has <span className="lp-mock-flag">changed</span> the way
                students learn English forever, and overall I agree with this view...
              </p>
              <div className="lp-mock-note">
                <IconWriting />
                <span>Từ vựng: cân nhắc dùng "transformed" thay cho "changed" để nâng điểm Lexical Resource.</span>
              </div>
              <div className="lp-mock-scores">
                <span>Task Response 7.5</span>
                <span>Coherence 7.0</span>
                <span>Lexical 7.5</span>
                <span>Grammar 7.5</span>
              </div>
            </div>

            <div className="lp-mock-card lp-mock-speaking">
              <div className="lp-mock-head" style={{ marginBottom: 4 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Speaking Part 2</div>
                  <div className="lp-mock-band-label">Đang chấm...</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="lp-mock-band">7.0</div>
                  <div className="lp-mock-band-label">Ước tính</div>
                </div>
              </div>
              <div className="lp-mock-waveform">
                {[10, 22, 14, 30, 18, 26, 12, 20, 16, 28, 10].map((h, i) => (
                  <span key={i} style={{ height: h }} />
                ))}
              </div>
              <div className="lp-mock-caption">
                <IconMic /> Nhận phản hồi phát âm &amp; trôi chảy ngay sau khi nộp
              </div>
            </div>
          </div>
        </div>
        <WaveDivider fill="#F7F8FC" />
      </section>

      <section id="features" className="lp-section lp-shell">
        <div className="lp-section-head">
          <h2>Một hành trình, đủ mọi kỹ năng</h2>
          <p>Mọi công cụ luyện thi IELTS bạn cần, ở cùng một nơi, đồng bộ với giáo viên đang dạy bạn.</p>
        </div>
        <div className="lp-feature-grid">
          {FEATURES.map((f) => (
            <div className="lp-feature-card" key={f.title}>
              <div className="lp-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="lp-section-tight lp-shell">
        <div className="lp-section-head">
          <h2>Bắt đầu chỉ với 3 bước</h2>
          <p>Không cần cài đặt phức tạp — có tài khoản là luyện tập được ngay.</p>
        </div>
        <div className="lp-steps">
          {STEPS.map((s, i) => (
            <div className="lp-step" key={s.title}>
              <div className="lp-step-num">{i + 1}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="why-us" className="lp-section lp-shell" style={{ background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
        <div className="lp-section-head">
          <h2>Vì sao chọn Whale English</h2>
          <p>Không chỉ là một app luyện đề — là nơi giáo viên và AI cùng đồng hành với bạn.</p>
        </div>
        <div className="lp-why-grid">
          {WHY.map((w) => (
            <div className="lp-why-item" key={w.title}>
              <h3>{w.icon}{w.title}</h3>
              <p>{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section lp-shell">
        <div className="lp-about">
          <div className="lp-photo-placeholder">
            {/* TODO: thay bằng ảnh thật của giáo viên / lớp học khi có */}
            <IconCamera />
            <span>Ảnh giáo viên / lớp học — thêm sau</span>
          </div>
          <div>
            <h2>Về Whale English</h2>
            <p>
              Whale English do Ms. An sáng lập, kết hợp việc giảng dạy trực tiếp với công cụ luyện tập
              có AI hỗ trợ, giúp học viên chủ động luyện Writing, Speaking, Nghe và Đọc mỗi ngày thay vì
              chỉ học trên lớp.
            </p>
            <p>
              Mỗi học viên được giáo viên theo sát: giao bài tập riêng, chấm và nhận xét trực tiếp trên
              hệ thống — bên cạnh phần luyện tập được AI chấm điểm tức thì.
            </p>
          </div>
        </div>
      </section>

      <section className="lp-cta-band">
        <WaveDivider flip fill="#F7F8FC" />
        <div className="lp-shell">
          <h2>Sẵn sàng bắt đầu?</h2>
          <p>Tạo tài khoản miễn phí và làm bài luyện tập đầu tiên ngay hôm nay.</p>
          <Link to="/register" className="lp-btn lp-btn-primary lp-btn-lg">Bắt đầu miễn phí</Link>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-shell">
          <div className="lp-footer-inner">
            <div className="lp-footer-brand">
              <img src={logo} alt="Whale English" />
              <span>Whale English</span>
            </div>
            <nav className="lp-footer-links">
              <a href="#features">Tính năng</a>
              <a href="#how-it-works">Cách hoạt động</a>
              <Link to="/login">Đăng nhập</Link>
              <Link to="/register">Đăng ký</Link>
            </nav>
          </div>
          <p className="lp-footer-copy">© {new Date().getFullYear()} Whale English. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
