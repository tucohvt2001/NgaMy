import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/authenticate';
import { loginSchema, refreshTokenSchema } from '../validators/auth.validator';

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Đăng nhập bằng username/email và mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về accessToken/refreshToken
 *       401:
 *         description: Sai tài khoản hoặc mật khẩu
 */
router.post('/auth/login', validate({ body: loginSchema }), authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Làm mới access token bằng refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Trả về accessToken/refreshToken mới
 */
router.post('/auth/refresh', validate({ body: refreshTokenSchema }), authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất, thu hồi refresh token
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post('/auth/logout', authenticate, authController.logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Lấy thông tin người dùng hiện tại
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Thông tin người dùng hiện tại
 */
router.get('/auth/me', authenticate, authController.me);

export default router;
