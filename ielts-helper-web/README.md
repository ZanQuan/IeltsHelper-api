# Whale English – Web (React + TypeScript + Vite)

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

Cần file `.env`:

```
VITE_API_URL=http://localhost:5119
VITE_GOOGLE_CLIENT_ID=...
```

## Bản đồ thư mục – "muốn sửa X thì mở đâu?"

```
src/
├── main.tsx                 Điểm vào của ứng dụng
├── app/
│   └── App.tsx              Khai báo toàn bộ route + bảo vệ đăng nhập
├── api/
│   └── client.ts            axios dùng chung (tự gắn token)
├── styles/
│   ├── index.css            CSS toàn cục (màu, nút, card, badge...)
│   ├── utilities.css        Class tiện ích 1 việc: mb-24, m-0, fs-13, w-240...
│   └── patterns.css         Mẫu bố cục dùng chung: row-between, toolbar, btn-sm, grid-2col...
├── types/                   Kiểu dữ liệu dùng chung (Student, Assignment, LessonLog...)
├── components/              Thành phần DÙNG CHUNG nhiều nơi
│   ├── layout/
│   │   ├── Layout.tsx       Thanh menu trên cùng của học viên/giáo viên (+ nút ☰ trên điện thoại)
│   │   ├── navConfig.ts     DANH SÁCH MỤC MENU và cách gom nhóm – muốn đổi menu thì sửa ở đây
│   │   ├── NavDropdown.tsx  Một nhóm menu xổ xuống (mở/đóng, phím Esc, bấm ra ngoài)
│   │   └── AdminLayout.tsx  Sidebar khu quản trị
│   └── WhaleMascot/         Linh vật cá voi (tsx + css)
└── features/                MỖI TÍNH NĂNG MỘT THƯ MỤC
    ├── auth/                Đăng nhập, đăng ký, quên/đặt lại mật khẩu, AuthContext
    ├── landing/             Trang giới thiệu (chưa đăng nhập)
    ├── dashboard/           Trang chủ sau đăng nhập (/dashboard)
    │   ├── HomePage.tsx         Chỉ chọn giao diện theo vai trò
    │   ├── StudentHome.tsx      Trang chủ học viên
    │   ├── TeacherHome.tsx      Trang chủ giáo viên
    │   └── QuickStat / ActionCard / greeting   Phần dùng chung
    ├── lessons/             Nhật ký buổi học          (/lessons)
    ├── vocabulary/          Từ vựng                   (/vocabulary)
    ├── errors/              Sổ lỗi sai                (/errors)
    ├── writing/             Writing + chấm AI         (/writing)
    ├── speaking/            Speaking                  (/speaking)
    ├── tests/               Listening & Reading       (/tests)
    ├── courses/             Khóa học + thanh toán     (/courses)
    ├── assignments/         Bài tập giáo viên giao    (/assignments)
    │   ├── AssignmentsPage.tsx      Chỉ chọn giao diện theo vai trò
    │   ├── StudentAssignments.tsx   Học viên xem và nộp bài
    │   ├── TeacherAssignments.tsx   Giáo viên giao và chấm bài
    │   └── StatusBadge / fmtDate    Phần dùng chung
    ├── teacher/             Quản lý học viên          (/teacher)
    ├── settings/            Hồ sơ cá nhân             (/settings)
    └── admin/               Tổng quan, người dùng, khóa học, đề thi (/admin/*)
```

**Quy tắc:** file chỉ dùng trong một tính năng thì để trong thư mục tính năng đó.
Khi một thứ (component, kiểu dữ liệu, hàm) bắt đầu được dùng ở 2 tính năng trở lên
thì mới đưa lên `components/` (giao diện) hoặc `src/types/` (kiểu dữ liệu).

**Import:** dùng alias `@/` trỏ tới `src/`, ví dụ `import apiClient from '@/api/client'`.

## Viết CSS ở đâu?

Hạn chế `style={{ ... }}` trong code. Chọn theo thứ tự:

1. **Đã có class phù hợp?** Tìm trong `styles/utilities.css` (khoảng cách, cỡ chữ...) hoặc
   `styles/patterns.css` (hàng ngang, lưới, nút nhỏ...). Ví dụ: `<p className="muted mb-24">`.
2. **Chưa có, và sẽ dùng nhiều chỗ** → thêm một dòng vào `utilities.css` / `patterns.css`.
3. **Chỉ riêng một trang/tính năng** → thêm vào file CSS nằm cạnh code của tính năng đó
   (ví dụ `features/vocabulary/vocabulary.css`). Tên class có tiền tố của tính năng
   (`vocab-word`, `settings-avatar`, `test-score`...) nên tìm bằng Ctrl+F là ra ngay.
   Tính năng chưa có file CSS thì tạo mới và `import './ten-file.css'` ở trang.
4. **Giá trị thay đổi theo dữ liệu** (độ rộng thanh tiến độ, màu theo trạng thái...) → giữ `style={{ ... }}`.

Cách đọc tên class tiện ích: `<viết tắt>-<giá trị>`, số là px.
`mb-24` = margin-bottom 24px · `m-6-0-0` = margin 6px 0 0 · `fs-13` = font-size 13px · `w-240` = width 240px.
Class có dạng `a.tên` (ví dụ `a.link-plain`, `a.topnav-user`) chỉ dùng cho thẻ `<a>`/`<Link>`:
viết `a.` để thắng được luật `a:hover` (đổi màu khi rê chuột) trong `index.css`.
`utilities.css` và `patterns.css` được nạp **cuối cùng** (xem `main.tsx`) nên ghi đè được các class khác
cùng độ ưu tiên, giống style inline trước đây. Đừng đổi thứ tự import này.

## Sửa menu chính ở đâu?

Menu trên cùng chỉ có `Trang chủ` và 3 nhóm xổ xuống (Lớp học, Luyện thi, Sổ tay).
- **Thêm / bớt / đổi chỗ một mục, đổi tên nhóm** → sửa `components/layout/navConfig.ts`
  (mỗi mục là `{ to: '/duong-dan', label: 'Tên hiển thị' }`). Nhớ khai báo route tương ứng trong `app/App.tsx`.
- **Đổi giao diện menu** (màu, cỡ chữ, khoảng cách) → `components/layout/layout.css`, các class bắt đầu bằng `topnav-`.
- Màn hình hẹp hơn 1180px: menu gập sau nút ☰ (đổi ngưỡng ở `@media (max-width: 1180px)` trong `layout.css`).
