import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { eventSettlementService } from '../services/eventSettlement.service';

export const eventSettlementController = {
  getOverview: asyncHandler(async (req: Request, res: Response) => {
    const overview = await eventSettlementService.getSettlementOverview(req.params.id);
    sendSuccess(res, overview, 'Lấy thông tin dự toán sự kiện thành công');
  }),

  settle: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const result = await eventSettlementService.settleEvent(req.params.id, req.body, userId);
    sendSuccess(res, result, 'Dự toán sự kiện và lập phiếu thu chi thành công', 201);
  }),
};
