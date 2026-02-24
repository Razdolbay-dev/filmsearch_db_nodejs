import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Определяем текущую директорию (для ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем .env файл из корня проекта
dotenv.config({ path: join(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const JWT_EXPIRES_IN = '24h';
const COOKIE_NAME = 'admin_token';

export const generateToken = (admin) => {
    return jwt.sign(
        {
            id: admin.id,
            username: admin.username,
            role: admin.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

export const authenticateAdmin = (req, res, next) => {
    try {
        console.log('🔐 Auth middleware check:');
        console.log('🍪 Все cookies:', req.cookies);
        console.log('🔑 Ищем cookie:', COOKIE_NAME);

        // Пробуем получить токен из разных мест
        let token = req.cookies?.[COOKIE_NAME];

        // Если нет в cookies, пробуем из заголовка Authorization
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
                console.log('📦 Токен из Authorization header');
            }
        }

        if (!token) {
            console.log('❌ Токен не найден');
            return res.status(401).json({
                success: false,
                error: 'Не авторизован'
            });
        }

        console.log('✅ Токен найден:', token.substring(0, 20) + '...');

        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Токен верифицирован:', decoded);

        req.admin = decoded;
        next();
    } catch (error) {
        console.error('❌ Auth middleware error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Недействительный токен'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Токен истек'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
};

export const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({
                success: false,
                error: 'Не авторизован'
            });
        }

        if (!roles.includes(req.admin.role)) {
            return res.status(403).json({
                success: false,
                error: 'Недостаточно прав'
            });
        }

        next();
    };
};

export const setAuthCookie = (res, token, req) => {
    const isHttps = req?.secure || req?.protocol === 'https';

    const cookieOptions = {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        secure: isHttps
    };

    console.log('🍪 Устанавливаем cookie:', {
        name: COOKIE_NAME,
        ...cookieOptions,
        protocol: req?.protocol,
        isHttps
    });

    res.cookie(COOKIE_NAME, token, cookieOptions);
};

export const clearAuthCookie = (res, req) => {
    const isHttps = req?.secure || req?.protocol === 'https';

    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isHttps
    });
};