# Status do Projeto e Débito Técnico — Backend (.NET 8 Web API)

Este arquivo consolida o progresso de implementação, débito técnico catalogado e o roadmap de melhorias do **Backend** do Dialogue.

---

## 📋 Diagnóstico de Débito Técnico

### 🔴 Críticos (Resolvidos ✅)
- [x] **Pacote NuGet Obsoleto Removido**: Removido `Microsoft.AspNet.SignalR 2.4.3` de `src/WebApi/WebApi.csproj`. Eliminados 14 warnings `NU1701`. A solução compila com **0 erros e 0 warnings**.
- [x] **Concorrência Segura no Hub**: Implementado `InMemoryConnectionTracker` com `ConcurrentDictionary<string, ConnectedUserDto>` em `Infraestructure` e registrado via DI através de `IConnectionTracker`.
- [x] **Entidade de Domínio Isolada da API**: Substituído o uso direto da entidade `User` por DTOs imutáveis (`JoinRoomRequest`, `ChatMessageDto`, `ConnectedUserDto`) em `Application/DTOs/`.
- [x] **Dockerfile Otimizado**:
  - Compilação configurada em modo `-c Release`.
  - Cache de camadas com cópia seletiva dos arquivos `.csproj` antes do `dotnet restore`.
  - Exposição da porta padrão do .NET 8 (`8080`) com `ASPNETCORE_URLS=http://+:8080`.
- [x] **launchSettings.json Padronizado**: Movido para `src/WebApi/Properties/` com porta configurada para `5000`.

### 🟡 Importantes (Resolvidos ✅)
- [x] **Criação de Testes Automatizados**: Suíte de testes xUnit em `src/Tests/Tests.csproj` com 11 testes cobrindo o Hub SignalR e estresse concorrente multithreaded (100% dos testes aprovados).
- [x] **Conexão das Camadas de Clean Architecture**: `Domain` (puro) <- `Application` (DTOs e Interfaces) <- `Infraestructure` (Serviços e DI) <- `WebApi` (Hubs e Endpoints).
- [x] **Timestamps em UTC**: Transmissão de eventos atualizada para `DateTime.UtcNow`.
- [x] **Identificador Único por Mensagem**: Implementado `Guid Id` nas mensagens para rastreamento canônico e deduplicação no cliente.
- [x] **Validação de Entrada e Logging**: Adicionada sanitização, corte de mensagens excessivas (>2000 caracteres) e `ILogger<ChatRoom>` estruturado.
- [x] **Endpoint de Healthcheck**: Adicionado `GET /health` em `Program.cs`.

### 🟢 Melhorias e Arquitetura Distribuída (Roadmap)
- [ ] **Sinalização WebRTC**: Métodos no Hub para chamadas de áudio e vídeo P2P (`SendCallOffer`, `SendCallAnswer`, `SendIceCandidate`, `HangUp`).
- [ ] **Redis Backplane para Scale-Out**: Suporte a balanceamento horizontal com múltiplas réplicas da WebApi via `Microsoft.AspNetCore.SignalR.StackExchangeRedis`.
- [ ] **Persistência de Histórico de Mensagens**: Implementação de banco de dados (PostgreSQL via EF Core em `Infraestructure`) para histórico persistente de salas.
- [ ] **Fila de Gravação Não-Bloqueante**: Utilizar `System.Threading.Channels` com `BackgroundService` para gravar mensagens em lote sem onerar a latência do WebSocket.
- [ ] **Autenticação e Autorização JWT no SignalR**: Proteger o Hub `/chat` com tokens JWT repassados na query string do WebSocket (`access_token`).
- [ ] **Renomear pasta `Infraestructure` para `Infrastructure`**: Corrigir grafia do diretório e projeto.

---

## 🚀 Checklist de Features do Hub SignalR (`/chat`)

- [x] Entrada em sala (`JoinRoom`) com validação
- [x] Transmissão de mensagem (`SendMessage`) com sanitização e limite
- [x] Notificação de desconexão (`OnDisconnectedAsync`)
- [x] Listagem de usuários conectados (`SendConnectedUser`)
- [x] Sinalização de digitação (`StartTyping` / `StopTyping`)
- [x] Identificador único por mensagem (`Guid Id`)
- [x] Timestamps em UTC (`DateTime.UtcNow`)
- [ ] Métodos de sinalização WebRTC (Oferta SDP, Resposta SDP, Candidato ICE)
- [ ] Confirmação de recebimento (Ack)
- [ ] Salas privadas / Direct Messages (1:1)
- [ ] Envio de anexos/mídia via HTTP com link transmitido no chat
