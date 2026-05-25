import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ─── Database schema initialisatie ──────────────────────────────────────────
// Tabellen worden automatisch aangemaakt als ze nog niet bestaan.
// Dit vervangt het init.sql bestand — geen lokale bestanden nodig.

async function initDB() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS persons (
        id         VARCHAR(36)  NOT NULL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name  VARCHAR(100) NOT NULL,
        created_at DATETIME     DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id   VARCHAR(50)  NOT NULL PRIMARY KEY,
        name VARCHAR(200) NOT NULL
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS key_types (
        id         VARCHAR(36)  NOT NULL PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        rooms_json TEXT
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`keys\` (
        id          VARCHAR(36) NOT NULL PRIMARY KEY,
        number      VARCHAR(50) NOT NULL UNIQUE,
        key_type_id VARCHAR(36) NOT NULL,
        FOREIGN KEY (key_type_id) REFERENCES key_types(id)
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS key_rooms (
        key_id  VARCHAR(36) NOT NULL,
        room_id VARCHAR(50) NOT NULL,
        PRIMARY KEY (key_id, room_id),
        FOREIGN KEY (key_id)  REFERENCES \`keys\`(id)  ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES rooms(id)     ON DELETE CASCADE
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id              VARCHAR(36) NOT NULL PRIMARY KEY,
        key_id          VARCHAR(36) NOT NULL,
        person_id       VARCHAR(36) NOT NULL,
        type            ENUM('ISSUED','RETURNED','LOST','BROKEN','EXTENDED') NOT NULL,
        timestamp       BIGINT      NOT NULL,
        signature       MEDIUMTEXT,
        expiration_date BIGINT,
        FOREIGN KEY (key_id)    REFERENCES \`keys\`(id),
        FOREIGN KEY (person_id) REFERENCES persons(id)
      )
    `);
    console.log('Database schema gereed.');
  } finally {
    conn.release();
  }
}

// ─── helpers ───────────────────────────────────────────────────────────────

const nextAugust31 = () => {
  const now = new Date();
  const aug31 = new Date(now.getFullYear(), 7, 31).getTime();
  return now.getTime() >= aug31
    ? new Date(now.getFullYear() + 1, 7, 31).getTime()
    : aug31;
};

// ─── PERSONS ───────────────────────────────────────────────────────────────

app.get('/api/persons', async (req, res) => {
  const [rows] = await pool.query('SELECT id, first_name AS firstName, last_name AS lastName FROM persons ORDER BY last_name, first_name');
  res.json(rows);
});

app.post('/api/persons', async (req, res) => {
  const { firstName, lastName } = req.body;
  const id = `p_${uuidv4()}`;
  await pool.query('INSERT INTO persons (id, first_name, last_name) VALUES (?, ?, ?)', [id, firstName, lastName]);
  res.status(201).json({ id, firstName, lastName });
});

// ─── ROOMS ─────────────────────────────────────────────────────────────────

app.get('/api/rooms', async (req, res) => {
  const [rows] = await pool.query('SELECT id, name FROM rooms ORDER BY id');
  res.json(rows);
});

app.post('/api/rooms/import', async (req, res) => {
  const { rooms } = req.body;
  let added = 0;
  for (const r of rooms) {
    await pool.query('INSERT IGNORE INTO rooms (id, name) VALUES (?, ?)', [r.id, r.name]);
    added++;
  }
  res.json({ added });
});

// ─── KEY TYPES ─────────────────────────────────────────────────────────────

app.get('/api/keytypes', async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, rooms_json AS roomsJson FROM key_types ORDER BY name');
  res.json(rows.map(r => ({ ...r, rooms: r.roomsJson ? r.roomsJson.split(',').map(x => x.trim()) : [] })));
});

app.post('/api/keytypes', async (req, res) => {
  const { name, rooms } = req.body;
  const id = `t_${uuidv4()}`;
  const roomsJson = Array.isArray(rooms) ? rooms.join(',') : '';
  await pool.query('INSERT INTO key_types (id, name, rooms_json) VALUES (?, ?, ?)', [id, name, roomsJson]);
  res.status(201).json({ id, name, rooms });
});

// ─── KEYS ─────────────────────────────────────────────────────────────────

app.get('/api/keys', async (req, res) => {
  const [keys] = await pool.query('SELECT id, number, key_type_id AS keyTypeId FROM `keys` ORDER BY number');
  const [keyRooms] = await pool.query('SELECT key_id AS keyId, room_id AS roomId FROM key_rooms');
  const result = keys.map(k => ({
    ...k,
    roomIds: keyRooms.filter(r => r.keyId === k.id).map(r => r.roomId),
  }));
  res.json(result);
});

app.post('/api/keys', async (req, res) => {
  const { number, keyTypeId } = req.body;
  const id = `k_${uuidv4()}`;
  await pool.query('INSERT INTO `keys` (id, number, key_type_id) VALUES (?, ?, ?)', [id, number, keyTypeId]);
  res.status(201).json({ id, number, keyTypeId, roomIds: [] });
});

app.post('/api/keys/import', async (req, res) => {
  const { keys } = req.body;
  let added = 0;
  for (const k of keys) {
    let [types] = await pool.query('SELECT id FROM key_types WHERE name = ?', [k.typeName]);
    let typeId;
    if (types.length === 0) {
      typeId = `t_${uuidv4()}`;
      await pool.query('INSERT INTO key_types (id, name, rooms_json) VALUES (?, ?, ?)', [typeId, k.typeName, '']);
    } else {
      typeId = types[0].id;
    }
    const [existing] = await pool.query('SELECT id FROM `keys` WHERE number = ?', [k.number]);
    if (existing.length === 0) {
      const id = `k_${uuidv4()}`;
      await pool.query('INSERT INTO `keys` (id, number, key_type_id) VALUES (?, ?, ?)', [id, k.number, typeId]);
      added++;
    }
  }
  res.json({ added });
});

app.post('/api/keys/:keyId/rooms/:roomId', async (req, res) => {
  const { keyId, roomId } = req.params;
  await pool.query('INSERT IGNORE INTO key_rooms (key_id, room_id) VALUES (?, ?)', [keyId, roomId]);
  res.sendStatus(204);
});

app.delete('/api/keys/:keyId/rooms/:roomId', async (req, res) => {
  const { keyId, roomId } = req.params;
  await pool.query('DELETE FROM key_rooms WHERE key_id = ? AND room_id = ?', [keyId, roomId]);
  res.sendStatus(204);
});

// ─── TRANSACTIONS ──────────────────────────────────────────────────────────

app.get('/api/transactions', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, key_id AS keyId, person_id AS personId, type, timestamp, signature, expiration_date AS expirationDate FROM transactions ORDER BY timestamp ASC'
  );
  res.json(rows);
});

app.post('/api/transactions/issue', async (req, res) => {
  const { keyId, personId, signature } = req.body;
  const id = `tr_${uuidv4()}`;
  const timestamp = Date.now();
  const expirationDate = nextAugust31();
  await pool.query(
    'INSERT INTO transactions (id, key_id, person_id, type, timestamp, signature, expiration_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, keyId, personId, 'ISSUED', timestamp, signature, expirationDate]
  );
  res.status(201).json({ id, keyId, personId, type: 'ISSUED', timestamp, signature, expirationDate });
});

app.post('/api/transactions/return', async (req, res) => {
  const { keyId, personId, signature } = req.body;
  const id = `tr_${uuidv4()}`;
  const timestamp = Date.now();
  await pool.query(
    'INSERT INTO transactions (id, key_id, person_id, type, timestamp, signature) VALUES (?, ?, ?, ?, ?, ?)',
    [id, keyId, personId, 'RETURNED', timestamp, signature]
  );
  res.status(201).json({ id, keyId, personId, type: 'RETURNED', timestamp, signature });
});

app.post('/api/transactions/extend', async (req, res) => {
  const { keyId, personId } = req.body;
  const id = `tr_${uuidv4()}`;
  const timestamp = Date.now();
  const expirationDate = new Date(new Date().getFullYear() + 1, 7, 31).getTime();
  await pool.query(
    'INSERT INTO transactions (id, key_id, person_id, type, timestamp, signature, expiration_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, keyId, personId, 'EXTENDED', timestamp, '', expirationDate]
  );
  res.status(201).json({ id, keyId, personId, type: 'EXTENDED', timestamp, expirationDate });
});

app.post('/api/transactions/lost', async (req, res) => {
  const { keyId, personId } = req.body;
  const id = `tr_${uuidv4()}`;
  const timestamp = Date.now();
  await pool.query(
    'INSERT INTO transactions (id, key_id, person_id, type, timestamp, signature) VALUES (?, ?, ?, ?, ?, ?)',
    [id, keyId, personId, 'LOST', timestamp, '']
  );
  res.status(201).json({ id, keyId, personId, type: 'LOST', timestamp });
});

app.post('/api/transactions/broken', async (req, res) => {
  const { keyId, personId } = req.body;
  const id = `tr_${uuidv4()}`;
  const timestamp = Date.now();
  await pool.query(
    'INSERT INTO transactions (id, key_id, person_id, type, timestamp, signature) VALUES (?, ?, ?, ?, ?, ?)',
    [id, keyId, personId, 'BROKEN', timestamp, '']
  );
  res.status(201).json({ id, keyId, personId, type: 'BROKEN', timestamp });
});

// ─── Start ─────────────────────────────────────────────────────────────────

// Eerst tabellen aanmaken, dan pas luisteren
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Sleutelbeheer API luistert op poort ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database initialisatie mislukt:', err);
    process.exit(1);
  });
