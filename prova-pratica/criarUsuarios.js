const bcrypt = require('bcrypt');
const db = require('./banco.js');

async function criarUsuariosDeTeste() {
    const usuarios = [
        { usuario: 'diego', senha: '1234' },
        { usuario: 'aluno', senha: 'senha' },
    ];

    const buscar = db.prepare('SELECT id FROM usuarios WHERE usuario = ?');
    const inserir = db.prepare(
        'INSERT INTO usuarios (usuario, senha_hash) VALUES (?, ?)'
    );

    for (const u of usuarios) {
        // se rodar duas vezes, nao tenta criar de novo
        if (buscar.get(u.usuario) !== undefined) {
            console.log(`${u.usuario} ja existe, pulando.`);
            continue;
        }
        const hash = await bcrypt.hash(u.senha, 10);
        inserir.run(u.usuario, hash);
        console.log(`${u.usuario} criado com hash.`);
    }
}

criarUsuariosDeTeste()
    .then(() => console.log('Usuarios de teste prontos.'))
    .catch((erro) => {
        console.error('Nao foi possivel criar usuarios:', erro);
        process.exitCode = 1;
    });
