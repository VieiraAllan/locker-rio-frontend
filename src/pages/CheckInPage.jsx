import { useState } from 'react';
import { criarPreCadastro } from '../services/api';
import logoCliente from '../assets/logo-cliente.svg';

const TEXTOS = {
  pt: {
    tituloForm: 'Check-in Locker Rio',
    subtitulo: 'Preencha seus dados para agilizar o atendimento.',
    nome: 'Nome completo',
    phNome: 'Seu nome completo',
    telefone: 'Telefone / WhatsApp',
    phTelefone: '+55 21 99999-9999',
    documento: 'Documento',
    phDocumento: 'RG, CPF ou passaporte',
    volumes: 'Quantidade de volumes',
    observacao: 'Observação para a equipe (opcional)',
    phObservacao: 'Ex.: uma das malas tem item frágil',
    semPreco: 'O valor será informado pela equipe no atendimento.',
    consentimento: 'Declaro que os dados informados estão corretos e autorizo seu uso para realização do atendimento.',
    enviar: 'Enviar pré-cadastro',
    enviando: 'Enviando...',
    okTitulo: 'Pré-cadastro recebido',
    okTexto: 'Apresente este código no atendimento. Isso agiliza sua vez, mas não reserva um armário — a confirmação é feita pela equipe no local.',
    novo: 'Fazer novo check-in',
    erroGenerico: 'Não foi possível registrar o check-in. Tente novamente.'
  },
  en: {
    tituloForm: 'Locker Rio check-in',
    subtitulo: 'Fill in your details to speed up your service.',
    nome: 'Full name',
    phNome: 'Your full name',
    telefone: 'Phone / WhatsApp',
    phTelefone: '+1 555 123 4567',
    documento: 'ID document',
    phDocumento: 'Passport or ID number',
    volumes: 'Number of bags',
    observacao: 'Note for staff (optional)',
    phObservacao: 'E.g.: one bag has a fragile item',
    semPreco: 'Staff will let you know the price when you check in.',
    consentimento: 'I confirm the information above is correct and can be used to process my check-in.',
    enviar: 'Send check-in',
    enviando: 'Sending...',
    okTitulo: 'Check-in received',
    okTexto: 'Show this code at the counter. This speeds up your service but does not reserve a locker — staff will confirm it on site.',
    novo: 'Start a new check-in',
    erroGenerico: 'We could not register your check-in. Please try again.'
  },
  es: {
    tituloForm: 'Check-in Locker Rio',
    subtitulo: 'Completa tus datos para agilizar la atención.',
    nome: 'Nombre completo',
    phNome: 'Tu nombre completo',
    telefone: 'Teléfono / WhatsApp',
    phTelefone: '+54 9 11 1234-5678',
    documento: 'Documento',
    phDocumento: 'DNI, cédula o pasaporte',
    volumes: 'Cantidad de bultos',
    observacao: 'Observación para el equipo (opcional)',
    phObservacao: 'Ej.: una maleta tiene un objeto frágil',
    semPreco: 'El equipo te informará el valor al momento de la atención.',
    consentimento: 'Declaro que los datos indicados son correctos y autorizo su uso para realizar la atención.',
    enviar: 'Enviar registro',
    enviando: 'Enviando...',
    okTitulo: 'Registro recibido',
    okTexto: 'Presenta este código en el mostrador. Esto agiliza tu turno, pero no reserva un casillero — el equipo lo confirma en el local.',
    novo: 'Hacer un nuevo registro',
    erroGenerico: 'No pudimos registrar tu check-in. Intenta nuevamente.'
  }
};

function CheckInPage() {
  const [idioma, setIdioma] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [documento, setDocumento] = useState('');
  const [volumes, setVolumes] = useState(1);
  const [observacao, setObservacao] = useState('');
  const [consentimento, setConsentimento] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(null);

  const t = TEXTOS[idioma] || null;

  function reiniciar() {
    setIdioma('');
    setNome('');
    setTelefone('');
    setDocumento('');
    setVolumes(1);
    setObservacao('');
    setConsentimento(false);
    setErro('');
    setResultado(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!nome.trim() || !telefone.trim() || !documento.trim() || !consentimento) {
      return;
    }

    try {
      setEnviando(true);
      setErro('');

      const dados = await criarPreCadastro({
        cliente_nome: nome.trim(),
        cliente_telefone: telefone.trim(),
        cliente_documento: documento.trim(),
        idioma,
        quantidade_volumes: volumes,
        observacao_cliente: observacao.trim()
      });

      setResultado(dados);
    } catch (err) {
      setErro(err.message || t.erroGenerico);
    } finally {
      setEnviando(false);
    }
  }

  const formularioValido =
    nome.trim() && telefone.trim() && documento.trim() && consentimento;

  return (
    <div className="checkin-page">
      <div className="checkin-card">
        <div className="checkin-brand">
          <img src={logoCliente} alt="Locker Rio" className="checkin-logo" />
          <span>Locker Rio</span>
        </div>

        {!idioma && (
          <div className="checkin-idioma">
            <h1>Choose your language</h1>
            <p>Escolha seu idioma · Elige tu idioma</p>

            <div className="checkin-idioma-opcoes">
              <button type="button" onClick={() => setIdioma('pt')}>🇧🇷 Português (Brasil)</button>
              <button type="button" onClick={() => setIdioma('en')}>🇺🇸 English</button>
              <button type="button" onClick={() => setIdioma('es')}>🇪🇸 Español</button>
            </div>
          </div>
        )}

        {idioma && !resultado && (
          <form className="checkin-form" onSubmit={handleSubmit}>
            <button
              type="button"
              className="checkin-voltar"
              onClick={() => setIdioma('')}
            >
              ‹ {idioma === 'pt' ? 'Idioma' : idioma === 'en' ? 'Language' : 'Idioma'}
            </button>

            <h1>{t.tituloForm}</h1>
            <p className="checkin-sub">{t.subtitulo}</p>

            <label className="checkin-campo">
              <span>{t.nome}</span>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder={t.phNome}
                maxLength={120}
                disabled={enviando}
              />
            </label>

            <label className="checkin-campo">
              <span>{t.telefone}</span>
              <input
                type="tel"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                placeholder={t.phTelefone}
                maxLength={30}
                disabled={enviando}
              />
            </label>

            <label className="checkin-campo">
              <span>{t.documento}</span>
              <input
                type="text"
                value={documento}
                onChange={e => setDocumento(e.target.value)}
                placeholder={t.phDocumento}
                maxLength={120}
                disabled={enviando}
              />
            </label>

            <label className="checkin-campo">
              <span>{t.volumes}</span>
              <div className="checkin-stepper">
                <button
                  type="button"
                  onClick={() => setVolumes(v => Math.max(1, v - 1))}
                  disabled={enviando}
                >
                  −
                </button>
                <output>{volumes}</output>
                <button
                  type="button"
                  onClick={() => setVolumes(v => Math.min(20, v + 1))}
                  disabled={enviando}
                >
                  +
                </button>
              </div>
            </label>

            <label className="checkin-campo">
              <span>{t.observacao}</span>
              <textarea
                value={observacao}
                onChange={e => setObservacao(e.target.value)}
                placeholder={t.phObservacao}
                maxLength={500}
                rows={3}
                disabled={enviando}
              />
            </label>

            <div className="checkin-sem-preco">
              <span className="checkin-dot" />
              <span>{t.semPreco}</span>
            </div>

            <label className="checkin-consentimento">
              <input
                type="checkbox"
                checked={consentimento}
                onChange={e => setConsentimento(e.target.checked)}
                disabled={enviando}
              />
              <span>{t.consentimento}</span>
            </label>

            {erro && <div className="checkin-erro">{erro}</div>}

            <button
              type="submit"
              className="checkin-enviar"
              disabled={!formularioValido || enviando}
            >
              {enviando ? t.enviando : t.enviar}
            </button>
          </form>
        )}

        {resultado && (
          <div className="checkin-confirmacao">
            <span className="checkin-ok-badge">{t.okTitulo}</span>
            <div className="checkin-codigo">{resultado.codigo_atendimento}</div>
            <p>{t.okTexto}</p>
            <button type="button" className="checkin-novo" onClick={reiniciar}>
              {t.novo}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckInPage;
