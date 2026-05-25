import { useEffect, useRef, useState } from 'react';
import LockerCard from '../components/LockerCard';
import Modal from '../components/Modal';

import {
  getLockers,
  criarLocacao,
  getLocacaoAtiva,
  finalizarLocacao,
  gerarLinkWhatsAppFinalizacao,
  getAvulsasAtivas,
  getConfiguracoes
} from '../services/api';

function LockersPage({ showToast, usuarioAtual }) {
  const [lockers, setLockers] = useState([]);
  const [avulsas, setAvulsas] = useState([]);
  const [configuracoes, setConfiguracoes] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedLocker, setSelectedLocker] = useState(null);
  const [selectedAvulsa, setSelectedAvulsa] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ✅ NOVO: identifica locação sem locker
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
  const [telefoneWhatsApp, setTelefoneWhatsApp] = useState('');

  const nomeRef = useRef(null);
  const telefoneRef = useRef(null);
  const valorPagoRef = useRef(null);
  const lacresRef = useRef(null);

  const totalVolumes = bagagensExternas.reduce(
    (total, b) => total + b.quantidade,
    0
  );

  const permitirBagagemAvulsa =
  configuracoes?.operacao?.permitirBagagemAvulsa !== false;

const permitirInRioTour =
  configuracoes?.operacao?.permitirInRioTour !== false;

const exigirLacres =
  configuracoes?.operacao?.exigirLacres !== false;

const exigirTelefoneCliente =
  configuracoes?.operacao?.exigirTelefoneCliente !== false;

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

  function resetModal() {
    setSubmitting(false);
    setIsAvulsa(false);
    setSelectedAvulsa(null);
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
    setTelefoneWhatsApp('');
  }

  function handleLockerClick(locker) {
    if (locker.status === 'manutencao') return;
    resetModal();
    setIsAvulsa(false);
    setSelectedLocker(locker);
    setModalType(locker.status === 'disponivel' ? 'nova' : 'finalizar');
  }

  // ✅ NOVO: clique em bagagem avulsa
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
  setModalType('finalizar');
  }

  function closeModal() {
    setSelectedLocker(null);
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

    if (exigirLacres && !lacres.trim()) {
    showToast('Informe a numeração dos lacres.', 'error');
    lacresRef.current?.focus();
    return;
    }

    // ✅ avulsa exige bagagem
    if (isAvulsa && bagagensExternas.length === 0) {
      showToast('Bagagem avulsa exige ao menos uma bagagem.', 'error');
      return;
    }

    const lockerIdsPayload = isAvulsa
      ? []
      : [selectedLocker.id];

    try {
      setSubmitting(true);

      await criarLocacao({
        locker_ids: lockerIdsPayload,
        in_rio_tour: permitirInRioTour ? inRioTour : false,
        bagagens_externas: bagagensExternas,
        cliente_nome: clienteNome,
        cliente_telefone: clienteTelefone,
        cliente_documento: clienteDocumento,
        lacres,
        usuario_abertura_id: usuarioAtual.id,
        usuario_abertura_nome: usuarioAtual.nome,
        usuario_abertura_perfil: usuarioAtual.perfil
      });

      showToast('Locação criada com sucesso.', 'success');
      await carregarLockers();
      setTimeout(closeModal, 600);

    } catch (err) {
      showToast(err.message || 'Erro ao criar locação.', 'error');
      setSubmitting(false);
    }
  }

  
async function confirmarFinalizacao() {
  if (submitting) return;

  const mensagemConfirmacao = isAvulsa
    ? `Confirmar finalização da bagagem avulsa de ${selectedAvulsa?.cliente_nome}?`
    : `Confirmar finalização da locação do armário ${selectedLocker.numero}?`;

  const confirmar = window.confirm(mensagemConfirmacao);

  if (!confirmar) return;

  try {
    setSubmitting(true);

    const locacaoId = isAvulsa
      ? selectedAvulsa.id
      : await getLocacaoAtiva(selectedLocker.id);

    const valor =
      inRioTour && valorExcedente
        ? Number(String(valorExcedente).replace(',', '.'))
        : null;

    await finalizarLocacao(locacaoId, valor);
    await carregarLockers();

    if (telefoneWhatsApp) {
      window.open(
        gerarLinkWhatsAppFinalizacao(locacaoId, telefoneWhatsApp),
        '_blank'
      );
    }

    showToast('Locação finalizada com sucesso.', 'success');
    setTimeout(closeModal, 600);

  } catch (err) {
    showToast(err.message || 'Erro ao finalizar locação.', 'error');
    setSubmitting(false);
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
            />
          ))}

          {/*✅ CARD BAGAGEM AVULSA*/}
          {permitirBagagemAvulsa && (
          <div
            className="avulsa-add-card"
            onClick={handleAvulsaClick}
          >
            + 📦 Bagagem avulsa
          </div>
          )}

          {/*✅ LISTAGEM DE BAGAGENS AVULSAS ATIVAS*/}
          
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

      {/*NOVA LOCAÇÃO*/}
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
        <input ref={nomeRef} placeholder="Nome completo" value={clienteNome} onChange={e => setClienteNome(e.target.value)} />
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
        <input placeholder="Documento / Observação" value={clienteDocumento} onChange={e => setClienteDocumento(e.target.value)} />

        <input ref={valorPagoRef} placeholder="Valor pago na locação" value={valorPago} onChange={e => setValorPago(e.target.value)} />
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
          <input type="checkbox"
          checked={inRioTour}
          onChange={e => setInRioTour(e.target.checked)}
          />
          Cliente In Rio Tour
        </label>
        )}

        <h4>Bagagens externas</h4>

        <input placeholder="Descrição da bagagem" value={descricaoBagagem} onChange={e => setDescricaoBagagem(e.target.value)} />
        <input type="number" min="1" value={quantidadeBagagem} onChange={e => setQuantidadeBagagem(Number(e.target.value))} />

        <button type="button" onClick={adicionarBagagem}>Adicionar bagagem</button>

        
            
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

      {/* FINALIZAR LOCAÇÃO */}
    <Modal
      isOpen={modalType === 'finalizar'}
      title={
        isAvulsa
          ? `Finalizar bagagem avulsa - ${selectedAvulsa?.cliente_nome}`
          : `Finalizar locação - Armário ${selectedLocker?.numero}`
      }
      onClose={closeModal}
      onConfirm={confirmarFinalizacao}
      confirmDisabled={submitting}
    >
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

        {inRioTour && (
          <input placeholder="Valor do excedente" value={valorExcedente} onChange={e => setValorExcedente(e.target.value)} />
        )}

        <input placeholder="Telefone para WhatsApp" value={telefoneWhatsApp} onChange={e => setTelefoneWhatsApp(e.target.value)} />

        <button onClick={confirmarFinalizacao} disabled={submitting}>
          {submitting ? 'Finalizando...' : 'Finalizar locação'}
        </button>
      </Modal>
    </div>
  );
}

export default LockersPage;
