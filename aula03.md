# Aula 03: o banco dentro da API

Nesta aula o array sai e o banco entra. As cinco rotas continuam as mesmas,
com os mesmos status e as mesmas mensagens de erro. Muda só de onde os dados
vêm. E o ganho do dia: os treinos param de sumir quando o servidor reinicia.

Tudo acontece no mesmo `servidor.js`. Não crie arquivo novo e não crie pasta
nova.

## Antes de mexer no código

```
git add .
git commit -m "meu trabalho antes da aula 03"
git pull
```

Se a sua Aula 02 não estava fechada, guarde a sua tentativa e comece da base
pronta:

```
cp servidor.js servidor-minha-tentativa-aula02.js
curl -o servidor.js https://raw.githubusercontent.com/Srdiegoibs/backend-i-referencia/main/servidor02.js
```

Sua tentativa fica salva no repositório com outro nome, e a nota da Aula 02
não muda.

## Aquecimento: o banco funcionando sozinho

Antes de mexer na API, garanta que o banco funciona. Crie um arquivo avulso
`teste-banco.js`:

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

db.prepare('INSERT INTO treinos (nome, duracao) VALUES (?, ?)')
  .run('Teste de banco', 10);

console.log(db.prepare('SELECT * FROM treinos').all());
```

Rode com `node teste-banco.js`. Se a lista aparecer no terminal, está tudo
certo.

- Apoio 1: rode duas vezes e veja que aparece mais um treino. O dado ficou salvo.
- Apoio 2: depois de migrar a API, crie treinos pelo `testes.http` e rode o
  `teste-banco.js` de novo. Os treinos criados pela API aparecem ali, porque é
  o mesmo arquivo de banco visto de dois lugares.
- Apoio 3: quebre de propósito. Troque `nome` por `nomee` num `SELECT` e leia
  a mensagem de erro do SQLite. É assim que o erro aparece quando você escreve
  um nome de coluna errado.

## A migração, na ordem

1. No topo do `servidor.js`: conectar no banco e criar a tabela. Apagar o
   `const treinos = []` e o `let proximoId`. Quem gera o id agora é o banco,
   com `AUTOINCREMENT`.
2. `GET /treinos`: `SELECT * FROM treinos` com `.all()`.
3. `POST /treinos`: `INSERT` com `.run()`, e devolver o treino usando o
   `lastInsertRowid`. A validação continua igual.
4. `GET /treinos/:id`: `SELECT ... WHERE id = ?` com `.get()`, mantendo o 404.
5. `PUT /treinos/:id`: `UPDATE ... WHERE id = ?`, mantendo o 404 e o 400.
6. `DELETE /treinos/:id`: `DELETE ... WHERE id = ?`, mantendo o 404 e o 204.

Teste cada rota no `testes.http` antes de ir para a próxima.

## A regra mais importante da aula

Nunca monte SQL com crase:

```js
// NUNCA
db.prepare(`SELECT * FROM treinos WHERE id = ${id}`).get();

// SEMPRE
db.prepare('SELECT * FROM treinos WHERE id = ?').get(id);
```

Com a crase, quem chama a API consegue escrever SQL junto com o valor. Um id
como `1 OR 1=1` traz a tabela inteira, e num DELETE apaga tudo. Com o `?`, o
banco trata o valor como dado, nunca como comando. Isso se chama SQL injection.

## A prova de que funcionou

1. Crie dois ou três treinos com POST.
2. Pare o servidor com Ctrl + C.
3. Suba de novo com `npm start`.
4. Faça `GET /treinos`.

Os treinos continuam lá. Antes eles sumiam, porque viviam num array na
memória. Agora estão no `treinos.db`.

O arquivo `treinos.db` é da sua máquina e não vai para o GitHub, porque o
`.gitignore` já ignora `*.db`. O que a gente versiona é o código.

## Exercícios

Os três primeiros são os mesmos desafios da Aula 02, agora com banco. Compare
os dois jeitos: a rota é a mesma, muda quem faz o trabalho de buscar.

1. Contagem (era `treinos.length`): `GET /treinos/total` respondendo
   `{ "total": 3 }`, com `SELECT COUNT(*) AS total`. Atenção: essa rota precisa
   ser declarada antes do `GET /treinos/:id`, senão o Express entende que
   `total` é um id.
2. Filtro (era `treinos.filter`): `GET /treinos?minimo=40` devolvendo só os
   treinos com duração maior ou igual ao valor, com `WHERE duracao >= ?`. Sem o
   parâmetro, devolve todos.
3. Ordenação (era `treinos.sort`): a listagem sai da maior para a menor
   duração, com `ORDER BY`.

Para quem terminou tudo:

4. Busca por nome: `GET /treinos?busca=peito` com `WHERE nome LIKE ?`. O `%`
   vai no valor que você passa, nunca dentro do SQL.
5. Resumo: `GET /treinos/resumo` devolvendo
   `{ "total": 4, "minutos": 210, "media": 52.5 }`, com `COUNT`, `SUM` e `AVG`
   numa consulta só. Também precisa vir antes do `/treinos/:id`.
6. Id inválido: hoje `GET /treinos/abc` responde 404. Pense: o treino não
   existe, ou o pedido está errado? Faça responder 400 quando o id não for um
   número inteiro, e continuar 404 quando for um número que não existe.

## Entrega

```
echo "03" > AULA
git add .
git commit -m "aula03 - banco de dados"
git push
```

Depois do push, olhe a cor do semáforo ao lado do commit aqui no GitHub. Ele
roda os testes da Aula 02 e os da Aula 03, ou seja, confere se você trocou a
fonte dos dados sem quebrar o contrato. Sem push não existe entrega.

## Dois avisos

- Não copie código do PDF. Ele insere espaço dentro das rotas (`'/ treinos '`)
  e troca as aspas por aspas curvas, e foi isso que zerou a maioria na Aula 02.
  Digite, ou copie deste arquivo.
- `UPDATE` e `DELETE` sem `WHERE` mexem na tabela inteira. Sempre
  `WHERE id = ?`.
