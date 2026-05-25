import { useState } from 'react';

import { loginUsuario } from '../services/api';

function LoginPage({ showToast, onLogin }) {
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
        <div className="login-brand">
          <span className="login-logo">▣</span>

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