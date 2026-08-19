# Backend - Hệ thống quản lý CLB Lân Sư Rồng Nga My Thượng

## Công nghệ

- Node.js + TypeScript
- Express.js
- Prisma ORM + PostgreSQL
- JWT Authentication + bcrypt
- Zod validation
- Swagger/OpenAPI (`/api-docs`)
- Winston logging
- Helmet, CORS, rate limiting

## Kiến trúc

```
src/
├── config/         # Cấu hình (env, logger, prisma, swagger)
├── controllers/     # Xử lý request/response
├── services/        # Business logic
├── repositories/     # Truy vấn dữ liệu qua Prisma
├── routes/           # Định nghĩa route
├── middlewares/      # Auth, error handler, ...
├── validators/       # Zod schema
├── utils/            # Helper dùng chung
├── types/            # TypeScript types
├── app.ts            # Khởi tạo Express app
└── server.ts         # Điểm chạy server
```

Luồng xử lý: `Route → Controller → Validator → Service → Repository/Prisma → Database`.

## Cài đặt

```bash
cd backend
npm install
copy .env.example .env
```

Mặc định `.env` cần một connection string PostgreSQL hợp lệ. Nếu chưa có Postgres cài sẵn, dùng ngay
một project miễn phí tại [Neon](https://neon.tech) hoặc [Railway](https://railway.app) (tạo trong 1-2 phút,
không cần thẻ), rồi dán connection string vào `DATABASE_URL`.

## Chạy dự án

```bash
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

`prisma:seed` tạo dữ liệu demo: 1 Super Admin, 1 Admin, 1 Team Leader, 5 Member, 5 Teams, 10 Positions,
5 Events, kèm chấm công/nghỉ phép/tiền công demo. Tài khoản đăng nhập (mật khẩu chung `Password@123`):
`superadmin`, `admin`, `doitruong`, `thanhvien1`..`thanhvien5`.

- API: http://localhost:5000/api
- Swagger: http://localhost:5000/api-docs
- Health check: http://localhost:5000/api/health

## Test

```bash
npm test
```

Test dùng chung `DATABASE_URL` trong `.env` (khuyến nghị trỏ sang schema/DB riêng cho test, xem
`tests/globalSetup.js`), tự động chạy migrate trước khi test. Bao gồm test cho: login, member CRUD,
team CRUD, event CRUD + phân công, check-in/check-out, duyệt nghỉ phép, tính tiền công, và authorization
(35 test).

## Docker

Chạy toàn bộ backend + PostgreSQL bằng Docker Compose (từ thư mục gốc `Web/`):

```bash
docker compose up -d --build
```

## Deploy (Railway / Render)

1. Tạo Postgres database (Neon/Railway/Render Postgres addon) và lấy connection string.
2. Tạo service mới trên Railway/Render, trỏ tới thư mục `backend/`, build command `npm install && npm run build`,
   start command `npx prisma migrate deploy && npm start`.
3. Cấu hình biến môi trường trên dashboard: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`
   (thêm domain Vercel của frontend, phân cách bằng dấu phẩy nếu nhiều domain).
4. Sau khi deploy thành công, chạy seed 1 lần (qua Railway/Render shell): `npm run prisma:seed`.
5. Cập nhật `NEXT_PUBLIC_API_URL` trên Vercel trỏ tới URL backend vừa deploy (vd: `https://your-backend.up.railway.app/api`).

## Trạng thái

Đã hoàn thành đầy đủ Phase 1-10 theo kế hoạch:
- Prisma schema đầy đủ (Role/Permission/User/Member/Team/Position/Event/EventMember/Attendance/LeaveRequest/Salary*)
- Auth JWT + phân quyền theo permission (kiểm tra ở backend, không chỉ ẩn UI)
- CRUD đầy đủ: thành viên, đội/nhóm, chức vụ, tài khoản, sự kiện, phân công, chấm công, nghỉ phép, tiền công
- Dashboard + báo cáo (kèm export Excel báo cáo tiền công)
- 35 test tự động (Jest + Supertest)
- Swagger tại `/api-docs`, Docker Compose, seed dữ liệu demo
