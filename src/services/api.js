const API_URL = 'http://localhost:3000';

function getAuthHeaders() {
  const token = localStorage.getItem('lockerRioToken');

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`
  };
}

/* =========================
   LOCKERS
========================= */
export async function getLockers() {
  const response = await fetch(`${API_URL}/lockers`);
  const data = await response.json();
  return data.data;
}

/* =========================
   CRIAR LOCAÇÃO
========================= */
export async function criarLocacao(payload) {
  const response = await fetch(`${API_URL}/locacoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao criar locação');
  }

  return data;
}

/* =========================
   BUSCAR LOCAÇÃO ATIVA
========================= */
export async function getLocacaoAtiva(lockerId) {
  const response = await fetch(
    `${API_URL}/lockers/${lockerId}/locacao-ativa`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Locação ativa não encontrada');
  }

  return data.locacao_id;
}

/* =========================
   FINALIZAR LOCAÇÃO
========================= */
export async function finalizarLocacao(locacaoId, payload = {}) {
  const dados = payload || {};

  const response = await fetch(`${API_URL}/locacoes/${locacaoId}/finalizar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      valor_excedente_manual: dados.valor_excedente_manual ?? null,
      valor_pago_final: dados.valor_pago_final ?? null
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao finalizar locação');
  }

  return data;
}

/* =========================
   WHATSAPP / PDF
========================= */
export function gerarLinkWhatsAppFinalizacao(locacaoId, telefone) {
  return `${API_URL}/mensagens/${locacaoId}/finalizacao?telefone=${telefone}`;
}

/* =========================
   BAGAGENS AVULSAS ATIVAS ✅ (ETAPA 2)
========================= */
export async function getAvulsasAtivas() {
  const response = await fetch(`${API_URL}/locacoes/avulsas-ativas`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao buscar bagagens avulsas');
  }

  return data.data;
}

/* =========================
   LOCAÇÕES ATIVAS
========================= */
export async function getLocacoesAtivas() {
  const response = await fetch(`${API_URL}/locacoes/ativas`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao buscar locações ativas');
  }

  return data.data;
}

/* =========================
   HISTÓRICO DE LOCAÇÕES
========================= */
export async function getHistoricoLocacoes() {
  const response = await fetch(`${API_URL}/locacoes/historico`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao buscar histórico de locações');
  }

  return data.data;
}

/* =========================
   RELATÓRIOS
========================= */
export async function getResumoRelatorio({
  periodo = 'hoje',
  inicio = null,
  fim = null
} = {}) {
  const params = new URLSearchParams();

  if (inicio && fim) {
    params.set('inicio', inicio);
    params.set('fim', fim);
  } else {
    params.set('periodo', periodo);
  }

  const response = await fetch(
    `${API_URL}/relatorios/resumo?${params.toString()}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao buscar resumo do relatório');
  }

  return data.data;
}

/* =========================
   CONFIGURAÇÕES DO SISTEMA
========================= */
export async function getConfiguracoes() {
  const response = await fetch(`${API_URL}/configuracoes`, {
    headers: {
      ...getAuthHeaders()
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao buscar configurações');
  }

  return data.data;
}

export async function salvarConfiguracoes(configuracoes) {
  const response = await fetch(`${API_URL}/configuracoes`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(configuracoes)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao salvar configurações');
  }

  return data.data;
}

/* =========================
   USUÁRIOS
========================= */
export async function getUsuarios() {
  const response = await fetch(`${API_URL}/usuarios`, {
    headers: {
      ...getAuthHeaders()
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao buscar usuários');
  }

  return data.data;
}

export async function criarUsuario(payload) {
  const response = await fetch(`${API_URL}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao criar usuário');
  }

  return data.data;
}

export async function atualizarUsuario(usuarioId, payload) {
  const response = await fetch(`${API_URL}/usuarios/${usuarioId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao atualizar usuário');
  }

  return data.data;
}

export async function excluirUsuario(usuarioId) {
  const response = await fetch(`${API_URL}/usuarios/${usuarioId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders()
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao excluir usuário');
  }

  return data;
}

/* =========================
   AUTENTICAÇÃO
========================= */
export async function loginUsuario(email, senha) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      senha
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao realizar login');
  }

  return {
    usuario: data.data.usuario,
    token: data.data.token
  };
}

/* =========================
   SENHA DO USUÁRIO
========================= */
export async function alterarSenhaUsuario(usuarioId, senha) {
  const response = await fetch(`${API_URL}/usuarios/${usuarioId}/senha`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      senha
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao alterar senha');
  }

  return data.data;
}

/* =========================
   RECIBO PDF
========================= */
export async function abrirReciboPdf(locacaoId) {
  const response = await fetch(`${API_URL}/recibos/${locacaoId}/pdf`, {
    headers: {
      ...getAuthHeaders()
    }
  });

  if (!response.ok) {
    let mensagemErro = 'Erro ao gerar recibo';

    try {
      const data = await response.json();
      mensagemErro = data.error || mensagemErro;
    } catch {
      // ignora erro de parse quando a resposta não for JSON
    }

    throw new Error(mensagemErro);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  window.open(url, '_blank', 'noopener,noreferrer');

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000);
}