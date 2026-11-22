# Prova prática: do Figma ao link

Vale **1,0 ponto** do 1º momento. Individual. Back-End I, 2C.

A API do Diário de Treinos (a mesma das aulas, com SQLite, camadas, login e
cookie) já está pronta aqui dentro. Você vai construir a **tela em React** que
conversa com ela, com a **aparência do seu Figma**, e entregar tudo rodando em
`localhost:3000`, servido pelo próprio Express (sem CORS, porque tela e API
ficam no mesmo endereço).

O que você precisa saber vem do que foi visto em Inovação até a Aula 06:
componentes, props, `useState`, eventos, renderização condicional, listas com
`map` e `key`, formulário controlado, validação e Vite. A parte de `useEffect`
e `fetch` (semanas 7 e 8) **já vem pronta**: leia, entenda o caminho e não
precisa mexer.

## Preparando (uma vez)

Coloque esta pasta dentro do seu repositório `api-treinos` com o nome
`prova-pratica`. Pare o servidor das aulas se ele estiver rodando (a porta 3000
é a mesma). No terminal, dentro de `prova-pratica`:

```bash
npm install
node criarUsuarios.js
cd web
npm install
npm run build
cd ..
npm start
```

Abra `http://localhost:3000`. Aparece o aviso "Falta o build" até o primeiro
`npm run build` terminar. Entre com `diego` / `1234`.

**Nunca copie a pasta `node_modules` de um computador para outro.** O `bcrypt`
quebra. Sempre `npm install` na máquina onde vai rodar.

### Trabalhando com atualização ao vivo

Em vez de rodar o build a cada mudança, use dois terminais:

```bash
npm start                  # terminal 1, na pasta prova-pratica (API na 3000)
cd web && npm run dev      # terminal 2 (tela na 5173, chamando a API na 3000)
```

Abra `http://localhost:5173`. No fim, rode `npm run build` dentro de `web/` e
confira em `localhost:3000`, que é onde vale.

## Onde fica cada coisa

```
servidor.js, banco.js, sessoes.js   API (pronta, não mexa)
controllers/ services/ repositories/  as camadas da API (prontas)
public/                              o build da tela (gerado, vai no commit)
web/src/
  tokens.css        TAREFA 1
  Login.jsx         TAREFAS 2 e 3
  CartaoTreino.jsx  TAREFA 4
  Treinos.jsx       TAREFAS 5, 6, 7 e 8
  api.js, App.jsx, Diagnostico.jsx, estilo.css, main.jsx   prontos
```

Procure por `TAREFA` nos arquivos: cada uma tem o enunciado em comentário.

## As tarefas

| # | O que fazer | Arquivo |
|---|-------------|---------|
| 1 | Trocar os valores de `tokens.css` pelos do **seu Figma** (cores, raio, fonte, espaçamento). Não mude os nomes das variáveis. | `tokens.css` |
| 2 | Deixar os campos de usuário e senha **controlados** (`value` + `onChange`). | `Login.jsx` |
| 3 | Validar antes de chamar a API: usuário não vazio (com `trim()`) e senha com 4+ caracteres. | `Login.jsx` |
| 4 | Escrever o componente que desenha **um treino**, recebendo `treino`, `onConcluir` e `onApagar` por props. Selo "concluído" e botão Concluir são condicionais. | `CartaoTreino.jsx` |
| 5 | Deixar os campos do formulário "Novo treino" controlados. | `Treinos.jsx` |
| 6 | Validar o formulário: nome não vazio e duração inteira de 1 a 180. | `Treinos.jsx` |
| 7 | Mostrar "Nenhum treino ainda. Cadastre o primeiro acima." quando não carregando e sem treinos. | `Treinos.jsx` |
| 8 | Desenhar a lista com `map`, um `CartaoTreino` por treino, com `key`. | `Treinos.jsx` |

Uma pegadilha para a 4: o SQLite guarda `concluido` como `0` ou `1`. Em
`{treino.concluido && ...}`, o valor `0` aparece escrito na tela. Pense em como
evitar isso.

## Como conferir

A aba **Diagnóstico** da tela faz chamadas de verdade à API e mostra cinco
cards em verde, amarelo ou vermelho. Ela existe para você enxergar o caminho
completo: tela, `fetch`, rota, camadas, SQLite. Com a API intacta, os cards
devem ficar verdes (amarelo significa "precisa estar logado"). Se algum ficar
vermelho, o problema é da API ou do servidor, não da sua tela: confira se você
mexeu em algum arquivo fora de `web/src`.

## Entrega

1. **Um commit por tarefa**, com o seu usuário do GitHub e mensagem no
   formato `tarefa 4: componente CartaoTreino`. É por eles que o professor vê
   a sua autoria.
2. Rode `npm run build` dentro de `web/` e **faça commit do `public/`** (o
   professor roda sem precisar gerar o build).
3. O `.gitignore` já ignora `node_modules/` e `*.db`. Não tire isso.
4. Envie o link do repositório.

## Avaliação (1,0)

| Parte | Valor |
|-------|-------|
| Tarefa 1: Figma aplicado e coerente com o seu protótipo | 0,15 |
| Tarefa 2: campos controlados no Login | 0,10 |
| Tarefa 3: validação do Login | 0,10 |
| Tarefa 4: `CartaoTreino` com props e condicionais | 0,15 |
| Tarefa 5: campos controlados no formulário | 0,05 |
| Tarefa 6: validação do formulário | 0,10 |
| Tarefa 7: estado vazio | 0,05 |
| Tarefa 8: lista com `map` e `key` | 0,10 |
| Arguição curta com o professor (explicar o fluxo de um clique) | 0,20 |

Autoria é pelos commits. Na arguição você precisa conseguir mostrar, no seu
código, o caminho de um clique em **Concluir** até o banco de dados, passando
por cada arquivo.
