# Frontend - Hệ thống quản lý CLB Lân Sư Rồng Nga My Thượng

## Công nghệ

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- TanStack React Query
- Zustand (state global)
- React Hook Form + Zod
- Axios

## Cấu trúc

```
app/            # Route theo App Router (login, dashboard, members, ...)
components/
├── ui/         # Component shadcn/ui dùng chung
├── layout/     # Sidebar, Header, ...
├── forms/      # Form nghiệp vụ
└── tables/     # Bảng dữ liệu
services/       # Gọi API (axios) theo từng module
hooks/          # Custom hooks (React Query hooks, ...)
stores/         # Zustand store
types/          # TypeScript types dùng chung
lib/            # axios instance, utils (cn, ...)
constants/      # Hằng số cấu hình
```

## Cài đặt

```bash
cd frontend
npm install
copy .env.example .env.local
```

Cập nhật `NEXT_PUBLIC_API_URL` trỏ đến backend đang chạy.

## Chạy dự án

```bash
npm run dev
```

Truy cập http://localhost:3000

## Deploy (Vercel)

1. Push code lên GitHub, import repo vào [Vercel](https://vercel.com), chọn **Root Directory = `frontend`**.
2. Thêm biến môi trường `NEXT_PUBLIC_API_URL` trỏ tới backend production (vd: `https://your-backend.up.railway.app/api`).
3. Vercel tự build/deploy mỗi khi push (Preview cho branch, Production cho `main`).
4. Nhớ thêm domain Vercel (production + preview) vào `CORS_ORIGIN` của backend để không bị chặn CORS.

## Trạng thái

Đã hoàn thành đầy đủ các module: đăng nhập, dashboard, thành viên, đội/nhóm, chức vụ, tài khoản, lịch diễn,
phân công, chấm công, nghỉ phép, tiền công, báo cáo — dùng Next.js App Router + Tailwind v4 + shadcn/ui +
React Query + Zustand.
