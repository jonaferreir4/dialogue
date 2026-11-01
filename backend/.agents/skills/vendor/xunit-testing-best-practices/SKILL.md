---
name: xunit-testing-best-practices
description: Padrões de testes unitários e de integração em .NET utilizando xUnit, Moq/NSubstitute e DbContext InMemory/SQLite para garantia de cobertura e prevenção de regressões.
---

# Testes Unitários e de Integração com xUnit (Community Vendor Skill)

Diretrizes para escrita de suítes de testes limpas, determinísticas e rápidas.

---

## 1. Padrão Arrange-Act-Assert (AAA)

Todo teste unitário deve ser estruturado em 3 blocos claros:
- **Arrange:** Configurar mocks, dados iniciais e dependências.
- **Act:** Executar o método sob teste.
- **Assert:** Verificar os resultados esperados e chamadas de dependências.

```csharp
[Fact]
public async Task CreateShortenedUrl_ShouldReturnCode_WhenUrlIsValid()
{
    // Arrange
    var dbContext = GetInMemoryDbContext();
    var service = new UrlShorteningService(dbContext);
    var originalUrl = "https://example.com";

    // Act
    var result = await service.CreateShortenedUrlAsync(originalUrl);

    // Assert
    Assert.NotNull(result);
    Assert.Equal(7, result.Code.Length);
}
```

---

## 2. Testes de Banco de Dados com InMemory / SQLite

- Utilizar `Microsoft.EntityFrameworkCore.InMemory` ou `Microsoft.Data.Sqlite` em memória para isolar testes de unidade sem depender de uma instância real do PostgreSQL.
- Garantir que cada método de teste utilize uma instância limpa do DbContext.
