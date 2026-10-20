'use strict';

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'scores.db');
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL,
    debt REAL NOT NULL CHECK(debt >= 0),
    distance REAL NOT NULL CHECK(distance >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS scores_distance_idx ON scores(distance DESC);
  CREATE INDEX IF NOT EXISTS scores_debt_idx ON scores(debt DESC);
`);

const app = express();
app.use(cors({ origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',').map((s) => s.trim()) }));
app.use(express.json({ limit: '8kb' }));

app.get('/api/scores', (req, res) => {
  const sort = req.query.sort === 'debt' ? 'debt' : 'distance';
  const orderBy = sort === 'debt'
    ? 'debt DESC, distance DESC'
    : 'distance DESC, debt ASC';
  const scores = db.prepare(`
    SELECT id, nickname, debt, distance, created_at
    FROM scores
    ORDER BY ${orderBy}, created_at ASC
    LIMIT 10
  `).all();
  res.json(scores);
});

app.post('/api/scores', (req, res) => {
  const nickname = typeof req.body?.nickname === 'string' ? req.body.nickname.trim() : '';
  const { debt, distance } = req.body || {};
  if (!nickname || nickname.length > 24) {
    return res.status(400).json({ error: 'nickname must contain 1–24 characters' });
  }
  if (typeof debt !== 'number' || !Number.isFinite(debt) || debt < 0) {
    return res.status(400).json({ error: 'debt must be a non-negative number' });
  }
  if (typeof distance !== 'number' || !Number.isFinite(distance) || distance < 0) {
    return res.status(400).json({ error: 'distance must be a non-negative number' });
  }

  const result = db.prepare(
    'INSERT INTO scores (nickname, debt, distance) VALUES (?, ?, ?)'
  ).run(nickname, debt, distance);
  const score = db.prepare(
    'SELECT id, nickname, debt, distance, created_at FROM scores WHERE id = ?'
  ).get(result.lastInsertRowid);
  return res.status(201).json(score);
});

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Leaderboard API listening on port ${PORT}; database: ${DB_PATH}`);
});
