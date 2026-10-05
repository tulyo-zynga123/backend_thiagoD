# Aula 04: camadas, controller, service e repository

Nenhuma rota nova hoje. O trabalho é reorganizar o `servidor.js`: hoje cada
rota faz três coisas ao mesmo tempo (lê o `req`, valida a regra, fala com o
banco). Vamos separar isso em três arquivos, cada um com um papel só. O
comportamento da API no fim da aula tem que ser idêntico ao de hoje de manhã:
mesmas rotas, mesmos status, mesmas mensagens de erro.

## Antes de mexer no código

```
git add .
git commit -m "meu trabalho antes da aula 04"
git pull
```

Não tem gabarito de emergência hoje. Se as suas cinco rotas da Aula 03 estão
funcionando, mesmo que tudo junto no `servidor.js`, você já tem o que precisa.

## As três camadas

- **Controller**: recebe o `req`, chama o Service, devolve o `res` com o
  status certo. É o único que conhece HTTP.
- **Service**: decide as regras (o que é um treino válido). Não sabe que
  existe `req`, `res` ou status HTTP.
- **Repository**: conversa com o banco. Não sabe nada de regra de negócio, só
  sabe ler e escrever linhas.

```
REQUISICAO                                            RESPOSTA
    |                                                     ^
    v                                                     |
CONTROLLER  -->  SERVICE  -->  REPOSITORY  -->  BANCO
 (HTTP)          (regra)        (SQL)          (SQLite)
```

A seta só vai num sentido: o Controller chama o Service, o Service chama o
Repository. Nunca o contrário. O Repository não sabe que o Service existe, e
o Service não sabe que existe um `req.body`.

## 1. banco.js: a conexão com o banco ganha um arquivo só dela

Na Aula 03 a conexão e o `CREATE TABLE` ficavam no topo do `servidor.js`.
Agora quem vai falar com o banco é o Repository, então a conexão precisa sair
do `servidor.js` e morar num arquivo que o Repository consiga importar.

Crie `banco.js` na raiz do projeto (ao lado do `servidor.js`) e **mova pra
ele** o que estava no topo do `servidor.js`: a linha do `new DatabaseSync` e o
`db.exec` com o `CREATE TABLE`:

```js
const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync('treinos.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS treinos (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        nome    TEXT    NOT NULL,
        duracao INTEGER NOT NULL
    )
`);

module.exports = db;
```

A última linha é a que importa: `module.exports = db` entrega o banco já
conectado para quem fizer `require('./banco.js')`. Em C seria como o `.h` que
expõe a variável pra outros arquivos. Quem quiser usar o banco pede o `db` a
esse arquivo, e a conexão e a criação da tabela acontecem uma vez só.

**Confira antes de seguir.** Crie um arquivo avulso `teste-banco2.js`:

```js
const db = require('./banco.js');

console.log(db.prepare('SELECT * FROM treinos').all());
```

Rode com `node teste-banco2.js`. Se aparecer a lista (ou `[]` se estiver
vazia), o `banco.js` está certo. Se der `Cannot find module`, o arquivo está
na pasta errada ou com o nome errado.

## 2. Repository: o único arquivo que conhece SQL

Crie `repositories/treinosRepository.js`:

```js
const db = require('../banco.js');

function listarTodos() {
    return db.prepare('SELECT * FROM treinos').all();
}

function buscarPorId(id) {
    return db.prepare('SELECT * FROM treinos WHERE id = ?').get(id);
}

function criar(nome, duracao) {
    const resultado = db
        .prepare('INSERT INTO treinos (nome, duracao) VALUES (?, ?)')
        .run(nome, duracao);
    return buscarPorId(resultado.lastInsertRowid);
}

function atualizar(id, nome, duracao) {
    db.prepare('UPDATE treinos SET nome = ?, duracao = ? WHERE id = ?')
      .run(nome, duracao, id);
    return buscarPorId(id);
}

function remover(id) {
    const resultado = db.prepare('DELETE FROM treinos WHERE id = ?').run(id);
    return resultado.changes > 0;
}

module.exports = { listarTodos, buscarPorId, criar, atualizar, remover };
```

Repare: nenhuma linha tem `req`, `res` ou `if (erro)`. Só dado puro.

## 3. Service: onde mora a regra de negócio

Crie `services/treinosService.js`:

```js
const repository = require('../repositories/treinosRepository.js');

function validarTreino(corpo) {
    if (typeof corpo.nome !== 'string' || corpo.nome.trim() === '') {
        return 'O campo nome e obrigatorio e deve ser um texto.';
    }
    if (typeof corpo.duracao !== 'number' || corpo.duracao <= 0) {
        return 'O campo duracao e obrigatorio e deve ser um numero maior que zero.';
    }
    return null;
}

function listarTodos() {
    return repository.listarTodos();
}

function buscarPorId(id) {
    return repository.buscarPorId(id);
}

function criarTreino(corpo) {
    const erro = validarTreino(corpo);
    if (erro !== null) return { erro: erro };
    const novo = repository.criar(corpo.nome, corpo.duracao);
    return { treino: novo };
}

function atualizarTreino(id, corpo) {
    const existente = repository.buscarPorId(id);
    if (existente === undefined) return { naoEncontrado: true };
    const erro = validarTreino(corpo);
    if (erro !== null) return { erro: erro };
    const atualizado = repository.atualizar(id, corpo.nome, corpo.duracao);
    return { treino: atualizado };
}

function removerTreino(id) {
    const existente = repository.buscarPorId(id);
    if (existente === undefined) return { naoEncontrado: true };
    repository.remover(id);
    return { removido: true };
}

module.exports = {
    listarTodos,
    buscarPorId,
    criarTreino,
    atualizarTreino,
    removerTreino,
};
```

O Service não tem `res`, então não pode responder `400` sozinho. Ele devolve
um objeto simples (`{ erro }`, `{ naoEncontrado: true }` ou `{ treino }`) e é
o Controller quem traduz isso em status HTTP.

## 4. Controller: o único arquivo que conhece HTTP

Crie `controllers/treinosController.js`:

```js
const service = require('../services/treinosService.js');

function listar(req, res) {
    res.status(200).json(service.listarTodos());
}

function buscarUm(req, res) {
    const id = Number(req.params.id);
    const treino = service.buscarPorId(id);
    if (treino === undefined) {
        return res.status(404).json({ erro: 'Treino nao encontrado.' });
    }
    res.status(200).json(treino);
}

function criar(req, res) {
    const resultado = service.criarTreino(req.body);
    if (resultado.erro !== undefined) {
        return res.status(400).json({ erro: resultado.erro });
    }
    res.status(201).json(resultado.treino);
}

function atualizar(req, res) {
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

function remover(req, res) {
    const id = Number(req.params.id);
    const resultado = service.removerTreino(id);
    if (resultado.naoEncontrado === true) {
        return res.status(404).json({ erro: 'Treino nao encontrado.' });
    }
    res.status(204).end();
}

module.exports = { listar, buscarUm, criar, atualizar, remover };
```

O Controller não sabe o que faz um treino ser válido, só pergunta ao Service
e traduz a resposta.

## 5. servidor.js emagrece

```js
const express = require('express');
const controller = require('./controllers/treinosController.js');

const app = express();
app.use(express.json());

app.get('/treinos', controller.listar);
app.get('/treinos/:id', controller.buscarUm);
app.post('/treinos', controller.criar);
app.put('/treinos/:id', controller.atualizar);
app.delete('/treinos/:id', controller.remover);

const PORTA = 3000;
app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
```

Apague do `servidor.js` tudo que virou responsabilidade de outra camada: a
conexão direta com o `db` e o `CREATE TABLE` (agora no `banco.js`), a função
`validarTreino` antiga e o corpo das cinco rotas.

## Como fazer, na ordem

1. Crie o `banco.js` (passo 1) e confira com o `teste-banco2.js`.
2. Crie as pastas `repositories/`, `services/` e `controllers/`.
3. Crie o Repository. Rode `npm start`: nada muda ainda, porque ninguém usa
   esse arquivo.
4. Crie o Service.
5. Crie o Controller.
6. Troque o `servidor.js` pela versão enxuta e apague o código antigo,
   inclusive a conexão com o banco, que agora está no `banco.js`.
7. Rode todos os blocos do `testes.http`. Tem que responder exatamente igual
   à Aula 03.

Erro mais comum: caminho de `require` errado. De dentro de `services/` ou
`controllers/`, o `../` sobe uma pasta antes de descer para outra
(`../repositories/treinosRepository.js`).

## Exercícios

**Os dois valem nota.** Não são desafio bônus nem opcional: pra tirar a nota
cheia da entrega da Aula 04 precisa entregar os dois funcionando.

1. **Prove que o Service não depende do Express.** Crie um arquivo avulso
   `teste-service.js`, fora de qualquer rota:

   ```js
   const service = require('./services/treinosService.js');

   console.log(service.listarTodos());
   console.log(service.criarTreino({ nome: 'Teste sem servidor', duracao: 15 }));
   console.log(service.criarTreino({ nome: '', duracao: 15 }));
   ```

   Rode com `node teste-service.js`, sem rodar `npm start` antes. Se os três
   `console.log` funcionarem, a regra de negócio roda sem servidor HTTP no ar.

2. **Uma regra nova, na camada certa.** Nenhum treino pode ter duração maior
   que 180 minutos. Implemente isso só em `treinosService.js`, dentro de
   `validarTreino`, e confirme que o `teste-service.js` e o `testes.http`
   continuam passando sem tocar no Controller nem no Repository.

## Entrega

```
echo "04" > AULA
git add .
git commit -m "aula04 - camadas: controller, service e repository"
git push
```

O semáforo roda os testes da Aula 02 e da Aula 03 de novo. Se a organização
em pastas não mudou o comportamento da API, eles continuam verdes. Vermelho
na Aula 04 quase sempre significa que uma resposta saiu diferente do que era,
não que a pasta esteja no lugar errado.
