/* =====================================================================
   Diagnostico.jsx
   ---------------------------------------------------------------------
   O QUE ESTE ARQUIVO FAZ:

   Este e o painel de diagnostico da API. Quando voce abre a aba
   "Diagnostico", o componente dispara uma bateria de pedidos HTTP
   contra a API local (localhost:3000) e confere se cada rota respondeu
   o que a gente combinou com o professor.

   PRA CADA ROTA TESTADA, o painel mostra:

       [OK]  nome do teste
             -> o que foi enviado, o que se esperava e o que voltou

   Codigos:
       [OK]  = passou (status da resposta bateu com o esperado)
       [X]   = falhou (rota nao existe, ou respondeu com status errado)
       [?]   = nao deu pra testar (precisa estar logado na aba Treinos)
       [ ]   = ainda nao rodou

   Resumo no cabecalho de cada card:
       PASSOU       = todos os testes passaram
       FALHOU       = pelo menos um teste falhou
       falta login  = tem teste que precisa de sessao (faz login e roda de novo)
       aguardando   = ainda nao rodou

   ONDE ESTA A LOGICA DOS TESTES:
   tudo dentro de rodarTudo(), abaixo. Cada bloco //A, //B, //C...
   corresponde a um card. Cada if/else e um teste. Fica facil de ler e
   de achar onde quebrou.

   AVISO:
   - Os testes A fazem POST /cadastro e deixam o usuario "diagnostico"
     no banco. Se voce resetar o banco, eles rodam do zero de novo.
   - Os testes D criam um treino e apagam no final (a nao ser que falhem
     no meio, ai fica lixo — nao e critico, so apaga na mao).

   COMO RODAR:
   abre a aba. Se algo der errado, clica em "Rodar tudo de novo".
   ===================================================================== */

import { useEffect, useState } from 'react';
import { chamar } from './api.js';

// ---------------------------------------------------------------------
// Utilitarios
// ---------------------------------------------------------------------

// Corta o JSON em ~90 chars pra caber na tela sem quebrar o layout.
function mostra(x) {
  var s;
  try {
    s = JSON.stringify(x);
  } catch (e) {
    s = String(x);
  }
  if (s === undefined) return '(sem corpo)';
  if (s.length > 90) return s.slice(0, 87) + '...';
  return s;
}

// Monta a descricao do pedido: "POST /cadastro mandando {...}"
function fiz(metodo, caminho, corpo) {
  var s = metodo + ' ' + caminho;
  if (corpo !== undefined) s += ' mandando ' + mostra(corpo);
  return s;
}

// Cor do card a partir dos resultados ja coletados.
// 'cinza' = ainda nao rodou, 'vermelho' = tem erro,
// 'amarelo' = tem teste esperando login, 'verde' = tudo ok.
function corDaLista(lista) {
  if (!lista || lista.length === 0) return 'cinza';
  var temFalta = false, temErro = false, temPendente = false;
  for (var i = 0; i < lista.length; i++) {
    if (!lista[i]) { temFalta = true; continue; }
    if (lista[i].ok === false) temErro = true;
    else if (lista[i].ok === null) temPendente = true;
  }
  if (temFalta) return 'cinza';
  if (temErro) return 'vermelho';
  if (temPendente) return 'amarelo';
  return 'verde';
}

function rotuloDaLista(lista) {
  var c = corDaLista(lista);
  if (c === 'cinza')    return 'aguardando';
  if (c === 'vermelho') return 'FALHOU';
  if (c === 'amarelo')  return 'falta login';
  return 'PASSOU';
}

function marca(lista, i) {
  if (!lista || !lista[i]) return '[ ]';
  var ok = lista[i].ok;
  if (ok === true) return '[OK]';
  if (ok === false) return '[X]';
  return '[?]';
}

function detalheDe(lista, i) {
  if (!lista || !lista[i]) return null;
  return <div className="suave">{lista[i].detalhe}</div>;
}


// ---------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------

export default function Diagnostico({ usuario }) {
  var [r, setR] = useState({});
  var [rodando, setRodando] = useState(false);

  async function rodarTudo() {
    setRodando(true);
    console.log('[diagnostico] comecando bateria de testes...');
    var n = {};
    var SEM = 'omit';           // nao manda cookie (independe de estar logado)
    var COM = 'same-origin';    // manda cookie (precisa de login)

    // =================================================================
    // CARD A - Cadastro de usuario
    // Rotas: POST /cadastro, POST /login
    // =================================================================
    n.A = [];
    try {
      // A.1 - cadastro com usuario vazio tem que dar 400
      var a1 = await chamar('POST', '/cadastro', { usuario: '', senha: '1234' }, SEM);
      if (a1.status !== 400) {
        n.A.push({ ok: false, detalhe: fiz('POST', '/cadastro', { usuario: '', senha: '1234' }) + '. Esperava 400. Veio ' + a1.status + ' com ' + mostra(a1.dados) });
      } else {
        n.A.push({ ok: true, detalhe: fiz('POST', '/cadastro', { usuario: '', senha: '1234' }) + '. Veio 400. Ok.' });
      }

      // A.2 - senha com 2 chars tem que dar 400
      var a2 = await chamar('POST', '/cadastro', { usuario: 'diagnostico', senha: '12' }, SEM);
      if (a2.status !== 400) {
        n.A.push({ ok: false, detalhe: fiz('POST', '/cadastro', { usuario: 'diagnostico', senha: '12' }) + '. Esperava 400. Veio ' + a2.status + ' com ' + mostra(a2.dados) });
      } else {
        n.A.push({ ok: true, detalhe: fiz('POST', '/cadastro', { usuario: 'diagnostico', senha: '12' }) + '. Veio 400. Ok.' });
      }

      // A.3 - cadastro novo: 201, sem senha e sem hash na resposta
      var a3 = await chamar('POST', '/cadastro', { usuario: 'diagnostico', senha: 'diagnostico1' }, SEM);
      if (a3.status === 409) {
        n.A.push({ ok: true, detalhe: fiz('POST', '/cadastro', { usuario: 'diagnostico', senha: 'diagnostico1' }) + '. Ja existia (409). Ok.' });
      } else if (a3.status !== 201) {
        n.A.push({ ok: false, detalhe: fiz('POST', '/cadastro', { usuario: 'diagnostico', senha: 'diagnostico1' }) + '. Esperava 201 ou 409. Veio ' + a3.status + ' com ' + mostra(a3.dados) });
      } else if (a3.dados && ('senha' in a3.dados || 'senha_hash' in a3.dados)) {
        n.A.push({ ok: false, detalhe: fiz('POST', '/cadastro', { usuario: 'diagnostico', senha: 'diagnostico1' }) + '. Veio 201 mas a RESPOSTA TEM senha/hash. Resposta: ' + mostra(a3.dados) });
      } else if (!a3.dados || typeof a3.dados.id !== 'number') {
        n.A.push({ ok: false, detalhe: fiz('POST', '/cadastro', { usuario: 'diagnostico', senha: 'diagnostico1' }) + '. Veio 201 mas sem campo id numerico. Resposta: ' + mostra(a3.dados) });
      } else {
        n.A.push({ ok: true, detalhe: fiz('POST', '/cadastro', { usuario: 'diagnostico', senha: 'diagnostico1' }) + '. Veio 201 com id=' + a3.dados.id + ', sem senha. Ok.' });
      }

      // A.4 - cadastro repetido tem que dar 409
      var a4 = await chamar('POST', '/cadastro', { usuario: 'diagnostico', senha: 'diagnostico1' }, SEM);
      if (a4.status !== 409) {
        n.A.push({ ok: false, detalhe: fiz('POST', '/cadastro', { usuario: 'diagnostico', senha: 'diagnostico1' }) + ' de novo. Esperava 409. Veio ' + a4.status + ' com ' + mostra(a4.dados) });
      } else {
        n.A.push({ ok: true, detalhe: fiz('POST', '/cadastro', { usuario: 'diagnostico', senha: 'diagnostico1' }) + ' de novo. Veio 409. Ok.' });
      }

      // A.5 - login com o usuario cadastrado tem que dar 200
      var a5 = await chamar('POST', '/login', { usuario: 'diagnostico', senha: 'diagnostico1' }, SEM);
      if (a5.status !== 200) {
        n.A.push({ ok: false, detalhe: fiz('POST', '/login', { usuario: 'diagnostico', senha: 'diagnostico1' }) + '. Esperava 200. Veio ' + a5.status + ' com ' + mostra(a5.dados) });
      } else {
        n.A.push({ ok: true, detalhe: fiz('POST', '/login', { usuario: 'diagnostico', senha: 'diagnostico1' }) + '. Veio 200. Ok.' });
      }
    } catch (e) {
      console.log('[diagnostico] erro no card A:', e);
      n.A.push({ ok: false, detalhe: 'Deu erro ao falar com a API: ' + (e && e.message ? e.message : String(e)) });
    }
    setR({ ...n });
    console.log('[diagnostico] card A:', n.A);

    // =================================================================
    // CARD B - PUT e DELETE exigem login
    // Rotas: PUT /treinos/:id, DELETE /treinos/:id
    // =================================================================
    n.B = [];
    try {
      // B.1 - PUT sem cookie tem que dar 401
      var b1 = await chamar('PUT', '/treinos/999999', { nome: 'x', duracao: 10 }, SEM);
      if (b1.status !== 401) {
        n.B.push({ ok: false, detalhe: fiz('PUT', '/treinos/999999', { nome: 'x', duracao: 10 }) + ' SEM cookie. Esperava 401. Veio ' + b1.status + ' com ' + mostra(b1.dados) });
      } else {
        n.B.push({ ok: true, detalhe: fiz('PUT', '/treinos/999999', { nome: 'x', duracao: 10 }) + ' SEM cookie. Veio 401. Ok.' });
      }

      // B.2 - DELETE sem cookie tem que dar 401
      var b2 = await chamar('DELETE', '/treinos/999999', undefined, SEM);
      if (b2.status !== 401) {
        n.B.push({ ok: false, detalhe: fiz('DELETE', '/treinos/999999') + ' SEM cookie. Esperava 401. Veio ' + b2.status + ' com ' + mostra(b2.dados) });
      } else {
        n.B.push({ ok: true, detalhe: fiz('DELETE', '/treinos/999999') + ' SEM cookie. Veio 401. Ok.' });
      }

      // B.3 - PUT com cookie em id que nao existe tem que dar 404
      if (!usuario) {
        n.B.push({ ok: null, detalhe: 'nao deu pra testar PUT logado: faz login na aba Treinos e clica "Rodar tudo de novo".' });
      } else {
        var b3 = await chamar('PUT', '/treinos/999999', { nome: 'x', duracao: 10 }, COM);
        if (b3.status !== 404) {
          n.B.push({ ok: false, detalhe: fiz('PUT', '/treinos/999999', { nome: 'x', duracao: 10 }) + ' COM cookie. Esperava 404 (id nao existe). Veio ' + b3.status + ' com ' + mostra(b3.dados) });
        } else {
          n.B.push({ ok: true, detalhe: fiz('PUT', '/treinos/999999', { nome: 'x', duracao: 10 }) + ' COM cookie. Veio 404 (id nao existe). Ok.' });
        }
      }
    } catch (e) {
      console.log('[diagnostico] erro no card B:', e);
      n.B.push({ ok: false, detalhe: 'Deu erro ao falar com a API: ' + (e && e.message ? e.message : String(e)) });
    }
    setR({ ...n });
    console.log('[diagnostico] card B:', n.B);

    // =================================================================
    // CARD C - Id invalido tem que dar 400
    // Rotas: GET, PUT e DELETE /treinos/:id
    // =================================================================
    n.C = [];
    try {
      // C.1 - GET com ids invalidos
      var idsInvalidos = ['abc', '-1', '0', '1.5'];
      var cFalhouEm = null;
      for (var k = 0; k < idsInvalidos.length; k++) {
        var idAtual = idsInvalidos[k];
        var c1 = await chamar('GET', '/treinos/' + idAtual, undefined, SEM);
        if (c1.status !== 400) {
          cFalhouEm = { id: idAtual, r: c1 };
          break;
        }
      }
      if (cFalhouEm) {
        n.C.push({ ok: false, detalhe: fiz('GET', '/treinos/' + cFalhouEm.id) + '. Esperava 400 (id invalido). Veio ' + cFalhouEm.r.status + ' com ' + mostra(cFalhouEm.r.dados) });
      } else {
        n.C.push({ ok: true, detalhe: 'Mandei GET /treinos/abc, /treinos/-1, /treinos/0 e /treinos/1.5. Todos deram 400. Ok.' });
      }

      // C.2 - PUT e DELETE com id invalido
      if (!usuario) {
        n.C.push({ ok: null, detalhe: 'nao deu pra testar PUT/DELETE com id invalido: faz login na aba Treinos.' });
      } else {
        var c2 = await chamar('PUT', '/treinos/abc', { nome: 'x', duracao: 10 }, COM);
        if (c2.status !== 400) {
          n.C.push({ ok: false, detalhe: fiz('PUT', '/treinos/abc', { nome: 'x', duracao: 10 }) + '. Esperava 400. Veio ' + c2.status + ' com ' + mostra(c2.dados) });
        } else {
          var c3 = await chamar('DELETE', '/treinos/abc', undefined, COM);
          if (c3.status !== 400) {
            n.C.push({ ok: false, detalhe: fiz('DELETE', '/treinos/abc') + '. Esperava 400. Veio ' + c3.status + ' com ' + mostra(c3.dados) });
          } else {
            n.C.push({ ok: true, detalhe: 'PUT e DELETE /treinos/abc. Os dois deram 400. Ok.' });
          }
        }
      }
    } catch (e) {
      console.log('[diagnostico] erro no card C:', e);
      n.C.push({ ok: false, detalhe: 'Deu erro ao falar com a API: ' + (e && e.message ? e.message : String(e)) });
    }
    setR({ ...n });
    console.log('[diagnostico] card C:', n.C);

    // =================================================================
    // CARD D - Concluir treino
    // Rota: PUT /treinos/:id/concluir
    // =================================================================
    n.D = [];
    try {
      // D.1 - concluir id inexistente tem que dar 404
      var d1 = await chamar('PUT', '/treinos/999999/concluir', undefined, SEM);
      if (d1.status !== 404) {
        n.D.push({ ok: false, detalhe: fiz('PUT', '/treinos/999999/concluir') + '. Esperava 404. Veio ' + d1.status + ' com ' + mostra(d1.dados) });
      } else {
        n.D.push({ ok: true, detalhe: fiz('PUT', '/treinos/999999/concluir') + '. Veio 404. Ok.' });
      }

      // D.2 - cria, conclui, confere e apaga
      if (!usuario) {
        n.D.push({ ok: null, detalhe: 'nao deu pra testar conclusao completa: faz login na aba Treinos.' });
      } else {
        var dNovo = await chamar('POST', '/treinos', { nome: 'Diagnostico', duracao: 5 }, COM);
        if (dNovo.status !== 201) {
          n.D.push({ ok: false, detalhe: fiz('POST', '/treinos', { nome: 'Diagnostico', duracao: 5 }) + '. Esperava 201. Veio ' + dNovo.status + ' com ' + mostra(dNovo.dados) });
        } else {
          var idNovo = dNovo.dados.id;
          var d2 = await chamar('PUT', '/treinos/' + idNovo + '/concluir', undefined, COM);
          if (d2.status !== 200) {
            n.D.push({ ok: false, detalhe: fiz('PUT', '/treinos/' + idNovo + '/concluir') + '. Esperava 200. Veio ' + d2.status + ' com ' + mostra(d2.dados) });
          } else if (!d2.dados || !d2.dados.concluido) {
            n.D.push({ ok: false, detalhe: fiz('PUT', '/treinos/' + idNovo + '/concluir') + '. Veio 200 mas a resposta NAO tem concluido=true. Resposta: ' + mostra(d2.dados) });
          } else {
            var d3 = await chamar('GET', '/treinos/' + idNovo, undefined, COM);
            if (d3.status !== 200) {
              n.D.push({ ok: false, detalhe: 'Depois de concluir, fiz GET /treinos/' + idNovo + '. Esperava 200. Veio ' + d3.status + ' com ' + mostra(d3.dados) });
            } else if (!d3.dados || !d3.dados.concluido) {
              n.D.push({ ok: false, detalhe: 'Depois de concluir, fiz GET /treinos/' + idNovo + ' e veio concluido=' + (d3.dados && d3.dados.concluido) + '. Nao gravou no banco. Resposta: ' + mostra(d3.dados) });
            } else {
              n.D.push({ ok: true, detalhe: 'Criei treino id=' + idNovo + ', conclui (200), GET confirma concluido=true. Ok.' });
            }
          }
          // limpa o treino de teste
          await chamar('DELETE', '/treinos/' + idNovo, undefined, COM);
        }
      }
    } catch (e) {
      console.log('[diagnostico] erro no card D:', e);
      n.D.push({ ok: false, detalhe: 'Deu erro ao falar com a API: ' + (e && e.message ? e.message : String(e)) });
    }
    setR({ ...n });
    console.log('[diagnostico] card D:', n.D);

    // =================================================================
    // CARD E - Total de treinos
    // Rota: GET /treinos/total
    // =================================================================
    n.E = [];
    try {
      // E.1 - /treinos/total tem que dar 200 com {total: numero}
      var e1 = await chamar('GET', '/treinos/total', undefined, SEM);
      if (e1.status !== 200) {
        n.E.push({ ok: false, detalhe: fiz('GET', '/treinos/total') + '. Esperava 200. Veio ' + e1.status + ' com ' + mostra(e1.dados) });
      } else if (!e1.dados || typeof e1.dados.total !== 'number') {
        n.E.push({ ok: false, detalhe: fiz('GET', '/treinos/total') + '. Veio 200 mas o campo total NAO e numero. Resposta: ' + mostra(e1.dados) });
      } else {
        n.E.push({ ok: true, detalhe: fiz('GET', '/treinos/total') + '. Veio 200 com total=' + e1.dados.total + '. Ok.' });
      }

      // E.2 - total tem que bater com o tamanho da lista
      var e2t = await chamar('GET', '/treinos/total', undefined, SEM);
      var e2l = await chamar('GET', '/treinos', undefined, SEM);
      if (e2t.status !== 200 || e2l.status !== 200) {
        n.E.push({ ok: false, detalhe: 'Fiz GET /treinos/total (veio ' + e2t.status + ') e GET /treinos (veio ' + e2l.status + '). Um dos dois falhou.' });
      } else if (!Array.isArray(e2l.dados)) {
        n.E.push({ ok: false, detalhe: 'Fiz GET /treinos mas a resposta NAO e uma lista. Veio: ' + mostra(e2l.dados) });
      } else if (e2t.dados.total !== e2l.dados.length) {
        n.E.push({ ok: false, detalhe: 'total diz ' + e2t.dados.total + ' mas a lista tem ' + e2l.dados.length + ' itens. Nao bateu.' });
      } else {
        n.E.push({ ok: true, detalhe: 'total=' + e2t.dados.total + ' == lista.length=' + e2l.dados.length + '. Ok.' });
      }
    } catch (e) {
      console.log('[diagnostico] erro no card E:', e);
      n.E.push({ ok: false, detalhe: 'Deu erro ao falar com a API: ' + (e && e.message ? e.message : String(e)) });
    }
    setR({ ...n });
    console.log('[diagnostico] card E:', n.E);

    console.log('[diagnostico] bateria terminou.');
    setRodando(false);
  }

  useEffect(function () { rodarTudo(); }, []);

  // -----------------------------------------------------------------
  // Renderizacao
  // -----------------------------------------------------------------
  return (
    <>
      <section className="cartao">
        <h2>Diagnostico da API</h2>
        <p className="suave">
          Cada card abaixo faz pedidos HTTP pra API e confere se a resposta
          bate com o que foi combinado. Embaixo de cada teste aparece o
          detalhe: o que foi enviado, o que se esperava e o que voltou.
          Vermelho = rota errada ou inexistente. Amarelo = falta login.
          {!usuario && ' Voce nao esta logado agora: os testes que precisam de sessao ficam amarelos ate voce entrar na aba Treinos.'}
        </p>
        <button onClick={rodarTudo} disabled={rodando}>
          {rodando ? 'Rodando, aguarde...' : 'Rodar tudo de novo'}
        </button>
      </section>

      {/* ============ CARD A ============ */}
      <section className={'cartao card-diag ' + corDaLista(r.A)}>
        <header>
          <h2>Card A - Cadastro de usuario</h2>
          <span className={'status ' + corDaLista(r.A)}>{rotuloDaLista(r.A)}</span>
        </header>
        <span className="suave"><code>POST /cadastro</code> e <code>POST /login</code></span>
        <ul className="testes">
          <li>{marca(r.A, 0)} Usuario vazio devolve 400 {detalheDe(r.A, 0)}</li>
          <li>{marca(r.A, 1)} Senha com 2 caracteres devolve 400 {detalheDe(r.A, 1)}</li>
          <li>{marca(r.A, 2)} Cadastro novo devolve 201 sem mostrar senha/hash {detalheDe(r.A, 2)}</li>
          <li>{marca(r.A, 3)} Cadastro repetido devolve 409 {detalheDe(r.A, 3)}</li>
          <li>{marca(r.A, 4)} Login com o usuario recem-cadastrado funciona {detalheDe(r.A, 4)}</li>
        </ul>
      </section>

      {/* ============ CARD B ============ */}
      <section className={'cartao card-diag ' + corDaLista(r.B)}>
        <header>
          <h2>Card B - PUT e DELETE exigem login</h2>
          <span className={'status ' + corDaLista(r.B)}>{rotuloDaLista(r.B)}</span>
        </header>
        <span className="suave"><code>PUT /treinos/:id</code> e <code>DELETE /treinos/:id</code></span>
        <ul className="testes">
          <li>{marca(r.B, 0)} PUT sem login devolve 401 {detalheDe(r.B, 0)}</li>
          <li>{marca(r.B, 1)} DELETE sem login devolve 401 {detalheDe(r.B, 1)}</li>
          <li>{marca(r.B, 2)} Com login, id inexistente continua dando 404 {detalheDe(r.B, 2)}</li>
        </ul>
      </section>

      {/* ============ CARD C ============ */}
      <section className={'cartao card-diag ' + corDaLista(r.C)}>
        <header>
          <h2>Card C - Id invalido devolve 400</h2>
          <span className={'status ' + corDaLista(r.C)}>{rotuloDaLista(r.C)}</span>
        </header>
        <span className="suave"><code>GET, PUT e DELETE /treinos/:id</code></span>
        <ul className="testes">
          <li>{marca(r.C, 0)} GET com id abc, -1, 0 e 1.5 devolve 400 {detalheDe(r.C, 0)}</li>
          <li>{marca(r.C, 1)} PUT e DELETE com id abc devolvem 400 {detalheDe(r.C, 1)}</li>
        </ul>
      </section>

      {/* ============ CARD D ============ */}
      <section className={'cartao card-diag ' + corDaLista(r.D)}>
        <header>
          <h2>Card D - Concluir treino</h2>
          <span className={'status ' + corDaLista(r.D)}>{rotuloDaLista(r.D)}</span>
        </header>
        <span className="suave"><code>PUT /treinos/:id/concluir</code></span>
        <ul className="testes">
          <li>{marca(r.D, 0)} Concluir id inexistente devolve 404 em JSON {detalheDe(r.D, 0)}</li>
          <li>{marca(r.D, 1)} Cria, conclui, GET confirma e apaga no final {detalheDe(r.D, 1)}</li>
        </ul>
      </section>

      {/* ============ CARD E ============ */}
      <section className={'cartao card-diag ' + corDaLista(r.E)}>
        <header>
          <h2>Card E - Total de treinos</h2>
          <span className={'status ' + corDaLista(r.E)}>{rotuloDaLista(r.E)}</span>
        </header>
        <span className="suave"><code>GET /treinos/total</code></span>
        <ul className="testes">
          <li>{marca(r.E, 0)} Devolve 200 com {`{total: numero}`} {detalheDe(r.E, 0)}</li>
          <li>{marca(r.E, 1)} total bate com o tamanho da lista {detalheDe(r.E, 1)}</li>
        </ul>
      </section>
    </>
  );
}