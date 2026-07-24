import { useEffect, useRef, useState } from 'react';
import LockerCard from '../components/LockerCard';
import Modal from '../components/Modal';
import {
  getLockers,
  getLocacaoAtiva,
  criarLocacao,
  finalizarLocacao,
  gerarMensagemWhatsApp,
  getAvulsasAtivas,
  getConfiguracoes,
  getLocacoesAtivas,
  atualizarStatusLocker
} from '../services/api';

function LockersPage({ showToast, usuarioAtual }) {
  const [lockers, setLockers] = useState([]);
  const [avulsas, setAvulsas] = useState([]);
  const [configuracoes, setConfiguracoes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocker, setSelectedLocker] = useState(null);
  const [selectedAvulsa, setSelectedAvulsa] = useState(null);
  const [selectedLocacao, setSelectedLocacao] = useState(null);
  const [locacoesAtivasDetalhes, setLocacoesAtivasDetalhes] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isAvulsa, setIsAvulsa] = useState(false);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteDocumento, setClienteDocumento] = useState('');
  const [valorPago, setValorPago] = useState('');
  const [lacres, setLacres] = useState('');
  const [inRioTour, setInRioTour] = useState(false);
  const [descricaoBagagem, setDescricaoBagagem] = useState('');
  const [quantidadeBagagem, setQuantidadeBagagem] = useState(1);
  const [bagagensExternas, setBagagensExternas] = useState([]);
  const [valorExcedente, setValorExcedente] = useState('');
  const [valorPagoFinal, setValorPagoFinal] = useState('');
  const [telefoneWhatsApp, setTelefoneWhatsApp] = useState('');
  const [tipoMensagemWhatsApp, setTipoMensagemWhatsApp] = useState('finalizacao');
  const [idiomaMensagemWhatsApp, setIdiomaMensagemWhatsApp] = useState('pt');
  const [whatsAppAberturaInfo, setWhatsAppAberturaInfo] = useState({
    locacaoId: null,
    clienteNome: '',
    referencia: ''
  });
  const [telefoneWhatsAppAbertura, setTelefoneWhatsAppAbertura] = useState('');
  const [idiomaMensagemAbertura, setIdiomaMensagemAbertura] = useState('');
  const [abrindoWhatsAppAbertura, setAbrindoWhatsAppAbertura] = useState(false);
  const [ajusteManualExcedenteAberto, setAjusteManualExcedenteAberto] = useState(false);
  const [lockerManutencaoAlvo, setLockerManutencaoAlvo] = useState(null);
  const [salvandoManutencao, setSalvandoManutencao] = useState(false);

  const nomeRef = useRef(null);
  const telefoneRef = useRef(null);
  const valorPagoRef = useRef(null);
  const lacresRef = useRef(null);

  const totalVolumes = bagagensExternas.reduce(
    (total, b) => total + b.quantidade,
    0
  );

  const perfilAtualNormalizado = String(usuarioAtual?.perfil || '')
    .trim()
    .toLowerCase();

  const podeAjustarManualFinalizacao = [
    'admin',
    'administrador',
    'gerente'
  ].some(perfil => perfilAtualNormalizado.includes(perfil));

  const podeGerenciarManutencao = podeAjustarManualFinalizacao;

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
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

  function normalizarValorMonetario(valor) {
    if (valor === null || valor === undefined) {
      return 0;
    }

    if (typeof valor === 'number') {
      return Number.isNaN(valor) ? 0 : valor;
    }

    const texto = String(valor).trim();

    if (!texto) {
      return 0;
    }

    const numero = Number(texto.replace(',', '.'));
    return Number.isNaN(numero) ? NaN : numero;
  }

  function formatarValorParaInput(valor) {
    return Number(valor || 0).toFixed(2).replace('.', ',');
  }

  function abrirWhatsApp({ telefone, mensagem }) {
    const telefoneOriginal = String(telefone || '').trim();
    const apenasNumeros = telefoneOriginal.replace(/\D/g, '');

    if (!apenasNumeros || !mensagem) return;

    const semDuplicidadeBrasil = apenasNumeros.replace(/^(55){2,}/, '55');

    let telefoneNormalizado = '';

    if (telefoneOriginal.startsWith('+')) {
      telefoneNormalizado = semDuplicidadeBrasil;
    } else if (telefoneOriginal.startsWith('00')) {
      telefoneNormalizado = telefoneOriginal.replace(/\D/g, '').replace(/^00/, '');
    } else if (semDuplicidadeBrasil.startsWith('55')) {
      telefoneNormalizado = semDuplicidadeBrasil;
    } else if (apenasNumeros.length >= 12) {
      telefoneNormalizado = apenasNumeros;
    } else {
      telefoneNormalizado = `55${apenasNumeros}`;
    }

    const url = new URL('https://api.whatsapp.com/send');
    url.searchParams.set('phone', telefoneNormalizado);
    url.searchParams.set('text', mensagem);

    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  }

  const quantidadeLockersSelecionados =
    isAvulsa || !selectedLocker ? 0 : 1;

  const valorLockerConfigurado = Number(
    configuracoes?.operacao?.valorLocker ?? 30
  );

  const valorBagagemAvulsaConfigurado = Number(
    configuracoes?.operacao?.valorBagagemAvulsa ?? 30
  );

  const valorHoraExcedenteConfigurado = Number(
    configuracoes?.operacao?.valorHoraExcedente ?? 5
  );

  const permitirBagagemAvulsa =
    configuracoes?.operacao?.permitirBagagemAvulsa !== false;
  const permitirInRioTour =
    configuracoes?.operacao?.permitirInRioTour !== false;
  const exigirLacres =
    configuracoes?.operacao?.exigirLacres !== false;
  const exigirTelefoneCliente =
    configuracoes?.operacao?.exigirTelefoneCliente !== false;

  const ehInRioTour = inRioTour && permitirInRioTour;

  const valorTotalLocacao =
    ehInRioTour
      ? 0
      : (isAvulsa ? 0 : valorLockerConfigurado * quantidadeLockersSelecionados) +
        valorBagagemAvulsaConfigurado * totalVolumes;

  const valorPagoPreview = normalizarValorMonetario(valorPago);

  const valorTotalLocacaoExibido =
    ehInRioTour
      ? Number.isNaN(valorPagoPreview)
        ? 0
        : valorPagoPreview
      : valorTotalLocacao;

  function calcularResumoFinalizacao(locacao) {
    if (!locacao) {
      return {
        horasExcedentes: 0,
        valorExcedenteSugerido: 0,
        valorPagoInicial: 0,
        valorPagoFinalAtual: 0,
        valorTotal: 0,
        valorPendente: 0
      };
    }

    const agora = new Date();
    const dataHoraPagoAte = new Date(`${locacao.data}T${locacao.hora_pago_ate}`);

    if (
      locacao.hora_entrada &&
      locacao.hora_pago_ate &&
      String(locacao.hora_pago_ate) < String(locacao.hora_entrada)
    ) {
      dataHoraPagoAte.setDate(dataHoraPagoAte.getDate() + 1);
    }

    const diffMs = agora - dataHoraPagoAte;
    const horasExcedentes =
      diffMs <= 0 ? 0 : Math.floor(diffMs / (1000 * 60 * 60));

    const quantidadeLockers = Array.isArray(locacao.lockers)
      ? locacao.lockers.length
      : 0;

    const quantidadeVolumesExtras = Number(locacao.total_volumes || 0);

    const valorExcedenteSugerido =
      horasExcedentes > 0
        ? horasExcedentes *
          valorHoraExcedenteConfigurado *
          (quantidadeLockers + quantidadeVolumesExtras)
        : 0;

    const valorPagoInicial = Number(locacao.valor_pago_inicial || 0);
    const valorPagoFinalAtual = Number(locacao.valor_pago_final || 0);
    const valorTotal = Number(locacao.valor_total || 0);

    const valorPendente = Math.max(
      0,
      valorTotal - valorPagoInicial - valorPagoFinalAtual
    );

    return {
      horasExcedentes,
      valorExcedenteSugerido,
      valorPagoInicial,
      valorPagoFinalAtual,
      valorTotal,
      valorPendente
    };
  }

  const resumoFinalizacao = calcularResumoFinalizacao(selectedLocacao);

  const valorExcedenteManualNormalizado = normalizarValorMonetario(valorExcedente);
  const cobrancaAdicionalEfetiva =
    ajusteManualExcedenteAberto && podeAjustarManualFinalizacao
      ? Number.isNaN(valorExcedenteManualNormalizado)
        ? NaN
        : valorExcedenteManualNormalizado
      : resumoFinalizacao.valorExcedenteSugerido;

  const totalCobrarAgora = Number.isNaN(cobrancaAdicionalEfetiva)
    ? NaN
    : resumoFinalizacao.valorPendente + cobrancaAdicionalEfetiva;

  const totalDisponiveis = lockers.filter(
    locker => locker.status === 'disponivel'
  ).length;
  const totalOcupados = lockers.filter(
    locker => locker.status === 'ocupado'
  ).length;
  const totalManutencao = lockers.filter(
    locker => locker.status === 'manutencao'
  ).length;
  const totalAvulsas = avulsas.length;

  async function carregarLockers() {
    try {
      const dados = await getLockers();
      setLockers(dados);
    } catch {
      setLockers([]);
    }

    try {
      const dadosLocacoesAtivas = await getLocacoesAtivas();
      setLocacoesAtivasDetalhes(dadosLocacoesAtivas);
    } catch {
      setLocacoesAtivasDetalhes([]);
    }

    try {
      const dadosAvulsas = await getAvulsasAtivas();
      setAvulsas(dadosAvulsas);
    } catch {
      setAvulsas([]);
    }

    try {
      const dadosConfiguracoes = await getConfiguracoes();
      setConfiguracoes(dadosConfiguracoes);
    } catch {
      setConfiguracoes(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    carregarLockers();
  }, []);

  useEffect(() => {
    if (modalType === 'nova') {
      setTimeout(() => nomeRef.current?.focus(), 0);
    }
  }, [modalType]);

  useEffect(() => {
    if (modalType === 'finalizar') {
      const telefonePadrao =
        selectedLocacao?.cliente_telefone ||
        selectedAvulsa?.cliente_telefone ||
        '';

      setTelefoneWhatsApp(telefonePadrao);
      setAjusteManualExcedenteAberto(false);
      setValorExcedente('');

      const totalInicial = resumoFinalizacao.valorPendente + resumoFinalizacao.valorExcedenteSugerido;
      setValorPagoFinal(formatarValorParaInput(totalInicial));
    }
  }, [modalType, selectedLocacao, selectedAvulsa]);

  function resetModal() {
    setSubmitting(false);
    setIsAvulsa(false);
    setSelectedAvulsa(null);
    setSelectedLocacao(null);
    setClienteNome('');
    setClienteTelefone('');
    setClienteDocumento('');
    setValorPago('');
    setLacres('');
    setInRioTour(false);
    setDescricaoBagagem('');
    setQuantidadeBagagem(1);
    setBagagensExternas([]);
    setValorExcedente('');
    setValorPagoFinal('');
    setTelefoneWhatsApp('');
    setTipoMensagemWhatsApp('finalizacao');
    setIdiomaMensagemWhatsApp('pt');
    setWhatsAppAberturaInfo({
      locacaoId: null,
      clienteNome: '',
      referencia: ''
    });
    setTelefoneWhatsAppAbertura('');
    setIdiomaMensagemAbertura('');
    setAbrindoWhatsAppAbertura(false);
    setAjusteManualExcedenteAberto(false);
  }

  function handleLockerClick(locker) {
    if (locker.status === 'manutencao') return;

    resetModal();
    setIsAvulsa(false);
    setSelectedLocker(locker);

    if (locker.status === 'disponivel') {
      setSelectedLocacao(null);
      setModalType('nova');
      return;
    }

    const locacaoAtiva = locacoesAtivasDetalhes.find(locacao =>
      Array.isArray(locacao.lockers) &&
      locacao.lockers.some(numero => String(numero) === String(locker.numero))
    );

    setSelectedLocacao(locacaoAtiva || null);
    setModalType('finalizar');
  }

  function abrirModalManutencao(locker) {
    setLockerManutencaoAlvo(locker);
    setModalType('manutencao_locker');
  }

  function fecharModalManutencao() {
    setLockerManutencaoAlvo(null);
    setSalvandoManutencao(false);

    if (modalType === 'manutencao_locker') {
      setModalType(null);
    }
  }

  async function confirmarAlteracaoManutencao() {
    if (!lockerManutencaoAlvo?.id || salvandoManutencao) return;

    const novoStatus =
      lockerManutencaoAlvo.status === 'manutencao' ? 'disponivel' : 'manutencao';

    try {
      setSalvandoManutencao(true);
      await atualizarStatusLocker(lockerManutencaoAlvo.id, novoStatus);
      showToast(
        novoStatus === 'manutencao'
          ? 'Locker colocado em manutenção com sucesso.'
          : 'Locker reativado com sucesso.',
        'success'
      );
      await carregarLockers();
      fecharModalManutencao();
    } catch (err) {
      showToast(err.message || 'Erro ao atualizar manutenção do locker.', 'error');
      setSalvandoManutencao(false);
    }
  }

  function handleAvulsaClick() {
    if (!permitirBagagemAvulsa) {
      showToast('Bagagem avulsa está desabilitada nas configurações.', 'error');
      return;
    }

    resetModal();
    setIsAvulsa(true);
    setSelectedLocker(null);
    setModalType('nova');
  }

  function handleAvulsaAtivaClick(avulsa) {
    resetModal();
    setIsAvulsa(true);
    setSelectedAvulsa(avulsa);
    setSelectedLocker(null);

    const locacaoAtiva = locacoesAtivasDetalhes.find(
      locacao => String(locacao.id) === String(avulsa.id)
    );

    setSelectedLocacao(locacaoAtiva || null);
    setModalType('finalizar');
  }

  function closeModal() {
    setSelectedLocker(null);
    setSelectedAvulsa(null);
    setSelectedLocacao(null);
    setLockerManutencaoAlvo(null);
    setSalvandoManutencao(false);
    setModalType(null);
    resetModal();
  }

  function adicionarBagagem() {
    if (!descricaoBagagem.trim() || quantidadeBagagem <= 0) {
      showToast('Informe descrição e quantidade da bagagem.', 'error');
      return;
    }

    setBagagensExternas(prev => [
      ...prev,
      { descricao: descricaoBagagem, quantidade: quantidadeBagagem }
    ]);

    setDescricaoBagagem('');
    setQuantidadeBagagem(1);
  }

  async function confirmarNovaLocacao() {
    if (!usuarioAtual || !usuarioAtual.id) {
      showToast('Usuário logado não identificado. Faça login novamente.', 'error');
      return;
    }

    if (exigirTelefoneCliente && !clienteTelefone.trim()) {
      showToast('Informe o telefone do cliente.', 'error');
      telefoneRef.current?.focus();
      return;
    }

    if (valorPago === '') {
      showToast('Informe o valor pago (pode ser zero).', 'error');
      valorPagoRef.current?.focus();
      return;
    }

    const valorNormalizado = Number(String(valorPago).replace(',', '.'));

    if (Number.isNaN(valorNormalizado) || valorNormalizado < 0) {
      showToast('Valor pago inválido.', 'error');
      valorPagoRef.current?.focus();
      return;
    }

    if (!ehInRioTour && valorNormalizado > valorTotalLocacao) {
      showToast(
        'O valor pago agora não pode ser maior que o valor total da locação.',
        'error'
      );
      valorPagoRef.current?.focus();
      return;
    }

    if (exigirLacres && !lacres.trim()) {
      showToast('Informe a numeração dos lacres.', 'error');
      lacresRef.current?.focus();
      return;
    }

    if (isAvulsa && bagagensExternas.length === 0) {
      showToast('Bagagem avulsa exige ao menos uma bagagem.', 'error');
      return;
    }

    const lockerIdsPayload = isAvulsa ? [] : [selectedLocker.id];

    try {
      setSubmitting(true);

      const referenciaAbertura = isAvulsa
        ? 'Bagagem avulsa'
        : `Armário ${selectedLocker?.numero}`;
      const telefoneClienteAtual = clienteTelefone.trim();
      const nomeClienteAtual = clienteNome.trim();

      const resultadoCriacao = await criarLocacao({
        locker_ids: lockerIdsPayload,
        in_rio_tour: permitirInRioTour ? inRioTour : false,
        bagagens_externas: bagagensExternas,
        cliente_nome: clienteNome,
        cliente_telefone: clienteTelefone,
        cliente_documento: clienteDocumento,
        lacres,
        valor_pago_inicial: valorNormalizado,
        usuario_abertura_id: usuarioAtual.id,
        usuario_abertura_nome: usuarioAtual.nome,
        usuario_abertura_perfil: usuarioAtual.perfil
      });

      showToast('Locação criada com sucesso.', 'success');
      await carregarLockers();

      const locacaoCriadaId = resultadoCriacao?.locacao?.id;

      if (locacaoCriadaId && telefoneClienteAtual) {
        setSelectedLocker(null);
        setSelectedAvulsa(null);
        setSelectedLocacao(null);
        setIsAvulsa(false);
        setClienteNome('');
        setClienteTelefone('');
        setClienteDocumento('');
        setValorPago('');
        setLacres('');
        setInRioTour(false);
        setDescricaoBagagem('');
        setQuantidadeBagagem(1);
        setBagagensExternas([]);
        setValorExcedente('');
        setValorPagoFinal('');
        setTelefoneWhatsApp('');
        setTipoMensagemWhatsApp('finalizacao');
        setIdiomaMensagemWhatsApp('pt');
        setSubmitting(false);

        setWhatsAppAberturaInfo({
          locacaoId: locacaoCriadaId,
          clienteNome: nomeClienteAtual,
          referencia: referenciaAbertura
        });
        setTelefoneWhatsAppAbertura(telefoneClienteAtual);
        setIdiomaMensagemAbertura('');
        setModalType('whatsapp_abertura');
        return;
      }

      if (!telefoneClienteAtual) {
        showToast(
          'Locação criada. Como não há telefone cadastrado, a mensagem de abertura poderá ser enviada depois em Locações Ativas.',
          'success'
        );
      }

      setTimeout(closeModal, 600);
    } catch (err) {
      showToast(err.message || 'Erro ao criar locação.', 'error');
      setSubmitting(false);
    }
  }

  async function handleAbrirWhatsAppAbertura() {
    if (abrindoWhatsAppAbertura) return;

    if (!telefoneWhatsAppAbertura.trim()) {
      showToast('Informe o telefone para o WhatsApp.', 'error');
      return;
    }

    if (!idiomaMensagemAbertura) {
      showToast('Selecione o idioma da mensagem.', 'error');
      return;
    }

    if (!whatsAppAberturaInfo.locacaoId) {
      showToast('Locação recém-criada não identificada.', 'error');
      return;
    }

    try {
      setAbrindoWhatsAppAbertura(true);

      const resultadoMensagem = await gerarMensagemWhatsApp(
        whatsAppAberturaInfo.locacaoId,
        {
          tipo: 'abertura',
          idioma: idiomaMensagemAbertura,
          telefone: telefoneWhatsAppAbertura.trim()
        }
      );

      if (!resultadoMensagem?.mensagem) {
        throw new Error('Mensagem de abertura não retornada.');
      }

      abrirWhatsApp({
        telefone: telefoneWhatsAppAbertura.trim(),
        mensagem: resultadoMensagem.mensagem
      });

      closeModal();
    } catch (err) {
      showToast(err.message || 'Erro ao gerar mensagem de abertura.', 'error');
      setAbrindoWhatsAppAbertura(false);
    }
  }

  function pularWhatsAppAbertura() {
    closeModal();
  }

  function prepararConfirmacaoFinalizacao() {
    if (submitting) return;

    if (ajusteManualExcedenteAberto && podeAjustarManualFinalizacao) {
      if (valorExcedente.trim() === '') {
        showToast('Informe a cobrança de excedente manual.', 'error');
        return;
      }

      if (Number.isNaN(valorExcedenteManualNormalizado) || valorExcedenteManualNormalizado < 0) {
        showToast('Cobrança de excedente manual inválida.', 'error');
        return;
      }
    }

    if (Number.isNaN(totalCobrarAgora) || totalCobrarAgora < 0) {
      showToast('Total a cobrar agora inválido.', 'error');
      return;
    }

    if (valorPagoFinal.trim() === '') {
      showToast('Informe o valor recebido agora.', 'error');
      return;
    }

    const valorPagoFinalNormalizado = normalizarValorMonetario(valorPagoFinal);

    if (Number.isNaN(valorPagoFinalNormalizado) || valorPagoFinalNormalizado < 0) {
      showToast('Valor recebido agora inválido.', 'error');
      return;
    }

    if (Math.abs(valorPagoFinalNormalizado - totalCobrarAgora) > 0.009) {
      showToast(
        'A locação só pode ser finalizada com o valor recebido agora igual ao total a cobrar agora.',
        'error'
      );
      return;
    }

    setModalType('confirmar_finalizacao');
  }

  function voltarParaFinalizacao() {
    setModalType('finalizar');
  }

  async function confirmarFinalizacaoDefinitiva() {
    if (submitting) return;

    if (ajusteManualExcedenteAberto && podeAjustarManualFinalizacao) {
      if (valorExcedente.trim() === '') {
        showToast('Informe a cobrança de excedente manual.', 'error');
        setModalType('finalizar');
        return;
      }

      if (Number.isNaN(valorExcedenteManualNormalizado) || valorExcedenteManualNormalizado < 0) {
        showToast('Cobrança de excedente manual inválida.', 'error');
        setModalType('finalizar');
        return;
      }
    }

    if (Number.isNaN(totalCobrarAgora) || totalCobrarAgora < 0) {
      showToast('Total a cobrar agora inválido.', 'error');
      setModalType('finalizar');
      return;
    }

    if (valorPagoFinal.trim() === '') {
      showToast('Informe o valor recebido agora.', 'error');
      setModalType('finalizar');
      return;
    }

    const valorPagoFinalNormalizado = normalizarValorMonetario(valorPagoFinal);

    if (Number.isNaN(valorPagoFinalNormalizado) || valorPagoFinalNormalizado < 0) {
      showToast('Valor recebido agora inválido.', 'error');
      setModalType('finalizar');
      return;
    }

    if (Math.abs(valorPagoFinalNormalizado - totalCobrarAgora) > 0.009) {
      showToast(
        'A locação só pode ser finalizada com o valor recebido agora igual ao total a cobrar agora.',
        'error'
      );
      setModalType('finalizar');
      return;
    }

    try {
      setSubmitting(true);

      const locacaoId = selectedLocacao?.id
        ? selectedLocacao.id
        : isAvulsa
          ? selectedAvulsa.id
          : await getLocacaoAtiva(selectedLocker.id);

      await finalizarLocacao(locacaoId, {
        valor_excedente_manual:
          ajusteManualExcedenteAberto && podeAjustarManualFinalizacao
            ? valorExcedenteManualNormalizado
            : null,
        valor_pago_final: valorPagoFinalNormalizado
      });

      await carregarLockers();

      if (telefoneWhatsApp.trim()) {
        const resultadoMensagem = await gerarMensagemWhatsApp(locacaoId, {
          tipo: tipoMensagemWhatsApp,
          idioma: idiomaMensagemWhatsApp,
          telefone: telefoneWhatsApp.trim()
        });

        if (resultadoMensagem?.mensagem) {
          abrirWhatsApp({
            telefone: telefoneWhatsApp.trim(),
            mensagem: resultadoMensagem.mensagem
          });
        }
      }

      showToast('Locação finalizada com sucesso.', 'success');
      setTimeout(closeModal, 600);
    } catch (err) {
      showToast(err.message || 'Erro ao finalizar locação.', 'error');
      setSubmitting(false);
      setModalType('finalizar');
    }
  }

  if (loading) {
    return (
      <div className="painel-container">
        <p>Carregando lockers...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="painel-container">
        <h2>Painel de Lockers</h2>

        <div className="painel-resumo">
          <div className="resumo-item resumo-disponivel">
            <span>Disponíveis</span>
            <strong>{totalDisponiveis}</strong>
          </div>
          <div className="resumo-item resumo-ocupado">
            <span>Ocupados</span>
            <strong>{totalOcupados}</strong>
          </div>
          <div className="resumo-item resumo-manutencao">
            <span>Manutenção</span>
            <strong>{totalManutencao}</strong>
          </div>
          <div className="resumo-item resumo-avulsa">
            <span>Avulsas</span>
            <strong>{totalAvulsas}</strong>
          </div>
        </div>

        <div className="lockers-grid">
          {lockers.map(locker => (
            <LockerCard
              key={locker.id}
              numero={locker.numero}
              status={locker.status}
              onClick={() => handleLockerClick(locker)}
              exibirAcaoManutencao={podeGerenciarManutencao && locker.status !== 'ocupado'}
              textoAcaoManutencao={locker.status === 'manutencao' ? 'Reativar' : 'Manutenção'}
              onAcaoManutencao={() => abrirModalManutencao(locker)}
            />
          ))}

          {permitirBagagemAvulsa && (
            <div className="avulsa-add-card" onClick={handleAvulsaClick}>
              + 📦 Bagagem avulsa
            </div>
          )}

          {avulsas.map(avulsa => (
            <div
              key={avulsa.id}
              className="avulsa-card"
              onClick={() => handleAvulsaAtivaClick(avulsa)}
            >
              📦 {avulsa.cliente_nome} ({avulsa.total_volumes})
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={modalType === 'manutencao_locker'}
        title={lockerManutencaoAlvo?.status === 'manutencao' ? 'Reativar locker' : 'Colocar locker em manutenção'}
        onClose={fecharModalManutencao}
      >
        <div className="locker-manutencao-modal">
          <p className="locker-manutencao-texto">
            {lockerManutencaoAlvo?.status === 'manutencao'
              ? `O armário ${lockerManutencaoAlvo?.numero} voltará a ficar disponível para novas locações.`
              : `O armário ${lockerManutencaoAlvo?.numero} ficará indisponível para novas locações até ser reativado.`}
          </p>

          <div className="locker-manutencao-acoes">
            <button
              type="button"
              className="locker-manutencao-btn-modal secundario"
              onClick={fecharModalManutencao}
              disabled={salvandoManutencao}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="locker-manutencao-btn-modal principal"
              onClick={confirmarAlteracaoManutencao}
              disabled={salvandoManutencao}
            >
              {salvandoManutencao
                ? 'Salvando...'
                : lockerManutencaoAlvo?.status === 'manutencao'
                  ? 'Confirmar reativação'
                  : 'Confirmar manutenção'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        key={isAvulsa ? 'modal-nova-avulsa' : 'modal-nova-locker'}
        isOpen={modalType === 'nova'}
        title={
          isAvulsa
            ? 'Nova locação – Bagagem avulsa'
            : `Nova locação - Armário ${selectedLocker?.numero}`
        }
        onClose={closeModal}
        onConfirm={confirmarNovaLocacao}
        confirmDisabled={submitting}
      >
        <input
          ref={nomeRef}
          placeholder="Nome completo"
          value={clienteNome}
          onChange={e => setClienteNome(e.target.value)}
        />

        <input
          ref={telefoneRef}
          placeholder={
            exigirTelefoneCliente
              ? 'Telefone (WhatsApp)'
              : 'Telefone (WhatsApp) — opcional'
          }
          value={clienteTelefone}
          onChange={e => setClienteTelefone(e.target.value)}
        />

        <input
          placeholder="Documento / Observação"
          value={clienteDocumento}
          onChange={e => setClienteDocumento(e.target.value)}
        />

        <div className="valor-locacao-resumo">
          <span>{ehInRioTour ? 'Valor definido para cliente In Rio Tour' : 'Valor total da locação'}</span>
          <strong>{formatarMoeda(valorTotalLocacaoExibido)}</strong>
        </div>

        <input
          ref={valorPagoRef}
          placeholder={ehInRioTour ? 'Valor livre para cliente In Rio Tour' : 'Valor pago agora'}
          value={valorPago}
          onChange={e => setValorPago(e.target.value)}
        />

        <input
          ref={lacresRef}
          placeholder={
            exigirLacres
              ? 'Numeração dos lacres'
              : 'Numeração dos lacres — opcional'
          }
          value={lacres}
          onChange={e => setLacres(e.target.value)}
        />

        {permitirInRioTour && (
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={inRioTour}
              onChange={e => setInRioTour(e.target.checked)}
            />
            Cliente In Rio Tour
          </label>
        )}

        <h4>Bagagens externas</h4>

        <input
          placeholder="Descrição da bagagem"
          value={descricaoBagagem}
          onChange={e => setDescricaoBagagem(e.target.value)}
        />

        <input
          type="number"
          min="1"
          value={quantidadeBagagem}
          onChange={e => setQuantidadeBagagem(Number(e.target.value))}
        />

        <button type="button" onClick={adicionarBagagem}>
          Adicionar bagagem
        </button>

        {bagagensExternas.length > 0 && (
          <ul className="bagagens-lista">
            {bagagensExternas.map((b, i) => (
              <li key={i} className="bagagem-item">
                <span className="bagagem-info">
                  {b.descricao} — {b.quantidade}
                </span>
                <button
                  type="button"
                  className="bagagem-remover"
                  onClick={() =>
                    setBagagensExternas(prev =>
                      prev.filter((_, idx) => idx !== i)
                    )
                  }
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}

        {bagagensExternas.length > 0 && (
          <p>Total de volumes: {totalVolumes}</p>
        )}

        <button onClick={confirmarNovaLocacao} disabled={submitting}>
          {submitting ? 'Salvando...' : 'Confirmar locação'}
        </button>
      </Modal>

      <Modal
        isOpen={modalType === 'whatsapp_abertura'}
        title="Mensagem de abertura"
        onClose={closeModal}
        confirmDisabled={abrindoWhatsAppAbertura}
      >
        <div className="whatsapp-abertura-modal">
          <div className="whatsapp-abertura-resumo">
            <div>
              <span>Cliente</span>
              <strong>{whatsAppAberturaInfo.clienteNome || '-'}</strong>
            </div>
            <div>
              <span>Referência</span>
              <strong>{whatsAppAberturaInfo.referencia || '-'}</strong>
            </div>
          </div>

          <p className="whatsapp-abertura-texto">
            A locação foi criada com sucesso. Se desejar, envie agora a mensagem de abertura ao cliente.
          </p>

          <div className="whatsapp-config-grid whatsapp-config-grid-abertura">
            <div className="whatsapp-config-item">
              <label>Idioma</label>
              <select
                value={idiomaMensagemAbertura}
                onChange={e => setIdiomaMensagemAbertura(e.target.value)}
              >
                <option value="">Selecione o idioma</option>
                <option value="pt">Português</option>
                <option value="en">Inglês</option>
                <option value="es">Espanhol</option>
              </select>
            </div>
          </div>

          <input
            placeholder="Telefone para WhatsApp"
            value={telefoneWhatsAppAbertura}
            onChange={e => setTelefoneWhatsAppAbertura(e.target.value)}
          />

          <div className="whatsapp-abertura-acoes">
            <button
              type="button"
              className="whatsapp-abertura-btn secundario"
              onClick={pularWhatsAppAbertura}
              disabled={abrindoWhatsAppAbertura}
            >
              Pular por agora
            </button>

            <button
              type="button"
              className="whatsapp-abertura-btn principal"
              onClick={handleAbrirWhatsAppAbertura}
              disabled={abrindoWhatsAppAbertura}
            >
              {abrindoWhatsAppAbertura ? 'Abrindo WhatsApp...' : 'Abrir WhatsApp'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalType === 'finalizar'}
        title={
          isAvulsa
            ? `Finalizar bagagem avulsa - ${selectedAvulsa?.cliente_nome}`
            : `Finalizar locação - Armário ${selectedLocker?.numero}`
        }
        onClose={closeModal}
        onConfirm={prepararConfirmacaoFinalizacao}
        confirmDisabled={submitting}
      >
        <div className="finalizacao-grid">
          <section className="finalizacao-card">
            <h4>Identificação</h4>
            <div className="finalizacao-info-lista">
              <div>
                <span>Cliente</span>
                <strong>{selectedLocacao?.cliente_nome || selectedAvulsa?.cliente_nome || '-'}</strong>
              </div>
              <div>
                <span>Recibo</span>
                <strong>{selectedLocacao?.recibo_numero || '-'}</strong>
              </div>
              <div>
                <span>Telefone</span>
                <strong>{selectedLocacao?.cliente_telefone || '-'}</strong>
              </div>
              <div>
                <span>Tipo</span>
                <strong>{selectedLocacao?.tipo === 'avulsa' ? 'Bagagem avulsa' : 'Locker'}</strong>
              </div>
              <div>
                <span>Armário(s)</span>
                <strong>
                  {selectedLocacao?.tipo === 'avulsa'
                    ? '-'
                    : selectedLocacao?.lockers?.join(', ') || selectedLocker?.numero || '-'}
                </strong>
              </div>
            </div>
          </section>

          <section className="finalizacao-card">
            <h4>Resumo da locação</h4>
            <div className="finalizacao-info-lista">
              <div>
                <span>Data</span>
                <strong>{formatarData(selectedLocacao?.data)}</strong>
              </div>
              <div>
                <span>Entrada</span>
                <strong>{selectedLocacao?.hora_entrada || '-'}</strong>
              </div>
              <div>
                <span>Pago até</span>
                <strong>{selectedLocacao?.hora_pago_ate || '-'}</strong>
              </div>
              <div>
                <span>Lacres</span>
                <strong>{selectedLocacao?.lacres || '-'}</strong>
              </div>
              <div>
                <span>Volumes extras</span>
                <strong>{selectedLocacao?.total_volumes || 0}</strong>
              </div>
              <div>
                <span>Aberta por</span>
                <strong>
                  {selectedLocacao?.usuario_abertura_nome
                    ? `${selectedLocacao.usuario_abertura_nome} — ${selectedLocacao.usuario_abertura_perfil}`
                    : '-'}
                </strong>
              </div>
              <div>
                <span>Horas excedentes</span>
                <strong>{resumoFinalizacao.horasExcedentes}</strong>
              </div>
              <div>
                <span>Cobrança de excedente calculada</span>
                <strong>{formatarMoeda(resumoFinalizacao.valorExcedenteSugerido)}</strong>
              </div>
            </div>
          </section>

          <section className="finalizacao-card finalizacao-card-financeiro">
            <h4>Financeiro</h4>
            <div className="finalizacao-metricas">
              <div className="finalizacao-metrica">
                <span>Valor contratado</span>
                <strong>{formatarMoeda(resumoFinalizacao.valorTotal)}</strong>
              </div>
              <div className="finalizacao-metrica">
                <span>Pago na abertura</span>
                <strong>{formatarMoeda(resumoFinalizacao.valorPagoInicial)}</strong>
              </div>
              <div className="finalizacao-metrica">
                <span>Cobrança de excedente</span>
                <strong>
                  {ajusteManualExcedenteAberto && podeAjustarManualFinalizacao
                    ? formatarMoeda(cobrancaAdicionalEfetiva || 0)
                    : formatarMoeda(resumoFinalizacao.valorExcedenteSugerido)}
                </strong>
              </div>
              <div className="finalizacao-metrica destaque">
                <span>Total a cobrar agora</span>
                <strong>{formatarMoeda(totalCobrarAgora || 0)}</strong>
              </div>
            </div>

            <div className="finalizacao-campo-principal">
              <label>Valor recebido agora</label>
              <input
                placeholder="Valor recebido agora"
                value={valorPagoFinal}
                onChange={e => setValorPagoFinal(e.target.value)}
              />
            </div>

            {podeAjustarManualFinalizacao && (
              <div className="finalizacao-ajuste-manual-area">
                <button
                  type="button"
                  className="finalizacao-ajuste-toggle"
                  onClick={() => {
                    const proximoAberto = !ajusteManualExcedenteAberto;
                    setAjusteManualExcedenteAberto(proximoAberto);

                    if (!proximoAberto) {
                      setValorExcedente('');
                      setValorPagoFinal(
                        formatarValorParaInput(
                          resumoFinalizacao.valorPendente + resumoFinalizacao.valorExcedenteSugerido
                        )
                      );
                    }
                  }}
                >
                  {ajusteManualExcedenteAberto
                    ? 'Cancelar ajuste manual'
                    : 'Ajustar cobrança manualmente'}
                </button>

                {ajusteManualExcedenteAberto && (
                  <div className="finalizacao-campo-principal finalizacao-campo-secundario">
                    <label>Cobrança de excedente manual</label>
                    <input
                      placeholder="Cobrança de excedente manual"
                      value={valorExcedente}
                      onChange={e => setValorExcedente(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="whatsapp-config-grid">
              <div className="whatsapp-config-item">
                <label>Tipo da mensagem</label>
                <select
                  value={tipoMensagemWhatsApp}
                  onChange={e => setTipoMensagemWhatsApp(e.target.value)}
                >
                  <option value="finalizacao">Finalização</option>
                  <option value="atraso">Atraso</option>
                  <option value="fechamento_proximo">Loja próxima de fechar</option>
                </select>
              </div>

              <div className="whatsapp-config-item">
                <label>Idioma</label>
                <select
                  value={idiomaMensagemWhatsApp}
                  onChange={e => setIdiomaMensagemWhatsApp(e.target.value)}
                >
                  <option value="pt">Português</option>
                  <option value="en">Inglês</option>
                  <option value="es">Espanhol</option>
                </select>
              </div>
            </div>

            <input
              placeholder="Telefone para WhatsApp"
              value={telefoneWhatsApp}
              onChange={e => setTelefoneWhatsApp(e.target.value)}
            />
          </section>
        </div>

        <button onClick={prepararConfirmacaoFinalizacao} disabled={submitting}>
          {submitting ? 'Finalizando...' : 'Finalizar locação'}
        </button>
      </Modal>

      <Modal
        isOpen={modalType === 'confirmar_finalizacao'}
        title="Confirmar finalização"
        onClose={closeModal}
      >
        <div className="confirmacao-finalizacao-modal">
          <p className="confirmacao-finalizacao-texto">
            Revise as informações abaixo antes de concluir a finalização da locação.
          </p>

          <div className="confirmacao-finalizacao-resumo">
            <div>
              <span>Cliente</span>
              <strong>{selectedLocacao?.cliente_nome || selectedAvulsa?.cliente_nome || '-'}</strong>
            </div>
            <div>
              <span>Referência</span>
              <strong>
                {isAvulsa
                  ? 'Bagagem avulsa'
                  : `Armário ${selectedLocacao?.lockers?.join(', ') || selectedLocker?.numero || '-'}`}
              </strong>
            </div>
            <div>
              <span>Total a cobrar agora</span>
              <strong>{formatarMoeda(totalCobrarAgora || 0)}</strong>
            </div>
            <div>
              <span>Valor recebido agora</span>
              <strong>{formatarMoeda(normalizarValorMonetario(valorPagoFinal) || 0)}</strong>
            </div>
            <div>
              <span>Cobrança de excedente</span>
              <strong>{formatarMoeda(cobrancaAdicionalEfetiva || 0)}</strong>
            </div>
            <div>
              <span>Mensagem WhatsApp</span>
              <strong>
                {telefoneWhatsApp.trim()
                  ? `${tipoMensagemWhatsApp} · ${idiomaMensagemWhatsApp}`
                  : 'Não enviar'}
              </strong>
            </div>
          </div>

          <div className="confirmacao-finalizacao-acoes">
            <button
              type="button"
              className="confirmacao-finalizacao-btn secundario"
              onClick={voltarParaFinalizacao}
              disabled={submitting}
            >
              Voltar
            </button>

            <button
              type="button"
              className="confirmacao-finalizacao-btn principal"
              onClick={confirmarFinalizacaoDefinitiva}
              disabled={submitting}
            >
              {submitting ? 'Finalizando...' : 'Confirmar finalização'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default LockersPage;