/* ======================================================
   PERMISSÕES — LOCKER RIO
====================================================== */

/* =========================
   PERFIS DO SISTEMA
========================= */
export const perfis = {
  ATENDENTE: 'atendente',
  GERENTE: 'gerente',
  ADMIN: 'admin'
};

/* =========================
   PÁGINAS DO SISTEMA
========================= */
export const paginas = {
  PAINEL: 'painel',
  LOCACOES: 'locacoes',
  HISTORICO: 'historico',
  RELATORIOS: 'relatorios',
  USUARIOS: 'usuarios',
  CONFIGURACOES: 'configuracoes'
};

/* =========================
   LABELS DOS PERFIS
========================= */
export const labelsPerfis = {
  atendente: 'Atendente',
  gerente: 'Gerente',
  admin: 'Administrador'
};

/* =========================
   LABELS DAS PÁGINAS
========================= */
export const labelsPaginas = {
  painel: 'Painel',
  locacoes: 'Locações',
  historico: 'Histórico',
  relatorios: 'Relatórios',
  usuarios: 'Usuários',
  configuracoes: 'Configurações'
};

/* =========================
   PERMISSÕES POR PERFIL

   Regra definida:
   - Atendente não gerencia usuários.
   - Gerente gerencia apenas atendentes.
   - Admin gerencia todos.
========================= */
export const permissoesPorPerfil = {
  atendente: {
    paginasPermitidas: [
      'painel',
      'locacoes'
    ],

    podeGerenciarUsuarios: false,

    perfisQuePodeVisualizar: [],
    perfisQuePodeCriar: [],
    perfisQuePodeEditar: [],
    perfisQuePodeExcluir: []
  },

  gerente: {
    paginasPermitidas: [
      'painel',
      'locacoes',
      'historico',
      'relatorios',
      'usuarios'
    ],

    podeGerenciarUsuarios: true,

    perfisQuePodeVisualizar: [
      'atendente'
    ],

    perfisQuePodeCriar: [
      'atendente'
    ],

    perfisQuePodeEditar: [
      'atendente'
    ],

    perfisQuePodeExcluir: [
      'atendente'
    ]
  },

  admin: {
    paginasPermitidas: [
      'painel',
      'locacoes',
      'historico',
      'relatorios',
      'usuarios',
      'configuracoes'
    ],

    podeGerenciarUsuarios: true,

    perfisQuePodeVisualizar: [
      'atendente',
      'gerente',
      'admin'
    ],

    perfisQuePodeCriar: [
      'atendente',
      'gerente',
      'admin'
    ],

    perfisQuePodeEditar: [
      'atendente',
      'gerente',
      'admin'
    ],

    perfisQuePodeExcluir: [
      'atendente',
      'gerente',
      'admin'
    ]
  }
};

/* ======================================================
   PERFIS — UTILITÁRIOS
====================================================== */
export function perfilExiste(perfil) {
  return (
    perfil === perfis.ATENDENTE ||
    perfil === perfis.GERENTE ||
    perfil === perfis.ADMIN
  );
}

export function obterPerfilSeguro(perfil) {
  if (perfilExiste(perfil)) {
    return perfil;
  }

  return perfis.ATENDENTE;
}

export function obterPermissoesDoPerfil(perfil) {
  const perfilSeguro = obterPerfilSeguro(perfil);
  const permissoes = permissoesPorPerfil[perfilSeguro];

  if (permissoes) {
    return permissoes;
  }

  return permissoesPorPerfil.atendente;
}

export function obterLabelPerfil(perfil) {
  const perfilSeguro = obterPerfilSeguro(perfil);

  return labelsPerfis[perfilSeguro] || 'Desconhecido';
}

/* ======================================================
   PÁGINAS — UTILITÁRIOS
====================================================== */
export function paginaExiste(pagina) {
  return (
    pagina === paginas.PAINEL ||
    pagina === paginas.LOCACOES ||
    pagina === paginas.HISTORICO ||
    pagina === paginas.RELATORIOS ||
    pagina === paginas.USUARIOS ||
    pagina === paginas.CONFIGURACOES
  );
}

export function obterLabelPagina(pagina) {
  if (!paginaExiste(pagina)) {
    return 'Página desconhecida';
  }

  return labelsPaginas[pagina] || 'Página desconhecida';
}

export function podeAcessarPagina(usuario, pagina) {
  if (!usuario) {
    return false;
  }

  if (!usuario.perfil) {
    return false;
  }

  if (!pagina) {
    return false;
  }

  if (!paginaExiste(pagina)) {
    return false;
  }

  const permissoes = obterPermissoesDoPerfil(usuario.perfil);

  return permissoes.paginasPermitidas.includes(pagina);
}

export function obterPaginasPermitidas(usuario) {
  if (!usuario) {
    return [];
  }

  if (!usuario.perfil) {
    return [];
  }

  const permissoes = obterPermissoesDoPerfil(usuario.perfil);

  return permissoes.paginasPermitidas;
}

export function filtrarPaginasPermitidas(usuario, listaDePaginas) {
  if (!Array.isArray(listaDePaginas)) {
    return [];
  }

  return listaDePaginas.filter(item => {
    if (!item) {
      return false;
    }

    if (!item.id) {
      return false;
    }

    return podeAcessarPagina(usuario, item.id);
  });
}

/* ======================================================
   USUÁRIOS — PERMISSÕES GERAIS
====================================================== */
export function podeGerenciarUsuarios(usuario) {
  if (!usuario) {
    return false;
  }

  if (!usuario.perfil) {
    return false;
  }

  const permissoes = obterPermissoesDoPerfil(usuario.perfil);

  return permissoes.podeGerenciarUsuarios === true;
}

export function podeVisualizarPerfil(usuarioAtual, perfilAlvo) {
  if (!usuarioAtual) {
    return false;
  }

  if (!usuarioAtual.perfil) {
    return false;
  }

  if (!perfilAlvo) {
    return false;
  }

  const permissoes = obterPermissoesDoPerfil(usuarioAtual.perfil);

  return permissoes.perfisQuePodeVisualizar.includes(perfilAlvo);
}

export function podeCriarPerfil(usuarioAtual, perfilAlvo) {
  if (!usuarioAtual) {
    return false;
  }

  if (!usuarioAtual.perfil) {
    return false;
  }

  if (!perfilAlvo) {
    return false;
  }

  const permissoes = obterPermissoesDoPerfil(usuarioAtual.perfil);

  return permissoes.perfisQuePodeCriar.includes(perfilAlvo);
}

export function podeEditarPerfil(usuarioAtual, perfilAlvo) {
  if (!usuarioAtual) {
    return false;
  }

  if (!usuarioAtual.perfil) {
    return false;
  }

  if (!perfilAlvo) {
    return false;
  }

  const permissoes = obterPermissoesDoPerfil(usuarioAtual.perfil);

  return permissoes.perfisQuePodeEditar.includes(perfilAlvo);
}

export function podeExcluirPerfil(usuarioAtual, perfilAlvo) {
  if (!usuarioAtual) {
    return false;
  }

  if (!usuarioAtual.perfil) {
    return false;
  }

  if (!perfilAlvo) {
    return false;
  }

  const permissoes = obterPermissoesDoPerfil(usuarioAtual.perfil);

  return permissoes.perfisQuePodeExcluir.includes(perfilAlvo);
}

/* ======================================================
   USUÁRIOS — PERMISSÕES SOBRE USUÁRIO ALVO
====================================================== */
export function podeVisualizarUsuario(usuarioAtual, usuarioAlvo) {
  if (!usuarioAlvo) {
    return false;
  }

  if (!usuarioAlvo.perfil) {
    return false;
  }

  return podeVisualizarPerfil(usuarioAtual, usuarioAlvo.perfil);
}

export function podeCriarUsuarioComPerfil(usuarioAtual, perfilNovoUsuario) {
  if (!perfilNovoUsuario) {
    return false;
  }

  return podeCriarPerfil(usuarioAtual, perfilNovoUsuario);
}

export function podeEditarUsuario(usuarioAtual, usuarioAlvo) {
  if (!usuarioAlvo) {
    return false;
  }

  if (!usuarioAlvo.perfil) {
    return false;
  }

  return podeEditarPerfil(usuarioAtual, usuarioAlvo.perfil);
}

export function podeExcluirUsuario(usuarioAtual, usuarioAlvo) {
  if (!usuarioAtual) {
    return false;
  }

  if (!usuarioAlvo) {
    return false;
  }

  if (!usuarioAlvo.perfil) {
    return false;
  }

  if (usuarioAtual.id && usuarioAlvo.id && usuarioAtual.id === usuarioAlvo.id) {
    return false;
  }

  return podeExcluirPerfil(usuarioAtual, usuarioAlvo.perfil);
}

/* ======================================================
   USUÁRIOS — FILTROS
====================================================== */
export function filtrarUsuariosVisiveis(usuarioAtual, usuarios) {
  if (!Array.isArray(usuarios)) {
    return [];
  }

  return usuarios.filter(usuario => {
    return podeVisualizarUsuario(usuarioAtual, usuario);
  });
}

export function filtrarUsuariosEditaveis(usuarioAtual, usuarios) {
  if (!Array.isArray(usuarios)) {
    return [];
  }

  return usuarios.filter(usuario => {
    return podeEditarUsuario(usuarioAtual, usuario);
  });
}

export function filtrarUsuariosExcluiveis(usuarioAtual, usuarios) {
  if (!Array.isArray(usuarios)) {
    return [];
  }

  return usuarios.filter(usuario => {
    return podeExcluirUsuario(usuarioAtual, usuario);
  });
}

/* ======================================================
   USUÁRIOS — STATUS
====================================================== */
export function usuarioEstaAtivo(usuario) {
  if (!usuario) {
    return false;
  }

  return usuario.ativo === true;
}

export function obterStatusUsuario(usuario) {
  if (!usuario) {
    return 'Desconhecido';
  }

  if (usuario.ativo) {
    return 'Ativo';
  }

  return 'Inativo';
}

/* ======================================================
   USUÁRIOS — RESUMO PARA INTERFACE
====================================================== */
export function obterResumoPermissaoUsuario(usuarioAtual, usuarioAlvo) {
  return {
    podeVisualizar: podeVisualizarUsuario(usuarioAtual, usuarioAlvo),
    podeEditar: podeEditarUsuario(usuarioAtual, usuarioAlvo),
    podeExcluir: podeExcluirUsuario(usuarioAtual, usuarioAlvo)
  };
}

export function obterDescricaoRegraDoPerfil(perfil) {
  const perfilSeguro = obterPerfilSeguro(perfil);

  if (perfilSeguro === perfis.ATENDENTE) {
    return 'Atendente pode acessar Painel e Locações, mas não gerencia usuários.';
  }

  if (perfilSeguro === perfis.GERENTE) {
    return 'Gerente pode acessar Painel, Locações, Histórico, Relatórios e gerenciar apenas usuários atendentes.';
  }

  if (perfilSeguro === perfis.ADMIN) {
    return 'Administrador pode acessar todas as páginas e gerenciar todos os perfis de usuários.';
  }

  return 'Perfil sem regra definida.';
}

/* ======================================================
   EXPORT AUXILIAR
====================================================== */
export const regrasUsuarios = {
  podeGerenciarUsuarios,
  podeVisualizarUsuario,
  podeCriarUsuarioComPerfil,
  podeEditarUsuario,
  podeExcluirUsuario,
  filtrarUsuariosVisiveis,
  filtrarUsuariosEditaveis,
  filtrarUsuariosExcluiveis
};

/* ===== FIM — PERMISSÕES LOCKER RIO ===== */