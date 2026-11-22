import { useEffect, useState } from 'react';
import { chamar } from './api.js';

// Cada teste devolve { ok: true | false, detalhe: 'texto' }.
// Os testes SEM login usam credenciais 'omit' (nao mandam o cookie), assim
// o resultado nao depende de voce estar logado na outra aba.

// Confere o status e se a resposta veio como JSON.
// Quando a rota nao existe o Express responde 404 em HTML.
function conferir(r, statusEsperado, rota) {
  if (!r.json && r.status === 404) {
    return { ok: false, detalhe: `${rota}: a rota nao existe (404 em HTML)` };
  }
  if (r.status !== statusEsperado) {
    const msg = r.dados && r.dados.erro ? ` (${r.dados.erro})` : '';
    return {
      ok: false,
      detalhe: `${rota}: esperado ${statusEsperado}, veio ${r.status}${msg}`,
    };
  }
  return { ok: true, detalhe: `${rota}: ${r.status} como esperado` };
}

function montarCards() {
  const SEM = 'omit';
  const COM = 'same-origin';

  return [
    {
      id: 'A',
      titulo: 'Cadastro de usuário',
      rota: 'POST /cadastro',
      testes: [
        {
          nome: 'Usuário vazio ou senha curta devolvem 400',
          rodar: async () => {
            const a = await chamar('POST', '/cadastro', { usuario: '', senha: '1234' }, SEM);
            const ra = conferir(a, 400, 'usuario vazio');
            if (!ra.ok) return ra;
            const b = await chamar('POST', '/cadastro', { usuario: 'diagnostico', senha: '12' }, SEM);
            return conferir(b, 400, 'senha com 2 caracteres');
          },
        },
        {
          nome: 'Cadastro novo devolve 201 sem mostrar a senha',
          rodar: async () => {
            const r = await chamar(
              'POST', '/cadastro',
              { usuario: 'diagnostico', senha: 'diagnostico1' }, SEM
            );
            // o usuario "diagnostico" fica no banco depois da primeira
            // rodada; nas seguintes o normal e vir 409
            if (r.status === 409 && r.json) {
              return { ok: true, detalhe: 'usuario diagnostico ja existia (409)' };
            }
            const c = conferir(r, 201, 'POST /cadastro');
            if (!c.ok) return c;
            const chaves = Object.keys(r.dados);
            if (chaves.includes('senha') || chaves.includes('senha_hash')) {
              return { ok: false, detalhe: 'a resposta do cadastro nao pode trazer a senha nem o hash' };
            }
            if (typeof r.dados.id !== 'number' || r.dados.usuario !== 'diagnostico') {
              return { ok: false, detalhe: 'a resposta deveria ter id e usuario' };
            }
            return { ok: true, detalhe: '201 com id e usuario, sem senha' };
          },
        },
        {
          nome: 'Usuário repetido devolve 409',
          rodar: async () => {
            const r = await chamar(
              'POST', '/cadastro',
              { usuario: 'diagnostico', senha: 'diagnostico1' }, SEM
            );
            return conferir(r, 409, 'cadastro repetido');
          },
        },
        {
          nome: 'Dá para entrar com o usuário cadastrado (o hash foi gravado certo)',
          rodar: async () => {
            const r = await chamar(
              'POST', '/login',
              { usuario: 'diagnostico', senha: 'diagnostico1' }, SEM
            );
            return conferir(r, 200, 'POST /login do usuario novo');
          },
        },
      ],
    },
    {
      id: 'B',
      titulo: 'PUT e DELETE exigem login',
      rota: 'PUT e DELETE /treinos/:id',
      testes: [
        {
          nome: 'PUT sem login devolve 401',
          rodar: async () => {
            const r = await chamar('PUT', '/treinos/999999', { nome: 'x', duracao: 10 }, SEM);
            return conferir(r, 401, 'PUT sem cookie');
          },
        },
        {
          nome: 'DELETE sem login devolve 401',
          rodar: async () => {
            const r = await chamar('DELETE', '/treinos/999999', undefined, SEM);
            return conferir(r, 401, 'DELETE sem cookie');
          },
        },
        {
          nome: 'Com login, treino que não existe continua dando 404',
          precisaLogin: true,
          rodar: async () => {
            const r = await chamar('PUT', '/treinos/999999', { nome: 'x', duracao: 10 }, COM);
            return conferir(r, 404, 'PUT com cookie');
          },
        },
      ],
    },
    {
      id: 'C',
      titulo: 'Id inválido devolve 400',
      rota: 'GET, PUT e DELETE /treinos/:id',
      testes: [
        {
          nome: 'GET com id abc, -1, 0 e 1.5 devolve 400',
          rodar: async () => {
            for (const id of ['abc', '-1', '0', '1.5']) {
              const r = await chamar('GET', `/treinos/${id}`, undefined, SEM);
              const c = conferir(r, 400, `GET /treinos/${id}`);
              if (!c.ok) return c;
            }
            return { ok: true, detalhe: 'abc, -1, 0 e 1.5 devolveram 400' };
          },
        },
        {
          nome: 'PUT e DELETE com id abc devolvem 400',
          precisaLogin: true,
          rodar: async () => {
            const p = await chamar('PUT', '/treinos/abc', { nome: 'x', duracao: 10 }, COM);
            const cp = conferir(p, 400, 'PUT /treinos/abc');
            if (!cp.ok) return cp;
            const d = await chamar('DELETE', '/treinos/abc', undefined, COM);
            return conferir(d, 400, 'DELETE /treinos/abc');
          },
        },
      ],
    },
    {
      id: 'D',
      titulo: 'Concluir treino',
      rota: 'PUT /treinos/:id/concluir',
      testes: [
        {
          nome: 'Treino que não existe devolve 404 em JSON',
          rodar: async () => {
            const r = await chamar('PUT', '/treinos/999999/concluir', undefined, SEM);
            return conferir(r, 404, 'concluir inexistente');
          },
        },
        {
          nome: 'Cria um treino, conclui e confere (e apaga depois)',
          precisaLogin: true,
          rodar: async () => {
            const novo = await chamar('POST', '/treinos', { nome: 'Diagnostico', duracao: 5 }, COM);
            const cn = conferir(novo, 201, 'POST /treinos');
            if (!cn.ok) return cn;
            const id = novo.dados.id;

            let resultado;
            const r = await chamar('PUT', `/treinos/${id}/concluir`, undefined, COM);
            const cr = conferir(r, 200, 'PUT concluir');
            if (!cr.ok) {
              resultado = cr;
            } else if (!r.dados.concluido) {
              resultado = { ok: false, detalhe: 'a resposta deveria ter concluido verdadeiro' };
            } else {
              const g = await chamar('GET', `/treinos/${id}`, undefined, COM);
              if (g.status === 200 && g.dados.concluido) {
                resultado = { ok: true, detalhe: 'concluido ficou gravado no banco' };
              } else {
                resultado = { ok: false, detalhe: 'o GET seguinte nao mostra o treino concluido' };
              }
            }

            await chamar('DELETE', `/treinos/${id}`, undefined, COM);
            return resultado;
          },
        },
      ],
    },
    {
      id: 'E',
      titulo: 'Total de treinos',
      rota: 'GET /treinos/total',
      testes: [
        {
          nome: 'Devolve 200 com { total: número }',
          rodar: async () => {
            const r = await chamar('GET', '/treinos/total', undefined, SEM);
            const c = conferir(r, 200, 'GET /treinos/total');
            if (!c.ok) return c;
            if (typeof r.dados.total !== 'number') {
              return { ok: false, detalhe: 'o campo total deveria ser um numero' };
            }
            return { ok: true, detalhe: `total = ${r.dados.total}` };
          },
        },
        {
          nome: 'O total bate com o tamanho da lista',
          rodar: async () => {
            const t = await chamar('GET', '/treinos/total', undefined, SEM);
            const l = await chamar('GET', '/treinos', undefined, SEM);
            if (t.status !== 200 || l.status !== 200) {
              return { ok: false, detalhe: 'GET /treinos/total ou GET /treinos falhou' };
            }
            if (t.dados.total !== l.dados.length) {
              return {
                ok: false,
                detalhe: `total diz ${t.dados.total}, mas a lista tem ${l.dados.length}`,
              };
            }
            return { ok: true, detalhe: 'total e lista batem' };
          },
        },
      ],
    },
  ];
}

// Junta o resultado dos testes de um card em verde, amarelo ou vermelho.
function situacaoDoCard(resultados) {
  if (resultados.some((r) => r && r.ok === false)) return 'vermelho';
  if (resultados.some((r) => r && r.ok === null)) return 'amarelo';
  if (resultados.every((r) => r && r.ok === true)) return 'verde';
  return 'cinza';
}

const ROTULO = {
  verde: 'Verde',
  amarelo: 'Falta testar com login',
  vermelho: 'Vermelho',
  cinza: 'Aguardando',
};

export default function Diagnostico({ usuario }) {
  const cards = montarCards();
  const [resultados, setResultados] = useState({});
  const [rodando, setRodando] = useState(false);

  async function rodarTudo() {
    setRodando(true);
    const novo = {};
    for (const card of cards) {
      novo[card.id] = [];
      for (const teste of card.testes) {
        let resultado;
        if (teste.precisaLogin && !usuario) {
          resultado = { ok: null, detalhe: 'entre na aba Treinos para rodar este teste' };
        } else {
          try {
            resultado = await teste.rodar();
          } catch {
            resultado = { ok: false, detalhe: 'nao consegui falar com a API' };
          }
        }
        novo[card.id].push(resultado);
      }
      setResultados({ ...novo });
    }
    setRodando(false);
  }

  useEffect(() => {
    rodarTudo();
  }, []);

  return (
    <>
      <section className="cartao">
        <h2>Diagnóstico da API</h2>
        <p className="suave">
          Cada card confere uma rota que a tela espera. Vermelho quer dizer que
          a rota ainda não existe ou responde diferente do combinado.
          {!usuario && ' Você não está logado: os testes que precisam de sessão ficam amarelos.'}
        </p>
        <button onClick={rodarTudo} disabled={rodando}>
          {rodando ? 'Rodando...' : 'Rodar de novo'}
        </button>
      </section>

      {cards.map((card) => {
        const lista = resultados[card.id] ?? [];
        const situacao =
          lista.length === card.testes.length ? situacaoDoCard(lista) : 'cinza';

        return (
          <section className={`cartao card-diag ${situacao}`} key={card.id}>
            <header>
              <h2>
                Card {card.id}: {card.titulo}
              </h2>
              <span className={`status ${situacao}`}>
                {situacao === 'verde' && '✔ '}
                {situacao === 'vermelho' && '✘ '}
                {ROTULO[situacao]}
              </span>
            </header>
            <span className="suave">
              <code>{card.rota}</code>
            </span>

            <ul className="testes">
              {card.testes.map((teste, i) => {
                const r = lista[i];
                let marca = '…';
                if (r) marca = r.ok === true ? '✔' : r.ok === false ? '✘' : '•';
                return (
                  <li key={teste.nome}>
                    {marca} {teste.nome}
                    {r && <div className="suave">{r.detalhe}</div>}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}
