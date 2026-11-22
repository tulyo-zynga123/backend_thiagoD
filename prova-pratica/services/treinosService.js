const repository = require('../repositories/treinosRepository.js');

function validarTreino(corpo) {
    if (typeof corpo.nome !== 'string' || corpo.nome.trim() === '') {
        return 'O campo nome e obrigatorio e deve ser um texto.';
    }
    if (typeof corpo.duracao !== 'number' || corpo.duracao <= 0) {
        return 'O campo duracao e obrigatorio e deve ser um numero maior que zero.';
    }
    if (corpo.duracao > 180) {
        return 'A duracao maxima de um treino e 180 minutos.';
    }
    return null;
}

// card C: o id da URL chega como texto. So vale inteiro positivo "puro".
// Number('1e2') da 100 e Number('0x10') da 16, entao tambem conferimos
// que o numero escrito de volta e igual ao texto que chegou.
function idValido(texto) {
    const n = Number(texto);
    return Number.isSafeInteger(n) && n > 0 && String(n) === texto;
}

// o SQLite guarda concluido como 0 ou 1; a API devolve true ou false
function comoTreino(linha) {
    if (linha === undefined) {
        return undefined;
    }
    return { ...linha, concluido: linha.concluido === 1 };
}

function listarTodos() {
    return repository.listarTodos().map(comoTreino);
}

function buscarPorId(id) {
    return comoTreino(repository.buscarPorId(id));
}

function criarTreino(corpo) {
    const erro = validarTreino(corpo);
    if (erro !== null) {
        return { erro: erro };
    }
    const novo = repository.criar(corpo.nome.trim(), corpo.duracao);
    return { treino: comoTreino(novo) };
}

function atualizarTreino(id, corpo) {
    const existente = repository.buscarPorId(id);
    if (existente === undefined) {
        return { naoEncontrado: true };
    }
    const erro = validarTreino(corpo);
    if (erro !== null) {
        return { erro: erro };
    }
    const atualizado = repository.atualizar(id, corpo.nome.trim(), corpo.duracao);
    return { treino: comoTreino(atualizado) };
}

function removerTreino(id) {
    const existente = repository.buscarPorId(id);
    if (existente === undefined) {
        return { naoEncontrado: true };
    }
    repository.remover(id);
    return { removido: true };
}

// card D
function concluirTreino(id) {
    const existente = repository.buscarPorId(id);
    if (existente === undefined) {
        return { naoEncontrado: true };
    }
    return { treino: comoTreino(repository.concluir(id)) };
}

// card E
function total() {
    return repository.total();
}

module.exports = {
    validarTreino,
    idValido,
    listarTodos,
    buscarPorId,
    criarTreino,
    atualizarTreino,
    removerTreino,
    concluirTreino,
    total,
};
