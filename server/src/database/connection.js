import mysql from 'mysql2/promise';
import config from '../config/index.js';

class Database {
    constructor() {
        this.config = config.database;
        this.pool = null;
    }

    async connect() {
        try {
            this.pool = mysql.createPool({
                host: this.config.host,
                user: this.config.username,
                password: this.config.password,
                database: this.config.name,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });

            console.log('✅ Подключение к базе данных установлено');
            return this.pool;
        } catch (error) {
            console.error('❌ Ошибка подключения к БД:', error.message);
            throw error;
        }
    }

    async query(sql, params) {
        if (!this.pool) {
            await this.connect();
        }

        const [rows] = await this.pool.execute(sql, params);
        return rows;
    }
}

export default new Database();