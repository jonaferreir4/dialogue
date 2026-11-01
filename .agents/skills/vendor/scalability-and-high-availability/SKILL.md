---
name: scalability-and-high-availability
description: Diretrizes de escalabilidade horizontal, alta disponibilidade, Rate Limiting distribuído, resiliência (Polly) e caching de alta performance para SaaS .NET 8.
---

# Escalabilidade e Alta Disponibilidade em .NET 8 (Community Vendor Skill)

Diretrizes e padrões arquiteturais para transformar a API em um serviço de alta disponibilidade capaz de processar milhões de requisições por dia.

---

## 1. Limitação de Taxa (Rate Limiting Distribuído)

- **Proteção contra Abuso:** Implementar Rate Limiting nativo do .NET 8 (`Microsoft.AspNetCore.RateLimiting`) em endpoints públicos (`POST /api/shorten` e `GET /{code}`).
- **Algoritmo Fixed/Sliding Window:** Configurar limites por IP de cliente ou por chave de API (ex: 100 requisições/min por IP para criação, 1000/min para redirecionamento).
- **Backend Redis:** Em cenários distribuídos com múltiplas instâncias da API, utilizar Redis como armazenamento central do Rate Limiting para evitar desincronização entre instâncias.

---

## 2. Escalabilidade Horizontal & Stateless Backend

- **Containers Stateless:** Garantir que o container da API (`smaller-app`) não armazene nenhum estado local. Todo estado deve residir no PostgreSQL ou Redis.
- **Rede e Load Balancing:** Utilizar o Traefik para balancear carga (Round-Robin) entre N réplicas da aplicação (`docker compose up --scale app=3`).
- **Connection Pooling:** Otimizar o pool de conexões do PostgreSQL (Npgsql) e Redis (StackExchange.Redis) para suportar alta concorrência sem estouro de file descriptors.

---

## 3. Caching em Camadas (Multi-Level Caching)

- **L1 Cache (In-Memory `IMemoryCache`):** URLs com taxa de acesso extremamente alta (hot links) mantidas na memória RAM da instância por períodos curtos (ex: 30 a 60 segundos).
- **L2 Cache (Distributed `IDistributedCache` / Redis):** Fonte secundária rápida antes de consultar o banco relacional PostgreSQL.
- **Invalidação de Cache:** Estratégias de expiração por TTL e expiração por inativação.

---

## 4. Fila Assíncrona e Resiliência

- **Desacoplamento de I/O:** Escrita de logs de acesso e métricas analíticas via `System.Threading.Channels` ou mensageria (RabbitMQ/Redis Streams) em background tasks (`BackgroundService`).
- **Padrões de Resiliência com Polly:** Implementar políticas de Retry com Exponential Backoff e Circuit Breaker para chamadas de banco de dados e Redis.
