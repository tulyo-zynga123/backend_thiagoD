// ============================================================
// API do Diario de Treinos
// Back-End I - CEEP Pedro Boaretto Neto
// ============================================================
// Este arquivo esta quase vazio DE PROPOSITO.
// Hoje voce vai escrever as rotas, uma de cada vez, conferindo
// no testes.http se cada uma responde o status certo.
// O que cada rota deve fazer esta no README.md.
// ============================================================

const express = require('express');
const app = express();

// Faz o Express entender JSON no corpo das requisicoes
app.use(express.json());

// ------------------------------------------------------------
// Os dados moram aqui, na memoria. Somem quando o servidor cai.
// (Na Aula 03 isso vira banco de dados.)
// ------------------------------------------------------------
const treinos = [];
let proximoId = 1;

// ------------------------------------------------------------
// Validacao
// Escreva a funcao validarTreino(corpo), que devolve a mensagem
// de erro quando algo esta errado, ou null quando esta tudo certo.
// ------------------------------------------------------------

function validarTreino(corpo) {
    if(typeof corpo.nome !== 'string' || corpo.nome == '') {
        return "O campo nome eh obrigatorio e deve ser um texto"
    }
    
    if(typeof corpo.duracao !== 'number' || corpo.duracao <= 0) {
        return "o campo duracao eh obrigatorio e deve ser um numero maior que zero"
    }
    return null;
}

// ------------------------------------------------------------
// GET /treinos - lista todos os treinos
// ------------------------------------------------------------

app.get('/treinos', (req, res) => {
    res.status(200).json(treinos);
})

// ------------------------------------------------------------
// GET /treinos/:id - busca um treino pelo id (404 se nao existir)
// ------------------------------------------------------------

app.get('/treinos/:id', (req, res) => {
    const id = Number(req.params.id);
    const treino = treinos.find((t) => t.id === id);

    if(!treino) {
        return res.status(404).json({ erro : 'Treino não encontrado.' });
    }

    res.status(200).json(treino);
})

// ------------------------------------------------------------
// POST /treinos - cria um treino (400 se os dados forem invalidos)
// ------------------------------------------------------------

app.post('/treinos',  (req, res) => {
    const erro = validarTreino(req.body);
    
    if(erro!==null) {
        return res.status(400).json( { erro: erro } );
    }

    const treino = {
        id : proximoId,
        nome : req.body.nome,
        duracao : req.body.duracao
    };

    proximoId = proximoId+1;

    treinos.push(treino);
    res.status(201).json(treino);
});

// ------------------------------------------------------------
// PUT /treinos/:id - substitui um treino
// ------------------------------------------------------------


app.put('/treinos/:id', (req,res) => {
    const id = Number(req.params.id);
    const treino = treinos.find((t) => t.id === id);
    if(treino === undefined) {
        return res.status(404).json({ erro : 'Treino não encontrado' });
    }

    const erro = validarTreino(req.body);
    
    if(erro !== null) {
        return res.status(400).json({ erro : erro})
    }

    treino.nome = req.body.nome;
    treino.duracao = req.body.duracao;

    res.status(200).json(treino)
})

// ------------------------------------------------------------
// DELETE /treinos/:id - remove um treino
// ------------------------------------------------------------

app.delete ('/treinos/:id', (req,res) => {
    const id=Number(req.params.id);

    const pos = treinos.findIndex((t) => t.id === id);

    if(pos === -1) {
        return res.status(404).json({ erro : 'Treino não encontrado.' });
    }
    treinos.splice(pos, 1);

    res.status(204).send();
});

// ------------------------------------------------------------
const PORTA = 3000;
app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
