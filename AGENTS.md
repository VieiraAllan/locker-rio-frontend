# AGENTS.md — Locker Rio Frontend

## 1. Finalidade

Este arquivo orienta agentes de IA e pessoas desenvolvedoras que trabalham no frontend do sistema Locker Rio.

O frontend é uma aplicação React + Vite responsável pela interface operacional de lockers, locações, bagagens extras e avulsas, histórico, relatórios, usuários, configurações, autenticação, recibos e mensagens de WhatsApp.

Toda alteração deve preservar o comportamento existente, priorizar segurança, estabilidade, clareza, acessibilidade e compatibilidade com o backend.

## 2. Princípios obrigatórios

- Segurança e integridade da operação vêm antes de velocidade de implementação.
- Não alterar código sem entender o fluxo afetado.
- Não remover funções, validações, estados ou regras existentes sem justificativa explícita.
- Não confiar no frontend como mecanismo de autorização.
- Regras críticas devem ser validadas pelo backend.
- Não inventar arquivos, componentes, rotas, campos ou respostas de API.
- Antes de codificar, localizar os arquivos reais e conferir a implementação atual.
- Evitar duplicação. Reutilizar componentes, helpers e estilos existentes.
- Não criar arquivos com sufixos como `.final`, `.corrigido`, `.v2` ou equivalentes dentro do repositório.
- Alterar o arquivo oficial e manter o histórico pelo Git.
- Trabalhar em branch de feature ou correção. Não alterar `main` diretamente.

## 3. Stack e convenções

- React
- Vite
- JavaScript
- CSS global
- Fetch API
- API REST do Locker Rio Backend
- Sessão no navegador via `sessionStorage`

Comandos esperados:

```bash
npm install
npm run dev
npm run build
npm audit
```

O frontend local usa, por padrão:

```env
VITE_API_URL=http://localhost:3000
```

A URL deve ser normalizada:

```js
const API_URL = String(
  import.meta.env.VITE_API_URL || 'http://localhost:3000'
).replace(/\/$/, '');
```

Somente variáveis públicas podem usar o prefixo `VITE_`.

Nunca colocar no frontend:

- `JWT_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- senha de banco
- tokens privados
- credenciais administrativas
- qualquer segredo de produção

## 4. Autenticação e sessão

O sistema usa JWT emitido pelo backend com validade padrão de 12 horas.

Regras obrigatórias:

- Salvar `lockerRioToken` em `sessionStorage`.
- Salvar `lockerRioUsuario` em `sessionStorage`.
- Não reintroduzir persistência de autenticação no `localStorage`.
- Ao fechar a guia ou janela, uma nova autenticação deve ser solicitada.
- Respostas `401` devem limpar a sessão e levar à tela de login.
- Respostas `403` não devem ser tratadas automaticamente como token expirado, pois podem indicar falta de permissão de perfil.
- Nunca decodificar o JWT no frontend para tomar decisões de segurança.
- O frontend pode esconder ações por perfil apenas para UX; o backend deve conferir a permissão.

Ao modificar `api.js`, preservar o tratamento global de sessão expirada e o envio do header:

```http
Authorization: Bearer <token>
```

Rotas operacionais, inclusive criação e listagem de locações, devem usar chamadas autenticadas se o backend exigir JWT.

## 5. Perfis e permissões

Perfis atuais:

- `atendente`
- `gerente`
- `admin` / `administrador`

Diretrizes:

- Não assumir autorização apenas porque um menu ou botão está oculto.
- Manter a configuração central de permissões como fonte da navegação.
- Ações administrativas devem permanecer invisíveis para perfis sem acesso.
- Tratar `403 Forbidden` com mensagem clara e sem encerrar uma sessão válida.
- Configurações avançadas, quando implementadas, devem ser exclusivas de administrador.
- Criação e exclusão segura de lockers são permitidas para administrador e gerente, sujeitas às regras do backend.

## 6. Regras de negócio que devem ser preservadas

### Lockers

- Status: `disponivel`, `ocupado` e `manutencao`.
- Locker ocupado não pode ser excluído.
- Locker com locação ativa não pode ser excluído.
- Locker com histórico não pode ser excluído; deve ser retirado da operação por manutenção.
- Cadastro de locker deve impedir número ausente, inválido ou repetido.
- Ações de manutenção devem continuar restritas aos perfis autorizados.

### Locações

- Cliente regular não pode pagar na abertura valor maior que o total contratado.
- Cliente In Rio Tour possui valor variável, inclusive zero.
- Para In Rio Tour, o valor final pode ser ajustado na finalização conforme a regra vigente.
- Bagagem avulsa continua separada do fluxo de locker.
- Bagagens extras integram cálculo, recibo e mensagem conforme as regras existentes.
- Observação interna deve aparecer somente no sistema.
- Observação interna não deve aparecer no recibo nem nas mensagens de WhatsApp.
- O campo de identificação deve ser chamado apenas de `Documento`.

### Recibos

- O PDF deve ser baixado como arquivo `.pdf`.
- O recibo de abertura mostra o valor pago na abertura.
- O recibo de histórico mostra a soma efetivamente paga na abertura e na finalização.
- Não reintroduzir `window.open` para blob de recibo quando o fluxo esperado for download.

### WhatsApp

- Respeitar números internacionais já informados com DDI.
- Não prefixar automaticamente `55` em número internacional explícito.
- Incluir bagagens extras na mensagem de abertura quando existirem.
- Exibir valor a pagar apenas quando houver pendência.
- Não deixar placeholders literais na mensagem, como `{valor_a_pagar_bloco}`.

## 7. Segurança no frontend

É proibido:

- `dangerouslySetInnerHTML`, salvo revisão de segurança documentada e sanitização robusta.
- `eval`.
- `new Function`.
- inserir dados de usuário via `innerHTML`.
- construir URLs não confiáveis sem validação.
- colocar segredos em código ou variáveis `VITE_`.
- confiar em estado visual para proteger uma operação.

Obrigatório:

- Renderizar dados do usuário como texto React.
- Validar campos para melhorar UX, mantendo validação definitiva no backend.
- Definir limites de tamanho coerentes nos inputs quando aplicável.
- Desabilitar ações durante envio para evitar requisições duplicadas.
- Exibir loading e feedback de sucesso/erro.
- Manter navegação por teclado, labels, `aria-label` e contraste legível.
- Usar o componente `Modal` do sistema em vez de `window.confirm` para fluxos relevantes.

## 8. API e tratamento de erros

- Centralizar chamadas no serviço `src/services/api.js`.
- Não espalhar `fetch` por páginas sem necessidade.
- Usar token nas rotas protegidas.
- Preservar mensagens úteis retornadas pela API.
- Não mostrar stack trace ou detalhes internos ao usuário.
- Diferenciar:
  - `400`: entrada inválida;
  - `401`: sessão ausente ou expirada;
  - `403`: falta de permissão;
  - `404`: recurso inexistente;
  - `409`: conflito de regra de negócio;
  - `500`: falha interna.
- Não transformar todo `403` em logout automático.

## 9. CSS e layout

- Preservar suporte a modo claro e escuro.
- Manter a topbar fixa e apenas o conteúdo principal rolável.
- Conferir desktop e mobile.
- Evitar seletores excessivamente genéricos que afetem todo o sistema.
- Colocar estilos novos próximos ao domínio funcional ou em bloco claramente identificado.
- Antes de adicionar CSS, procurar regras duplicadas ou conflitantes.
- Garantir estados `hover`, `focus`, `disabled` e responsivos.
- Respeitar `prefers-reduced-motion` ao criar animações contínuas.

## 10. Uploads e imagens futuras

Quando fotos de locações forem implementadas:

- Comprimir e redimensionar antes do upload.
- Aceitar somente JPEG, PNG e WebP.
- Aplicar limite de tamanho.
- Não salvar base64 no banco.
- Enviar para storage privado por fluxo autorizado.
- Utilizar URLs assinadas para leitura.
- Fotos temporárias devem ter expiração e limpeza definidas.
- Não confiar apenas no atributo `accept` do input; o backend deve validar.

## 11. Arquivos de ambiente e Git

O `.env` local não deve ser versionado.

O `.gitignore` deve conter:

```gitignore
.env
.env.local
.env.*.local
!.env.example
```

O repositório deve manter apenas `.env.example` com valores fictícios.

Antes de commit:

```bash
git status --short
git diff
npm run build
npm audit
```

Procurar artefatos acidentais:

```bash
git ls-files
grep -RInE '^(<<<<<<<|=======|>>>>>>>)' .
```

## 12. Fluxo de trabalho obrigatório para agentes

Ao receber uma solicitação:

1. Identificar o problema e a regra de negócio.
2. Inspecionar os arquivos atuais.
3. Listar os arquivos afetados.
4. Informar se há impacto no backend ou banco.
5. Explicar riscos de regressão.
6. Implementar a menor alteração segura possível.
7. Preservar funcionalidades existentes.
8. Executar build e testes disponíveis.
9. Informar testes manuais recomendados.
10. Sugerir commit em português, claro e específico.
11. Não fazer merge ou push sem solicitação explícita.

## 13. Checklist antes de concluir uma entrega

- [ ] Nenhum segredo foi exposto?
- [ ] As rotas protegidas enviam JWT?
- [ ] `401` e `403` são tratados corretamente?
- [ ] A autorização continua validada no backend?
- [ ] Há risco de XSS?
- [ ] Nenhum HTML de chat foi colado no código?
- [ ] Inputs têm validação e limites coerentes?
- [ ] Fluxos In Rio Tour continuam corretos?
- [ ] Bagagens avulsas e extras continuam funcionando?
- [ ] Observação interna continua fora de recibo e WhatsApp?
- [ ] Recibo continua baixando em PDF?
- [ ] Tema claro e escuro foram testados?
- [ ] Mobile foi testado?
- [ ] `npm run build` passou?
- [ ] `npm audit` foi revisado?
- [ ] Não há marcadores de conflito?
- [ ] O diff contém apenas alterações intencionais?

## 14. Commits sugeridos

Usar Conventional Commits quando possível:

```txt
feat(lockers): adicionar selecao de lockers adicionais
fix(auth): tratar sessao expirada sem afetar permissao negada
fix(layout): corrigir topbar no modo claro
docs: atualizar instrucoes do frontend
chore(frontend): atualizar configuracao local
```

## 15. Limites do agente

- Não afirmar que uma alteração está segura sem revisar backend e banco quando forem relevantes.
- Não apagar arquivos estranhos sem conferir nome, conteúdo e status no Git.
- Não executar correções destrutivas automaticamente.
- Não usar `npm audit fix --force` sem análise.
- Não substituir arquivos inteiros desnecessariamente.
- Não alterar contratos de API sem coordenar a mudança com o backend.
