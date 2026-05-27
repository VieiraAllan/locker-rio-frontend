import { useEffect, useState } from 'react';

import {
  getConfiguracoes,
  salvarConfiguracoes as salvarConfiguracoesApi,
  alterarSenhaUsuario
} from '../services/api';

function formatarValorConfiguracao(valor) {
  const numero = Number(valor || 0);

  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function ConfiguracoesPage({ showToast, usuarioAtual }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [senhaNova, setSenhaNova] = useState('');
  const [senhaConfirmacao, setSenhaConfirmacao] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const [estabelecimento, setEstabelecimento] = useState({
    nome: '',
    telefone: '',
    endereco: '',
    mensagemRecibo: ''
  });

  const [valores, setValores] = useState({
    valorLocker: 0,
    valorBagagemAvulsa: 0,
    valorHoraExcedente: 0,
    horasInclusas: 0
  });

  const [operacao, setOperacao] = useState({
    permitirBagagemAvulsa: true,
    permitirInRioTour: true,
    exigirLacres: true,
    exigirTelefoneCliente: true
  });

  function aplicarConfiguracoes(configuracoes) {
    setEstabelecimento({
      nome: configuracoes.estabelecimento?.nome || '',
      telefone: configuracoes.estabelecimento?.telefone || '',
      endereco: configuracoes.estabelecimento?.endereco || '',
      mensagemRecibo: configuracoes.estabelecimento?.mensagemRecibo || ''
    });

    setValores({
      valorLocker: Number(configuracoes.valores?.valorLocker || 0),
      valorBagagemAvulsa: Number(
        configuracoes.valores?.valorBagagemAvulsa || 0
      ),
      valorHoraExcedente: Number(
        configuracoes.valores?.valorHoraExcedente || 0
      ),
      horasInclusas: Number(configuracoes.valores?.horasInclusas || 0)
    });

    setOperacao({
      permitirBagagemAvulsa:
        configuracoes.operacao?.permitirBagagemAvulsa === true,

      permitirInRioTour:
        configuracoes.operacao?.permitirInRioTour === true,

      exigirLacres:
        configuracoes.operacao?.exigirLacres === true,

      exigirTelefoneCliente:
        configuracoes.operacao?.exigirTelefoneCliente === true
    });
  }

  async function carregarConfiguracoes() {
    try {
      setLoading(true);

      const dados = await getConfiguracoes();

      aplicarConfiguracoes(dados);
    } catch (err) {
      showToast(
        err.message || 'Erro ao carregar configurações.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  function atualizarEstabelecimento(campo, valor) {
    setEstabelecimento(prev => ({
      ...prev,
      [campo]: valor
    }));
  }

  function atualizarValor(campo, valor) {
    setValores(prev => ({
      ...prev,
      [campo]: valor
    }));
  }

  function atualizarOperacao(campo, valor) {
    setOperacao(prev => ({
      ...prev,
      [campo]: valor
    }));
  }

  async function salvarConfiguracoes() {
    try {
      setSaving(true);

      const configuracoesAtualizadas = await salvarConfiguracoesApi({
        estabelecimento,
        valores,
        operacao
      });

      aplicarConfiguracoes(configuracoesAtualizadas);

      showToast('Configurações salvas com sucesso.', 'success');
    } catch (err) {
      showToast(
        err.message || 'Erro ao salvar configurações.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  }

  async function restaurarConfiguracoes() {
    await carregarConfiguracoes();

    showToast('Configurações recarregadas do banco.', 'success');
  }

  async function salvarSenhaUsuario() {
  if (!usuarioAtual || !usuarioAtual.id) {
    showToast('Usuário logado não identificado. Faça login novamente.', 'error');
    return;
  }

  if (!senhaNova.trim()) {
    showToast('Informe a nova senha.', 'error');
    return;
  }

  if (senhaNova.length < 6) {
    showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
    return;
  }

  if (senhaNova !== senhaConfirmacao) {
    showToast('A confirmação da senha não confere.', 'error');
    return;
  }

  try {
    setSalvandoSenha(true);

    await alterarSenhaUsuario(usuarioAtual.id, senhaNova);

    setSenhaNova('');
    setSenhaConfirmacao('');

    showToast('Senha alterada com sucesso.', 'success');
  } catch (err) {
    showToast(
      err.message || 'Erro ao alterar senha.',
      'error'
    );
  } finally {
    setSalvandoSenha(false);
  }
}

  if (loading) {
    return (
      <div className="painel-container">
        <p>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="painel-container">
      <div className="configuracoes-header">
        <div>
          <h2>Configurações</h2>
          <p>
            Configurações reais do sistema, carregadas e salvas no banco.
          </p>
        </div>

        <div className="configuracoes-acoes">
          <button
            type="button"
            onClick={restaurarConfiguracoes}
            disabled={saving}
          >
            Restaurar
          </button>

          <button
            type="button"
            onClick={salvarConfiguracoes}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </div>

      <div className="configuracoes-grid">
        <section className="configuracao-card">
          <div className="configuracao-card-header">
            <h3>Estabelecimento</h3>
            <span>Dados institucionais</span>
          </div>

          <label className="configuracao-field">
            <span>Nome do estabelecimento</span>
            <input
              value={estabelecimento.nome}
              onChange={e =>
                atualizarEstabelecimento('nome', e.target.value)
              }
              placeholder="Nome do estabelecimento"
            />
          </label>

          <label className="configuracao-field">
            <span>Telefone padrão</span>
            <input
              value={estabelecimento.telefone}
              onChange={e =>
                atualizarEstabelecimento('telefone', e.target.value)
              }
              placeholder="Telefone do estabelecimento"
            />
          </label>

          <label className="configuracao-field">
            <span>Endereço</span>
            <input
              value={estabelecimento.endereco}
              onChange={e =>
                atualizarEstabelecimento('endereco', e.target.value)
              }
              placeholder="Endereço"
            />
          </label>

          <label className="configuracao-field">
            <span>Mensagem do recibo</span>
            <textarea
              value={estabelecimento.mensagemRecibo}
              onChange={e =>
                atualizarEstabelecimento(
                  'mensagemRecibo',
                  e.target.value
                )
              }
              placeholder="Mensagem padrão do recibo"
              rows="3"
            />
          </label>
        </section>

        <section className="configuracao-card">
          <div className="configuracao-card-header">
            <h3>Valores</h3>
            <span>Regras financeiras</span>
          </div>

          <label className="configuracao-field">
            <span>Valor do locker</span>
            <input
              type="number"
              min="0"
              value={valores.valorLocker}
              onChange={e =>
                atualizarValor('valorLocker', Number(e.target.value))
              }
            />
            <small>
              Prévia: {formatarValorConfiguracao(valores.valorLocker)}
            </small>
          </label>

          <label className="configuracao-field">
            <span>Valor da bagagem avulsa</span>
            <input
              type="number"
              min="0"
              value={valores.valorBagagemAvulsa}
              onChange={e =>
                atualizarValor(
                  'valorBagagemAvulsa',
                  Number(e.target.value)
                )
              }
            />
            <small>
              Prévia:{' '}
              {formatarValorConfiguracao(valores.valorBagagemAvulsa)}
            </small>
          </label>

          <label className="configuracao-field">
            <span>Valor por hora excedente</span>
            <input
              type="number"
              min="0"
              value={valores.valorHoraExcedente}
              onChange={e =>
                atualizarValor(
                  'valorHoraExcedente',
                  Number(e.target.value)
                )
              }
            />
            <small>
              Prévia:{' '}
              {formatarValorConfiguracao(valores.valorHoraExcedente)}
            </small>
          </label>

          <label className="configuracao-field">
            <span>Horas inclusas</span>
            <input
              type="number"
              min="1"
              value={valores.horasInclusas}
              onChange={e =>
                atualizarValor('horasInclusas', Number(e.target.value))
              }
            />
            <small>
              Tempo incluso antes de excedente
            </small>
          </label>
        </section>

        <section className="configuracao-card">
          <div className="configuracao-card-header">
            <h3>Operação</h3>
            <span>Regras de atendimento</span>
          </div>

          <label className="configuracao-toggle">
            <div>
              <strong>Permitir bagagem avulsa</strong>
              <span>Exibe e permite criar locações sem locker.</span>
            </div>

            <input
              type="checkbox"
              checked={operacao.permitirBagagemAvulsa}
              onChange={e =>
                atualizarOperacao(
                  'permitirBagagemAvulsa',
                  e.target.checked
                )
              }
            />
          </label>

          <label className="configuracao-toggle">
            <div>
              <strong>Permitir cliente In Rio Tour</strong>
              <span>Habilita marcação especial para clientes parceiros.</span>
            </div>

            <input
              type="checkbox"
              checked={operacao.permitirInRioTour}
              onChange={e =>
                atualizarOperacao(
                  'permitirInRioTour',
                  e.target.checked
                )
              }
            />
          </label>

          <label className="configuracao-toggle">
            <div>
              <strong>Exigir lacres</strong>
              <span>Obrigar preenchimento da numeração dos lacres.</span>
            </div>

            <input
              type="checkbox"
              checked={operacao.exigirLacres}
              onChange={e =>
                atualizarOperacao('exigirLacres', e.target.checked)
              }
            />
          </label>

          <label className="configuracao-toggle">
            <div>
              <strong>Exigir telefone do cliente</strong>
              <span>Obrigar preenchimento do telefone na locação.</span>
            </div>

            <input
              type="checkbox"
              checked={operacao.exigirTelefoneCliente}
              onChange={e =>
                atualizarOperacao(
                  'exigirTelefoneCliente',
                  e.target.checked
                )
              }
            />
          </label>
        </section>

            <section className="configuracao-card">
  <div className="configuracao-card-header">
    <h3>Minha senha</h3>
    <span>Alteração de senha do usuário logado</span>
  </div>

  <label className="configuracao-field">
    <span>Usuário</span>
    <input
      value={
        usuarioAtual
          ? `${usuarioAtual.nome} — ${usuarioAtual.email}`
          : 'Usuário não identificado'
      }
      disabled
    />
  </label>

  <label className="configuracao-field">
    <span>Nova senha</span>
    <input
      type="password"
      value={senhaNova}
      onChange={e => setSenhaNova(e.target.value)}
      placeholder="Digite a nova senha"
      autoComplete="new-password"
      disabled={salvandoSenha}
    />
    <small>
      A senha deve ter pelo menos 6 caracteres.
    </small>
  </label>

  <label className="configuracao-field">
    <span>Confirmar nova senha</span>
    <input
      type="password"
      value={senhaConfirmacao}
      onChange={e => setSenhaConfirmacao(e.target.value)}
      placeholder="Confirme a nova senha"
      autoComplete="new-password"
      disabled={salvandoSenha}
    />
  </label>

  <div className="configuracao-card-actions">
    <button
      type="button"
      onClick={() => {
        setSenhaNova('');
        setSenhaConfirmacao('');
      }}
      disabled={salvandoSenha}
    >
      Limpar
    </button>

    <button
      type="button"
      onClick={salvarSenhaUsuario}
      disabled={salvandoSenha}
    >
      {salvandoSenha ? 'Alterando...' : 'Alterar senha'}
    </button>
  </div>
</section>

      </div>
    </div>
  );
}

export default ConfiguracoesPage;