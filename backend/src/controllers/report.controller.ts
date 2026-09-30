import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { reportService } from '../services/report.service';

export const reportController = {
  members: asyncHandler(async (_req: Request, res: Response) => {
    const report = await reportService.memberReport();
    sendSuccess(res, report);
  }),

  events: asyncHandler(async (_req: Request, res: Response) => {
    const report = await reportService.eventReport();
    sendSuccess(res, report);
  }),

  attendance: asyncHandler(async (_req: Request, res: Response) => {
    const report = await reportService.attendanceReport();
    sendSuccess(res, report);
  }),

  salary: asyncHandler(async (req: Request, res: Response) => {
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const report = await reportService.salaryReport(month, year);
    sendSuccess(res, report);
  }),

  exportSalaryExcel: asyncHandler(async (req: Request, res: Response) => {
    const month = req.query.month ? Number(req.query.month) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const report = await reportService.salaryReport(month, year);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Báo cáo tiền công');

    sheet.columns = [
      { header: 'Thành viên', key: 'memberName', width: 30 },
      { header: 'Tháng', key: 'month', width: 10 },
      { header: 'Năm', key: 'year', width: 10 },
      { header: 'Tổng tiền công', key: 'totalAmount', width: 20 },
      { header: 'Trạng thái', key: 'status', width: 15 },
    ];
    sheet.getRow(1).font = { bold: true };
    report.byMember.forEach((row) => sheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="bao-cao-tien-cong.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  }),

  monthlyMatrix: asyncHandler(async (req: Request, res: Response) => {
    const now = new Date();
    const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
    const year = req.query.year ? Number(req.query.year) : now.getFullYear();

    const matrix = await reportService.monthlyAttendanceMatrix(month, year);
    sendSuccess(res, matrix);
  }),

  exportMatrixExcel: asyncHandler(async (req: Request, res: Response) => {
    const now = new Date();
    const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
    const year = req.query.year ? Number(req.query.year) : now.getFullYear();

    const matrix = await reportService.monthlyAttendanceMatrix(month, year);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Đi Show Tháng ${month}-${year}`);
    sheet.views = [{ showGridLines: true }];

    // 1. Sheet Ma trận tổng quan (Đã bỏ 2 cột Đội / Nhóm và Chức vụ, thêm cột Tổng tiền công)
    const columns: Partial<ExcelJS.Column>[] = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Mã TV', key: 'memberCode', width: 12 },
      { header: 'Họ và Tên', key: 'fullName', width: 26 },
    ];

    // Cột theo từng show trong tháng
    matrix.events.forEach((ev) => {
      const d = new Date(ev.eventDate);
      const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      columns.push({
        header: `${ev.name}\n(${dateStr})`,
        key: `event_${ev.eventId}`,
        width: 18,
      });
    });

    columns.push({
      header: 'Tổng Show Tham Gia',
      key: 'totalAttended',
      width: 20,
    });

    columns.push({
      header: 'Tổng Tiền Công Dự Kiến',
      key: 'totalEarned',
      width: 24,
    });

    sheet.columns = columns;

    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 36;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD97706' }, // Amber-600
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Thêm các dòng thành viên
    matrix.members.forEach((m, idx) => {
      const rowData: Record<string, any> = {
        stt: idx + 1,
        memberCode: m.memberCode,
        fullName: m.fullName,
        totalAttended: m.totalAttended,
        totalEarned: m.totalEarned,
      };

      matrix.events.forEach((ev) => {
        const att = m.shows[ev.eventId];
        if (att?.isAttended) {
          rowData[`event_${ev.eventId}`] = '✓';
        } else if (att?.attendanceStatus?.startsWith('ABSENT')) {
          rowData[`event_${ev.eventId}`] = 'Vắng';
        } else {
          rowData[`event_${ev.eventId}`] = '-';
        }
      });

      const row = sheet.addRow(rowData);
      row.alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('fullName').alignment = { vertical: 'middle', horizontal: 'left' };
      
      const earnedCell = row.getCell('totalEarned');
      earnedCell.numFmt = '#,##0 "đ"';
      earnedCell.alignment = { vertical: 'middle', horizontal: 'right' };
      earnedCell.font = { bold: true, color: { argb: 'FF059669' } };

      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      });

      // Highlight cell đã đi show
      matrix.events.forEach((ev) => {
        const att = m.shows[ev.eventId];
        const cell = row.getCell(`event_${ev.eventId}`);
        if (att?.isAttended) {
          cell.font = { bold: true, color: { argb: 'FF059669' } }; // Emerald
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFECFDF5' },
          };
        } else if (att?.attendanceStatus?.startsWith('ABSENT')) {
          cell.font = { color: { argb: 'FFDC2626' } };
        }
      });
    });

    // Dòng tổng kết số người đi từng show ở cuối
    const summaryRowData: Record<string, any> = {
      stt: '',
      memberCode: '',
      fullName: 'TỔNG CỘNG',
      totalAttended: matrix.members.reduce((sum, m) => sum + m.totalAttended, 0),
      totalEarned: matrix.members.reduce((sum, m) => sum + m.totalEarned, 0),
    };

    matrix.events.forEach((ev) => {
      summaryRowData[`event_${ev.eventId}`] = `${ev.attendeeCount} người`;
    });

    const summaryRow = sheet.addRow(summaryRowData);
    summaryRow.font = { bold: true };
    summaryRow.alignment = { vertical: 'middle', horizontal: 'center' };
    summaryRow.getCell('fullName').alignment = { vertical: 'middle', horizontal: 'left' };
    
    const sumEarnedCell = summaryRow.getCell('totalEarned');
    sumEarnedCell.numFmt = '#,##0 "đ"';
    sumEarnedCell.alignment = { vertical: 'middle', horizontal: 'right' };
    sumEarnedCell.font = { bold: true, color: { argb: 'FF059669' } };

    summaryRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEF3C7' }, // Amber-100
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // 2. Thêm các sheet chi tiết cho từng thành viên tham gia ít nhất 1 show
    const usedSheetNames = new Set<string>();
    usedSheetNames.add(sheet.name);

    const activeMembers = matrix.members.filter((m) => m.totalAttended > 0);

    for (const m of activeMembers) {
      const safeMemberCode = m.memberCode ? `${m.memberCode} - ` : '';
      let rawName = `${safeMemberCode}${m.fullName}`.replace(/[\\/?*:[\]]/g, '').trim();
      if (rawName.length > 31) {
        rawName = rawName.slice(0, 31).trim();
      }
      let sheetName = rawName || `TV_${m.memberCode}`;
      let counter = 1;
      while (usedSheetNames.has(sheetName)) {
        const suffix = ` (${counter})`;
        sheetName = `${rawName.slice(0, 31 - suffix.length)}${suffix}`;
        counter++;
      }
      usedSheetNames.add(sheetName);

      const mSheet = workbook.addWorksheet(sheetName);
      mSheet.views = [{ showGridLines: true }];

      // Độ rộng các cột
      mSheet.getColumn(1).width = 8;   // STT
      mSheet.getColumn(2).width = 16;  // Mã Show
      mSheet.getColumn(3).width = 34;  // Tên Show
      mSheet.getColumn(4).width = 16;  // Ngày diễn
      mSheet.getColumn(5).width = 32;  // Địa điểm
      mSheet.getColumn(6).width = 24;  // Vai trò
      mSheet.getColumn(7).width = 16;  // Trạng thái
      mSheet.getColumn(8).width = 24;  // Tiền công dự kiến

      // Dòng 1: Tiêu đề Sheet
      mSheet.mergeCells('A1:H1');
      const titleCell = mSheet.getCell('A1');
      titleCell.value = `BẢNG CHI TIẾT ĐI SHOW THÁNG ${month}/${year} - ${m.fullName.toUpperCase()}`;
      titleCell.font = { bold: true, size: 13, color: { argb: 'FF9A3412' } }; // Amber-800
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFBEB' }, // Amber-50
      };
      titleCell.border = { bottom: { style: 'medium', color: { argb: 'FFD97706' } } };
      mSheet.getRow(1).height = 30;

      // Dòng 3 & 4: Thông tin thành viên
      const row3 = mSheet.getRow(3);
      row3.values = [
        'Mã TV:',
        m.memberCode,
        'Họ và tên:',
        m.fullName,
        'Số điện thoại:',
        m.phone || 'Chưa cập nhật',
      ];
      mSheet.mergeCells('F3:H3');

      const row4 = mSheet.getRow(4);
      row4.values = [
        'Đội / Nhóm:',
        m.teamNames,
        'Chức vụ:',
        m.positionNames,
        'Tổng đi show & thù lao:',
        `${m.totalAttended} show  —  ${m.totalEarned.toLocaleString('vi-VN')} đ`,
      ];
      mSheet.mergeCells('F4:H4');

      [3, 4].forEach((rNum) => {
        const r = mSheet.getRow(rNum);
        r.height = 22;
        r.alignment = { vertical: 'middle' };
        r.getCell(1).font = { bold: true, color: { argb: 'FF4B5563' } };
        r.getCell(3).font = { bold: true, color: { argb: 'FF4B5563' } };
        r.getCell(5).font = { bold: true, color: { argb: 'FF4B5563' } };
        r.getCell(2).font = { bold: true };
        r.getCell(4).font = { bold: true };
      });
      row4.getCell(6).font = { bold: true, color: { argb: 'FF059669' } }; // Highlight tổng show và thù lao

      // Dòng 6: Tiêu đề bảng
      const tHeaderRow = mSheet.getRow(6);
      tHeaderRow.values = [
        'STT',
        'Mã Show',
        'Tên Show / Sự Kiện',
        'Ngày Diễn',
        'Địa Điểm',
        'Vai Trò / Vị Trí',
        'Trạng Thái',
        'Tiền Công Dự Kiến',
      ];
      tHeaderRow.height = 28;
      tHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      tHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
      for (let c = 1; c <= 8; c++) {
        const cell = tHeaderRow.getCell(c);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD97706' }, // Amber-600
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFB45309' } },
          left: { style: 'thin', color: { argb: 'FFB45309' } },
          bottom: { style: 'thin', color: { argb: 'FFB45309' } },
          right: { style: 'thin', color: { argb: 'FFB45309' } },
        };
      }

      // Lọc các show mà thành viên tham gia hoặc được phân công
      const memberShows = matrix.events.filter((ev) => {
        const att = m.shows[ev.eventId];
        return (
          att?.isAttended ||
          (att?.attendanceStatus && !['NONE', 'ABSENT'].includes(att.attendanceStatus)) ||
          att?.isAssigned
        );
      });

      let currentLine = 7;
      memberShows.forEach((ev, sIdx) => {
        const att = m.shows[ev.eventId];
        const d = new Date(ev.eventDate);
        const dateFormatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

        let statusText = 'Có mặt';
        if (att?.attendanceStatus === 'LATE') statusText = 'Đi trễ';
        else if (att?.attendanceStatus === 'ABSENT_WITH_PERMISSION') statusText = 'Vắng có phép';
        else if (att?.attendanceStatus === 'ABSENT_WITHOUT_PERMISSION') statusText = 'Vắng không phép';
        else if (att?.isAttended) statusText = 'Có mặt';
        else if (att?.attendanceStatus) statusText = att.attendanceStatus;
        else if (att?.isAssigned) statusText = 'Được phân công';

        const dRow = mSheet.getRow(currentLine);
        dRow.height = 24;
        dRow.values = [
          sIdx + 1,
          ev.eventCode || '-',
          ev.name,
          dateFormatted,
          ev.location || '-',
          att?.positionName || 'Thành viên',
          statusText,
          att?.earnedAmount ?? 0,
        ];

        dRow.alignment = { vertical: 'middle', horizontal: 'left' };
        dRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        dRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
        dRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
        dRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };

        const payoutCell = dRow.getCell(8);
        payoutCell.numFmt = '#,##0 "đ"';
        payoutCell.alignment = { vertical: 'middle', horizontal: 'right' };
        payoutCell.font = { bold: true, color: { argb: (att?.earnedAmount ?? 0) > 0 ? 'FF059669' : 'FF6B7280' } };

        if (att?.isAttended) {
          dRow.getCell(7).font = { bold: true, color: { argb: 'FF059669' } };
          dRow.getCell(7).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFECFDF5' },
          };
        } else if (att?.attendanceStatus?.startsWith('ABSENT')) {
          dRow.getCell(7).font = { bold: true, color: { argb: 'FFDC2626' } };
          dRow.getCell(7).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF2F2' },
          };
        }

        for (let c = 1; c <= 8; c++) {
          const cell = dRow.getCell(c);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          };
        }

        currentLine++;
      });

      // Dòng tổng kết ở sheet thành viên
      const sumRow = mSheet.getRow(currentLine);
      sumRow.height = 26;
      sumRow.values = [
        '',
        '',
        'TỔNG CỘNG',
        '',
        '',
        '',
        `${m.totalAttended} show`,
        m.totalEarned,
      ];
      mSheet.mergeCells(`C${currentLine}:F${currentLine}`);
      sumRow.font = { bold: true };
      sumRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' };
      sumRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };
      sumRow.getCell(7).font = { bold: true, color: { argb: 'FF059669' } };

      const sumPayoutCell = sumRow.getCell(8);
      sumPayoutCell.numFmt = '#,##0 "đ"';
      sumPayoutCell.alignment = { vertical: 'middle', horizontal: 'right' };
      sumPayoutCell.font = { bold: true, color: { argb: 'FF059669' } };

      for (let c = 1; c <= 8; c++) {
        const cell = sumRow.getCell(c);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF3C7' }, // Amber-100
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD97706' } },
          left: { style: 'thin', color: { argb: 'FFD97706' } },
          bottom: { style: 'thin', color: { argb: 'FFD97706' } },
          right: { style: 'thin', color: { argb: 'FFD97706' } },
        };
      }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ma-tran-di-show-thang-${month}-${year}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  }),
};
