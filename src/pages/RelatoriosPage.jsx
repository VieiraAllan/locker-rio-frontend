import { useEffect, useState } from 'react';
import { getResumoRelatorio } from '../services/api';

function escapeCsvField(value, separador = ';') {
  const texto = String(value ?? '');

  if (
    texto.includes(separador) ||
    texto.includes('"') ||
    texto.includes('\n') ||
    texto.includes('\r')
  ) {
    return `"${texto.replace(/"/g, '""')}"`;
  }

  return texto;
}

function formatarListaLockers(lockers) {
  if (!Array.isArray(lockers) || lockers.length === 0) {
    return '';
  }

  return lockers.join(' | ');
}

function formatarListaBagagens(bagagens) {
  if (!Array.isArray(bagagens) || bagagens.length === 0) {
    return '';
  }

  return bagagens
    .map(bagagem => `${bagagem.quantidade}x ${bagagem.descricao}`)
    .join(' | ');
}

function gerarNomeArquivoCsv(periodo, inicio = '', fim = '') {
  const hoje = new Date().toISOString().slice(0, 10);

  if (periodo === 'hoje') {
    return `relatorio-locker-rio-hoje-${hoje}.csv`;
  }

  if (periodo === '7dias') {
    return `relatorio-locker-rio-ultimos-7-dias-${hoje}.csv`;
  }

  if (periodo === 'mes') {
    return `relatorio-locker-rio-este-mes-${hoje}.csv`;
  }

  if (periodo === 'personalizado' && inicio && fim) {
    return `relatorio-locker-rio-${inicio}-a-${fim}.csv`;
  }

  return `relatorio-locker-rio-${hoje}.csv`;
}

function RelatoriosPage({ showToast }) {
  const [periodo, setPeriodo] = useState('hoje');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);

  async function carregarRelatorio(filtros = { periodo }) {
    try {
      setLoading(true);

      const dados = await getResumoRelatorio(filtros);
      setResumo(dados);
    } catch (err) {
      showToast(err.message || 'Erro ao carregar relatório.', 'error');
      setResumo(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarRelatorio({ periodo: 'hoje' });
  }, []);

  function alterarPeriodo(novoPeriodo) {
    setPeriodo(novoPeriodo);
    setDataInicial('');
    setDataFinal('');
    carregarRelatorio({ periodo: novoPeriodo });
  }

  function aplicarPeriodoPersonalizado() {
    if (!dataInicial || !dataFinal) {
      showToast('Informe a data inicial e a data final.', 'error');
      return;
    }

    if (dataInicial > dataFinal) {
      showToast('A data inicial não pode ser maior que a data final.', 'error');
      return;
    }

    setPeriodo('personalizado');
    carregarRelatorio({
      inicio: dataInicial,
      fim: dataFinal
    });
  }

  function limparPeriodoPersonalizado() {
    setDataInicial('');
    setDataFinal('');
    setPeriodo('hoje');
    carregarRelatorio({ periodo: 'hoje' });
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

    const partes = String(data).split('-');

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
    if (periodo === 'personalizado') return 'Período personalizado';
    return 'Período';
  }

  function exportarCsv() {
    const lista = Array.isArray(resumo?.locacoes)
      ? resumo.locacoes
      : [];

    if (lista.length === 0) {
      showToast('Não há dados para exportar.', 'error');
      return;
    }

    const separador = ';';

    const cabecalhos = [
      'Recibo',
      'Data',
      'Entrada',
      'Pago até',
      'Cliente',
      'Telefone',
      'Documento/Observação',
      'Tipo',
      'Lockers',
      'Bagagens Extras',
      'Volumes Extras',
      'Lacres',
      'Valor Recebido',
      'Status',
      'Usuário Abertura',
      'Perfil Abertura'
    ];

    const linhas = lista.map(locacao => {
      const totalVolumes = Number(locacao.total_volumes || 0);
      const valorRecebido = Number(
        locacao.valor_recebido ?? locacao.valor_pago ?? 0
      )
        .toFixed(2)
        .replace('.', ',');

      return [
        locacao.recibo_numero || '',
        locacao.data || '',
        locacao.hora_entrada || '',
        locacao.hora_pago_ate || '',
        locacao.cliente_nome || '',
        locacao.cliente_telefone || '',
        locacao.cliente_documento || '',
        locacao.tipo || '',
        formatarListaLockers(locacao.lockers),
        formatarListaBagagens(locacao.bagagens),
        totalVolumes,
        locacao.lacres || '',
        valorRecebido,
        locacao.status || '',
        locacao.usuario_abertura_nome || '',
        locacao.usuario_abertura_perfil || ''
      ];
    });

    const conteudoCsv = [
      cabecalhos.map(campo => escapeCsvField(campo, separador)).join(separador),
      ...linhas.map(linha =>
        linha.map(campo => escapeCsvField(campo, separador)).join(separador)
      )
    ].join('\r\n');

    const csvComBom = '\uFEFF' + conteudoCsv;

    const blob = new Blob([csvComBom], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = gerarNomeArquivoCsv(
      resumo?.periodo || periodo,
      resumo?.inicio || dataInicial,
      resumo?.fim || dataFinal
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showToast('Relatório exportado em CSV com sucesso.', 'success');
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

        <button
          type="button"
          onClick={exportarCsv}
          disabled={!resumo?.locacoes?.length}
        >
          Exportar CSV
        </button>
      </div>

      <div className="relatorios-filtros relatorios-filtros-personalizados">
        <input
          type="date"
          value={dataInicial}
          onChange={e => setDataInicial(e.target.value)}
          disabled={loading}
        />

        <input
          type="date"
          value={dataFinal}
          onChange={e => setDataFinal(e.target.value)}
          disabled={loading}
        />

        <button
          type="button"
          onClick={aplicarPeriodoPersonalizado}
          disabled={loading || !dataInicial || !dataFinal}
        >
          Aplicar período
        </button>

        <button
          type="button"
          onClick={limparPeriodoPersonalizado}
          disabled={loading && !resumo}
        >
          Limpar
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
                      <span>Valor Recebido</span>
                      <strong>
                        {formatarValor(
                          locacao.valor_recebido ?? locacao.valor_pago
                        )}
                      </strong>
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