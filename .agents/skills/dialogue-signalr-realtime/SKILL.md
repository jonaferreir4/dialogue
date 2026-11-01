---
name: dialogue-signalr-realtime
description: Boas práticas e guardrails para comunicação bidirecional em tempo real com ASP.NET Core SignalR, WebSockets, concorrência thread-safe, ordenação canônica de mensagens e escalabilidade horizontal no Dialogue.
---

# Dialogue SignalR Real-Time Skill

Este guia define as diretrizes técnicas e padrões de implementação para comunicação em tempo real no **Dialogue** utilizando **ASP.NET Core SignalR** (.NET 8).

---

## 1. Ciclo de Vida do Hub e Concorrência Thread-Safe

### 1.1 Ciclo de Vida Transitório
- Instâncias de `Hub` (`ChatRoom`) são criadas e descartadas pelo ASP.NET Core a **cada invocação de método** do cliente.
- **NUNCA** armazene estado da conexão ou dados em variáveis de instância não estáticas dentro do Hub.

### 1.2 Gerenciamento de Conexões em Memória
- Quando gerenciar conexões em memória na aplicação:
  - **SEMPRE** utilizar coleções thread-safe como `ConcurrentDictionary<TKey, TValue>`.
  - **NUNCA** registrar ou injetar `Dictionary<TKey, TValue>` como Singleton para escrita concorrente (provoca `InvalidOperationException` e corrupção de memória sob concorrência).
  - Encapsular o rastreamento de conexões em um serviço dedicado injetado via interface (ex.: `IConnectionTracker` ou `IUserSessionService`), em vez de expor a coleção diretamente ao Hub.

### 1.3 Escalabilidade Horizontal (Scale-Out)
- Para rodar mais de uma réplica do backend com SignalR e balanceamento Nginx, utilizar o **Redis Backplane** oficial da Microsoft:
  ```bash
  dotnet add package Microsoft.AspNetCore.SignalR.StackExchangeRedis
  ```
- O Redis distribui os broadcasts (`Clients.Group`, `Clients.All`) entre todas as instâncias da aplicação de forma transparente.

---

## 2. Contratos de Mensagens, DTOs e Ordenação Canônica

*(Lições aprendidas de concorrência e WebSocket baseadas no K-Flow)*

### 2.1 Uso Estrito de DTOs
- **NUNCA** receber ou retornar entidades do `Domain` (ex: `Domain.Entities.User`) como parâmetros de métodos do Hub.
- Criar DTOs dedicados (records imutáveis) em `Application/DTOs/` ou `WebApi/DTOs/`:
  - `JoinRoomRequest(string Username, string ChatRoom)`
  - `SendMessageRequest(string Content)`
  - `ChatMessageDto(Guid Id, string Sender, string Content, DateTime TimestampUtc)`
  - `ConnectedUserDto(string Username, DateTime ConnectedAtUtc)`

### 2.2 Ordenação Canônica e Timestamps
- Mensagens devem **SEMPRE** carregar timestamps em **UTC** (`DateTime.UtcNow`). Evite `DateTime.Now` para prevenir divergências de fuso horário entre clientes.
- Cada mensagem transmitida deve possuir um identificador único imutável (`Guid Id`), permitindo deduplicação no frontend e controle de entrega/confirmação (`ack`).

---

## 3. Indicadores de Digitação e Otimização de Eventos

- Eventos de digitação (`StartTyping`, `StopTyping`) geram tráfego frequente.
- Utilizar `Clients.OthersInGroup(chatRoom)` para que o próprio autor não receba eco do seu evento.
- No frontend, debounces de pelo menos 1.5s a 2s devem ser sincronizados com `StopTyping`.

---

## 4. Resiliência e Desconexões Graciosas

- Em `OnDisconnectedAsync(Exception? exception)`:
  - Sempre invocar `await base.OnDisconnectedAsync(exception)`.
  - Remover a conexão com segurança (`TryRemove`) do tracker.
  - Notificar a sala apenas se o usuário não possuir outra conexão ativa (caso suporte múltiplas abas/janelas).
  - Logar a causa da desconexão usando `ILogger<ChatRoom>` se `exception != null`.

---

## 5. Segurança e Validação de Entrada

- Validar strings recebidas:
  - Mensagens não podem ser vazias ou conter apenas espaços em branco.
  - Limite de tamanho de caracteres por mensagem (ex: máximo 2000 caracteres).
  - Nomes de sala sanitizados (apenas caracteres alfanuméricos e hífens).
- Prevenir injeção de HTML/Scripts no payload de broadcast.
