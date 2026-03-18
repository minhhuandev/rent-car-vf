import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Database Setup (MySQL with SQLite fallback)
let dbType: 'mysql' | 'sqlite' = 'mysql';
let mysqlPool: mysql.Pool | null = null;
let sqliteDb: any = null;

interface DBWrapper {
  query: (sql: string, params?: any[]) => Promise<any[]>;
  execute: (sql: string, params?: any[]) => Promise<{ affectedRows: number, insertId?: any }>;
}

let dbInstance: DBWrapper | null = null;

async function getDb(): Promise<DBWrapper> {
  if (dbInstance) return dbInstance;

  if (dbType === 'mysql') {
    try {
      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'car_rental',
        port: parseInt(process.env.DB_PORT || '3306'),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      // Test connection
      await mysqlPool.query('SELECT 1');
      console.log('Connected to MySQL database');
      
      dbInstance = {
        query: async (sql, params = []) => {
          const [rows] = await mysqlPool!.query(sql, params);
          return rows as any[];
        },
        execute: async (sql, params = []) => {
          const [result] = await mysqlPool!.query(sql, params);
          return result as any;
        }
      };
      return dbInstance;
    } catch (err: any) {
      console.warn('MySQL connection failed, falling back to SQLite:', err.message);
      dbType = 'sqlite';
    }
  }

  // SQLite initialization
  sqliteDb = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });
  console.log('Connected to SQLite fallback database');

  dbInstance = {
    query: async (sql, params = []) => {
      return await sqliteDb.all(sql, params);
    },
    execute: async (sql, params = []) => {
      const result = await sqliteDb.run(sql, params);
      return {
        affectedRows: result.changes || 0,
        insertId: result.lastID
      };
    }
  };
  return dbInstance;
}

async function initDb() {
  try {
    const db = await getDb();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS banners (
        id VARCHAR(255) PRIMARY KEY,
        imageUrl VARCHAR(1024) NOT NULL,
        title VARCHAR(255) NOT NULL,
        subtitle TEXT
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        createdAt DATETIME NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key_name VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    
    const settings = await db.query("SELECT * FROM settings WHERE key_name = 'pricePerDay'");
    if (settings.length === 0) {
      await db.execute("INSERT INTO settings (key_name, value) VALUES ('pricePerDay', '1000000')");
    }

    const rows = await db.query('SELECT COUNT(*) as count FROM banners');
    if (rows[0].count === 0) {
      await db.execute(`
        INSERT INTO banners (id, imageUrl, title, subtitle)
        VALUES (?, ?, ?, ?)
      `, [
        '1',
        'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=2072&auto=format&fit=crop',
        'Trải nghiệm Tương lai cùng VinFast VF 5',
        'Nhỏ gọn, thông minh và 100% điện. Thuê VinFast VF 5 Plus ngay hôm nay để tận hưởng trải nghiệm lái xe mượt mà, thân thiện với môi trường trong thành phố.'
      ]);
    }
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Simple auth middleware
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token === 'admin-secret-token') {
    next();
  } else {
    res.status(401).json({ error: 'Không có quyền truy cập' });
  }
};

const formatDate = (val: any) => {
  if (!val) return '';
  if (typeof val === 'string') return val.split('T')[0];
  const d = new Date(val);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return \`\${year}-\${month}-\${day}\`;
};

async function startServer() {
  await initDb(); // Initialize database on startup

  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use('/uploads', express.static(uploadDir));

  // API Routes
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin') {
      res.json({ token: 'admin-secret-token' });
    } else {
      res.status(401).json({ error: 'Thông tin đăng nhập không hợp lệ' });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Banners API
  app.get('/api/banners', async (req, res) => {
    try {
      const db = await getDb();
      const rows = await db.query('SELECT * FROM banners');
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi kết nối cơ sở dữ liệu' });
    }
  });

  app.post('/api/banners', authenticate, upload.single('image'), async (req, res) => {
    try {
      const { title, subtitle } = req.body;
      let imageUrl = req.body.imageUrl;

      if (req.file) {
        imageUrl = \`/uploads/\${req.file.filename}\`;
      }

      if (!imageUrl || !title) {
        return res.status(400).json({ error: 'Yêu cầu có ảnh và tiêu đề' });
      }
      
      const id = Math.random().toString(36).substring(2, 9);
      const db = await getDb();
      await db.execute('INSERT INTO banners (id, imageUrl, title, subtitle) VALUES (?, ?, ?, ?)', [id, imageUrl, title, subtitle || '']);
      
      res.status(201).json({ id, imageUrl, title, subtitle });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi kết nối cơ sở dữ liệu' });
    }
  });

  app.delete('/api/banners/:id', authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const db = await getDb();
      await db.execute('DELETE FROM banners WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi kết nối cơ sở dữ liệu' });
    }
  });

  // Get car details
  app.get('/api/car', async (req, res) => {
    try {
      const db = await getDb();
      const rows = await db.query("SELECT value FROM settings WHERE key_name = 'pricePerDay'");
      const pricePerDay = rows.length > 0 ? parseInt(rows[0].value) : 1000000;
      
      res.json({
        model: 'VinFast VF 5 Plus',
        type: 'A-SUV',
        batteryCapacity: '37.23 kWh',
        range: '326 km (NEDC)',
        power: '134 hp',
        torque: '135 Nm',
        pricePerDay: pricePerDay,
        features: [
          'Hệ thống Hỗ trợ Lái xe Nâng cao (ADAS)',
          'Trợ lý ảo thông minh',
          'Phanh tái sinh',
          'Màn hình giải trí 8 inch',
          'Thiết kế nhỏ gọn & linh hoạt'
        ]
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi kết nối cơ sở dữ liệu' });
    }
  });

  // Update car price
  app.patch('/api/car/price', authenticate, async (req, res) => {
    try {
      const { price } = req.body;
      if (!price || isNaN(price)) {
        return res.status(400).json({ error: 'Giá không hợp lệ' });
      }
      const db = await getDb();
      await db.execute("UPDATE settings SET value = ? WHERE key_name = 'pricePerDay'", [price.toString()]);
      res.json({ success: true, price });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi kết nối cơ sở dữ liệu' });
    }
  });

  // Get booked dates
  app.get('/api/bookings/dates', async (req, res) => {
    try {
      const db = await getDb();
      const rows = await db.query("SELECT startDate, endDate FROM bookings WHERE status != 'cancelled'");
      const formatted = rows.map((r: any) => ({
        start: formatDate(r.startDate),
        end: formatDate(r.endDate)
      }));
      res.json(formatted);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi kết nối cơ sở dữ liệu' });
    }
  });

  // Create a booking
  app.post('/api/bookings', async (req, res) => {
    try {
      const { name, email, phone, startDate, endDate } = req.body;
      
      if (!name || !email || !phone || !startDate || !endDate) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
      }

      const db = await getDb();
      
      const overlapping = await db.query(\`
        SELECT id FROM bookings 
        WHERE status != 'cancelled' 
        AND startDate <= ? AND endDate >= ?
      \`, [endDate, startDate]);

      if (overlapping.length > 0) {
        return res.status(400).json({ error: 'Khoảng thời gian này đã có người đặt. Vui lòng chọn ngày khác.' });
      }

      const id = Math.random().toString(36).substring(2, 9);
      const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      await db.execute(\`
        INSERT INTO bookings (id, name, email, phone, startDate, endDate, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
      \`, [id, name, email, phone, startDate, endDate, createdAt]);

      res.status(201).json({ id, name, email, phone, startDate, endDate, status: 'pending', createdAt });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi kết nối cơ sở dữ liệu' });
    }
  });

  // Get all bookings (Admin/Backend view)
  app.get('/api/bookings', authenticate, async (req, res) => {
    try {
      const db = await getDb();
      const rows = await db.query("SELECT id, name, email, phone, startDate, endDate, status, createdAt FROM bookings ORDER BY createdAt DESC");
      const formatted = rows.map((r: any) => ({
        ...r,
        startDate: formatDate(r.startDate),
        endDate: formatDate(r.endDate)
      }));
      res.json(formatted);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi kết nối cơ sở dữ liệu' });
    }
  });

  // Update booking status
  app.patch('/api/bookings/:id/status', authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
      }

      const db = await getDb();
      const result = await db.execute('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Không tìm thấy yêu cầu đặt xe' });
      }

      res.json({ id, status });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Lỗi kết nối cơ sở dữ liệu' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

startServer();
