import { useEffect, useState } from 'react';
import {
  getLocacoesAtivas,
  abrirReciboPdf
} from '../services/api';

function LocacoesAtivasPage({ showToast }) {
  const [locacoes, setLocacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gerandoReciboId, setGerandoReciboId] = useState(null);

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

  function formatarValor(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
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

        <span className="locacoes-total">
          {locacoes.length} ativa{locacoes.length === 1 ? '' : 's'}
        </span>
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
    </div>
  );
}

export default LocacoesAtivasPage;