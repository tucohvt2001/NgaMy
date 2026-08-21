import { PrismaClient } from '@prisma/client';
import { VIETQR_BANKS_DATA } from '../src/constants/vietqr-banks';

const prisma = new PrismaClient();

export async function seedBanks() {
  console.log('🏦 Bắt đầu nạp master data Danh mục ngân hàng VietQR vào Database...');

  let bankList = VIETQR_BANKS_DATA;

  // Thử gọi live API VietQR để lấy danh sách mới nhất nếu có kết nối Internet
  try {
    const res = await fetch('https://api.vietqr.io/v2/banks');
    if (res.ok) {
      const json: any = await res.json();
      if (json && json.data && Array.isArray(json.data) && json.data.length > 0) {
        console.log(`🌐 Đã tải thành công ${json.data.length} ngân hàng trực tiếp từ VietQR API!`);
        bankList = json.data.map((b: any, index: number) => ({
          code: String(b.code).toUpperCase().trim(),
          name: b.name || b.shortName || b.code,
          shortName: b.shortName || b.short_name || b.name || b.code,
          bin: String(b.bin).trim(),
          logo: b.logo || null,
          transferSupported: Boolean(b.transferSupported || b.isTransfer),
          lookupSupported: Boolean(b.lookupSupported),
          swiftCode: b.swift_code || null,
          displayOrder: index + 1,
        }));
      }
    }
  } catch (e) {
    console.log('ℹ️ Không kết nối được VietQR live API, sử dụng dữ liệu tĩnh chuẩn...');
  }

  let count = 0;
  for (const b of bankList) {
    await prisma.bank.upsert({
      where: { code: b.code },
      update: {
        name: b.name,
        shortName: b.shortName,
        bin: b.bin,
        logo: b.logo,
        transferSupported: b.transferSupported,
        lookupSupported: b.lookupSupported,
        swiftCode: b.swiftCode,
        displayOrder: b.displayOrder,
        isActive: true,
      },
      create: {
        code: b.code,
        name: b.name,
        shortName: b.shortName,
        bin: b.bin,
        logo: b.logo,
        transferSupported: b.transferSupported,
        lookupSupported: b.lookupSupported,
        swiftCode: b.swiftCode,
        displayOrder: b.displayOrder,
        isActive: true,
      },
    });
    count++;
  }

  console.log(`✅ Đã đồng bộ thành công ${count} ngân hàng vào master data (Bảng Bank)!`);

  // Đồng bộ bankId, bankCode, bankBin cho các member hiện có dựa theo bankName
  const allBanks = await prisma.bank.findMany();
  const members = await prisma.member.findMany({
    where: { bankName: { not: null } },
  });

  let updatedMembers = 0;
  for (const m of members) {
    if (!m.bankName) continue;
    const raw = m.bankName.trim().toUpperCase();
    const matched = allBanks.find(
      (b) =>
        b.code.toUpperCase() === raw ||
        b.shortName.toUpperCase() === raw ||
        b.name.toUpperCase().includes(raw) ||
        raw.includes(b.shortName.toUpperCase()) ||
        raw.includes(b.code.toUpperCase())
    );

    if (matched) {
      await prisma.member.update({
        where: { id: m.id },
        data: {
          bankId: matched.id,
          bankCode: matched.code,
          bankBin: matched.bin,
          bankName: matched.shortName,
        },
      });
      updatedMembers++;
    }
  }

  if (updatedMembers > 0) {
    console.log(`🔗 Đã tự động gắn thông tin Bank (code/bin/logo) cho ${updatedMembers} thành viên hiện có.`);
  }
}

async function main() {
  await seedBanks();
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error('❌ Lỗi khi seed ngân hàng:', err);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
