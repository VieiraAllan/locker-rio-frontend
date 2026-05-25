# 🔐 Locker Rio — Frontend

Frontend do sistema **Locker Rio**, desenvolvido em **React + Vite**, responsável pela interface web de gerenciamento de lockers, locações, bagagens extras, histórico, relatórios, configurações, usuários e autenticação.

Este projeto consome a API do repositório **locker-rio-backend** e oferece uma experiência visual moderna, responsiva e preparada para operação diária de guarda-volumes.

---

## 📌 Sobre o projeto

O **Locker Rio** é um sistema para operação de lockers, guarda-volumes e bagagens extras/avulsas.

O frontend permite que a equipe operacional:

- visualize o painel de lockers;
- crie locações com locker;
- crie locações de bagagem avulsa;
- registre bagagens extras;
- finalize locações;
- visualize locações ativas;
- consulte histórico;
- acompanhe relatórios;
- configure valores e regras operacionais;
- gerencie usuários;
- utilize permissões por perfil;
- realize login no sistema.

---

## 🧱 Tecnologias utilizadas

- **React**
- **Vite**
- **JavaScript**
- **CSS**
- **Fetch API**
- **LocalStorage**
- **API REST do Locker Rio Backend**

---

## 📂 Estrutura principal

```txt
locker-rio-frontend/
├── public/
│
├── src/
│   ├── components/
│   │   └── Toast.jsx
│   │
│   ├── config/
│   │   ├── configuracoesMock.js
│   │   ├── permissoes.js
│   │   ├── usuarioAtual.js
│   │   └── usuariosMock.js
│   │
│   ├── hooks/
│   │   └── useToast.js
│   │
│   ├── pages/
│   │   ├── ConfiguracoesPage.jsx
│   │   ├── HistoricoPage.jsx
│   │   ├── LocacoesAtivasPage.jsx
│   │   ├── LockersPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RelatoriosPage.jsx
│   │   └── UsuariosPage.jsx
│   │
│   ├── services/
│   │   └── api.js
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```
---

## 🔐 Perfis de acesso
O sistema possui três perfis principais.
Atendente
Pode acessar:

Painel;
Locações.

Pode:

criar locações;
finalizar locações;
visualizar operações do painel.

Não pode:

acessar usuários;
acessar relatórios;
acessar histórico completo;
acessar configurações.


Gerente
Pode acessar:

Painel;
Locações;
Histórico;
Relatórios;
Usuários.

Pode:

gerenciar apenas usuários atendentes;
criar atendentes;
editar atendentes;
ativar/desativar atendentes;
excluir atendentes.

Não pode:

gerenciar administradores;
gerenciar outros gerentes;
acessar configurações críticas.


Administrador
Pode acessar:

Painel;
Locações;
Histórico;
Relatórios;
Usuários;
Configurações.

Pode:

gerenciar todos os usuários;
gerenciar atendentes;
gerenciar gerentes;
gerenciar administradores;
alterar configurações do sistema.

👨‍💻 Autor
Projeto desenvolvido por Állan R.

📄 Licença
Projeto privado em desenvolvimento.
Todos os direitos reservados.
