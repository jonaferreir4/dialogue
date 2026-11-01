# Status do Projeto e Débito Técnico — Dialogue-front

Este arquivo consolida o progresso de interface, débitos técnicos catalogados e o roadmap de melhorias do **Dialogue-front** (React 19 + Vite + Material UI + TanStack Query + Zustand).

---

## 📋 Diagnóstico de Débito Técnico

### 🔴 Críticos (Resolvidos ✅)
- [x] **URL da API com .env**: Configurado `VITE_API_URL` em `api.ts` e criado `.env` e `.env.example`.
- [x] **Bug no Indicador de Digitação Corrigido**: O evento `UserTyping` agora armazena quem está digitando (`typingUser`) no Zustand e só exibe quando o autor for outro usuário.
- [x] **Reconexão e Reingressão Automática na Sala**: `ChatSignalRService` escuta `onreconnected` e refaz o `JoinRoom` automaticamente caso `currentUser` e `currentRoom` estejam no store.
- [x] **Novo Contrato Canônico de Mensagens**: Captura `messageId` para usar como `key` única no React e formata `timestampUtc` na hora local do cliente (`HH:mm`).

### 🟡 Importantes (Resolvidos ✅)
- [x] **Integração de Zustand e TanStack Query**:
  - `useChatStore` (Zustand) gerencia o estado atômico em tempo real do chat (mensagens, usuários conectados, digitação, status).
  - `@tanstack/react-query` configurado com `QueryClientProvider` e consulta de saúde da API (`/health`).
- [x] **Tema Moderno e Sofisticado (Slate / Indigo)**: Criado `theme/index.ts` com paleta escura refinada, tipografia Inter, scrollbar estilizada e cards modernos.
- [x] **Auto-Scroll no Chat**: Implementado auto-scroll suave com `messagesEndRef` a cada nova mensagem ou indicação de digitação.
- [x] **Badge de Status de Conexão**: Chip dinâmico indicando se a conexão está Online, Reconectando ou Desconectada.

### 🟢 Melhorias e Novas Features (Roadmap)
- [ ] **Seletor de Emojis**: Integrar picker de emojis no input de envio.
- [ ] **Som de Notificação Sutil**: Reproduzir som curto em mensagens recebidas (com toggle para silenciar).
- [ ] **Busca de Usuários no Sidebar**: Campo de filtro rápido para salas com muitos participantes.
- [ ] **Suporte a Compartilhamento de Mídia/Links**: Renderização enriquecida de links e imagens.

---

## 🚀 Checklist de Telas e Componentes

### Welcome & Join Room
- [x] Tela de boas-vindas moderna com glassmorphism e badges informativos
- [x] Formulário de entrada na sala com username, chatRoom e badge em tempo real de saúde do backend via TanStack Query
- [ ] Sugestão de salas populares / ativas

### Chat Room
- [x] Sidebar moderno com avatares e contagem de participantes
- [x] Balões de chat diferenciados para remetente vs outros participantes
- [x] Timestamps locais em cada balão de mensagem
- [x] Auto-scroll suave para última mensagem
- [x] Indicador de digitação dinâmico com avatar de quem digita
- [x] Status de conexão em tempo real (Conectado / Reconectando / Desconectado)
- [x] Botão de sair com limpeza de sessão
