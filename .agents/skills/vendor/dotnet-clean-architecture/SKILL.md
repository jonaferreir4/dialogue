---
name: dotnet-clean-architecture
description: Clean Architecture, Domain-Driven Design (DDD), and SOLID engineering practices for C# / .NET 8 Web APIs. Use whenever developing, refactoring, or reviewing backend code.
---

# .NET 8 Clean Architecture & DDD Skill

This skill provides mandatory architectural patterns, SOLID principles, and best practices for .NET 8 Web API applications structured with Clean Architecture.

## 🏛️ Layer Boundaries & Dependency Rules

Strict dependency flow MUST be maintained:
`Api` -> `Infrastructure` & `Application` -> `Domain`

```
  ┌────────────────────────────────────────────────────────┐
  │                     MarkMotores.Api                    │
  │          (Controllers, Middleware, DI Setup)           │
  └───────────────────────────┬────────────────────────────┘
                              │
  ┌───────────────────────────▼────────────────────────────┐
  │               MarkMotores.Infrastructure               │
  │        (EF Core, PostgreSQL, Repositories, Hash)       │
  └───────────────────────────┬────────────────────────────┘
                              │
  ┌───────────────────────────▼────────────────────────────┐
  │               MarkMotores.Application                  │
  │       (Use Cases, DTOs, Interfaces, Validators)        │
  └───────────────────────────┬────────────────────────────┘
                              │
  ┌───────────────────────────▼────────────────────────────┐
  │                 MarkMotores.Domain                     │
  │     (Entities, Value Objects, Enums, Domain Events)    │
  └────────────────────────────────────────────────────────┘
```

### Layer Purity Requirements:
1. **Domain Layer (`MarkMotores.Domain`)**:
   - Zero external framework dependencies.
   - Encapsulated domain entities with private setters (`private set`).
   - Invariants validated inside entity factory methods or domain constructors.

2. **Application Layer (`MarkMotores.Application`)**:
   - Contains application interfaces (`IProductRepository`, `IProductService`).
   - Use DTOs (`record` types in C#) for request/response payload definition.
   - Encapsulate application logic in Use Cases / Services.

3. **Infrastructure Layer (`MarkMotores.Infrastructure`)**:
   - Implements interfaces defined in the Application layer.
   - Entity Framework Core `DbContext` configuration using Fluent API (`IEntityTypeConfiguration<T>`).

4. **API Layer (`MarkMotores.Api`)**:
   - Thin controllers delegating execution directly to Application Services.
