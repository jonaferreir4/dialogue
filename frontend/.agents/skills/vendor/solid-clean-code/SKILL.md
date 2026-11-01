---
name: solid-clean-code
description: Guia de arquitetura limpa e princípios SOLID mantidos por engenheiros sêniores para desacoplamento de código backend, coesão de classes e sustentabilidade do software.
---

# Princípios SOLID e Clean Code Backend (Community Vendor Skill)

Diretrizes fundamentais para manutenção de código sustentável e testável.

---

## 1. Princípios SOLID Aplicados

- **Single Responsibility Principle (SRP):** Cada classe deve ter uma única razão para mudar. Controllers lidam com HTTP; Services lidam com regras de negócio; DbContext lida com persistência.
- **Open/Closed Principle (OCP):** Entidades e serviços devem estar abertos para extensão, mas fechados para modificação.
- **Liskov Substitution Principle (LSP):** Subtipos devem ser substituíveis por seus tipos de base.
- **Interface Segregation Principle (ISP):** Clientes não devem depender de interfaces que não utilizam.
- **Dependency Inversion Principle (DIP):** Módulos de alto nível não devem depender de módulos de baixo nível. Ambos devem depender de abstrações.

---

## 2. Nomenclatura e Clareza

- Nomes expressivos e autoexplicativos sem abreviações obscuras.
- Métodos devem realizar apenas uma ação bem definida.
- Evitar comentários redundantes que apenas repetem o que o código faz; comentar o *porquê* de decisões não óbvias.
