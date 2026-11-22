const service = require('../services/treinosService.js');
const { usuarioDaRequisicao } = require('./authController.js');

function listar(req, res) {
    const treinos = service.listarTodos();
    res.status(200).json(treinos);
}

// card E (a rota /treinos/total precisa vir ANTES da /treinos/:id no servidor.js)
function total(req, res) {
    res.status(200).json({ total: service.total() });
}

function buscarUm(req, res) {
    if (!service.idValido(req.params.id)) {
        return res.status(400).json({ erro: 'Id invalido.' });
    }
    const id = Number(req.params.id);
    const treino = service.buscarPorId(id);

    if (treino === undefined) {
        return res.status(404).json({ erro: 'Treino nao encontrado.' });
    }
    res.status(200).json(treino);
}

function criar(req, res) {
    if (usuarioDaRequisicao(req) === null) {
        return res.status(401).json({ erro: 'Faca login primeiro.' });
    }

    const resultado = service.criarTreino(req.body);

    if (resultado.erro !== undefined) {
        return res.status(400).json({ erro: resultado.erro });
    }
    res.status(201).json(resultado.treino);
}

// card B (login) e card C (id invalido)
function atualizar(req, res) {
    if (usuarioDaRequisicao(req) === null) {
        return res.status(401).json({ erro: 'Faca login primeiro.' });
    }
    if (!service.idValido(req.params.id)) {
        return res.status(400).json({ erro: 'Id invalido.' });
    }
    const id = Number(req.params.id);
    const resultado = service.atualizarTreino(id, req.body);

    if (resultado.naoEncontrado === true) {
        return res.status(404).json({ erro: 'Treino nao encontrado.' });
    }
    if (resultado.erro !== undefined) {
        return res.status(400).json({ erro: resultado.erro });
    }
    res.status(200).json(resultado.treino);
}

// card B (login) e card C (id invalido)
function remover(req, res) {
    if (usuarioDaRequisicao(req) === null) {
        return res.status(401).json({ erro: 'Faca login primeiro.' });
    }
    if (!service.idValido(req.params.id)) {
        return res.status(400).json({ erro: 'Id invalido.' });
    }
    const id = Number(req.params.id);
    const resultado = service.removerTreino(id);

    if (resultado.naoEncontrado === true) {
        return res.status(404).json({ erro: 'Treino nao encontrado.' });
    }
    res.status(204).end();
}

// card D
function concluir(req, res) {
    if (!service.idValido(req.params.id)) {
        return res.status(400).json({ erro: 'Id invalido.' });
    }
    const id = Number(req.params.id);
    const resultado = service.concluirTreino(id);

    if (resultado.naoEncontrado === true) {
        return res.status(404).json({ erro: 'Treino nao encontrado.' });
    }
    res.status(200).json(resultado.treino);
}

module.exports = { listar, total, buscarUm, criar, atualizar, remover, concluir };
