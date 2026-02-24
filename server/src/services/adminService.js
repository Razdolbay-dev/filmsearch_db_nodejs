import { pool } from '../config/database.js';
import bcrypt from 'bcrypt';

class AdminService {
    constructor() {
        this.pool = pool;
    }

    // Вход администратора
    async login(username, password) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM admins WHERE username = ?',
                [username]
            );

            if (rows.length === 0) {
                return { success: false, error: 'Неверное имя пользователя или пароль' };
            }

            const admin = rows[0];

            // Проверяем пароль
            const validPassword = await bcrypt.compare(password, admin.password_hash);

            if (!validPassword) {
                return { success: false, error: 'Неверное имя пользователя или пароль' };
            }

            // Обновляем время последнего входа
            await this.pool.execute(
                'UPDATE admins SET last_login = NOW() WHERE id = ?',
                [admin.id]
            );

            // Удаляем хеш пароля из результата
            delete admin.password_hash;

            return { success: true, data: admin };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Ошибка при входе' };
        }
    }

    // Получение информации о текущем админе
    async getCurrentAdmin(adminId) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT id, username, email, role, last_login, created_at FROM admins WHERE id = ?',
                [adminId]
            );

            if (rows.length === 0) {
                return { success: false, error: 'Администратор не найден' };
            }

            return { success: true, data: rows[0] };
        } catch (error) {
            console.error('Get current admin error:', error);
            return { success: false, error: 'Ошибка при получении данных' };
        }
    }

    // Создание нового администратора (только для superadmin)
    async createAdmin(adminData, creatorId) {
        try {
            const { username, password, email, role = 'admin' } = adminData;

            // Проверяем, существует ли уже такой пользователь
            const [existing] = await this.pool.execute(
                'SELECT id FROM admins WHERE username = ? OR email = ?',
                [username, email]
            );

            if (existing.length > 0) {
                return { success: false, error: 'Пользователь с таким именем или email уже существует' };
            }

            // Хешируем пароль
            const passwordHash = await bcrypt.hash(password, 10);

            const [result] = await this.pool.execute(
                'INSERT INTO admins (username, password_hash, email, role) VALUES (?, ?, ?, ?)',
                [username, passwordHash, email, role]
            );

            return {
                success: true,
                data: {
                    id: result.insertId,
                    username,
                    email,
                    role
                }
            };
        } catch (error) {
            console.error('Create admin error:', error);
            return { success: false, error: 'Ошибка при создании администратора' };
        }
    }

    // Получение списка администраторов
    async getAllAdmins() {
        try {
            const [rows] = await this.pool.execute(
                'SELECT id, username, email, role, last_login, created_at FROM admins ORDER BY created_at DESC'
            );
            return { success: true, data: rows };
        } catch (error) {
            console.error('Get all admins error:', error);
            return { success: false, error: 'Ошибка при получении списка администраторов' };
        }
    }

    // Удаление администратора
    async deleteAdmin(adminId, deleterId) {
        try {
            // Не даем удалить самого себя
            if (parseInt(adminId) === parseInt(deleterId)) {
                return { success: false, error: 'Нельзя удалить самого себя' };
            }

            const [result] = await this.pool.execute(
                'DELETE FROM admins WHERE id = ?',
                [adminId]
            );

            if (result.affectedRows === 0) {
                return { success: false, error: 'Администратор не найден' };
            }

            return { success: true };
        } catch (error) {
            console.error('Delete admin error:', error);
            return { success: false, error: 'Ошибка при удалении администратора' };
        }
    }

    // Изменение пароля
    async changePassword(adminId, oldPassword, newPassword) {
        try {
            const [rows] = await this.pool.execute(
                'SELECT password_hash FROM admins WHERE id = ?',
                [adminId]
            );

            if (rows.length === 0) {
                return { success: false, error: 'Администратор не найден' };
            }

            const validPassword = await bcrypt.compare(oldPassword, rows[0].password_hash);

            if (!validPassword) {
                return { success: false, error: 'Неверный текущий пароль' };
            }

            const newPasswordHash = await bcrypt.hash(newPassword, 10);

            await this.pool.execute(
                'UPDATE admins SET password_hash = ? WHERE id = ?',
                [newPasswordHash, adminId]
            );

            return { success: true };
        } catch (error) {
            console.error('Change password error:', error);
            return { success: false, error: 'Ошибка при смене пароля' };
        }
    }
}

export default AdminService;