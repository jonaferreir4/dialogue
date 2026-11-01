# Backend AI Agent Guidelines — Dialogue (.NET 8 Web API & SignalR)

Welcome AI Assistant. This directory contains the **Backend API** for Dialogue, built with **.NET 8, Clean Architecture, Domain-Driven Design (DDD), and ASP.NET Core SignalR**.

> Regra de ouro: **Em caso de dúvida arquitetural, pergunte antes de decidir**. É preferível uma pergunta a um commit que viola as fronteiras de camadas no backend ou introduz concorrência insegura.

---

## 🏛️ Clean Architecture Project Map

```
backend/
├── .agents/skills/             # Backend-scoped skills (ver skills.json)
│   ├── dialogue-signalr-realtime/
│   └── vendor/
│       ├── csharp-dotnet-best-practices/
│       ├── dotnet-clean-architecture/
│       ├── solid-clean-code/
│       ├── security-and-hardening/
│       ├── performance-optimization/
│       ├── xunit-testing-best-practices/
│       └── scalability-and-high-availability/
├── Dialogue.sln
├── Dockerfile
├── appsettings.json
├── appsettings.Development.json
├── AGENTS.md                   # Este arquivo de governança
├── STATUS.md                   # Status e débito técnico do backend
└── src/
    ├── Domain/                 # Entidades puras, Value Objects, Enums (Sem dependências externas)
    ├── Application/            # Use Cases, DTOs (Records), Interfaces (IConnectionTracker)
    ├── Infraestructure/        # Persistência, Conexões thread-safe, DI (DependencyInjection.cs)
    ├── WebApi/                 # Hubs SignalR (/chat), Endpoint /health, Program.cs
    └── Tests/                  # Testes unitários e de concorrência com xUnit, Moq e FluentAssertions
```

### Reference Skills:
- SignalR Real-Time & Concorrência: [.agents/skills/dialogue-signalr-realtime/SKILL.md](.agents/skills/dialogue-signalr-realtime/SKILL.md)
- Clean Architecture & DDD: [.agents/skills/vendor/dotnet-clean-architecture/SKILL.md](.agents/skills/vendor/dotnet-clean-architecture/SKILL.md)
- C# 12 & .NET 8 Best Practices: [.agents/skills/vendor/csharp-dotnet-best-practices/SKILL.md](.agents/skills/vendor/csharp-dotnet-best-practices/SKILL.md)
- SOLID & Clean Code: [.agents/skills/vendor/solid-clean-code/SKILL.md](.agents/skills/vendor/solid-clean-code/SKILL.md)
- Testes Automatizados com xUnit: [.agents/skills/vendor/xunit-testing-best-practices/SKILL.md](.agents/skills/vendor/xunit-testing-best-practices/SKILL.md)
- Otimização & Coleções Concorrentes: [.agents/skills/vendor/performance-optimization/SKILL.md](.agents/skills/vendor/performance-optimization/SKILL.md)
- Segurança & Hardening: [.agents/skills/vendor/security-and-hardening/SKILL.md](.agents/skills/vendor/security-and-hardening/SKILL.md)

---

## 📐 Regras de Engenharia Invioláveis

### 1. Dependências Estritas entre Camadas
- **`Domain`**: Camada mais interna. **NUNCA** referencia nenhum outro projeto da solução, nem pacotes externos ou frameworks.
- **`Application`**: Referencia apenas `Domain`. Contém contratos de serviços (`Interfaces/`), DTOs imutáveis (`DTOs/`) e casos de uso.
- **`Infraestructure`**: Referencia `Application` (e transitivamente `Domain`). Implementa o rastreamento de conexões (`IConnectionTracker`), persistência e integrações externas.
- **`WebApi`**: Camada de entrada HTTP e WebSockets. Referencia `Application` e `Infraestructure` (para registro no `Program.cs`), mas os Hubs e Controllers devem consumir **apenas interfaces** da camada `Application`.

### 2. Regras Específicas para SignalR e Tempo Real
- **Hubs são Transitórios**: Instâncias de `Hub` são instanciadas por chamada. Nunca armazene estado em campos não estáticos dentro da classe do Hub.
- **Concorrência Segura (Thread-Safety)**: **NUNCA** injete `Dictionary<TKey, TValue>` compartilhado como Singleton. **SEMPRE** utilize coleções thread-safe como `ConcurrentDictionary<TKey, TValue>` encapsuladas em serviços dedicados (`IConnectionTracker`).
- **Contratos e DTOs Imutáveis**: **NUNCA** receba ou retorne entidades do `Domain` (como `User`) como argumentos do Hub. Use `records` imutáveis (`JoinRoomRequest`, `ChatMessageDto`).
- **Timestamps em UTC**: Mensagens devem conter `DateTime.UtcNow`. **NUNCA** usar `DateTime.Now`.
- **Identificador Único por Mensagem**: Toda mensagem emitida pelo Hub deve carregar um `Guid Id` único para permitir deduplicação e controle de entrega no cliente.
- **Sanitização de Entrada**: Mensagens vazias ou com espaços em branco devem ser ignoradas. Truncar mensagens com tamanho excessivo (> 2000 caracteres).

### 3. Qualidade de Código C# 12 & .NET 8
- **Nulabilidade**: `<Nullable>enable</Nullable>` ativo em todos os projetos. Sem supressões levianas (`!`) no código.
- **Pacotes Nativos**: O SignalR no .NET 8 é nativo (`Microsoft.AspNetCore.App`). É proibido adicionar pacotes legados como `Microsoft.AspNet.SignalR`.
- **Programação Assíncrona Idiomática**: Todas as operações I/O devem ser assíncronas (`async Task`). Nunca use `.Result` ou `.Wait()`.
- **Injeção de Dependência**: Injetar dependências via construtor (preferir *Primary Constructors* do C# 12).

### 4. Testes Automatizados
- Todo método novo no Hub SignalR ou serviço em `Application`/`Infraestructure` deve ser acompanhado de testes unitários em `src/Tests/`.
- Testar concorrência multithreaded para coleções compartilhadas.
- **NUNCA** submeter código sem verificar que `dotnet test backend/Dialogue.sln` passa com 0 erros e 0 warnings.

---

## ❌ Proibido vs ✅ Correto

| ❌ Proibido | ✅ Correto |
|---|---|
| Pacote `Microsoft.AspNet.SignalR` no csproj | SignalR nativo do ASP.NET Core (`Microsoft.AspNetCore.SignalR`) |
| `Dictionary<string, User>` como Singleton | `ConcurrentDictionary<string, ConnectedUserDto>` via `IConnectionTracker` |
| `JoinRoom(User user)` usando entidade | `JoinRoom(JoinRoomRequest request)` usando DTO imutável |
| `DateTime.Now` no envio de mensagens | `DateTime.UtcNow` |
| `WebApi` chamar `Domain` diretamente sem `Application` | `WebApi` consome `IApplicationService` / `IConnectionTracker` |
| Métodos de Hub sem sanitização ou limite de tamanho | Validar `IsNullOrWhiteSpace` e limitar tamanho de caracteres |
| Submeter código sem testar compilação | Executar `dotnet test backend/Dialogue.sln` com 0 erros e 0 warnings |

---

## 📦 Convenções de Git e Commits
Seguir **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `perf:`, `test:`, `docs:`, `chore:`.
