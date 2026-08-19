import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { teamService } from '../services/team.service';

export const teamController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const teams = await teamService.list();
    sendSuccess(res, teams);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const team = await teamService.getById(req.params.id);
    sendSuccess(res, team);
  }),

  getMembers: asyncHandler(async (req: Request, res: Response) => {
    const members = await teamService.getMembers(req.params.id);
    sendSuccess(res, members);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const team = await teamService.create(req.body);
    sendSuccess(res, team, 'Tạo đội/nhóm thành công', 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const team = await teamService.update(req.params.id, req.body);
    sendSuccess(res, team, 'Cập nhật đội/nhóm thành công');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await teamService.remove(req.params.id);
    sendSuccess(res, null, 'Xóa đội/nhóm thành công');
  }),
};
