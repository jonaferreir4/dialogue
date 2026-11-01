# Global AI Agent Guidelines & Architecture Map — Dialogue Monorepo

Welcome AI Assistant (Google Antigravity, Claude Code, Cursor, Copilot, ChatGPT, Gemini etc.). This repository houses **Dialogue**, a high-performance real-time fullstack communication platform built with **.NET 8 (Clean Architecture & SignalR)** and **React 19 (Material UI, TanStack Query, Zustand)**.

---

## 0. Meta-regra

> **Quando em dúvida, não faça.** Pergunte ao desenvolvedor antes de tomar uma decisão arquitetural que viole as fronteiras de camadas no backend ou o fluxo unidirecional de dados no frontend.

---

## 🏛️ Monorepo Overview & Scope Directory

```
Dialogue/
├── .agents/
│   ├── skills.json                   # Descoberta de skills do monorepo
│   └── skills/
│       ├── dialogue-signalr-realtime/# Skill de SignalR backend (concorrência, sockets)
│       ├── dialogue-realtime-client/ # Skill de SignalR client (React 19, reconnection)
│       └── vendor/                   # Skills consolidadas de engenharia
│           ├── csharp-dotnet-best-practices/
│           ├── dotnet-clean-architecture/
│           ├── solid-clean-code/
│           ├── frontend-senior/
│           ├── ui-ux-design-system/
│           ├── security-and-hardening/
│           ├── performance-optimization/
│           └── xunit-testing-best-practices/
├── backend/                          # .NET 8 Web API (Clean Architecture & DDD)
│   ├── Dialogue.sln
│   ├── Dockerfile
│   └── src/
│       ├── Domain/                   # Entidades puras e regras de negócio
│       ├── Application/              # Use Cases, DTOs (Records), Interfaces
│       ├── Infraestructure/          # Implementações, Serviços de Conexão, DI
│       ├── WebApi/                   # Hubs SignalR, Controllers, Program.cs
│       └── Tests/                    # Testes unitários com xUnit, Moq e FluentAssertions
├── frontend/                         # React 19 + TypeScript + Vite + MUI v7
│   ├── src/
│   │   ├── components/               # Componentes UI (TypingIndicator, etc.)
│   │   ├── context/                  # Contextos de aplicação
│   │   ├── lib/                      # QueryClient do TanStack Query
│   │   ├── pages/                    # Welcome, JoinRoom, Chat
│   │   ├── services/                 # SignalR Client e API Axios
│   │   ├── stores/                   # Stores atômicos Zustand (useChatStore)
│   │   └── theme/                    # Tema moderno Dark/Slate
│   ├── Dockerfile                    # Multi-stage build com Nginx SPA
│   ├── nginx.conf                    # Nginx interno do SPA
│   └── package.json
├── nginx/
│   └── nginx.conf                    # Proxy reverso orquestrador (WebSockets + SPA)
├── docker-compose.yml                # Orquestração (backend + frontend + nginx)
├── AGENTS.md                         # Este arquivo de governança
└── STATUS.md                         # Roadmap unificado e débito técnico
```

### Scope Routing Instructions for AI Agents
- Quando estiver trabalhando no **Backend C# / .NET** (`/backend`), siga as regras de Clean Architecture, concorrência thread-safe com `ConcurrentDictionary`/`IConnectionTracker`, DTOs imutáveis, e timestamps UTC.
- Quando estiver trabalhando no **Frontend React** (`/frontend`), siga os padrões do Zustand para tempo real, TanStack Query para estado de servidor, Material UI customizado e auto-scroll suave.
- Ao alterar contratos de comunicação (eventos do Hub SignalR), **sempre atualize ambos os lados (backend e frontend) no mesmo ciclo**.

---

## 📐 Regras de Engenharia Invioláveis

### 1. Backend (.NET 8 & C# 12)
- **Dependências Estritas**: `Domain` (zero dependências) <- `Application` <- `Infraestructure` <- `WebApi`.
- **Concorrência Segura**: Hubs SignalR são transitórios. Nunca use `Dictionary` não-thread-safe como singleton. Sempre use `ConcurrentDictionary` ou abstrações como `IConnectionTracker`.
- **Contratos e DTOs**: Nunca passe entidades de `Domain` como parâmetros de métodos do Hub. Use `records` imutáveis.
- **Timestamps**: Sempre use `DateTime.UtcNow`. Nunca use `DateTime.Now`.
- **Identificadores**: Mensagens devem conter `Guid Id` para permitir deduplicação no frontend.
- **Testes**: Sempre validar que `dotnet test backend/Dialogue.sln` passa com 0 erros e 0 warnings.

### 2. Frontend (React 19 & TypeScript)
- **Conexão SignalR**: Nunca use URLs hardcoded (`http://localhost:5000`). Consuma `import.meta.env.VITE_API_URL`.
- **Zustand vs TanStack Query**: Zustand gerencia streaming de tempo real (mensagens, presença, digitação); TanStack Query gerencia dados REST e cache de servidor.
- **Limpeza de Eventos**: Sempre limpe listeners de eventos (`connection.off(...)`) no cleanup de efeitos.
- **Chaves de Lista**: Nunca use `key={index}` na lista de mensagens; use `key={msg.id}`.

---

## ❌ Proibido vs ✅ Correto

| ❌ Proibido | ✅ Correto |
|---|---|
| Pacote `Microsoft.AspNet.SignalR` no csproj | SignalR nativo do ASP.NET Core (`Microsoft.AspNetCore.SignalR`) |
| `Dictionary<string, User>` como Singleton | `ConcurrentDictionary<string, ConnectedUserDto>` ou `IConnectionTracker` |
| `JoinRoom(User user)` usando entidade | `JoinRoom(JoinRoomRequest request)` usando DTO imutável |
| `DateTime.Now` no envio de mensagens | `DateTime.UtcNow` |
| `http://localhost:5000/chat` hardcoded no front | `import.meta.env.VITE_API_URL + '/chat'` |
| `<TypingIndicator typingUser={myUsername}/>` | `<TypingIndicator typingUser={remoteTypingUser}/>` |
| Submeter código sem testar compilação | Executar `dotnet test` e `npm run build` com 0 erros |

---

## 📦 Convenções de Git e Commits
Seguir o padrão **Conventional Commits**:
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `refactor:` Refatoração sem alteração de comportamento externo
- `perf:` Melhoria de performance
- `test:` Adição ou ajuste de testes
- `docs:` Documentação
- `chore:` Atualizações de configuração ou dependências
