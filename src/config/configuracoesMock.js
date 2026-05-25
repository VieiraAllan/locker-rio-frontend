/* ======================================================
   CONFIGURAÇÕES SIMULADAS — LOCKER RIO
   Futuramente esses dados virão do backend/banco
====================================================== */

export const configuracoesMock = {
  estabelecimento: {
    nome: 'Locker Rio',
    telefone: '',
    endereco: '',
    mensagemRecibo: 'Obrigado por utilizar o Locker Rio.'
  },

  valores: {
    valorLocker: 30,
    valorBagagemAvulsa: 30,
    valorHoraExcedente: 5,
    horasInclusas: 4
  },

  operacao: {
    permitirBagagemAvulsa: true,
    permitirInRioTour: true,
    exigirLacres: true,
    exigirTelefoneCliente: true
  }
};

export function obterConfiguracoesMock() {
  return configuracoesMock;
}

export function formatarValorConfiguracao(valor) {
  const numero = Number(valor || 0);

  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}