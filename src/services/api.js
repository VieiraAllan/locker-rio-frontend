const API_URL = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'lockerRioToken';
const USUARIO_KEY = 'lockerRioUsuario';

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function limparSessaoLockerRio() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USUARIO_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
}

function getAuthHeaders() {
  const token = getToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`
  };
}

async function authFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...getAuthHeaders()
    }
  });

  if (response.status === 401) {
    limparSessaoLockerRio();

    window.dispatchEvent(
      new CustomEvent('lockerRioAuthExpired', {
        detail: {
          message: 'Sessão expirada. Faça login novamente.'
        }
      })
    );

    throw new Error('Sessão expirada. Faça login novamente.');
  }

  return response;
}

/* =========================
   LOCKERS
========================= */
export async function getLockers() {
  const response = await fetch(`${API_URL}/lockers`);
  const data = await response.json();
  return data.data;
}

export async function atualizarStatusLocker(lockerId, status) {
  const response = await authFetch(`${API_URL}/lockers/${lockerId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ status })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao atualizar status do locker');
  }

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
   EDITAR DADOS DO CLIENTE
========================= */
export async function atualizarDadosClienteLocacao(locacaoId, payload) {
  const response = await authFetch(`${API_URL}/locacoes/${locacaoId}/cliente`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      cliente_nome: payload.cliente_nome,
      cliente_telefone: payload.cliente_telefone,
      cliente_documento: payload.cliente_documento
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao atualizar dados do cliente');
  }

  return data.data;
}

/* =========================
   FINALIZAR LOCAÇÃO
========================= */
export async function finalizarLocacao(locacaoId, payload = {}) {
  const dados = payload || {};

  const response = await authFetch(`${API_URL}/locacoes/${locacaoId}/finalizar`, {
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
   WHATSAPP / MENSAGENS
========================= */
export async function gerarMensagemWhatsApp(
  locacaoId,
  {
    tipo = 'finalizacao',
    idioma = 'pt',
    telefone = ''
  } = {}
) {
  const params = new URLSearchParams();

  if (telefone) {
    params.set('telefone', telefone);
  }

  if (idioma) {
    params.set('idioma', idioma);
  }

  const response = await authFetch(
    `${API_URL}/mensagens/${locacaoId}/${tipo}?${params.toString()}`,
    {
      headers: {
        ...getAuthHeaders()
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao gerar mensagem do WhatsApp');
  }

  return data.data;
}

/* ===== compatibilidade temporária ===== */
export function gerarLinkWhatsAppFinalizacao(
  locacaoId,
  telefone,
  idioma = 'pt'
) {
  const params = new URLSearchParams();

  if (telefone) {
    params.set('telefone', telefone);
  }

  if (idioma) {
    params.set('idioma', idioma);
  }

  return `${API_URL}/mensagens/${locacaoId}/finalizacao?${params.toString()}`;
}

/* =========================
   BAGAGENS AVULSAS ATIVAS
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
  const response = await authFetch(`${API_URL}/configuracoes`, {
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
  const response = await authFetch(`${API_URL}/configuracoes`, {
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
  const response = await authFetch(`${API_URL}/usuarios`, {
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
  const response = await authFetch(`${API_URL}/usuarios`, {
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
  const response = await authFetch(`${API_URL}/usuarios/${usuarioId}`, {
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
  const response = await authFetch(`${API_URL}/usuarios/${usuarioId}`, {
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
  const response = await authFetch(`${API_URL}/usuarios/${usuarioId}/senha`, {
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
  const response = await authFetch(`${API_URL}/recibos/${locacaoId}/pdf`, {
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
  const pdfBlob = new Blob([blob], { type: 'application/pdf' });

  const nomeArquivoPadrao = `recibo-locker-rio-${locacaoId}.pdf`;
  const contentDisposition = response.headers.get('content-disposition') || '';
  const filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  const nomeArquivo = decodeURIComponent(
    filenameMatch?.[1] || filenameMatch?.[2] || nomeArquivoPadrao
  );

  const nomeArquivoPdf = nomeArquivo.toLowerCase().endsWith('.pdf')
    ? nomeArquivo
    : `${nomeArquivo}.pdf`;

  const url = URL.createObjectURL(pdfBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivoPdf;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Não revogar imediatamente: em alguns casos o Chrome ainda está gravando o Blob
  // e a revogação cedo demais gera falha de download / nome UUID sem extensão.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000);
}