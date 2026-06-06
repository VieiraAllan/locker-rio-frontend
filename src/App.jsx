import { useEffect, useState } from 'react';

import LoginPage from './pages/LoginPage';
import LockersPage from './pages/LockersPage';
import LocacoesAtivasPage from './pages/LocacoesAtivasPage';
import HistoricoPage from './pages/HistoricoPage';
import RelatoriosPage from './pages/RelatoriosPage';
import UsuariosPage from './pages/UsuariosPage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';

import Toast from './components/Toast';
import useToast from './hooks/useToast';

import {
  paginas,
  podeAcessarPagina
} from './config/permissoes';

function App() {
  const { toast, showToast, clearToast } = useToast();

  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(paginas.PAINEL);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);

  const itensMenu = [
    {
      id: paginas.PAINEL,
      label: 'Painel',
      icon: '▦'
    },
    {
      id: paginas.LOCACOES,
      label: 'Locações Ativas',
      icon: '▤'
    },
    {
      id: paginas.HISTORICO,
      label: 'Histórico',
      icon: '◷'
    },
    {
      id: paginas.RELATORIOS,
      label: 'Relatórios',
      icon: '▧'
    },
    {
      id: paginas.USUARIOS,
      label: 'Usuários',
      icon: '◉'
    },
    {
      id: paginas.CONFIGURACOES,
      label: 'Configurações',
      icon: '⚙'
    }
  ];

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');

    if (savedDarkMode === 'true') {
      setDarkMode(true);
      document.body.classList.add('dark');
    } else {
      setDarkMode(false);
      document.body.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    try {
      const usuarioSalvo = localStorage.getItem('lockerRioUsuario');

      if (usuarioSalvo) {
        const usuario = JSON.parse(usuarioSalvo);
        setUsuarioLogado(usuario);
      }
    } catch {
      localStorage.removeItem('lockerRioUsuario');
      setUsuarioLogado(null);
    } finally {
      setCarregandoSessao(false);
    }
  }, []);

  useEffect(() => {
    if (!usuarioLogado) {
      return;
    }

    const paginaPermitida = podeAcessarPagina(
      usuarioLogado,
      paginaAtual
    );

    if (paginaPermitida) {
      return;
    }

    const primeiraPaginaPermitida = itensMenu.find(item =>
      podeAcessarPagina(usuarioLogado, item.id)
    );

    if (primeiraPaginaPermitida) {
      setPaginaAtual(primeiraPaginaPermitida.id);
    }
  }, [usuarioLogado, paginaAtual]);

  function toggleDarkMode() {
    setDarkMode(prev => {
      const next = !prev;

      document.body.classList.toggle('dark', next);
      localStorage.setItem('darkMode', String(next));

      return next;
    });
  }

  function selecionarPagina(pagina) {
    if (!usuarioLogado) {
      return;
    }

    if (!podeAcessarPagina(usuarioLogado, pagina)) {
      return;
    }

    setPaginaAtual(pagina);
    setMenuOpen(false);
  }

  function obterTituloPagina() {
    const item = itensMenu.find(menuItem => menuItem.id === paginaAtual);

    if (!item) {
      return 'Locker Rio';
    }

    return item.label;
  }

  function handleLogin(usuario) {
    setUsuarioLogado(usuario);
    setPaginaAtual(paginas.PAINEL);
  }

  function handleLogout() {
    localStorage.removeItem('lockerRioUsuario');
    localStorage.removeItem('lockerRioToken');
    
    setUsuarioLogado(null);
    setPaginaAtual(paginas.PAINEL);
    setMenuOpen(false);

    showToast('Sessão encerrada com sucesso.', 'success');
  }

  if (carregandoSessao) {
    return (
      <div className="app-shell">
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />

        <div className="painel-container">
          <p>Carregando sessão...</p>
        </div>
      </div>
    );
  }

  if (!usuarioLogado) {
    return (
      <>
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />

        <LoginPage
          showToast={showToast}
          onLogin={handleLogin}
        />
      </>
    );
  }

  return (
    <div className="app-shell">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={clearToast}
      />

      {menuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-label="Fechar menu"
        />
      )}

      <aside className={`app-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-logo">▣</span>
          <span>Locker Rio</span>
        </div>

        <nav className="sidebar-nav">
          {itensMenu.map(item => {
            const permitido = podeAcessarPagina(usuarioLogado, item.id);
            const ativo = paginaAtual === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-item ${ativo ? 'active' : ''} ${
                  !permitido ? 'disabled' : ''
                }`}
                onClick={() => selecionarPagina(item.id)}
                disabled={!permitido}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button
            type="button"
            className="hamburger-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
            ☰
          </button>

          <div className="topbar-title">
            {obterTituloPagina()}
          </div>

          <div className="topbar-actions">
            <span className="topbar-user">
              {usuarioLogado.nome}
            </span>

            <button
              type="button"
              className="darkmode-toggle"
              onClick={toggleDarkMode}
            >
              {darkMode ? '☀️ Claro' : '🌙 Escuro'}
            </button>

            <button
              type="button"
              className="darkmode-toggle"
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        </header>

        <main className="app-content">
          {paginaAtual === paginas.PAINEL && (
            <LockersPage
              showToast={showToast}
              usuarioAtual={usuarioLogado}
            />
          )}

          {paginaAtual === paginas.LOCACOES && (
            <LocacoesAtivasPage
              showToast={showToast}
              usuarioAtual={usuarioLogado}
            />
          )}

          {paginaAtual === paginas.HISTORICO && (
            <HistoricoPage
              showToast={showToast}
              usuarioAtual={usuarioLogado}
            />
          )}

          {paginaAtual === paginas.RELATORIOS && (
            <RelatoriosPage
              showToast={showToast}
              usuarioAtual={usuarioLogado}
            />
          )}

          {paginaAtual === paginas.USUARIOS && (
            <UsuariosPage
              showToast={showToast}
              usuarioAtual={usuarioLogado}
            />
          )}

          {paginaAtual === paginas.CONFIGURACOES && (
            <ConfiguracoesPage
              showToast={showToast}
              usuarioAtual={usuarioLogado}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;