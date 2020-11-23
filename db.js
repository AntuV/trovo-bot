const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const utils = require("./common/utils");
const dbPath = path.resolve(__dirname, "data.db");

const upgradeSchema = async (version) => {
  if (version < 1) {
    await db.run("CREATE TABLE config(key TEXT, value TEXT)");

    const initialConfig = {
      'trovo.user': '',
      'trovo.email': '',
      'trovo.password': '',
      pointsname: 'Gold Coins',
      debug: false,
      owner: 'AntuV'
    };

    const keys = Object.keys(initialConfig);
    for (let i = 0; i < keys.length; i++) {
      const value = initialConfig[keys[i]];
      await db.run('INSERT INTO config(key, value) VALUES (?, ?)', [keys[i], JSON.stringify(value)]);
    }

    await db.run("CREATE TABLE cooldowns(username TEXT, command TEXT, expiration TEXT)");
    await db.run("CREATE TABLE mods(username TEXT)");
    await db.run("CREATE TABLE points(username TEXT UNIQUE, displayname TEXT, quantity INT)");

    await db.run("UPDATE schema_version SET version = 1");
  }

  if (version < 2) {
    await db.run("CREATE TABLE commands(command TEXT, content TEXT, times INT)");
    await db.run("UPDATE schema_version SET version = 2");
  }

  db.all('SELECT * FROM mods').then(m => {
    utils.mods = m;
  });
}

const db = {
  raw: new sqlite3.Database(dbPath, async (err) => {
    let initialized = null;
    try {
      initialized = await db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version';"
      );
    } catch (err) {
      //
    }

    if (!initialized) {
      await db.run("CREATE TABLE schema_version(version int)");
      await db.run("INSERT INTO schema_version(version) VALUES (0)");
    }

    const schema = await db.get("SELECT version FROM schema_version");

    upgradeSchema(schema.version);
  }),
  run: (query, params) => {
    if (params === undefined) {
      params = [];
    }

    return new Promise((resolve, reject) => {
      db.raw.run(query, params, (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  },
  get: (query, params) => {
    if (params === undefined) {
      params = [];
    }

    return new Promise((resolve, reject) => {
      db.raw.get(query, params, (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(row);
      });
    });
  },
  all: (query, params) => {
    if (params === undefined) {
      params = [];
    }

    return new Promise((resolve, reject) => {
      db.raw.all(query, params, (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(row);
      });
    });
  },
  getNextId: async (tableName) => {
    try {
      const row = await db.get(`SELECT MAX(id) as lastId FROM ${tableName}`);
      if (!row) {
        return 1;
      }

      return row.lastId + 1;
    } catch (err) {
      console.error(err);
      return 1;
    }
  }
};

module.exports = db;
