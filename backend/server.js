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
    difficulty TEXT NOT NULL DEFAULT 'unknown' CHECK(difficulty IN ('easy', 'normal', 'hard', 'unknown')),
    game_mode TEXT NOT NULL DEFAULT 'runner',
    flight_score INTEGER NOT NULL DEFAULT 0 CHECK(flight_score >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS scores_distance_idx ON scores(distance DESC);
  CREATE INDEX IF NOT EXISTS scores_debt_idx ON scores(debt DESC);
`);

// Add the difficulty column to existing score databases without losing records.
const scoreColumns = db.pragma('table_info(scores)');
if (!scoreColumns.some((column) => column.name === 'difficulty')) {
  db.exec("ALTER TABLE scores ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'unknown' CHECK(difficulty IN ('easy', 'normal', 'hard', 'unknown'))");
}
if (!scoreColumns.some((column) => column.name === 'game_mode')) {
  db.exec("ALTER TABLE scores ADD COLUMN game_mode TEXT NOT NULL DEFAULT 'runner'");
}
if (!scoreColumns.some((column) => column.name === 'flight_score')) {
  db.exec('ALTER TABLE scores ADD COLUMN flight_score INTEGER NOT NULL DEFAULT 0');
}

const insertScore = db.prepare(
  'INSERT INTO scores (nickname, debt, distance, difficulty, game_mode, flight_score) VALUES (?, ?, ?, ?, ?, ?)'
);
const getScore = db.prepare(
  'SELECT id, nickname, debt, distance, difficulty, game_mode, flight_score, created_at FROM scores WHERE id = ?'
);
// Prepare each leaderboard query once (mode x sort x period) instead of on every request.
const listQueries = new Map();
function listQuery(gameMode, sort, period) {
  const key = `${gameMode}|${sort}|${period}`;
  if (!listQueries.has(key)) {
    const orderBy = gameMode === 'flight'
      ? 'flight_score DESC, created_at ASC'
      : sort === 'debt' ? 'debt DESC, distance DESC' : 'distance DESC, debt ASC';
    const periodFilter = period === 'week'
      ? "WHERE game_mode = ? AND created_at >= datetime('now', '-7 days')"
      : 'WHERE game_mode = ?';
    listQueries.set(key, db.prepare(`
      SELECT id, nickname, debt, distance, difficulty, game_mode, flight_score, created_at
      FROM scores ${periodFilter}
      ORDER BY ${orderBy}, created_at ASC
      LIMIT 10
    `));
  }
  return listQueries.get(key);
}

const app = express();
app.use(cors({ origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',').map((s) => s.trim()) }));
app.use(express.json({ limit: '8kb' }));

app.get('/api/scores', (req, res) => {
  const gameMode = req.query.mode === 'flight' ? 'flight' : 'runner';
  const sort = req.query.sort === 'debt' ? 'debt' : 'distance';
  const period = req.query.period === 'week' ? 'week' : 'all';
  const scores = listQuery(gameMode, sort, period).all(gameMode);
  res.json({ scores, sort, period, gameMode });
});

app.post('/api/scores', (req, res) => {
  const nickname = typeof req.body?.nickname === 'string' ? req.body.nickname.trim() : '';
  const { debt, distance } = req.body || {};
  const gameMode = req.body?.gameMode ?? 'runner';
  const flightScore = req.body?.flightScore;
  const difficulty = req.body?.difficulty ?? 'normal';
  if (!nickname || nickname.length > 24) {
    return res.status(400).json({ error: 'nickname must contain 1–24 characters' });
  }
  if (!['runner', 'flight'].includes(gameMode)) {
    return res.status(400).json({ error: 'gameMode must be runner or flight' });
  }
  if (gameMode === 'flight' && (!Number.isInteger(flightScore) || flightScore < 0)) {
    return res.status(400).json({ error: 'flightScore must be a non-negative integer' });
  }
  if (gameMode === 'runner' && (typeof debt !== 'number' || !Number.isFinite(debt) || debt < 0)) {
    return res.status(400).json({ error: 'debt must be a non-negative number' });
  }
  if (gameMode === 'runner' && (typeof distance !== 'number' || !Number.isFinite(distance) || distance < 0)) {
    return res.status(400).json({ error: 'distance must be a non-negative number' });
  }
  if (!['easy', 'normal', 'hard'].includes(difficulty)) {
    return res.status(400).json({ error: 'difficulty must be easy, normal, or hard' });
  }

  const result = insertScore.run(nickname, gameMode === 'runner' ? debt : 0, gameMode === 'runner' ? distance : 0, difficulty, gameMode, gameMode === 'flight' ? flightScore : 0);
  const score = getScore.get(result.lastInsertRowid);
  return res.status(201).json(score);
});

app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Serve the game and its generated sprite assets from this same origin.
app.use('/assets', express.static(path.join(__dirname, '..', 'assets'), { maxAge: '7d' }));
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Leaderboard API listening on port ${PORT}; database: ${DB_PATH}`);
});
