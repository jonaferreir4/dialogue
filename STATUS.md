# Status do Projeto e Débito Técnico — Dialogue

Este arquivo consolida o progresso de implementação, débito técnico catalogado e o roadmap de melhorias do **Dialogue** (Backend SignalR em .NET 8).

---

## 📋 Diagnóstico de Débito Técnico

### 🔴 Críticos (Resolvidos ✅)
- [x] **Pacote NuGet Obsoleto no WebApi**: Removido `Microsoft.AspNet.SignalR 2.4.3` do [src/WebApi/WebApi.csproj](file:///home/jona/Área%20de%20trabalho/Dialogue/src/WebApi/WebApi.csproj). Eliminados todos os 14 warnings `NU1701`. A solução compila com **0 erros e 0 warnings**.
- [x] **Concorrência Insegura no Hub**: Implementado `InMemoryConnectionTracker` com `ConcurrentDictionary<string, ConnectedUserDto>` em `Infraestructure` e registrado via injeção de dependência através da interface `IConnectionTracker`.
- [x] **Entidade de Domínio Exposta na API (`User`)**: Substituído o uso da entidade `User` nos métodos do Hub por DTOs imutáveis (`JoinRoomRequest`, `ChatMessageDto`, `ConnectedUserDto`) em `Application/DTOs/`.
- [x] **Dockerfile corrigido**:
  - Corrigido typo `COPY --from=build /app/out .`.
  - Publicação otimizada em `-c Release`.
  - Configurada porta padrão `8080` do .NET 8 com `ASPNETCORE_URLS=http://+:8080`.
- [x] **Docker Compose e Nginx**:
  - Removida dependência circular no [docker-compose.yml](file:///home/jona/Área%20de%20trabalho/Dialogue/docker-compose.yml) (`nginx` depende de `webapi`).
  - Criado o arquivo [nginx/nginx.conf](file:///home/jona/Área%20de%20trabalho/Dialogue/nginx/nginx.conf) com headers de upgrade para WebSockets (`Upgrade $http_upgrade`, `Connection $connection_upgrade`) e timeouts de 3600s.

### 🟡 Importantes (Resolvidos ✅)
- [x] **Criação de Testes Automatizados**: Criado projeto `src/Tests/Tests.csproj` adicionado à solução [Dialogue.sln](file:///home/jona/Área%20de%20trabalho/Dialogue/Dialogue.sln). Incluídos 11 testes unitários com **xUnit**, **Moq** e **FluentAssertions** cobrindo o Hub SignalR e o rastreador concorrente sob estresse multithreaded (100% dos testes aprovados).
- [x] **Conexão das Camadas de Clean Architecture**: `Domain` (puro) <- `Application` (DTOs e Interfaces) <- `Infraestructure` (Serviços e DI) <- `WebApi` (Hubs e Endpoints).
- [x] **Timestamps Padronizados em UTC**: Transmissão de eventos atualizada para `DateTime.UtcNow`.
- [x] **Identificador Único por Mensagem**: Implementado `Guid Id` nas mensagens para rastreamento canônico e deduplicação no frontend.
- [x] **Validação de Entrada e Logging**: Adicionada sanitização, corte de mensagens excessivas (>2000 caracteres) e `ILogger<ChatRoom>` estruturado.
- [x] **Endpoint de Healthcheck**: Adicionado `GET /health` em `Program.cs`.

### 🟢 Melhorias e Arquitetura Distribuída (Roadmap)
- [ ] **Redis Backplane para Scale-Out**: Suporte a balanceamento horizontal com múltiplas instâncias do backend via `Microsoft.AspNetCore.SignalR.StackExchangeRedis`.
- [ ] **Persistência de Histórico de Mensagens**: Implementação de banco de dados (PostgreSQL/SQL Server via EF Core em `Infraestructure`) para histórico de salas.
- [ ] **Autenticação e Autorização JWT no SignalR**: Proteger o Hub `/chat` com tokens JWT repassados na query string do WebSocket (`access_token`).
- [ ] **Histórico e Paginação**: Endpoint REST ou método SignalR para carregar mensagens anteriores da sala ao ingressar.
- [ ] **Renomear pasta `Infraestructure` para `Infrastructure`**: Corrigir grafia do diretório e projeto.

---

## 🚀 Checklist de Features e Funcionalidades

### SignalR Hub (`/chat`)
- [x] Entrada em sala (`JoinRoom`) com validação
- [x] Transmissão de mensagem (`SendMessage`) com sanitização e limite
- [x] Notificação de desconexão (`OnDisconnectedAsync`)
- [x] Listagem de usuários conectados (`SendConnectedUser`)
- [x] Sinalização de digitação (`StartTyping` / `StopTyping`)
- [x] Identificador único por mensagem (`Guid Id`)
- [x] Timestamps em UTC (`DateTime.UtcNow`)
- [ ] Confirmação de recebimento (Ack)
- [ ] Salas privadas / Direct Messages (1:1)
- [ ] Envio de anexos/mídia via HTTP com link transmitido no chat

### Infraestrutura e Deploy
- [x] Dockerfile funcional e otimizado para produção (`Release`, porta 8080)
- [x] Docker Compose com Nginx configurado (proxy reverso com suporte a WebSockets/Upgrade headers)
- [x] Healthcheck endpoint (`/health`)
- [x] Suíte de testes automatizados unitários e de concorrência com xUnit
- [ ] Suporte a Redis Backplane para múltiplos nós
