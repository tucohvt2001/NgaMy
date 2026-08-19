import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { eventMemberService } from '../services/eventMember.service';

export const eventMemberController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await eventMemberService.list(req.params.eventId);
    sendSuccess(res, items);
  }),

  assign: asyncHandler(async (req: Request, res: Response) => {
    const result = await eventMemberService.assign(req.params.eventId, req.body);
    sendSuccess(res, result, 'Phân công thành viên thành công', 201);
  }),

  batchAssign: asyncHandler(async (req: Request, res: Response) => {
    const result = await eventMemberService.batchAssign(req.params.eventId, req.body);
    sendSuccess(res, result, `Đã phân công ${result.count} thành viên`, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const result = await eventMemberService.update(req.params.eventId, req.params.memberId, req.body);
    sendSuccess(res, result, 'Cập nhật phân công thành công');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await eventMemberService.remove(req.params.eventId, req.params.memberId);
    sendSuccess(res, null, 'Hủy phân công thành công');
  }),
};
