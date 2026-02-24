import bcrypt from 'bcrypt';
import { pool } from '../config/database.js';

async function hashTestPassword() {
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    console.log('Пароль:', password);
    console.log('Хеш:', hash);
    console.log('\nSQL для вставки:');
    console.log(`
INSERT INTO admins (username, password_hash, email, role) VALUES
('admin', '${hash}', 'admin@example.com', 'superadmin');
  `);
}

hashTestPassword().then(() => process.exit());