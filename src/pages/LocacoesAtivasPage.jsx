import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import {
  getLocacoesAtivas,
  abrirReciboPdf,
  gerarMensagemWhatsApp,
  atualizarDadosClienteLocacao
} from '../services/api';

function LocacoesAtivasPage({ showToast }) {
  const [locacoes, setLocacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gerandoReciboId, setGerandoReciboId] = useState(null);
  const [gerandoMensagemChave, setGerandoMensagemChave] = useState(null);
  const [idiomaWhatsAppPorLocacao, setIdiomaWhatsAppPorLocacao] = useState({});
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [locacaoEmEdicao, setLocacaoEmEdicao] = useState(null);
  const [editClienteNome, setEditClienteNome] = useState('');
  const [editClienteTelefone, setEditClienteTelefone] = useState('');
  const [editClienteDocumento, setEditClienteDocumento] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  async function carregarLocacoesAtivas() {
    try {
      const dados = await getLocacoesAtivas();
      setLocacoes(dados);
    } catch (err) {
      showToast(err.message || 'Erro ao carregar locações ativas.', 'error');
      setLocacoes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarLocacoesAtivas();
  }, []);

  function abrirWhatsApp({ telefone, mensagem }) {
    const apenasNumeros = String(telefone || '').replace(/\D/g, '');

    if (!apenasNumeros || !mensagem) {
      return;
    }

    const telefoneNormalizado = apenasNumeros.startsWith('55')
      ? apenasNumeros
      : `55${apenasNumeros}`;

    const url = new URL('https://api.whatsapp.com/send');
    url.searchParams.set('phone', telefoneNormalizado);
    url.searchParams.set('text', mensagem);

    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  }

  function obterIdiomaWhatsAppLocacao(locacaoId) {
    return idiomaWhatsAppPorLocacao[locacaoId] || '';
  }

  function alterarIdiomaWhatsAppLocacao(locacaoId, idioma) {
    setIdiomaWhatsAppPorLocacao(prev => ({
      ...prev,
      [locacaoId]: idioma
    }));
  }

  async function handleAbrirRecibo(locacaoId) {
    try {
      setGerandoReciboId(locacaoId);
      await abrirReciboPdf(locacaoId);
    } catch (err) {
      showToast(err.message || 'Erro ao abrir recibo.', 'error');
    } finally {
      setGerandoReciboId(null);
    }
  }

  async function handleEnviarMensagem(locacao, tipo) {
    const telefone = String(locacao?.cliente_telefone || '').trim();
    const idioma = obterIdiomaWhatsAppLocacao(locacao.id);

    if (!telefone) {
      showToast('Esta locação não possui telefone cadastrado.', 'error');
      return;
    }

    if (!idioma) {
      showToast('Selecione o idioma desta locação antes de enviar a mensagem.', 'error');
      return;
    }

    const chave = `${locacao.id}-${tipo}`;

    try {
      setGerandoMensagemChave(chave);

      const resultado = await gerarMensagemWhatsApp(locacao.id, {
        tipo,
        idioma,
        telefone
      });

      if (!resultado?.mensagem) {
        throw new Error('Mensagem do WhatsApp não retornada.');
      }

      abrirWhatsApp({
        telefone,
        mensagem: resultado.mensagem
      });
    } catch (err) {
      showToast(err.message || 'Erro ao gerar mensagem do WhatsApp.', 'error');
    } finally {
      setGerandoMensagemChave(null);
    }
  }

  function abrirModalEdicao(locacao) {
    setLocacaoEmEdicao(locacao);
    setEditClienteNome(locacao?.cliente_nome || '');
    setEditClienteTelefone(locacao?.cliente_telefone || '');
    setEditClienteDocumento(locacao?.cliente_documento || '');
    setModalEdicaoAberto(true);
  }

  function fecharModalEdicao() {
    setModalEdicaoAberto(false);
    setLocacaoEmEdicao(null);
    setEditClienteNome('');
    setEditClienteTelefone('');
    setEditClienteDocumento('');
    setSalvandoEdicao(false);
  }

  async function handleSalvarEdicaoCliente() {
    if (!locacaoEmEdicao?.id || salvandoEdicao) {
      return;
    }

    if (!editClienteNome.trim()) {
      showToast('Informe o nome do cliente.', 'error');
      return;
    }

    if (!editClienteDocumento.trim()) {
      showToast('Informe o documento.', 'error');
      return;
    }

    try {
      setSalvandoEdicao(true);

      await atualizarDadosClienteLocacao(locacaoEmEdicao.id, {
        cliente_nome: editClienteNome.trim(),
        cliente_telefone: editClienteTelefone.trim(),
        cliente_documento: editClienteDocumento.trim()
      });

      showToast('Dados do cliente atualizados com sucesso.', 'success');
      await carregarLocacoesAtivas();
      fecharModalEdicao();
    } catch (err) {
      showToast(err.message || 'Erro ao atualizar dados do cliente.', 'error');
      setSalvandoEdicao(false);
    }
  }

  function formatarValor(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function obterTextoBotaoWhatsApp(locacaoId, tipo, label) {
    if (gerandoMensagemChave === `${locacaoId}-${tipo}`) {
      return 'Abrindo WhatsApp...';
    }

    return label;
  }

  if (loading) {
    return (
      <div className="painel-container">
        <p>Carregando locações ativas...</p>
      </div>
    );
  }

  return (
    <div className="painel-container">
      <div className="locacoes-header">
        <div>
          <h2>Locações ativas</h2>
          <p>Locações em andamento, incluindo lockers e bagagens avulsas.</p>
        </div>

        <div className="locacoes-header-acoes">
          <span className="locacoes-total">
            {locacoes.length} ativa{locacoes.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {locacoes.length === 0 ? (
        <div className="locacoes-empty">
          Nenhuma locação ativa no momento.
        </div>
      ) : (
        <div className="locacoes-lista">
          {locacoes.map(locacao => {
            const valorPagoInicial = Number(
              locacao.valor_pago_inicial ?? locacao.valor_pago ?? 0
            );

            const semTelefone = !String(locacao.cliente_telefone || '').trim();
            const idiomaSelecionado = obterIdiomaWhatsAppLocacao(locacao.id);

            return (
              <div key={locacao.id} className="locacao-card">
                <div className="locacao-card-topo">
                  <div>
                    <strong>{locacao.cliente_nome}</strong>

                    <span>
                      {locacao.tipo === 'avulsa'
                        ? '📦 Bagagem avulsa'
                        : `Armário ${locacao.lockers.join(', ')}`}
                    </span>
                  </div>

                  <div className="locacao-topo-acoes">
                    <button
                      type="button"
                      className="locacao-editar-btn"
                      onClick={() => abrirModalEdicao(locacao)}
                    >
                      Editar cliente
                    </button>

                    <button
                      type="button"
                      className="locacao-recibo-btn"
                      onClick={() => handleAbrirRecibo(locacao.id)}
                      disabled={gerandoReciboId === locacao.id}
                    >
                      {gerandoReciboId === locacao.id
                        ? 'Abrindo PDF...'
                        : 'Recibo PDF'}
                    </button>

                    <span
                      className={
                        locacao.tipo === 'avulsa'
                          ? 'locacao-badge avulsa'
                          : 'locacao-badge locker'
                      }
                    >
                      {locacao.tipo === 'avulsa' ? 'Avulsa' : 'Locker'}
                    </span>
                  </div>
                </div>

                <div className="locacao-detalhes">
                  <div>
                    <span>Telefone</span>
                    <strong>{locacao.cliente_telefone || '-'}</strong>
                  </div>

                  <div>
                    <span>Documento</span>
                    <strong>{locacao.cliente_documento || '-'}</strong>
                  </div>

                  <div>
                    <span>Entrada</span>
                    <strong>{locacao.hora_entrada || '-'}</strong>
                  </div>

                  <div>
                    <span>Pago até</span>
                    <strong>{locacao.hora_pago_ate || '-'}</strong>
                  </div>

                  <div>
                    <span>Lacres</span>
                    <strong>{locacao.lacres || '-'}</strong>
                  </div>

                  <div>
                    <span>Volumes extras</span>
                    <strong>{locacao.total_volumes || 0}</strong>
                  </div>

                  <div>
                    <span>Valor pago</span>
                    <strong>{formatarValor(valorPagoInicial)}</strong>
                  </div>

                  <div>
                    <span>Aberta por</span>
                    <strong>
                      {locacao.usuario_abertura_nome
                        ? `${locacao.usuario_abertura_nome} — ${locacao.usuario_abertura_perfil}`
                        : '-'}
                    </strong>
                  </div>
                </div>

                {locacao.observacao && (
                  <div className="locacao-observacao-interna">
                    <span>Observação interna</span>
                    <strong>{locacao.observacao}</strong>
                  </div>
                )}

                <div className="locacao-whatsapp-area">
                  <div className="locacao-whatsapp-header">
                    <span>Mensagens WhatsApp</span>
                    {!semTelefone ? (
                      <small>{locacao.cliente_telefone}</small>
                    ) : (
                      <small className="locacao-whatsapp-sem-telefone">
                        Sem telefone cadastrado
                      </small>
                    )}
                  </div>

                  <div className="locacao-whatsapp-config-card">
                    <label htmlFor={`locacao-whatsapp-idioma-${locacao.id}`}>
                      Idioma desta locação
                    </label>
                    <select
                      id={`locacao-whatsapp-idioma-${locacao.id}`}
                      value={idiomaSelecionado}
                      onChange={e => alterarIdiomaWhatsAppLocacao(locacao.id, e.target.value)}
                    >
                      <option value="">Selecione o idioma</option>
                      <option value="pt">Português</option>
                      <option value="en">Inglês</option>
                      <option value="es">Espanhol</option>
                    </select>
                  </div>

                  <div className="locacao-whatsapp-acoes">
                    <button
                      type="button"
                      className="locacao-whatsapp-btn"
                      onClick={() => handleEnviarMensagem(locacao, 'abertura')}
                      disabled={semTelefone || gerandoMensagemChave !== null}
                    >
                      {obterTextoBotaoWhatsApp(locacao.id, 'abertura', 'Abertura')}
                    </button>

                    <button
                      type="button"
                      className="locacao-whatsapp-btn"
                      onClick={() => handleEnviarMensagem(locacao, 'atraso')}
                      disabled={semTelefone || gerandoMensagemChave !== null}
                    >
                      {obterTextoBotaoWhatsApp(locacao.id, 'atraso', 'Atraso')}
                    </button>

                    <button
                      type="button"
                      className="locacao-whatsapp-btn"
                      onClick={() => handleEnviarMensagem(locacao, 'fechamento_proximo')}
                      disabled={semTelefone || gerandoMensagemChave !== null}
                    >
                      {obterTextoBotaoWhatsApp(
                        locacao.id,
                        'fechamento_proximo',
                        'Fechamento próximo'
                      )}
                    </button>
                  </div>
                </div>

                {locacao.bagagens.length > 0 && (
                  <div className="locacao-bagagens">
                    <span>Bagagens Extras</span>

                    <ul>
                      {locacao.bagagens.map((bagagem, index) => (
                        <li key={index}>
                          {bagagem.descricao} — {bagagem.quantidade}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modalEdicaoAberto}
        title="Editar dados do cliente"
        onClose={fecharModalEdicao}
      >
        <div className="locacao-edicao-modal">
          <div className="locacao-edicao-resumo">
            <div>
              <span>Locação</span>
              <strong>
                {locacaoEmEdicao?.tipo === 'avulsa'
                  ? 'Bagagem avulsa'
                  : `Armário ${locacaoEmEdicao?.lockers?.join(', ') || '-'}`}
              </strong>
            </div>
            <div>
              <span>Recibo</span>
              <strong>{locacaoEmEdicao?.recibo_numero || '-'}</strong>
            </div>
          </div>

          <div className="locacao-edicao-campo">
            <label htmlFor="edit-cliente-nome">Nome do cliente</label>
            <input
              id="edit-cliente-nome"
              placeholder="Digite o nome do cliente"
              value={editClienteNome}
              onChange={e => setEditClienteNome(e.target.value)}
            />
          </div>

          <div className="locacao-edicao-campo">
            <label htmlFor="edit-cliente-telefone">Telefone (WhatsApp)</label>
            <input
              id="edit-cliente-telefone"
              placeholder="Digite o telefone do cliente"
              value={editClienteTelefone}
              onChange={e => setEditClienteTelefone(e.target.value)}
            />
          </div>

          <div className="locacao-edicao-campo">
            <label htmlFor="edit-cliente-documento">Documento</label>
            <input
              id="edit-cliente-documento"
              placeholder="Digite o documento"
              value={editClienteDocumento}
              onChange={e => setEditClienteDocumento(e.target.value)}
            />
          </div>

          <div className="locacao-edicao-acoes">
            <button
              type="button"
              className="locacao-edicao-btn secundario"
              onClick={fecharModalEdicao}
              disabled={salvandoEdicao}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="locacao-edicao-btn principal"
              onClick={handleSalvarEdicaoCliente}
              disabled={salvandoEdicao}
            >
              {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default LocacoesAtivasPage;