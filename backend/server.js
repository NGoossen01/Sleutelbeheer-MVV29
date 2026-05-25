import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'sleutelbeheer',
  user: process.env.DB_USER || 'sleutel',
  password: process.env.DB_PASS || 'sleutelpass',
  waitForConnections: true,
  connectionLimit: 10,
});

// ── PERSONS ──────────────────────────────────────────────────────────────────
app.get('/api/persons', async (req, res) => {
  const [rows] = await pool.query('SELECT id, first_name as firstName, last_name as lastName FROM persons ORDER BY last_name, first_name');
  res.json(rows);
});

app.post('/api/persons', async (req, res) => {
  const { id, firstName, lastName } = req.body;
  await pool.query('INSERT INTO persons (id, first_name, last_name) VALUES (?, ?, ?)', [id, firstName, lastName]);
  res.json({ id, firstName, lastName });
});

// ── ROOMS ─────────────────────────────────────────────────────────────────────
app.get('/api/rooms', async (req, res) => {
  const [rows] = await pool.query('SELECT id, name FROM rooms ORDER BY name');
  res.json(rows);
});

app.post('/api/rooms', async (req, res) => {
  const { id, name } = req.body;
  await pool.query('INSERT IGNORE INTO rooms (id, name) VALUES (?, ?)', [id, name]);
  res.json({ id, name });
});

app.post('/api/rooms/bulk', async (req, res) => {
  const { rooms } = req.body;
  if (!rooms?.length) return res.json({ added: 0 });
  const conn = await pool.getConnection();
  let added = 0;
  try {
    for (const r of rooms) {
      const [result] = await conn.query('INSERT IGNORE INTO rooms (id, name) VALUES (?, ?)', [r.id, r.name]);
      if (result.affectedRows) added++;
    }
  } finally { conn.release(); }
  res.json({ added });
});

// ── KEY TYPES ─────────────────────────────────────────────────────────────────
app.get('/api/keytypes', async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, rooms FROM key_types ORDER BY name');
  res.json(rows.map(r => ({ ...r, rooms: JSON.parse(r.rooms || '[]') })));
});

app.post('/api/keytypes', async (req, res) => {
  const { id, name, rooms } = req.body;
  await pool.query('INSERT INTO key_types (id, name, rooms) VALUES (?, ?, ?)', [id, name, JSON.stringify(rooms || [])]);
  res.json({ id, name, rooms });
});

// ── KEYS ──────────────────────────────────────────────────────────────────────
app.get('/api/keys', async (req, res) => {
  const [rows] = await pool.query('SELECT id, number, key_type_id as keyTypeId, room_ids as roomIds FROM `keys` ORDER BY number');
  res.json(rows.map(r => ({ ...r, roomIds: JSON.parse(r.roomIds || '[]') })));
});

app.post('/api/keys', async (req, res) => {
  const { id, number, keyTypeId, roomIds } = req.body;
  await pool.query('INSERT INTO `keys` (id, number, key_type_id, room_ids) VALUES (?, ?, ?, ?)', [id, number, keyTypeId, JSON.stringify(roomIds || [])]);
  res.json({ id, number, keyTypeId, roomIds });
});

app.patch('/api/keys/:id/rooms', async (req, res) => {
  const { roomIds } = req.body;
  await pool.query('UPDATE `keys` SET room_ids = ? WHERE id = ?', [JSON.stringify(roomIds), req.params.id]);
  res.json({ ok: true });
});

app.post('/api/keys/bulk', async (req, res) => {
  const { keys, keyTypes } = req.body;
  const conn = await pool.getConnection();
  let addedKeys = 0, addedTypes = 0;
  try {
    await conn.beginTransaction();
    for (const kt of (keyTypes || [])) {
      const [r] = await conn.query('INSERT IGNORE INTO key_types (id, name, rooms) VALUES (?, ?, ?)', [kt.id, kt.name, JSON.stringify([])]);
      if (r.affectedRows) addedTypes++;
    }
    for (const k of (keys || [])) {
      const [r] = await conn.query('INSERT IGNORE INTO `keys` (id, number, key_type_id, room_ids) VALUES (?, ?, ?, ?)', [k.id, k.number, k.keyTypeId, JSON.stringify([])]);
      if (r.affectedRows) addedKeys++;
    }
    await conn.commit();
  } catch(e) { await conn.rollback(); throw e; }
  finally { conn.release(); }
  res.json({ addedKeys, addedTypes });
});

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────
app.get('/api/transactions', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, key_id as keyId, person_id as personId, type, timestamp, signature, expiration_date as expirationDate FROM transactions ORDER BY timestamp ASC'
  );
  res.json(rows);
});

app.post('/api/transactions', async (req, res) => {
  const { id, keyId, personId, type, timestamp, signature, expirationDate } = req.body;
  await pool.query(
    'INSERT INTO transactions (id, key_id, person_id, type, timestamp, signature, expiration_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, keyId, personId, type, timestamp, signature || '', expirationDate || null]
  );
  res.json({ id, keyId, personId, type, timestamp, signature, expirationDate });
});

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch(e) {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Sleutelbeheer API draait op poort ${PORT}`));
