---
name: csharp-dotnet-best-practices
description: Guia de boas práticas de comunidade mantidas por desenvolvedores da comunidade .NET / Microsoft para C# 12 e .NET 8 Web APIs (programação assíncrona, injetores de dependência, tipos nulos, records e immutability).
---

# Boas Práticas C# 12 & .NET 8 Web API (Community Vendor Skill)

Guias de padrões modernos e de alta performance mantidos pela comunidade .NET.

---

## 1. Programação Assíncrona Idiomática

- **Sempre** utilizar `async` e `await` até o topo da pilha de chamadas (Controllers).
- **Nunca** usar `.Result`, `.Wait()` ou `.GetAwaiter().GetResult()` — evita bloqueio da thread pool.
- Usar `CancellationToken` quando aplicável para repassar cancelamentos de requisições HTTP.

---

## 2. Injeção de Dependência e Escopos

- `AddScoped`: Para DbContext e Services vinculados ao ciclo de vida de uma requisição HTTP.
- `AddSingleton`: Apenas para serviços sem estado (stateless) thread-safe ou caches em memória globais.
- `AddTransient`: Para utilitários leves instanciados sob demanda.

---

## 3. Imutabilidade e DTOs Modernos

- Preferir `record` ou `readonly record struct` para Data Transfer Objects (DTOs).
- Habilitar e respeitar Nullable Reference Types (`#nullable enable`).
- Evitar mutação direta de coleções; utilizar `IReadOnlyCollection<T>` ou `IReadOnlyList<T>` em retornos públicos.
