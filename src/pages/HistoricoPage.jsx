import { useEffect, useState } from 'react';
import {
  getHistoricoLocacoes,
  abrirReciboPdf
} from '../services/api';

function HistoricoPage({ showToast }) {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gerandoReciboId, setGerandoReciboId] = useState(null);

  async function carregarHistorico() {
    try {
      const dados = await getHistoricoLocacoes();
      setHistorico(dados);
    } catch (err) {
      showToast(err.message || 'Erro ao carregar histórico.', 'error');
      setHistorico([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarHistorico();
  }, []);

  function formatarValor(valor) {
    const numero = Number(valor || 0);

    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function formatarData(data) {
    if (!data) return '-';

    const partes = data.split('-');

    if (partes.length !== 3) {
      return data;
    }

    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
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

  if (loading) {
    return (
      <div className="painel-container">
        <p>Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="painel-container">
      <div className="historico-header">
        <div>
          <h2>Histórico</h2>
          <p>Locações finalizadas, incluindo lockers e bagagens avulsas.</p>
        </div>

        <span className="historico-total">
          {historico.length} registro{historico.length === 1 ? '' : 's'}
        </span>
      </div>

      {historico.length === 0 ? (
        <div className="historico-empty">
          Nenhuma locação finalizada encontrada.
        </div>
      ) : (
        <div className="historico-lista">
          {historico.map(locacao => (
            <div key={locacao.id} className="historico-card">
              <div className="historico-card-topo">
                <div>
                  <strong>{locacao.cliente_nome}</strong>

                  <span>
                    {locacao.tipo === 'avulsa'
                      ? '📦 Bagagem avulsa'
                      : `Armário ${locacao.lockers.join(', ')}`}
                  </span>
                </div>

                <div className="historico-topo-acoes">
                  <button
                    type="button"
                    className="historico-recibo-btn"
                    onClick={() => handleAbrirRecibo(locacao.id)}
                    disabled={gerandoReciboId === locacao.id}
                  >
                    {gerandoReciboId === locacao.id ? 'Abrindo PDF...' : 'Recibo PDF'}
                  </button>

                  <span
                    className={
                      locacao.tipo === 'avulsa'
                        ? 'historico-badge avulsa'
                        : 'historico-badge locker'
                    }
                  >
                    {locacao.tipo === 'avulsa' ? 'Avulsa' : 'Locker'}
                  </span>
                </div>
              </div>

              <div className="historico-detalhes">
                <div>
                  <span>Recibo</span>
                  <strong>{locacao.recibo_numero || '-'}</strong>
                </div>

                <div>
                  <span>Lacres</span>
                  <strong>{locacao.lacres || '-'}</strong>
                </div>

                <div>
                  <span>Data</span>
                  <strong>{formatarData(locacao.data)}</strong>
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
                  <span>Volumes extras</span>
                  <strong>{locacao.total_volumes}</strong>
                </div>

                <div>
                  <span>Valor final</span>
                  <strong>{formatarValor(locacao.valor_pago)}</strong>
                </div>
              </div>

              <div className="historico-cliente">
                <div>
                  <span>Telefone</span>
                  <strong>{locacao.cliente_telefone || '-'}</strong>
                </div>

                <div>
                  <span>Documento / Observação</span>
                  <strong>{locacao.cliente_documento || '-'}</strong>
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

              {locacao.bagagens.length > 0 && (
                <div className="historico-bagagens">
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
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoricoPage;