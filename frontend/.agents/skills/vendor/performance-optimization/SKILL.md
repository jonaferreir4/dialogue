---
name: performance-optimization
description: Guia de otimização de alta performance para C# e .NET 8 (redução de alocações na heap, uso de Span/Memory, concorrência e estratégias de cache).
---

# Otimização de Performance em .NET 8 (Community Vendor Skill)

Estratégias para maximizar o throughput e reduzir o garbage collection (GC) em APIs .NET.

---

## 1. Redução de Alocações em Memória

- Utilizar `ReadOnlySpan<char>` para manipulação e slicing de strings sem alocar novas instâncias na heap.
- Utilizar tabelas de busca de caracteres eficientes para conversão de Base62.

---

## 2. Reutilização de Conexões e HttpClient

- Nunca instanciar `new HttpClient()` por requisição. Utilizar `IHttpClientFactory` ou instâncias singleton registradas na DI.
- Garantir pool de conexões otimizado no PostgreSQL via string de conexão do Npgsql.

---

## 3. Estratégias de Caching

- Para URLs de altíssimo acesso, considerar camada de cache em memória (`IMemoryCache`) com expiração rápida para evitar consultas repetitivas ao banco PostgreSQL no fluxo de redirecionamento.
