import { prisma } from '../config/prisma';
import { VIETQR_BANKS_DATA } from '../constants/vietqr-banks';

export const bankService = {
  async list(query?: { search?: string; transferOnly?: boolean }) {
    const where: any = { isActive: true };

    if (query?.transferOnly) {
      where.transferSupported = true;
    }

    if (query?.search) {
      const q = query.search.trim();
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { shortName: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { bin: { contains: q, mode: 'insensitive' } },
      ];
    }

    return prisma.bank.findMany({
      where,
      orderBy: [
        { displayOrder: 'asc' },
        { shortName: 'asc' },
      ],
    });
  },

  async getById(id: string) {
    return prisma.bank.findUnique({
      where: { id },
    });
  },

  async getByCode(code: string) {
    return prisma.bank.findFirst({
      where: {
        OR: [
          { code: { equals: code, mode: 'insensitive' } },
          { shortName: { equals: code, mode: 'insensitive' } },
          { bin: { equals: code } },
        ],
      },
    });
  },

  async sync() {
    let bankList = VIETQR_BANKS_DATA;

    try {
      const res = await fetch('https://api.vietqr.io/v2/banks');
      if (res.ok) {
        const json: any = await res.json();
        if (json && json.data && Array.isArray(json.data) && json.data.length > 0) {
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
      // Dùng dữ liệu tĩnh nếu không fetch được
    }

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
    }

    return this.list();
  },
};
