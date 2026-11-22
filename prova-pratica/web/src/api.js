// Uma funcao so para falar com a API.
// Devolve sempre { status, json, dados }:
//   status: o numero HTTP (200, 401, 404...)
//   json:   true se a resposta veio como JSON. Quando a rota NAO existe, o
//           Express responde 404 em HTML, entao json fica false e a tela
//           sabe que o problema e rota faltando, nao "treino nao achado".
//   dados:  o corpo ja convertido (ou null)
//
// credenciais: 'same-origin' manda o cookie sid (padrao da tela);
//              'omit' manda a requisicao SEM cookie (usado no Diagnostico).
export async function chamar(metodo, caminho, corpo, credenciais = 'same-origin') {
  const opcoes = { method: metodo, headers: {}, credentials: credenciais };

  if (corpo !== undefined) {
    opcoes.headers['Content-Type'] = 'application/json';
    opcoes.body = JSON.stringify(corpo);
  }

  const resposta = await fetch(caminho, opcoes);
  const tipo = resposta.headers.get('content-type') ?? '';
  const json = tipo.includes('application/json');

  let dados = null;
  if (json) {
    dados = await resposta.json();
  }

  return { status: resposta.status, json: json, dados: dados };
}

// Texto de erro amigavel a partir de uma resposta que nao deu certo.
export function mensagemDeErro(r, rotaEsperada) {
  if (!r.json && r.status === 404) {
    return `A rota ${rotaEsperada} ainda nao existe na API.`;
  }
  if (r.dados && r.dados.erro) {
    return r.dados.erro;
  }
  return `Erro ${r.status}.`;
}
