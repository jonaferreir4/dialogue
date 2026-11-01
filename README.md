# Dialogue — Fullstack Real-Time Communication Platform

Plataforma de comunicação em tempo real de alta performance, projetada com arquitetura distribuída, concorrência thread-safe e orquestração por containers.

Construída com **.NET 8 (Clean Architecture & ASP.NET Core SignalR)** no backend e **React 19 (TypeScript, Material UI, TanStack Query e Zustand)** no frontend.

---

## 🏛️ Arquitetura do Monorepo

O repositório é organizado no formato **Monorepo**, garantindo sincronia estrita de contratos de tempo real entre cliente e servidor:

```
Dialogue/
├── backend/                  # .NET 8 Web API (Clean Architecture & SignalR)
│   ├── src/
│   │   ├── Domain/           # Entidades puras e regras de negócio
│   │   ├── Application/      # Casos de uso, DTOs imutáveis, interfaces
│   │   ├── Infraestructure/  # Conexões thread-safe, serviços externos, DI
│   │   ├── WebApi/           # Hubs SignalR (/chat), Controllers, Program.cs
│   │   └── Tests/            # Testes unitários com xUnit, Moq e FluentAssertions
│   ├── Dialogue.sln
│   ├── Dockerfile
│   ├── AGENTS.md             # Regras de IA específicas do backend
│   ├── STATUS.md             # Roadmap técnico do backend
│   └── README.md             # Documentação aprofundada da API
│
├── frontend/                 # React 19 + TypeScript + Vite + MUI v7
│   ├── src/
│   │   ├── components/       # Componentes visuais (TypingIndicator, etc.)
│   │   ├── context/          # Contextos de aplicação
│   │   ├── lib/              # QueryClient do TanStack Query
│   │   ├── pages/            # Welcome, JoinRoom, Chat
│   │   ├── services/         # SignalR Client com auto-reconnect e Axios
│   │   ├── stores/           # Zustand store (useChatStore) para streaming
│   │   └── theme/            # Tema Dark Slate / Índigo moderno
│   ├── Dockerfile            # Multi-stage build com Nginx SPA
│   ├── AGENTS.md             # Regras de IA específicas do frontend
│   ├── STATUS.md             # Roadmap técnico do frontend
│   └── README.md             # Documentação da interface web
│
├── nginx/
│   └── nginx.conf            # Proxy reverso orquestrador (WebSockets + SPA)
├── docker-compose.yml        # Orquestração local completa (Nginx + Backend + Frontend)
├── AGENTS.md                 # Governança global de IA com Scope Routing
├── STATUS.md                 # Roadmap unificado do produto
└── README.md                 # Este documento
```

---

## 🌐 Fluxo e Topologia de Rede (Docker Compose)

O sistema utiliza um **Nginx Gateway** como proxy reverso frontal para unificar o frontend e o backend sob a mesma porta e domínio, eliminando problemas de CORS e configurando túneis de longa duração para WebSockets:

```mermaid
flowchart TD
    User([Navegador / Usuário]) -->|http://localhost:8080| Nginx[Nginx Gateway :8080]

    subgraph Docker Network
        Nginx -->|/chat (WebSockets) & /health| Backend[Backend WebApi :8080]
        Nginx -->|/ (HTML, JS, Assets estáticos)| Frontend[Frontend SPA :80]
    end
```

---

## ⚡ Como Executar

### Pré-requisitos
- **Docker Engine 20.10+** e **Docker Compose 2.0+** (Recomendado), **OU**
- **.NET 8.0 SDK** e **Node.js 20+** (para execução manual).

### 1. Execução via Docker Compose (1 Comando)

Para compilar e subir todos os serviços orquestrados com Nginx:

```bash
docker compose up --build
```

Serviços disponíveis:
* **Aplicação Completa (Frontend + Chat WebSockets)**: `http://localhost:8080`
* **Backend WebApi Direto**: `http://localhost:5000` (Healthcheck em `http://localhost:5000/health`)
* **Frontend SPA Direto**: `http://localhost:3000`

---

### 2. Execução Local para Desenvolvimento (Sem Docker)

#### Iniciar o Backend (.NET 8):
```bash
dotnet run --project backend/src/WebApi/WebApi.csproj
```
*(Executando em `http://localhost:5000`)*

#### Iniciar o Frontend (Vite Dev Server):
```bash
cd frontend
npm install
npm run dev
```
*(Executando em `http://localhost:5173` com Hot-Module Replacement)*

#### Executar Testes Automatizados:
```bash
dotnet test backend/Dialogue.sln
```

---

## 🤖 Desenvolvimento Assistido por IA (AI Agent Governance)

Este repositório possui uma infraestrutura completa de governança para agentes de IA (Google Antigravity, Claude Code, Cursor, Copilot):

| Arquivo / Diretório | Escopo | Descrição |
| :--- | :--- | :--- |
| **`AGENTS.md` (Raiz)** | Global | Roteador de escopo (*Scope Routing*), meta-regras de arquitetura e tabela ❌ Proibido vs ✅ Correto. |
| **`STATUS.md` (Raiz)** | Global | Semáforo de débitos técnicos e roadmap fullstack. |
| **`backend/AGENTS.md`** | Backend | Regras estritas de Clean Architecture, concorrência thread-safe e C# 12. |
| **`frontend/AGENTS.md`**| Frontend | Padrões de React 19, Zustand para real-time, TanStack Query e Material UI. |
| **`.agents/skills/`** | Compartilhado | Catálogo de skills de engenharia, concorrência em WebSockets e design systems. |
