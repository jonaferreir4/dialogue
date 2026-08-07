# Dialogue - Backend de Comunicação em Tempo Real

## 1. Visão Geral do Sistema

O **Dialogue** é uma solução backend desenvolvida em .NET 8 com foco em comunicação assíncrona, bidirecional e em tempo real. O sistema utiliza a biblioteca ASP.NET Core SignalR para gerenciar conexões via WebSockets e receptores de fallback (Server-Sent Events / Long Polling), permitindo o agrupamento dinâmico de usuários em salas de chat, transmissão de mensagens, controle de presença e sinalização de digitação.

O projeto foi estruturado seguindo os princípios de **Clean Architecture** (Arquitetura Limpa) e **Domain-Driven Design (DDD)**, promovendo baixo acoplamento, alta coesão e facilidade de manutenção e testabilidade.

---

## 2. Arquitetura e Estrutura do Projeto

A solução é organizada sob o padrão de projetos em camadas, dividida nos seguintes módulos:

```
Dialogue/
├── src/
│   ├── Domain/          # Entidades centrais e regras de negócio do domínio
│   ├── Application/     # Casos de uso, interfaces e contratos da aplicação
│   ├── Infraestructure/ # Implementação de persistência, mensageria e serviços externos
│   └── WebApi/          # Controladores, Hubs SignalR, DTOs e configurações da API
├── docker-compose.yml   # Orquestração de containers (WebApi + Nginx)
├── DockerFile           # Receita de build e runtime da aplicação em container
└── Dialogue.sln         # Solução do Visual Studio / .NET CLI
```

### Detalhamento das Camadas

* **Domain (`src/Domain`)**: Contém as entidades centrais do sistema, como `BaseEntity` e `User`, livres de dependências externas ou frameworks de infraestrutura.
* **Application (`src/Application`)**: Destinada às interfaces de serviços, casos de uso (Use Cases), DTOs abstratos e lógica de orquestração do negócio.
* **Infraestructure (`src/Infraestructure`)**: Destinada a abstrair conexões de dados, repositórios, mensageria externa (como RabbitMQ/Kafka) e integração com terceiros.
* **WebApi (`src/WebApi`)**: Camada de entrada HTTP e WebSockets. Aloja os Hubs SignalR (ex.: `ChatRoom`), configurações de injeção de dependência (`Program.cs`) e politicas de suporte a CORS.

---

## 3. Principais Funcionalidades

### 3.1. Gerenciamento de Conexões e Salas
* **Entrada em Sala (`JoinRoom`)**: Registra o usuário em um grupo específico do SignalR (`ChatRoom`), mapeia o identificador único da conexão (`ConnectionId`) e notifica os demais integrantes da sala.
* **Saída e Desconexão (`OnDisconnectedAsync`)**: Trata a desconexão graciosa ou inesperada do cliente, remove a associação da conexão do estado em memória e notifica a sala sobre a saída do usuário.
* **Listagem de Usuários Conectados (`ConnectedUser`)**: Transmite periodicamente ou sob demanda a lista atualizada de apelidos (`Username`) ativos na sala.

### 3.2. Troca de Mensagens e Sinalização
* **Envio de Mensagens (`SendMessage`)**: Recupera os dados do remetente associado à conexão ativa e realiza o broadcast da mensagem para o grupo correspondente.
* **Indicadores de Digitação (`StartTyping` / `StopTyping`)**: Emite eventos em tempo real para informar aos demais participantes quando um usuário começou ou parou de digitar.

---

## 4. Tecnologia e Dependências

* **Runtime**: .NET 8.0 SDK
* **Linguagem**: C# 12
* **Protocolo de Tempo Real**: ASP.NET Core SignalR (WebSockets / SSE)
* **Orquestração e Containers**: Docker, Docker Compose, Nginx
* **Gerenciador de Dependências**: NuGet

---

## 5. Especificação dos Contratos SignalR

O Hub SignalR está exposto na rota `/chat`.

### Métodos de Invocação (Client -> Server)

| Método | Argumentos | Descrição |
| :--- | :--- | :--- |
| `JoinRoom` | `User user` (`{ username, chatRoom }`) | Conecta o usuário a uma sala e notifica o grupo. |
| `SendMessage` | `string message` | Envia uma mensagem para a sala do usuário atual. |
| `StartTyping` | `string chatRoom, string username` | Notifica que o usuário começou a digitar na sala. |
| `StopTyping` | `string chatRoom, string username` | Notifica que o usuário parou de digitar na sala. |

### Eventos Transmitidos (Server -> Client)

| Evento | Parâmetros | Descrição |
| :--- | :--- | :--- |
| `ReceiveMessage` | `string sender, string message, DateTime timestamp` | Recebimento de mensagem pública ou do sistema. |
| `ConnectedUser` | `string[] users` | Lista de nomes de usuários atualmente conectados na sala. |
| `UserTyping` | `string username` | Notificação de início de digitação de outro participante. |
| `UserStopTyping` | `string username` | Notificação de término de digitação de outro participante. |

---

## 6. Configuração e Execução

### Pré-requisitos
* .NET 8.0 SDK instalado localmente, **OU**
* Docker Engine 20.10+ e Docker Compose 2.0+

### 6.1. Execução Local via .NET CLI

1. Restaure as dependências e compile a solução:
```bash
dotnet build Dialogue.sln
```

2. Execute o projeto WebApi:
```bash
dotnet run --project src/WebApi/WebApi.csproj
```

A aplicação iniciará e estará acessível para conexões SignalR no endereço padrão configurado pela ASP.NET Core WebApi.

### 6.2. Execução via Docker Compose

O projeto possui suporte a conteinerização incluindo um proxy reverso Nginx para balanceamento de carga e roteamento.

Para subir o ambiente completo:
```bash
docker-compose up --build
```

Serviços expostos:
* **WebApi**: `http://localhost:5000`
* **Nginx Proxy**: `http://localhost:8080`

---

## 7. Apêndice Técnico e Oportunidades de Refatoração

Durante a análise do código fonte, foram identificados os seguintes pontos de atenção arquitetural e de implementação a serem priorizados em ciclos de refatoração:

1. **Pacote NuGet Obsoleto no WebApi**:
   * O arquivo `src/WebApi/WebApi.csproj` declara dependência do pacote `Microsoft.AspNet.SignalR` (versão 2.4.3), que é voltado ao legado .NET Framework. No .NET 8, o SignalR é nativo (`Microsoft.AspNetCore.SignalR`). Recomenda-se remover a referência legada para evitar conflitos de namespaces.

2. **Gerenciamento de Estado em Memória (`IDictionary<string, User>`)**:
   * O Hub `ChatRoom` utiliza `IDictionary<string, User>` injetado como Singleton para manter o estado das conexões. Para cenários com múltiplas instâncias da aplicação (scale-out), é necessário substituir a coleção local por um estado distribuído (ex.: Redis Backplane com `Microsoft.AspNetCore.SignalR.StackExchangeRedis`).

3. **Inconsistências no DockerFile**:
   * O estágio de runtime do `DockerFile` possui uma instrução com erro de digitação (`COPY --from=buld` em vez de `COPY --from=build`). É recomendável corrigir o estágio para garantir compilação reproduzível em pipelines CI/CD.

4. **Tratamento de Exceções e Resiliência**:
   * Sugere-se a implementação de validação de entradas nos métodos do Hub (por exemplo, checagem de objetos `User` nulos ou nomes de sala vazios) e adoção de DTOs específicos em vez de reutilizar a entidade de domínio `User` diretamente na camada de apresentação.
