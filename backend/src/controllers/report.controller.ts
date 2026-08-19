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
};
