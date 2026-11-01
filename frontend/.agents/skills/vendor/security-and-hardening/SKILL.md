---
name: security-and-hardening
description: Diretrizes de segurança OWASP para backend Web APIs (mitigação de Open Redirect, SSRF, SQL Injection, CORS, Security Headers, Rate Limiting e sanitização de input).
---

# Hardening e Segurança em Web APIs (Community Vendor Skill)

Práticas de segurança avançadas alinhadas com as diretrizes OWASP Top 10 para APIs RESTful e aplicações SaaS comerciais.

---

## 1. Validação e Sanitização Rigorosa de Entrada

- **Sanitização de URLs:** Validar todas as URLs recebidas utilizando `Uri.TryCreate` com checagem de esquema obrigatoriamente `http` ou `https`.
- **Prevenção de SSRF (Server-Side Request Forgery):** Rejeitar URLs que apontem para IPs locais/privados (`127.0.0.1`, `localhost`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`).
- **Sanitização de Custom Slugs:** Validar caracteres alfanuméricos e hifens/underscores (`[a-zA-Z0-9_-]`) bloqueando caracteres de injeção HTML/Script (`<`, `>`, `"`, `'`).

---

## 2. Mitigação de Open Redirect e Loops de Redirecionamento

- Impedir que o encurtador encurte URLs pertencentes ao seu próprio domínio (`DOMAIN_NAME`) para prevenir exaustão de pilha ou loops infinitos de redirecionamento HTTP.
- Evitar redirecionamentos para protocolos inseguros ou esquemas perigosos (`file://`, `javascript:`, `data:`).

---

## 3. Cabeçalhos de Segurança e CORS

- **CORS Estrito:** Configurar políticas de CORS restritivas liberando apenas as origens confiáveis da aplicação no frontend.
- **HTTP Security Headers:**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` ou `SAMEORIGIN`
  - `Content-Security-Policy (CSP)`
  - `Strict-Transport-Security (HSTS)` em ambientes HTTPS.
  - `Referrer-Policy: strict-origin-when-cross-origin`

---

## 4. Proteção contra Negação de Serviço (DoS) e Injeção

- **SQL Injection:** Uso estrito do EF Core com consultas parametrizadas LINQ. Proibida concatenação de strings em SQL bruto.
- **Limitação de Tamanho de Payload e Campos:**
  - `IpAddress` (máx. 45 caracteres)
  - `UserAgent` (máx. 512 caracteres)
  - Tamanho máximo do corpo da requisição HTTP limitado a 10KB para encurtamento.
- **Rate Limiting:** Implementação de limitação de requisições por IP/token para prevenir brute-force de slugs e sobrecarga de infraestrutura.
