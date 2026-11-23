const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({
    path: [
        path.resolve(__dirname, '.env'),
        path.resolve(__dirname, '..', '.env')
    ]
});

const app = express();

const sessions = new Map();
const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD,
    database: 'sportiva',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Kết nối MySQL thất bại:', err.message);
        return;
    }
    console.log('Đã kết nối MySQL thành công!');
    connection.release();
});

// Kiểm tra kết nối
app.get('/api/test', (req, res) => {
    db.query('SELECT NOW() AS time', (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({
            message: 'Backend đã kết nối MySQL!',
            data: result
        });
    });
});

app.post('/api/login', (req, res) => {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');

    if (!username || !password) {
        return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
    }

    db.query(
        'SELECT id, name, username, role, status, password FROM users WHERE username = ? LIMIT 1',
        [username],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!rows.length) return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' });

            const user = rows[0];
            if (user.status !== 'Hoạt động') {
                return res.status(403).json({ error: 'Tài khoản đã bị khóa.' });
            }
            if (!user.password || hashPassword(password) !== user.password) {
                return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
            }

            const token = crypto.randomBytes(32).toString('hex');
            const session = { id: user.id, name: user.name, username: user.username, role: user.role };
            sessions.set(token, session);
            res.json({ token, user: session });
        }
    );
});

app.post('/api/logout', (req, res) => {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    sessions.delete(token);
    res.json({ message: 'Đã đăng xuất.' });
});

app.use('/api', (req, res, next) => {
    if (req.path === '/test') return next();
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token || !sessions.has(token)) {
        return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn.' });
    }
    req.user = sessions.get(token);
    next();
});

const resources = {
    fields: {
        table: 'fields',
        select: 'id, name, type_id AS typeId, location, price, status',
        columns: { name: 'name', typeId: 'type_id', location: 'location', price: 'price', status: 'status' },
        required: ['name', 'typeId', 'price', 'status']
    },
    types: {
        table: 'field_types',
        select: 'id, name, description',
        columns: { name: 'name', description: 'description' },
        required: ['name']
    },
    slots: {
        table: 'time_slots',
        select: "id, TIME_FORMAT(start_time, '%H:%i') AS start, TIME_FORMAT(end_time, '%H:%i') AS end, price",
        columns: { start: 'start_time', end: 'end_time', price: 'price' },
        required: ['start', 'end', 'price']
    },
    customers: {
        table: 'customers',
        select: 'id, name, phone, email, address',
        columns: { name: 'name', phone: 'phone', email: 'email', address: 'address' },
        required: ['name', 'phone']
    },
    users: {
        table: 'users',
        select: 'id, name, username, role, status',
        columns: { name: 'name', username: 'username', password: 'password', role: 'role', status: 'status' },
        required: ['name', 'username', 'role', 'status']
    }
};

function getResource(req, res, next) {
    const resource = resources[req.params.resource];
    if (!resource) {
        return res.status(404).json({ error: 'Không tìm thấy loại dữ liệu.' });
    }
    req.resource = resource;
    next();
}

app.get('/api/:resource', getResource, (req, res) => {
    const { table, select } = req.resource;
    db.query(`SELECT ${select} FROM ${table} ORDER BY id DESC`, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

function getValues(req, res) {
    const { columns, required } = req.resource;
    const body = req.body;
    const missing = required.find((key) =>
        body[key] === undefined || body[key] === null ||
        (typeof body[key] === 'string' && body[key].trim() === '')
    );
    if (missing) {
        res.status(400).json({ error: `Trường "${missing}" không được để trống.` });
        return null;
    }

    if ('price' in body && (!Number.isFinite(Number(body.price)) || Number(body.price) < 0)) {
        res.status(400).json({ error: 'Giá phải là số hợp lệ và không được âm.' });
        return null;
    }
    if ('typeId' in body && (!Number.isInteger(Number(body.typeId)) || Number(body.typeId) < 1)) {
        res.status(400).json({ error: 'Loại sân không hợp lệ.' });
        return null;
    }
    if ('start' in body && 'end' in body && body.start >= body.end) {
        res.status(400).json({ error: 'Giờ kết thúc phải sau giờ bắt đầu.' });
        return null;
    }

    const keys = Object.keys(columns).filter((key) => key in body);
    const values = keys.map((key) => {
        const value = body[key];
        return value === '' || value === undefined ? null : value;
    });
    return { keys, values };
}

app.post('/api/:resource', getResource, (req, res) => {
    const data = getValues(req, res);
    if (!data) return;
    if (req.params.resource === 'users') {
        if (!req.body.password) return res.status(400).json({ error: 'Vui lòng nhập mật khẩu.' });
        const passwordIndex = data.keys.indexOf('password');
        if (passwordIndex >= 0) data.values[passwordIndex] = hashPassword(String(req.body.password));
        else {
            data.keys.push('password');
            data.values.push(hashPassword(String(req.body.password)));
        }
    }

    const { table, columns } = req.resource;
    const columnNames = data.keys.map((key) => columns[key]);
    const placeholders = data.keys.map(() => '?');
    db.query(
        `INSERT INTO ${table} (${columnNames.join(', ')}) VALUES (${placeholders.join(', ')})`,
        data.values,
        (err, result) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.status(201).json({ message: 'Đã thêm dữ liệu.', id: result.insertId });
        }
    );
});

app.put('/api/:resource/:id', getResource, (req, res) => {
    const data = getValues(req, res);
    if (!data) return;
    if (req.params.resource === 'users') {
        const passwordIndex = data.keys.indexOf('password');
        if (passwordIndex >= 0) {
            if (String(req.body.password || '').trim()) {
                data.values[passwordIndex] = hashPassword(String(req.body.password));
            } else {
                data.keys.splice(passwordIndex, 1);
                data.values.splice(passwordIndex, 1);
            }
        }
    }

    const { table, columns } = req.resource;
    const assignments = data.keys.map((key) => `${columns[key]} = ?`);
    db.query(
        `UPDATE ${table} SET ${assignments.join(', ')} WHERE id = ?`,
        [...data.values, req.params.id],
        (err, result) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            if (result.affectedRows > 0) {
                return res.json({ message: 'Đã cập nhật dữ liệu.' });
            }
            db.query(`SELECT id FROM ${table} WHERE id = ?`, [req.params.id], (selectErr, rows) => {
                if (selectErr) {
                    return res.status(500).json({ error: selectErr.message });
                }
                if (!rows.length) {
                    return res.status(404).json({ error: 'Không tìm thấy dữ liệu.' });
                }
                res.json({ message: 'Dữ liệu không thay đổi.' });
            });
        }
    );
});

app.delete('/api/:resource/:id', getResource, (req, res) => {
    db.query(`DELETE FROM ${req.resource.table} WHERE id = ?`, [req.params.id], (err, result) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy dữ liệu.' });
        }
        res.json({ message: 'Đã xóa dữ liệu.' });
    });
});

// Khởi chạy backend
app.listen(5000, () => {
    console.log('Backend đang chạy tại http://localhost:5000');
});