import { useEffect, useState } from 'react';
import { getResumoRelatorio } from '../services/api';

function RelatoriosPage({ showToast }) {
  const [periodo, setPeriodo] = useState('hoje');
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);

  async function carregarRelatorio(periodoSelecionado = periodo) {
    try {
      setLoading(true);

      const dados = await getResumoRelatorio({
        periodo: periodoSelecionado
      });

      setResumo(dados);
    } catch (err) {
      showToast(err.message || 'Erro ao carregar relatório.', 'error');
      setResumo(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarRelatorio('hoje');
  }, []);

  function alterarPeriodo(novoPeriodo) {
    setPeriodo(novoPeriodo);
    carregarRelatorio(novoPeriodo);
  }

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

  function obterNomePeriodo() {
    if (periodo === 'hoje') return 'Hoje';
    if (periodo === '7dias') return 'Últimos 7 dias';
    if (periodo === 'mes') return 'Este mês';
    return 'Período';
  }

  if (loading && !resumo) {
    return (
      <div className="painel-container">
        <p>Carregando relatório...</p>
      </div>
    );
  }

  return (
    <div className="painel-container">
      <div className="relatorios-header">
        <div>
          <h2>Relatórios</h2>
          <p>Resumo financeiro e operacional das locações.</p>
        </div>

        {resumo && (
          <span className="relatorios-periodo">
            {obterNomePeriodo()} · {formatarData(resumo.inicio)} até{' '}
            {formatarData(resumo.fim)}
          </span>
        )}
      </div>

      <div className="relatorios-filtros">
        <button
          type="button"
          className={periodo === 'hoje' ? 'active' : ''}
          onClick={() => alterarPeriodo('hoje')}
          disabled={loading}
        >
          Hoje
        </button>

        <button
          type="button"
          className={periodo === '7dias' ? 'active' : ''}
          onClick={() => alterarPeriodo('7dias')}
          disabled={loading}
        >
          Últimos 7 dias
        </button>

        <button
          type="button"
          className={periodo === 'mes' ? 'active' : ''}
          onClick={() => alterarPeriodo('mes')}
          disabled={loading}
        >
          Este mês
        </button>
      </div>

      {loading && resumo && (
        <div className="relatorios-loading-inline">
          Atualizando relatório...
        </div>
      )}

      {!resumo ? (
        <div className="relatorios-empty">
          Nenhum dado de relatório encontrado.
        </div>
      ) : (
        <>
          <div className="relatorios-resumo-grid">
            <div className="relatorio-metrica relatorio-faturamento">
              <span>Faturamento total</span>
              <strong>{formatarValor(resumo.total_faturado)}</strong>
            </div>

            <div className="relatorio-metrica">
              <span>Locações finalizadas</span>
              <strong>{resumo.locacoes_finalizadas}</strong>
            </div>

            <div className="relatorio-metrica">
              <span>Ticket médio</span>
              <strong>{formatarValor(resumo.ticket_medio)}</strong>
            </div>

            <div className="relatorio-metrica">
              <span>Locações com locker</span>
              <strong>{resumo.locacoes_com_locker}</strong>
            </div>

            <div className="relatorio-metrica">
              <span>Bagagens avulsas</span>
              <strong>{resumo.bagagens_avulsas}</strong>
            </div>

            <div className="relatorio-metrica">
              <span>Lockers utilizados</span>
              <strong>{resumo.lockers_utilizados}</strong>
            </div>

            <div className="relatorio-metrica">
              <span>Volumes extras</span>
              <strong>{resumo.volumes_extras}</strong>
            </div>
          </div>

          <div className="relatorios-detalhamento-header">
            <h3>Detalhamento</h3>

            <span>
              {resumo.locacoes.length} registro
              {resumo.locacoes.length === 1 ? '' : 's'}
            </span>
          </div>

          {resumo.locacoes.length === 0 ? (
            <div className="relatorios-empty">
              Nenhuma locação encontrada para o período selecionado.
            </div>
          ) : (
            <div className="relatorios-lista">
              {resumo.locacoes.map(locacao => (
                <div key={locacao.id} className="relatorio-card">
                  <div className="relatorio-card-topo">
                    <div>
                      <strong>{locacao.cliente_nome || '-'}</strong>

                      <span>
                        {locacao.tipo === 'avulsa'
                          ? '📦 Bagagem avulsa'
                          : `Armário ${locacao.lockers?.join(', ') || '-'}`}
                      </span>
                    </div>

                    <span
                      className={
                        locacao.tipo === 'avulsa'
                          ? 'relatorio-badge avulsa'
                          : 'relatorio-badge locker'
                      }
                    >
                      {locacao.tipo === 'avulsa' ? 'Avulsa' : 'Locker'}
                    </span>
                  </div>

                  <div className="relatorio-detalhes">
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
                      <span>Status</span>
                      <strong>{locacao.status || '-'}</strong>
                    </div>

                    <div>
                      <span>Volumes Extras</span>
                      <strong>{locacao.total_volumes || 0}</strong>
                    </div>

                    <div>
                      <span>Valor</span>
                      <strong>{formatarValor(locacao.valor_pago)}</strong>
                    </div>
                  </div>

                  <div className="relatorio-cliente">
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

                  {locacao.bagagens && locacao.bagagens.length > 0 && (
                    <div className="relatorio-bagagens">
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
        </>
      )}
    </div>
  );
}

export default RelatoriosPage;