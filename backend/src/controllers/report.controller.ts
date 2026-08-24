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

    // Định nghĩa cột
    const columns: Partial<ExcelJS.Column>[] = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Mã TV', key: 'memberCode', width: 12 },
      { header: 'Họ và Tên', key: 'fullName', width: 26 },
      { header: 'Đội / Nhóm', key: 'teamNames', width: 20 },
      { header: 'Chức vụ', key: 'positionNames', width: 20 },
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
        teamNames: m.teamNames,
        positionNames: m.positionNames,
        totalAttended: m.totalAttended,
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
      row.getCell('teamNames').alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell('positionNames').alignment = { vertical: 'middle', horizontal: 'left' };

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
        }
      });
    });

    // Dòng tổng kết số người đi từng show ở cuối
    const summaryRowData: Record<string, any> = {
      stt: '',
      memberCode: '',
      fullName: 'TỔNG NHÂN SỰ ĐI SHOW',
      teamNames: '',
      positionNames: '',
      totalAttended: matrix.members.reduce((sum, m) => sum + m.totalAttended, 0),
    };

    matrix.events.forEach((ev) => {
      summaryRowData[`event_${ev.eventId}`] = `${ev.attendeeCount} người`;
    });

    const summaryRow = sheet.addRow(summaryRowData);
    summaryRow.font = { bold: true };
    summaryRow.alignment = { vertical: 'middle', horizontal: 'center' };
    summaryRow.getCell('fullName').alignment = { vertical: 'middle', horizontal: 'left' };
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

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ma-tran-di-show-thang-${month}-${year}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  }),
};
