const db = require('../banco.js');

// usado so pelo login: precisa do senha_hash
function buscarPorUsuario(usuario) {
    return db
        .prepare('SELECT * FROM usuarios WHERE usuario = ?')
        .get(usuario);
}

// usado nas respostas publicas: nunca devolve o hash
function buscarPorId(id) {
    return db
        .prepare('SELECT id, usuario FROM usuarios WHERE id = ?')
        .get(id);
}

function inserir(usuario, senhaHash) {
    const resultado = db
        .prepare('INSERT INTO usuarios (usuario, senha_hash) VALUES (?, ?)')
        .run(usuario, senhaHash);
    return Number(resultado.lastInsertRowid);
}

module.exports = { buscarPorUsuario, buscarPorId, inserir };
