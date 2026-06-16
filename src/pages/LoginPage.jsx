import { useState } from 'react';

import { loginUsuario } from '../services/api';
import logoCliente from '../assets/logo-cliente.svg';

function LoginPage({
  showToast,
  onLogin,
  darkMode,
  toggleDarkMode
}) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const emailLimpo = email.trim();

    if (!emailLimpo) {
      showToast('Informe o email.', 'error');
      return;
    }

    if (!senha.trim()) {
      showToast('Informe a senha.', 'error');
      return;
    }

    try {
      setLoading(true);

      const { usuario, token } = await loginUsuario(emailLimpo, senha);

      localStorage.setItem(
        'lockerRioUsuario',
        JSON.stringify(usuario)
      );

      localStorage.setItem(
        'lockerRioToken',
        token
      );

      showToast('Login realizado com sucesso.', 'success');

      onLogin(usuario);
    } catch (err) {
      showToast(
        err.message || 'Erro ao realizar login.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-theme-wrapper">
          <label
            className="theme-switch theme-switch-login"
            title={darkMode ? 'Modo claro' : 'Modo escuro'}
          >
            <input
              type="checkbox"
              checked={darkMode}
              onChange={toggleDarkMode}
              aria-label="Alternar tema"
            />

            <div className="slider round">
              <div className="sun-moon">
                <svg id="moon-dot-1" className="moon-dot" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="50"></circle>
                </svg>
                <svg id="moon-dot-2" className="moon-dot" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="50"></circle>
                </svg>
                <svg id="moon-dot-3" className="moon-dot" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="50"></circle>
                </svg>

                <svg id="light-ray-1" className="light-ray" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="50"></circle>
                </svg>
                <svg id="light-ray-2" className="light-ray" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="50"></circle>
                </svg>
                <svg id="light-ray-3" className="light-ray" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="50"></circle>
                </svg>

                <svg id="cloud-1" className="cloud-dark" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="50"></circle>
                </svg>
                <svg id="cloud-2" className="cloud-dark" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="50"></circle>
                </svg>
                <svg id="cloud-3" className="cloud-dark" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="50"></circle>
                </svg>

                <svg id="cloud-4" className="cloud-light" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="50"></circle>
                </svg>
                <svg id="cloud-5" className="cloud-light" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="50"></circle>
                </svg>
                <svg id="cloud-6" className="cloud-light" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="50"></circle>
                </svg>
              </div>

              <div className="stars">
                <svg id="star-1" className="star" viewBox="0 0 20 20">
                  <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
                </svg>
                <svg id="star-2" className="star" viewBox="0 0 20 20">
                  <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
                </svg>
                <svg id="star-3" className="star" viewBox="0 0 20 20">
                  <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
                </svg>
                <svg id="star-4" className="star" viewBox="0 0 20 20">
                  <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
                </svg>
              </div>
            </div>
          </label>
        </div>

        <div className="login-brand">
          <span className="login-logo">
            <img
              src={logoCliente}
              alt="Logo Locker Rio"
              className="login-logo-image"
            />
          </span>

          <div>
            <h1>Locker Rio</h1>
            <p>Sistema de gestão de lockers e bagagens</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form-header">
            <h2>Entrar no sistema</h2>
            <p>Use seu email e senha para acessar.</p>
          </div>

          <label className="login-field">
            <span>Email</span>

            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              disabled={loading}
            />
          </label>

          <label className="login-field">
            <span>Senha</span>

            <input
              type="password"
              value={senha}
              onChange={event => setSenha(event.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              disabled={loading}
            />
          </label>

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">
          <span>Ambiente operacional Locker Rio</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;