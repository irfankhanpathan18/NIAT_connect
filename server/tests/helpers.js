const initSqlJs = require('sql.js');
const { initSchema } = require('../schema');
const seedDatabase = require('../seed');

// Minimal synchronous wrapper around an in-memory sql.js database (no disk writes).
function createMemoryDb(SQL) {
  const raw = new SQL.Database();
  const bind = (stmt, params) => {
    const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    if (flat.length) stmt.bind(flat);
  };
  return {
    exec: sql => raw.exec(sql),
    prepare: sql => ({
      run: (...params) => {
        const stmt = raw.prepare(sql);
        bind(stmt, params);
        stmt.step();
        stmt.free();
        return { lastInsertRowid: raw.exec('SELECT last_insert_rowid()')[0].values[0][0], changes: 1 };
      },
      get: (...params) => {
        const stmt = raw.prepare(sql);
        bind(stmt, params);
        const row = stmt.step() ? stmt.getAsObject() : null;
        stmt.free();
        return row;
      },
      all: (...params) => {
        const stmt = raw.prepare(sql);
        bind(stmt, params);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      }
    })
  };
}

/** Creates an in-memory database with the schema and demo seed data. */
async function createSeededDb() {
  const SQL = await initSqlJs();
  const db = createMemoryDb(SQL);
  initSchema(db);
  const log = console.log;
  console.log = () => {};
  try {
    seedDatabase(db);
  } finally {
    console.log = log;
  }
  return db;
}

/** Replaces global fetch with a handler for the duration of a test. */
function mockFetch(handler) {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init, body: init.body ? JSON.parse(init.body) : undefined });
    const out = await handler(String(url), init, calls.length);
    const status = out.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => out.json,
      text: async () => JSON.stringify(out.json ?? {})
    };
  };
  return { calls, restore: () => { global.fetch = original; } };
}

module.exports = { createMemoryDb, createSeededDb, mockFetch };
