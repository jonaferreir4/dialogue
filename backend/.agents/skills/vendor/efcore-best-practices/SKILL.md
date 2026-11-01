---
name: efcore-best-practices
description: Guia de otimização e boas práticas mantidas pela comunidade para Entity Framework Core 9 e PostgreSQL (consultas de alta performance, AsNoTracking, prevenção de N+1, indexação e Fluent API).
---

# Boas Práticas Entity Framework Core 9 & PostgreSQL (Community Vendor Skill)

Guias de otimização de consultas e modelagem relacional.

---

## 1. Otimização de Consultas de Leitura

- **`.AsNoTracking()`**: Obrigatório para todas as queries que não alteram o estado da entidade. Reduz drasticamente o consumo de memória e desabilita o Change Tracker do EF Core.
- **Projeção Direta (`Select`)**: Em vez de carregar toda a entidade, projetar apenas os campos necessários:
  ```csharp
  var codes = await _context.ShortenedUrls
      .AsNoTracking()
      .Select(x => new { x.Code, x.Click })
      .ToListAsync();
  ```

---

## 2. Prevenção do Problema N+1 Query

- Utilizar `.Include()` e `.ThenInclude()` para carregamento adiantado (Eager Loading) quando os dados relacionados forem necessários.
- Alternativamente, usar projeções com `.Select()` para deixar o EF Core traduzir tudo em um único `JOIN` otimizado no SQL.

---

## 3. Indexação e Desempenho no PostgreSQL

- Campos utilizados em cláusulas `WHERE`, `JOIN` ou ordenação frequente **devem possuir índice** no banco.
- Exemplo: `builder.HasIndex(x => x.Code).IsUnique();` garante busca em tempo $O(1)$ via árvore B-Tree / Hashing.
