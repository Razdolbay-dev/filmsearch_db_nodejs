import { Router } from 'express';
import AdminController from '../controllers/adminController.js';
import { authenticateAdmin, checkRole } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();
const adminController = new AdminController();

// Лимитер для попыток входа (защита от брутфорса)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 5, // максимум 5 попыток
    message: {
        success: false,
        error: 'Слишком много попыток входа. Попробуйте позже.'
    }
});

// Публичные маршруты (не требуют авторизации)
router.post('/login', loginLimiter, adminController.login);
router.post('/logout', adminController.logout);

// Защищенные маршруты (требуют авторизации)
router.use(authenticateAdmin);

// Маршруты доступные всем авторизованным админам
router.get('/me', adminController.getCurrentAdmin);
router.post('/change-password', adminController.changePassword);

// Маршруты только для superadmin
router.get('/admins', checkRole(['superadmin']), adminController.getAllAdmins);
router.post('/admins', checkRole(['superadmin']), adminController.createAdmin);
router.delete('/admins/:id', checkRole(['superadmin']), adminController.deleteAdmin);

export default router;