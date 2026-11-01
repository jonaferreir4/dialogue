# Status do Projeto e Roadmap — Dialogue Monorepo

Este arquivo consolida o progresso de implementação, a arquitetura monorepo unificada e o roadmap de melhorias do **Dialogue** (.NET 8 + React 19).

---

## 🏛️ Estrutura do Monorepo

- [x] **Unificação Monorepo**: Separação limpa entre `/backend` (.NET 8 Clean Architecture) e `/frontend` (React 19 + Vite).
- [x] **Containerização Multi-Stage**:
  - `backend/Dockerfile`: SDK 8.0 Release build com runtime leve ASP.NET 8.0 (porta 8080).
  - `frontend/Dockerfile`: Node 20 build com Nginx Alpine servindo a SPA estática (porta 80).
  - `nginx/nginx.conf`: Proxy reverso orquestrador unificando WebSockets (`/chat`), Healthcheck (`/health`) e SPA (`/`).
  - `docker-compose.yml`: Orquestração completa de ponta a ponta.
- [x] **Governança de IA Assistida Unificada**:
  - `AGENTS.md` com roteamento de escopo por pasta (`backend` vs `frontend`).
  - Catálogo centralizado em `.agents/skills/` com skills para SignalR (servidor e cliente), Clean Architecture, C#, Frontend Senior e UI/UX.

---

## 📋 Diagnóstico e Resoluções

### Backend (.NET 8 WebApi) — Resolvidos ✅
- [x] **Clean Architecture Conectada**: `Domain` <- `Application` <- `Infraestructure` <- `WebApi`.
- [x] **Pacotes Obsoletos Removidos**: Removido `Microsoft.AspNet.SignalR 2.4.3`. Solução compila com 0 erros e 0 warnings.
- [x] **Concorrência Segura**: Implementado `InMemoryConnectionTracker` com `ConcurrentDictionary<string, ConnectedUserDto>`.
- [x] **Contratos Canônicos e DTOs**: DTOs imutáveis (`JoinRoomRequest`, `ChatMessageDto`, etc.), timestamps em UTC e `Guid Id` em cada mensagem.
- [x] **Testes Automatizados**: Suíte xUnit em `backend/src/Tests/` com 11 testes unitários e de estresse concorrente aprovados.
- [x] **Endpoint de Healthcheck**: Rota `/health` disponível para monitoramento e validação de container.

### Frontend (React 19 + MUI + TanStack + Zustand) — Resolvidos ✅
- [x] **Zustand para Tempo Real**: `useChatStore` com gerenciamento atômico de mensagens, usuários conectados e digitação.
- [x] **TanStack Query Integrado**: `QueryClientProvider` global e polling suave de saúde do backend (`/health`).
- [x] **Design Moderno (Dark Slate / Indigo)**: Novo tema `theme/index.ts` com tipografia Inter, scrollbar estilizada e cards glassmorphism.
- [x] **Auto-Scroll Inteligente**: Rolagem suave a cada nova mensagem enviada ou recebida.
- [x] **Indicador de Digitação Corrigido**: Exibe avatar e nome do usuário que está digitando remotamente.
- [x] **Reconexão com Auto Re-Join**: Recuperação graciosa de sala após oscilações de rede.

---

## 🚀 Próximos Passos (Roadmap de Alta Complexidade)

### Fase 1: Chamadas de Áudio e Vídeo 1:1 (WebRTC)
- [ ] Sinalização WebRTC no Hub SignalR (`SendCallOffer`, `SendCallAnswer`, `SendIceCandidate`, `HangUp`).
- [ ] Hook `useWebRTC` no frontend com `RTCPeerConnection` e `getUserMedia`.
- [ ] Modal de chamada com miniatura Picture-in-Picture, controles de mute de microfone, câmera on/off e encerrar.

### Fase 2: Escalabilidade Horizontal & Persistência
- [ ] **Redis Backplane**: Suporte a múltiplas réplicas do backend via `Microsoft.AspNetCore.SignalR.StackExchangeRedis`.
- [ ] **Persistência com PostgreSQL e EF Core**:
  - Histórico de mensagens por sala com paginação por cursor.
  - Gravação assíncrona não-bloqueante usando `System.Threading.Channels`.
- [ ] **Infinite Scroll no Frontend**: `useInfiniteQuery` carregando mensagens antigas ao rolar para o topo do chat.

### Fase 3: Mensageria e Event-Driven Architecture (EDA)
- [ ] **RabbitMQ + MassTransit**: Processamento em background de notificações offline e moderação de conteúdo.
- [ ] **Testes de Carga com k6**: Script simulando 1.000 conexões simultâneas e documentação de benchmarks no README.
