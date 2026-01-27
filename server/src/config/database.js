import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import config from '../config/index.js';

dotenv.config();

const dbConfig = {
    host: config.database.host,
    user: config.database.username,
    password: config.database.password,
    database: config.database.name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Создаем пул соединений
const pool = mysql.createPool(dbConfig);

// Функция для проверки и создания базы данных если нужно
async function initializeDatabase() {
    try {
        const adminConnection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });

        await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
        console.log(`✅ База данных ${dbConfig.database} готова`);

        await adminConnection.end();
    } catch (error) {
        console.error('❌ Ошибка инициализации базы данных:', error.message);
    }
}

export { pool, initializeDatabase };