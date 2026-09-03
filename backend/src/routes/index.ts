import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import accountRoutes from './account.routes';
import memberRoutes from './member.routes';
import teamRoutes from './team.routes';
import positionRoutes from './position.routes';
import eventRoutes from './event.routes';
import attendanceRoutes from './attendance.routes';
import leaveRoutes from './leave.routes';
import salaryRoutes from './salary.routes';
import transactionRoutes from './transaction.routes';
import dashboardRoutes from './dashboard.routes';
import reportRoutes from './report.routes';
import eventTypeRoutes from './eventType.routes';
import reviewRoutes from './review.routes';
import { bankRouter } from './bank.routes';

const router = Router();

router.use('/', healthRoutes);
router.use('/', authRoutes);
router.use('/', reviewRoutes);
router.use('/', accountRoutes);
router.use('/', memberRoutes);
router.use('/', teamRoutes);
router.use('/', positionRoutes);
router.use('/', eventRoutes);
router.use('/', eventTypeRoutes);
router.use('/', attendanceRoutes);
router.use('/', leaveRoutes);
router.use('/', salaryRoutes);
router.use('/', transactionRoutes);
router.use('/', dashboardRoutes);
router.use('/', reportRoutes);
router.use('/', bankRouter);

export default router;

