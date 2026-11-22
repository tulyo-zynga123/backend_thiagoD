const { randomUUID } = require('node:crypto');

const sessoes = new Map();   // token -> id do usuario

function criar(usuarioId) {
    const token = randomUUID();
    sessoes.set(token, usuarioId);
    return token;
}

function usuarioIdDaSessao(token) {
    return sessoes.get(token);
}

function encerrar(token) {
    sessoes.delete(token);
}

module.exports = { criar, usuarioIdDaSessao, encerrar };
