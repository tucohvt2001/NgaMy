import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { dashboardService } from '../services/dashboard.service';

export const dashboardController = {
  summary: asyncHandler(async (_req: Request, res: Response) => {
    const summary = await dashboardService.getSummary();
    sendSuccess(res, summary);
  }),

  charts: asyncHandler(async (req: Request, res: Response) => {
    const year = Number(req.query.year) || new Date().getFullYear();
    const [eventsByMonth, salaryByMonth, attendanceRate, memberStatus] = await Promise.all([
      dashboardService.getEventsByMonth(year),
      dashboardService.getSalaryByMonth(year),
      dashboardService.getAttendanceRate(),
      dashboardService.getActiveMembersTrend(),
    ]);
    sendSuccess(res, { eventsByMonth, salaryByMonth, attendanceRate, memberStatus });
  }),
};
