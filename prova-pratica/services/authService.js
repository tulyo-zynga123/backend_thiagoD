const bcrypt = require('bcrypt');
const repository = require('../repositories/usuariosRepository.js');

async function login(usuario, senha) {
    const encontrado = repository.buscarPorUsuario(usuario);

    if (encontrado === undefined) {
        return { invalido: true };
    }

    const confere = await bcrypt.compare(
        senha,
        encontrado.senha_hash
    );

    if (!confere) {
        return { invalido: true };
    }

    return {
        usuario: {
            id: encontrado.id,
            usuario: encontrado.usuario
        }
    };
}

// card A
async function cadastrar(usuario, senha) {
    if (usuario === '' || senha.length < 4) {
        return { erro: 'Usuario e obrigatorio e a senha precisa de 4 ou mais caracteres.' };
    }

    // o hash (que espera) vem ANTES da conferencia. Entre conferir se o
    // usuario existe e gravar nao pode ter nenhum await: se tivesse, dois
    // cadastros iguais ao mesmo tempo passariam pela conferencia e o segundo
    // INSERT quebraria no UNIQUE.
    const hash = await bcrypt.hash(senha, 10);

    if (repository.buscarPorUsuario(usuario) !== undefined) {
        return { existe: true };
    }

    const id = repository.inserir(usuario, hash);
    return { usuario: { id: id, usuario: usuario } };
}

module.exports = { login, cadastrar };
