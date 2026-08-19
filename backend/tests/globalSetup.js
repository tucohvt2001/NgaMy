const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Áp dụng migration lên DATABASE_URL (Postgres) trước khi chạy test suite.
// Khuyến nghị: trỏ DATABASE_URL sang một database/schema Postgres riêng cho test
// (không dùng chung với dev) để tránh lẫn dữ liệu, ví dụ đổi query string "?schema=test".
module.exports = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('Thiếu DATABASE_URL để chạy test. Vui lòng cấu hình trong .env');
  }

  execSync('npx prisma migrate deploy', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });
};
