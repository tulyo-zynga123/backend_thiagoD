import { useEffect, useState } from 'react';
import { chamar } from './api.js';
import Login from './Login.jsx';
import Treinos from './Treinos.jsx';
import Diagnostico from './Diagnostico.jsx';

export default function App() {
  // undefined = ainda perguntando ao servidor, null = ninguem logado
  const [usuario, setUsuario] = useState(undefined);
  const [apiForaDoAr, setApiForaDoAr] = useState(false);
  const [aba, setAba] = useState('treinos');

  useEffect(() => {
    async function descobrirSessao() {
      try {
        const r = await chamar('GET', '/perfil');
        setUsuario(r.status === 200 ? r.dados : null);
      } catch {
        setApiForaDoAr(true);
        setUsuario(null);
      }
    }
    descobrirSessao();
  }, []);

  async function sair() {
    await chamar('POST', '/logout');
    setUsuario(null);
  }

  return (
    <div className="pagina">
      <header className="topo">
        <h1>Diário de Treinos</h1>
        {usuario && (
          <div className="sessao">
            <span>Olá, {usuario.usuario}</span>
            <button className="secundario" onClick={sair}>
              Sair
            </button>
          </div>
        )}
      </header>

      {apiForaDoAr && (
        <p className="mensagem-erro" role="alert">
          Não consegui falar com a API. Confira se o servidor está rodando
          (<code>npm start</code>) e se você abriu <code>localhost:3000</code>.
        </p>
      )}

      <nav className="abas" role="tablist">
        <button
          className="aba"
          role="tab"
          aria-selected={aba === 'treinos'}
          onClick={() => setAba('treinos')}
        >
          Treinos
        </button>
        <button
          className="aba"
          role="tab"
          aria-selected={aba === 'diagnostico'}
          onClick={() => setAba('diagnostico')}
        >
          Diagnóstico
        </button>
      </nav>

      {aba === 'treinos' && usuario === undefined && (
        <p className="suave">Carregando...</p>
      )}

      {aba === 'treinos' && usuario === null && (
        <Login onEntrar={setUsuario} />
      )}

      {aba === 'treinos' && usuario && (
        <Treinos onSessaoExpirada={() => setUsuario(null)} />
      )}

      {aba === 'diagnostico' && <Diagnostico usuario={usuario} />}
    </div>
  );
}
