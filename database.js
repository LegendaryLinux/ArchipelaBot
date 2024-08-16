const config = require('./config.json');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(config.sqliteFile || ':memory:');

module.exports = {
  dbInit: async () => {
    const tableQueries = [
      `
      CREATE TABLE IF NOT EXISTS readySystems (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        guildId VARCHAR(128) NOT NULL,
        channelId VARCHAR(128) NOT NULL,
        userId VARCHAR(128) NOT NULL,
        UNIQUE (guildId, channelId)
      )
      `,
      `
      CREATE TABLE IF NOT EXISTS readyChecks (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        readySystemId INTEGER NOT NULL,
        userId VARCHAR(128) NOT NULL,
        isReady INTEGER NOT NULL DEFAULT 0,
        UNIQUE (readySystemId, userId)
      )
      `
    ];
    for (let query of tableQueries) {
      await module.exports.dbExecute(query);
    }
  },

  // Execute a query on the database
  dbExecute: (sql, params=[]) => new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      // Reject on errors, provide the error
      if (err) { return reject(err); }

      // Execution is complete
      resolve();
    });
  }),

  dbQueryOne: (sql, params=[]) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      // Reject on errors, provide the error
      if (err) { return reject(err); }

      // Send back the row object
      resolve(row || null);
    });
  }),

  dbQueryAll: (sql, params=[]) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      // Reject on errors, provide the error
      if (err) { return reject(err); }

      // Send back the rows array
      resolve((rows.length === 0) ? null : rows);
    });
  }),
};