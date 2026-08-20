import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { transactionService } from '../services/transaction.service';

export const transactionController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await transactionService.list(req.query as any);
    sendSuccess(res, result);
  }),

  summary: asyncHandler(async (req: Request, res: Response) => {
    const fromDate = req.query.fromDate ? String(req.query.fromDate) : undefined;
    const toDate = req.query.toDate ? String(req.query.toDate) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;

    const summary = await transactionService.getSummary({ fromDate, toDate, year });
    sendSuccess(res, summary, 'Lấy thống kê thu chi thành công');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const transaction = await transactionService.getById(req.params.id);
    sendSuccess(res, transaction, 'Lấy thông tin chi tiết giao dịch thành công');
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const transaction = await transactionService.create(req.body, userId);
    sendSuccess(res, transaction, 'Tạo phiếu giao dịch thu chi thành công', 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const transaction = await transactionService.update(req.params.id, req.body);
    sendSuccess(res, transaction, 'Cập nhật phiếu giao dịch thành công');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const result = await transactionService.remove(req.params.id);
    sendSuccess(res, result, 'Xóa phiếu giao dịch thành công');
  }),

  exportExcel: asyncHandler(async (req: Request, res: Response) => {
    const workbook = await transactionService.exportExcel(req.query as any);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="so-quy-thu-chi-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }),
};
