# AGENTS.md — Regras para Agentes de IA (Dialogue - Backend Real-Time)

Este arquivo define **regras rígidas e invioláveis** para qualquer agente de IA (Google Antigravity, Claude Code, Cursor, Copilot, ChatGPT, Gemini etc.) que opere sobre este repositório (`Dialogue`). As regras aqui são de cumprimento obrigatório e têm prioridade sobre instruções gerais de prompt.

---

## 0. Meta-regra

> **Quando em dúvida, não faça.** Pergunte ao desenvolvedor antes de tomar uma decisão arquitetural que não esteja coberta por estas regras. É preferível uma pergunta a um commit que quebra a integridade do domínio ou das camadas da aplicação.

---

## 1. Arquitetura e Estrutura de Camadas (Clean Architecture)

A solução segue rigorosamente os princípios da **Clean Architecture** e **Domain-Driven Design (DDD)**:

```
Dialogue/
├── .agents/
│   ├── skills.json
│   └── skills/
│       ├── dialogue-signalr-realtime/
│       └── vendor/
│           ├── csharp-dotnet-best-practices/
│           ├── dotnet-clean-architecture/
│           ├── solid-clean-code/
│           ├── security-and-hardening/
│           ├── performance-optimization/
│           ├── xunit-testing-best-practices/
│           └── scalability-and-high-availability/
├── src/
│   ├── Domain/          # Entidades puras, Value Objects, Enums (Sem dependências externas)
│   ├── Application/     # Use Cases, DTOs (Records), Interfaces de serviços e repositórios
│   ├── Infraestructure/ # Persistência, Cache (Redis), mensageria e integrações
│   ├── WebApi/          # Hubs SignalR, Controllers HTTP, Middlewares, DI (Program.cs)
│   └── Tests/           # Testes unitários e de integração com xUnit
├── DockerFile           # Build multi-stage para container
├── docker-compose.yml   # Orquestração do backend + Nginx / Redis
└── Dialogue.sln         # Solução .NET 8
```

### 1.1 Regras de Dependência entre Projetos
- **`Domain`**: **NUNCA** referencia nenhum outro projeto da solução, nem pacotes de terceiros de infraestrutura ou EF Core.
- **`Application`**: Referencia apenas `Domain`. Contém contratos (`Interfaces`) e DTOs.
- **`Infraestructure`**: Referencia `Application` (e transitivamente `Domain`). Implementa as interfaces de repositório, persistência e serviços externos.
- **`WebApi`**: Referencia `Application` e `Infraestructure` para composição da Injeção de Dependência no `Program.cs`. Os Hubs e Controllers devem consumir **apenas interfaces** da camada `Application`.

---

## 2. Regras Específicas para SignalR e Tempo Real

### 2.1 Concorrência e Gerenciamento de Estado
- Instâncias de `Hub` são **transitórias**. Nunca declare estado mutável em campos normais do Hub.
- **NUNCA** utilizar `Dictionary<TKey, TValue>` compartilhado em Singleton. **SEMPRE** utilizar coleções thread-safe como `ConcurrentDictionary<TKey, TValue>` ou um serviço rastreador isolado (`IConnectionTracker`).
- Para suporte a múltiplas instâncias (scale-out), preparar e preferir o **Redis Backplane** (`Microsoft.AspNetCore.SignalR.StackExchangeRedis`).

### 2.2 Contratos e DTOs (Lições canônicas de WebSockets)
- **NUNCA** passar entidades do `Domain` diretamente como argumentos ou retornos de Hubs SignalR.
- **SEMPRE** utilizar `records` imutáveis como DTOs.
- Mensagens de chat **DEVEM** conter:
  1. Identificador único imutável (`Guid Id`) para permitir deduplicação no cliente.
  2. Timestamp padronizado em **UTC** (`DateTime.UtcNow`). **NUNCA** usar `DateTime.Now`.
- Sanitizar e validar entradas de texto (tamanho máximo, conteúdo não vazio, sem tags perigosas).

---

## 3. Qualidade de Código C# 12 & .NET 8

### 3.1 Nulabilidade e Tipagem
- Manter `<Nullable>enable</Nullable>` ativo em todos os projetos.
- Tratar avisos de compilação (CS8600, CS8602, CS8604, etc.) explicitamente, sem supressões levianas (`!`).
- **NUNCA** adicionar pacotes legados do .NET Framework (como `Microsoft.AspNet.SignalR`). O SignalR no .NET 8 é nativo via `Microsoft.AspNetCore.App`.

### 3.2 Programação Assíncrona (`async` / `await`)
- Todas as operações I/O devem ser assíncronas (`async Task<T>`).
- **NUNCA** usar `.Result`, `.Wait()` ou `.GetAwaiter().GetResult()`.
- Aceitar e repassar `CancellationToken` quando aplicável.

### 3.3 Injeção de Dependência (DI)
- Injetar dependências via construtor (preferir *Primary Constructors* do C# 12 onde for limpo).
- **NUNCA** instanciar services com `new` dentro de Hubs ou Controllers.

---

## 4. Testes Automatizados Obrigatórios

- Qualquer nova regra de negócio em `Application` ou alteração no Hub SignalR deve ser acompanhada de testes unitários em `src/Tests/`.
- Utilizar **xUnit**, **Moq** / **NSubstitute** e **FluentAssertions**.
- Não submeter código sem verificar que `dotnet test` e `dotnet build` executam com **0 erros e 0 warnings**.

---

## 5. Tabela: ❌ Proibido vs ✅ Correto

| ❌ Proibido | ✅ Correto |
|---|---|
| Pacote `Microsoft.AspNet.SignalR` no csproj | SignalR nativo do ASP.NET Core (`Microsoft.AspNetCore.SignalR`) |
| `Dictionary<string, User>` como Singleton | `ConcurrentDictionary<string, ConnectedUserDto>` ou `IConnectionTracker` |
| `JoinRoom(User user)` usando entidade de domínio | `JoinRoom(JoinRoomRequest request)` usando DTO imutável |
| `DateTime.Now` no envio de mensagens | `DateTime.UtcNow` |
| `WebApi` chamar `Domain` diretamente sem `Application` | `WebApi` consome `IApplicationService` |
| `COPY --from=buld` ou `publish -c debug` no Dockerfile | `COPY --from=build` e `publish -c Release` |
| `webapi` e `nginx` com dependência circular no compose | `nginx` depende de `webapi` |

---

## 6. Convenções de Git e Commits

Seguir o padrão **Conventional Commits**:
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `refactor:` Refatoração sem alteração de comportamento externo
- `perf:` Melhoria de performance
- `test:` Adição ou ajuste de testes
- `docs:` Documentação
- `chore:` Atualizações de configuração ou dependências
