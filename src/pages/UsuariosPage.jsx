import { useEffect, useMemo, useState } from 'react';

import {
  perfis,
  paginas,
  podeAcessarPagina,
  podeGerenciarUsuarios,
  podeCriarUsuarioComPerfil,
  podeEditarUsuario,
  podeExcluirUsuario,
  filtrarUsuariosVisiveis,
  obterLabelPerfil,
  obterStatusUsuario,
  obterDescricaoRegraDoPerfil
} from '../config/permissoes';

import {
  getUsuarios,
  criarUsuario as criarUsuarioApi,
  atualizarUsuario as atualizarUsuarioApi,
  excluirUsuario as excluirUsuarioApi,
  alterarSenhaUsuario
} from '../services/api';

function UsuariosPage({ showToast, usuarioAtual }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formAberto, setFormAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPerfil, setFormPerfil] = useState(perfis.ATENDENTE);
  const [formAtivo, setFormAtivo] = useState(true);

  const [senhaModalAberto, setSenhaModalAberto] = useState(false);
  const [usuarioSenha, setUsuarioSenha] = useState(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const podeAcessar = podeAcessarPagina(usuarioAtual, paginas.USUARIOS);
  const podeGerenciar = podeGerenciarUsuarios(usuarioAtual);

  const usuariosVisiveis = useMemo(() => {
  return filtrarUsuariosVisiveis(usuarioAtual, usuarios);
}, [usuarioAtual, usuarios]);

  const perfisDisponiveisParaCriacao = useMemo(() => {
  return [
    perfis.ATENDENTE,
    perfis.GERENTE,
    perfis.ADMIN
  ].filter(perfil =>
    podeCriarUsuarioComPerfil(usuarioAtual, perfil)
  );
}, [usuarioAtual]);

  const totalUsuariosVisiveis = usuariosVisiveis.length;

  const totalAtivos = usuariosVisiveis.filter(
    usuario => usuario.ativo
  ).length;

  const totalInativos = usuariosVisiveis.filter(
    usuario => !usuario.ativo
  ).length;

  async function carregarUsuarios() {
    try {
      setLoading(true);

      const dados = await getUsuarios();

      setUsuarios(dados);
    } catch (err) {
      showToast(err.message || 'Erro ao carregar usuários.', 'error');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  if (podeAcessar && usuarioAtual?.id) {
    carregarUsuarios();
  } else {
    setLoading(false);
  }
}, [podeAcessar, usuarioAtual?.id]);

  function limparFormulario() {
    setUsuarioEditando(null);
    setFormNome('');
    setFormEmail('');
    setFormPerfil(perfisDisponiveisParaCriacao[0] || perfis.ATENDENTE);
    setFormAtivo(true);
    setFormAberto(false);
  }

  function abrirFormularioCriacao() {
    if (!podeGerenciar) {
      showToast('Você não tem permissão para criar usuários.', 'error');
      return;
    }

    if (perfisDisponiveisParaCriacao.length === 0) {
      showToast('Nenhum perfil disponível para criação.', 'error');
      return;
    }

    setUsuarioEditando(null);
    setFormNome('');
    setFormEmail('');
    setFormPerfil(perfisDisponiveisParaCriacao[0]);
    setFormAtivo(true);
    setFormAberto(true);
  }

  function abrirFormularioEdicao(usuario) {
    if (!podeEditarUsuario(usuarioAtual, usuario)) {
      showToast('Você não tem permissão para editar este usuário.', 'error');
      return;
    }

    setUsuarioEditando(usuario);
    setFormNome(usuario.nome || '');
    setFormEmail(usuario.email || '');
    setFormPerfil(usuario.perfil || perfis.ATENDENTE);
    setFormAtivo(usuario.ativo === true);
    setFormAberto(true);
  }

  async function salvarFormularioUsuario() {
    if (!formNome.trim()) {
      showToast('Informe o nome do usuário.', 'error');
      return;
    }

    if (!formEmail.trim()) {
      showToast('Informe o email do usuário.', 'error');
      return;
    }

    if (!usuarioEditando && !podeCriarUsuarioComPerfil(usuarioAtual, formPerfil)) {
      showToast('Você não tem permissão para criar usuário com este perfil.', 'error');
      return;
    }

    if (usuarioEditando && !podeEditarUsuario(usuarioAtual, usuarioEditando)) {
      showToast('Você não tem permissão para editar este usuário.', 'error');
      return;
    }

    try {
      setSubmitting(true);

      if (usuarioEditando) {
  const usuarioAtualizado = await atualizarUsuarioApi(
    usuarioEditando.id,
    {
      nome: formNome.trim(),
      email: formEmail.trim(),
      perfil: formPerfil,
      ativo: formAtivo
    }
  );

  setUsuarios(prev =>
    prev.map(usuario =>
      usuario.id === usuarioAtualizado.id
        ? usuarioAtualizado
        : usuario
    )
  );

  showToast('Usuário atualizado com sucesso.', 'success');
} else {
        const novoUsuario = await criarUsuarioApi({
          nome: formNome.trim(),
          email: formEmail.trim(),
          perfil: formPerfil,
          ativo: formAtivo
        });

        setUsuarios(prev => [...prev, novoUsuario]);

        showToast('Usuário criado com sucesso.', 'success');
      }

      limparFormulario();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar usuário.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function alternarStatusUsuario(usuarioAlvo) {
  if (!podeEditarUsuario(usuarioAtual, usuarioAlvo)) {
    showToast('Você não tem permissão para editar este usuário.', 'error');
    return;
  }

  try {
    setSubmitting(true);

    const usuarioAtualizado = await atualizarUsuarioApi(
      usuarioAlvo.id,
      {
        ativo: !usuarioAlvo.ativo
      }
    );

    setUsuarios(prev =>
      prev.map(usuario =>
        usuario.id === usuarioAlvo.id
          ? usuarioAtualizado
          : usuario
      )
    );

    showToast('Status do usuário atualizado.', 'success');
  } catch (err) {
    showToast(err.message || 'Erro ao atualizar usuário.', 'error');
  } finally {
    setSubmitting(false);
  }
}

  async function excluirUsuario(usuarioAlvo) {
    if (!podeExcluirUsuario(usuarioAtual, usuarioAlvo)) {
      showToast('Você não tem permissão para excluir este usuário.', 'error');
      return;
    }

    const confirmar = window.confirm(
      `Confirmar exclusão do usuário ${usuarioAlvo.nome}?`
    );

    if (!confirmar) return;

    try {
      setSubmitting(true);

      await excluirUsuarioApi(usuarioAlvo.id);

      setUsuarios(prev =>
        prev.filter(usuario => usuario.id !== usuarioAlvo.id)
      );

      showToast('Usuário excluído com sucesso.', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao excluir usuário.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

function abrirModalSenha(usuario) {
  if (!podeEditarUsuario(usuarioAtual, usuario)) {
    showToast('Você não tem permissão para definir senha deste usuário.', 'error');
    return;
  }

  setUsuarioSenha(usuario);
  setNovaSenha('');
  setConfirmarNovaSenha('');
  setSenhaModalAberto(true);
}

function fecharModalSenha() {
  if (salvandoSenha) {
    return;
  }

  setSenhaModalAberto(false);
  setUsuarioSenha(null);
  setNovaSenha('');
  setConfirmarNovaSenha('');
}

async function salvarSenhaUsuario() {
  if (!usuarioSenha || !usuarioSenha.id) {
    showToast('Usuário não identificado.', 'error');
    return;
  }

  if (!novaSenha.trim()) {
    showToast('Informe a nova senha.', 'error');
    return;
  }

  if (novaSenha.length < 6) {
    showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
    return;
  }

  if (novaSenha !== confirmarNovaSenha) {
    showToast('A confirmação da senha não confere.', 'error');
    return;
  }

  try {
    setSalvandoSenha(true);

    await alterarSenhaUsuario(usuarioSenha.id, novaSenha);

    showToast('Senha definida com sucesso.', 'success');

    fecharModalSenha();
  } catch (err) {
    showToast(
      err.message || 'Erro ao definir senha.',
      'error'
    );
  } finally {
    setSalvandoSenha(false);
  }
}

  if (!podeAcessar) {
    return (
      <div className="painel-container">
        <div className="usuarios-acesso-negado">
          <h2>Acesso negado</h2>

          <p>
            Seu perfil não tem permissão para acessar a página de usuários.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="painel-container">
        <p>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="painel-container">
      <div className="usuarios-header">
        <div>
          <h2>Usuários</h2>

          <p>
            Gestão de usuários reais do sistema, respeitando permissões por
            perfil.
          </p>
        </div>

        {podeGerenciar && (
          <button
            type="button"
            className="usuarios-novo-btn"
            onClick={abrirFormularioCriacao}
            disabled={submitting}
          >
            + Novo usuário
          </button>
        )}
      </div>

      <div className="usuarios-regra">
        <strong>Perfil atual:</strong>{' '}
        {usuarioAtual.nome} — {obterLabelPerfil(usuarioAtual.perfil)}

        <br />

        <span>
          {obterDescricaoRegraDoPerfil(usuarioAtual.perfil)}
        </span>
      </div>

{senhaModalAberto && usuarioSenha && (
  <div className="usuario-senha-overlay">
    <div className="usuario-senha-modal">
      <div className="usuario-senha-header">
        <div>
          <h3>Definir senha</h3>
          <p>
            Defina uma nova senha para {usuarioSenha.nome}.
          </p>
        </div>

        <button
          type="button"
          onClick={fecharModalSenha}
          disabled={salvandoSenha}
          aria-label="Fechar"
        >
          ×
        </button>
      </div>

      <div className="usuario-senha-body">
        <label className="usuarios-form-field">
          <span>Usuário</span>
          <input
            value={`${usuarioSenha.nome} — ${usuarioSenha.email}`}
            disabled
          />
        </label>

        <label className="usuarios-form-field">
          <span>Nova senha</span>
          <input
            type="password"
            value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)}
            placeholder="Digite a nova senha"
            autoComplete="new-password"
            disabled={salvandoSenha}
          />
          <small>
            A senha deve ter pelo menos 6 caracteres.
          </small>
        </label>

        <label className="usuarios-form-field">
          <span>Confirmar nova senha</span>
          <input
            type="password"
            value={confirmarNovaSenha}
            onChange={e => setConfirmarNovaSenha(e.target.value)}
            placeholder="Confirme a nova senha"
            autoComplete="new-password"
            disabled={salvandoSenha}
          />
        </label>
      </div>

      <div className="usuario-senha-actions">
        <button
          type="button"
          onClick={fecharModalSenha}
          disabled={salvandoSenha}
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={salvarSenhaUsuario}
          disabled={salvandoSenha}
        >
          {salvandoSenha ? 'Salvando...' : 'Salvar senha'}
        </button>
      </div>
    </div>
  </div>
)}

      {formAberto && (
        <div className="usuarios-form-card">
          <div className="usuarios-form-header">
            <div>
              <h3>
                {usuarioEditando ? 'Editar usuário' : 'Novo usuário'}
              </h3>

              <p>
                {usuarioEditando
                  ? 'Atualize os dados do usuário selecionado.'
                  : 'Preencha os dados para cadastrar um novo usuário.'}
              </p>
            </div>
          </div>

          <div className="usuarios-form-grid">
            <label className="usuarios-form-field">
              <span>Nome</span>
              <input
                value={formNome}
                onChange={e => setFormNome(e.target.value)}
                placeholder="Nome do usuário"
              />
            </label>

            <label className="usuarios-form-field">
              <span>Email</span>
              <input
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </label>

            <label className="usuarios-form-field">
              <span>Perfil</span>
              <select
                value={formPerfil}
                onChange={e => setFormPerfil(e.target.value)}
                disabled={usuarioEditando && !podeEditarUsuario(usuarioAtual, usuarioEditando)}
              >
                {usuarioEditando ? (
                  <option value={formPerfil}>
                    {obterLabelPerfil(formPerfil)}
                  </option>
                ) : (
                  perfisDisponiveisParaCriacao.map(perfil => (
                    <option key={perfil} value={perfil}>
                      {obterLabelPerfil(perfil)}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="usuarios-form-check">
              <input
                type="checkbox"
                checked={formAtivo}
                onChange={e => setFormAtivo(e.target.checked)}
              />
              Usuário ativo
            </label>
          </div>

          <div className="usuarios-form-actions">
            <button
              type="button"
              onClick={limparFormulario}
              disabled={submitting}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={salvarFormularioUsuario}
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : 'Salvar usuário'}
            </button>
          </div>
        </div>
      )}

      <div className="usuarios-resumo">
        <div className="usuarios-resumo-card">
          <span>Visíveis</span>
          <strong>{totalUsuariosVisiveis}</strong>
        </div>

        <div className="usuarios-resumo-card">
          <span>Ativos</span>
          <strong>{totalAtivos}</strong>
        </div>

        <div className="usuarios-resumo-card">
          <span>Inativos</span>
          <strong>{totalInativos}</strong>
        </div>
      </div>

      {usuariosVisiveis.length === 0 ? (
        <div className="usuarios-empty">
          Nenhum usuário disponível para o seu perfil.
        </div>
      ) : (
        <div className="usuarios-lista">
          {usuariosVisiveis.map(usuario => {
            const podeEditar = podeEditarUsuario(usuarioAtual, usuario);
            const podeExcluir = podeExcluirUsuario(usuarioAtual, usuario);

            return (
              <div key={usuario.id} className="usuario-card">
                <div className="usuario-card-info">
                  <div className="usuario-avatar">
                    {usuario.nome.charAt(0).toUpperCase()}
                  </div>

                  <div className="usuario-identidade">
                    <strong>{usuario.nome}</strong>
                    <span>{usuario.email}</span>
                  </div>
                </div>

                <div className="usuario-card-meta">
                  <span className={`usuario-badge perfil-${usuario.perfil}`}>
                    {obterLabelPerfil(usuario.perfil)}
                  </span>

                  <span
                    className={
                      usuario.ativo
                        ? 'usuario-status ativo'
                        : 'usuario-status inativo'
                    }
                  >
                    {obterStatusUsuario(usuario)}
                  </span>
                </div>

                <div className="usuario-card-actions">
  <button
    type="button"
    onClick={() => abrirFormularioEdicao(usuario)}
    disabled={!podeEditar || submitting}
  >
    Editar
  </button>

  <button
    type="button"
    onClick={() => abrirModalSenha(usuario)}
    disabled={!podeEditar || submitting || salvandoSenha}
  >
    Definir senha
  </button>

  <button
    type="button"
    onClick={() => alternarStatusUsuario(usuario)}
    disabled={!podeEditar || submitting}
  >
    {usuario.ativo ? 'Desativar' : 'Ativar'}
  </button>

  <button
    type="button"
    onClick={() => excluirUsuario(usuario)}
    disabled={!podeExcluir || submitting}
  >
    Excluir
  </button>
</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UsuariosPage;