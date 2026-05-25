import { useEffect, useState } from 'react';

import LockersPage from './pages/LockersPage';
import LocacoesAtivasPage from './pages/LocacoesAtivasPage';
import HistoricoPage from './pages/HistoricoPage';
import RelatoriosPage from './pages/RelatoriosPage';
import UsuariosPage from './pages/UsuariosPage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';

import Toast from './components/Toast';
import useToast from './hooks/useToast';

import { usuarioAtual } from './config/usuarioAtual';
import {
  paginas,
  podeAcessarPagina
} from './config/permissoes';

function App() {
  const { toast, showToast, clearToast } = useToast();

  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(paginas.PAINEL);

  const itensMenu = [
    {
      id: paginas.PAINEL,
      label: 'Painel',
      icon: '▦'
    },
    {
      id: paginas.LOCACOES,
      label: 'Locações',
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
    const paginaPermitida = podeAcessarPagina(usuarioAtual, paginaAtual);

    if (paginaPermitida) return;

    const primeiraPaginaPermitida = itensMenu.find(item =>
      podeAcessarPagina(usuarioAtual, item.id)
    );

    if (primeiraPaginaPermitida) {
      setPaginaAtual(primeiraPaginaPermitida.id);
    }
  }, [paginaAtual]);

  function toggleDarkMode() {
    setDarkMode(prev => {
      const next = !prev;

      document.body.classList.toggle('dark', next);
      localStorage.setItem('darkMode', String(next));

      return next;
    });
  }

  function selecionarPagina(pagina) {
    if (!podeAcessarPagina(usuarioAtual, pagina)) {
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
            const permitido = podeAcessarPagina(usuarioAtual, item.id);
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

          <button
            type="button"
            className="darkmode-toggle"
            onClick={toggleDarkMode}
          >
            {darkMode ? '☀️ Claro' : '🌙 Escuro'}
          </button>
        </header>

        <main className="app-content">
          {paginaAtual === paginas.PAINEL && (
            <LockersPage showToast={showToast} />
          )}

          {paginaAtual === paginas.LOCACOES && (
            <LocacoesAtivasPage showToast={showToast} />
          )}

          {paginaAtual === paginas.HISTORICO && (
            <HistoricoPage showToast={showToast} />
          )}

          {paginaAtual === paginas.RELATORIOS && (
            <RelatoriosPage showToast={showToast} />
          )}

          {paginaAtual === paginas.USUARIOS && (
            <UsuariosPage showToast={showToast} />
          )}

          {paginaAtual === paginas.CONFIGURACOES && (
            <ConfiguracoesPage showToast={showToast} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;