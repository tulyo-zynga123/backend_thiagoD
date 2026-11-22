const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync('treinos.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS treinos (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        nome      TEXT    NOT NULL,
        duracao   INTEGER NOT NULL,
        concluido INTEGER NOT NULL DEFAULT 0
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario    TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL
    )
`);

module.exports = db;
