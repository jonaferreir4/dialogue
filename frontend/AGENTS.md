# AGENTS.md — Regras para Agentes de IA (Dialogue-front)

Este arquivo define **regras rígidas e invioláveis** para qualquer agente de IA que opere sobre este repositório (`Dialogue-front`). As regras aqui são de cumprimento obrigatório.

---

## 0. Meta-regra

> **Quando em dúvida, não faça.** Pergunte ao desenvolvedor antes de tomar uma decisão arquitetural que comprometa a consistência da interface ou do consumo de WebSocket.

---

## 1. Arquitetura e Organização de Pastas

A aplicação utiliza **React 19, TypeScript, Material UI (MUI v7), Vite e @microsoft/signalr**:

```
Dialogue-front/
├── .agents/
│   ├── skills.json
│   └── skills/
│       ├── dialogue-realtime-client/
│       └── vendor/
│           ├── frontend-senior/
│           ├── ui-ux-design-system/
│           ├── solid-clean-code/
│           ├── performance-optimization/
│           └── security-and-hardening/
├── src/
│   ├── assets/        # Recursos estáticos (logos, ícones)
│   ├── components/    # Componentes reutilizáveis (MessageBubble, ChatHeader, etc.)
│   ├── context/       # Context API e State global (ChatContext)
│   ├── pages/         # Telas da aplicação (Welcome, JoinRoom, Chat)
│   ├── services/      # Abstração de chamadas SignalR e HTTP
│   ├── theme/         # Definição do tema MUI (paleta, tipografia, dark mode)
│   ├── App.tsx        # Rotas da aplicação
│   └── main.tsx       # Bootstrap e ThemeProvider
├── AGENTS.md          # Regras invioláveis de IA
└── STATUS.md          # Checklist de débitos e features
```

---

## 2. Padrões de Conexão com o Backend SignalR

### 2.1 Variáveis de Ambiente e URLs
- **NUNCA** utilizar URLs fixas como `http://localhost:5000` no código.
- **SEMPRE** consumir `import.meta.env.VITE_API_URL` com fallback seguro.

### 2.2 Ciclo de Vida da Conexão
- O `HubConnection` deve ser instanciado uma única vez dentro de `useChatService` ou `ChatProvider`.
- **SEMPRE** limpar listeners (`connection.off(...)`) no return do `useEffect`.
- Configurar `.withAutomaticReconnect()` e tratar o evento `onreconnected` para reinscrição na sala se houver credenciais salvas.

### 2.3 Contratos de Mensagens e Tipagem
- Tratar o payload canônico recebido em `ReceiveMessage`:
  `(sender: string, message: string, timestampUtc: string, messageId: string)`
- Utilizar `messageId` como `key` única na lista de mensagens do React.
- Formatar timestamps em hora local (`HH:mm`) utilizando a API nativa `Intl.DateTimeFormat`.

---

## 3. Diretrizes de UI/UX e Design System

### 3.1 Estética Visual Rica e Moderna
- Evitar o visual cru ou padrão cinza do Material UI.
- Adotar um tema moderno com suporte a modo escuro elegante, contraste refinado e micro-interações.
- Utilizar tipografia moderna (`Inter` ou `Plus Jakarta Sans`).
- Usar cards com cantos arredondados suaves (`border-radius: 12px` a `16px`), sombras suaves e bordas translúcidas sutis.

### 3.2 Experiência do Chat
- **Auto-scroll**: Novas mensagens devem rolar a conversa automaticamente para o final com `scrollIntoView({ behavior: 'smooth' })`.
- **Indicador de Digitação**: Exibir o nome correto de quem está digitando (*"João está digitando..."*) e nunca atribuir a digitação ao usuário local.
- **Badges de Presença**: Indicar o status da conexão em tempo real (Conectado / Reconectando / Desconectado).

---

## 4. Tabela: ❌ Proibido vs ✅ Correto

| ❌ Proibido | ✅ Correto |
|---|---|
| `http://localhost:5000/chat` hardcoded | `import.meta.env.VITE_API_URL + '/chat'` |
| `key={index}` na lista de mensagens | `key={msg.id}` usando o UUID da mensagem |
| `<TypingIndicator typingUser={myUsername}/>` | `<TypingIndicator typingUser={remoteTypingUser}/>` |
| Cores padrão cruas `#f5f5f5` sem tema | Tema customizado com `createTheme` e `ThemeProvider` |
| Deixar conexões zumbis abertas sem `connection.off` | Remover listeners no cleanup de `useEffect` |

---

## 5. Convenções de Git e Commits
Seguir **Conventional Commits**: `feat:`, `fix:`, `style:`, `refactor:`, `test:`, `docs:`.
