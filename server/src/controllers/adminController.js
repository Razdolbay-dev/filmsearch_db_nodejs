import AdminService from '../services/adminService.js';
import { generateToken, setAuthCookie, clearAuthCookie } from '../middleware/authMiddleware.js';

class AdminController {
    constructor() {
        this.adminService = new AdminService();
    }

    // Вход в админку
    login = async (req, res) => {
        try {
            const { username, password } = req.body;

            console.log('🔐 Login attempt:', { username, password: '***' });

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Имя пользователя и пароль обязательны'
                });
            }

            const result = await this.adminService.login(username, password);

            if (!result.success) {
                console.log('❌ Login failed:', result.error);
                return res.status(401).json(result);
            }

            // Генерируем JWT токен
            const token = generateToken(result.data);
            console.log('✅ Login successful, token generated');

            // **ВАЖНО: Передаем req для определения протокола**
            setAuthCookie(res, token, req);

            res.json({
                success: true,
                data: result.data,
                message: 'Успешный вход'
            });

        } catch (error) {
            console.error('❌ Login controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    };

    // Выход из админки
    logout = (req, res) => {
        clearAuthCookie(res, req);
        res.json({
            success: true,
            message: 'Успешный выход'
        });
    };

    // Получение информации о текущем админе
    getCurrentAdmin = async (req, res) => {
        try {
            const result = await this.adminService.getCurrentAdmin(req.admin.id);

            if (!result.success) {
                return res.status(404).json(result);
            }

            res.json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error('Get current admin error:', error);
            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    };

    // Создание нового администратора
    createAdmin = async (req, res) => {
        try {
            // Только superadmin может создавать новых админов
            if (req.admin.role !== 'superadmin') {
                return res.status(403).json({
                    success: false,
                    error: 'Недостаточно прав'
                });
            }

            const result = await this.adminService.createAdmin(req.body, req.admin.id);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.status(201).json({
                success: true,
                data: result.data,
                message: 'Администратор создан'
            });
        } catch (error) {
            console.error('Create admin error:', error);
            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    };

    // Получение списка администраторов
    getAllAdmins = async (req, res) => {
        try {
            const result = await this.adminService.getAllAdmins();

            res.json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error('Get all admins error:', error);
            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    };

    // Удаление администратора
    deleteAdmin = async (req, res) => {
        try {
            if (req.admin.role !== 'superadmin') {
                return res.status(403).json({
                    success: false,
                    error: 'Недостаточно прав'
                });
            }

            const { id } = req.params;
            const result = await this.adminService.deleteAdmin(id, req.admin.id);

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.json({
                success: true,
                message: 'Администратор удален'
            });
        } catch (error) {
            console.error('Delete admin error:', error);
            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    };

    // Смена пароля
    changePassword = async (req, res) => {
        try {
            const { oldPassword, newPassword } = req.body;

            if (!oldPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Старый и новый пароль обязательны'
                });
            }

            const result = await this.adminService.changePassword(
                req.admin.id,
                oldPassword,
                newPassword
            );

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.json({
                success: true,
                message: 'Пароль успешно изменен'
            });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    };
}

export default AdminController;