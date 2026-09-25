const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('treinos.db');
db.exec(`
CREATE TABLE IF NOT EXISTS treinos (
id INTEGER PRIMARY KEY AUTOINCREMENT,
nome TEXT NOT NULL,
duracao INTEGER NOT NULL

5

)
`);
db.prepare('INSERT INTO treinos (nome, duracao) VALUES (?, ?)')
.run('Teste de banco', 10);
console.log(db.prepare('SELECT * FROM treinos').all());