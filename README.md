# Hệ thống quản lý CLB Lân Sư Rồng Nga My Thượng

Hệ thống quản lý hoạt động CLB Lân Sư Rồng Nga My Thượng, tách thành 2 project độc lập giao tiếp qua REST API.

```
Web/
├── backend/   # Node.js + TypeScript + Express + Prisma
├── frontend/  # Next.js + TypeScript + Tailwind + shadcn/ui
└── docker-compose.yml
```

## Chạy nhanh (dev cục bộ)

```bash
# Backend (http://localhost:5000)
cd backend
npm install
copy .env.example .env
npm run prisma:migrate
npm run prisma:seed
npm run dev

# Frontend (http://localhost:3000)
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Swagger API docs: http://localhost:5000/api-docs

## Tài khoản demo (mật khẩu chung: `Password@123`)

| Username     | Vai trò      |
| ------------ | ------------ |
| superadmin   | SUPER_ADMIN  |
| admin        | ADMIN        |
| doitruong    | TEAM_LEADER  |
| thanhvien1-5 | MEMBER       |

## Công nghệ chính

- **Backend**: Express, Prisma ORM (SQLite cho dev / PostgreSQL cho production), JWT + bcrypt,
  Zod validation, Swagger, Winston logging, Helmet, rate limiting.
- **Frontend**: Next.js App Router, Tailwind CSS v4, shadcn/ui, TanStack Query, Zustand, React Hook Form + Zod.

## Kiến trúc backend

`Route → Controller → Validator → Service → Repository/Prisma → Database`

Chi tiết xem [backend/README.md](backend/README.md) và [frontend/README.md](frontend/README.md).

## Chức năng MVP

Quản lý thành viên, đội/nhóm, chức vụ, tài khoản & phân quyền, lịch diễn, phân công nhân sự, chấm công,
nghỉ phép, tính tiền công, dashboard & báo cáo (export Excel).

## Docker

```bash
docker compose up -d --build
```

Chạy PostgreSQL + backend trong container (xem lưu ý đổi provider Prisma trong [backend/README.md](backend/README.md)).
Frontend chạy riêng bằng `npm run dev` và trỏ `NEXT_PUBLIC_API_URL` về backend.

## Test

```bash
cd backend && npm test
```

35 test tự động: đăng nhập, CRUD thành viên/đội/sự kiện, phân công, chấm công, duyệt nghỉ phép,
tính tiền công, kiểm tra phân quyền.
