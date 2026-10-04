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
│   └── index.css            CSS toàn cục (màu, nút, card, badge...)
├── components/              Thành phần DÙNG CHUNG nhiều nơi
│   ├── layout/
│   │   ├── Layout.tsx       Thanh menu của học viên/giáo viên
│   │   └── AdminLayout.tsx  Sidebar khu quản trị
│   └── WhaleMascot/         Linh vật cá voi (tsx + css)
└── features/                MỖI TÍNH NĂNG MỘT THƯ MỤC
    ├── auth/                Đăng nhập, đăng ký, quên/đặt lại mật khẩu, AuthContext
    ├── landing/             Trang giới thiệu (chưa đăng nhập)
    ├── dashboard/           Trang chủ sau đăng nhập (/dashboard)
    ├── lessons/             Nhật ký buổi học          (/lessons)
    ├── vocabulary/          Từ vựng                   (/vocabulary)
    ├── errors/              Sổ lỗi sai                (/errors)
    ├── writing/             Writing + chấm AI         (/writing)
    ├── speaking/            Speaking                  (/speaking)
    ├── tests/               Listening & Reading       (/tests)
    ├── courses/             Khóa học + thanh toán     (/courses)
    ├── assignments/         Bài tập giáo viên giao    (/assignments)
    ├── teacher/             Quản lý học viên          (/teacher)
    ├── settings/            Hồ sơ cá nhân             (/settings)
    └── admin/               Tổng quan, người dùng, khóa học, đề thi (/admin/*)
```

**Quy tắc:** file chỉ dùng trong một tính năng thì để trong thư mục tính năng đó.
Khi một thứ (component, kiểu dữ liệu, hàm) bắt đầu được dùng ở 2 tính năng trở lên
thì mới đưa lên `components/` (giao diện) hoặc `src/types/` (kiểu dữ liệu).

**Import:** dùng alias `@/` trỏ tới `src/`, ví dụ `import apiClient from '@/api/client'`.
