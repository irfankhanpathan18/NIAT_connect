const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'niat.db');

let sqlInstance = null;
let db = null;
let saveTimer = null;

function debouncedSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveToDisk();
  }, 300);
}

function saveToDisk() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

// Wrapper for statement execution matching common API
class StatementWrapper {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql;
  }

  get(...params) {
    let stmt = null;
    try {
      stmt = this.database.prepare(this.sql);
      const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      if (flatParams.length > 0) {
        stmt.bind(flatParams);
      }
      if (stmt.step()) {
        const obj = stmt.getAsObject();
        return obj;
      }
      return null;
    } catch (err) {
      console.error(`SQL GET Error in "${this.sql}":`, err.message);
      throw err;
    } finally {
      if (stmt) stmt.free();
    }
  }

  all(...params) {
    let stmt = null;
    try {
      stmt = this.database.prepare(this.sql);
      const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      if (flatParams.length > 0) {
        stmt.bind(flatParams);
      }
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      return results;
    } catch (err) {
      console.error(`SQL ALL Error in "${this.sql}":`, err.message);
      throw err;
    } finally {
      if (stmt) stmt.free();
    }
  }

  run(...params) {
    let stmt = null;
    try {
      stmt = this.database.prepare(this.sql);
      const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      if (flatParams.length > 0) {
        stmt.bind(flatParams);
      }
      stmt.step();
      
      const lastIdRes = this.database.exec("SELECT last_insert_rowid() as id;");
      const lastInsertRowid = lastIdRes.length && lastIdRes[0].values.length ? lastIdRes[0].values[0][0] : 0;
      const changesRes = this.database.exec("SELECT changes() as cnt;");
      const changes = changesRes.length && changesRes[0].values.length ? changesRes[0].values[0][0] : 0;

      debouncedSave();

      return {
        changes,
        lastInsertRowid
      };
    } catch (err) {
      console.error(`SQL RUN Error in "${this.sql}":`, err.message);
      throw err;
    } finally {
      if (stmt) stmt.free();
    }
  }
}

class DatabaseManager {
  constructor() {
    this.rawDb = null;
  }

  setDatabase(rawDb) {
    this.rawDb = rawDb;
  }

  prepare(sql) {
    return new StatementWrapper(this.rawDb, sql);
  }

  exec(sql) {
    const res = this.rawDb.exec(sql);
    debouncedSave();
    return res;
  }

  save() {
    saveToDisk();
  }

  // Runs fn inside BEGIN/COMMIT; rolls back every write if fn throws.
  transaction(fn) {
    this.rawDb.exec('BEGIN');
    try {
      const result = fn();
      this.rawDb.exec('COMMIT');
      debouncedSave();
      return result;
    } catch (err) {
      this.rawDb.exec('ROLLBACK');
      throw err;
    }
  }
}

const dbManager = new DatabaseManager();

async function initDatabase() {
  if (db) return dbManager;

  sqlInstance = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    try {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new sqlInstance.Database(fileBuffer);
    } catch (e) {
      console.warn('Could not read existing database, creating fresh one:', e.message);
      db = new sqlInstance.Database();
    }
  } else {
    db = new sqlInstance.Database();
  }

  // Set foreign keys
  db.run('PRAGMA foreign_keys = ON;');
  dbManager.setDatabase(db);
  return dbManager;
}

module.exports = {
  db: dbManager,
  initDatabase,
  saveToDisk
};
