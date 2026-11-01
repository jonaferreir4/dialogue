---
name: frontend-senior
description: Senior Frontend Engineering best practices, Core Web Vitals optimization, state architecture, React 19 performance patterns, accessible UI design systems, and robust error boundaries. Use whenever implementing or refactoring frontend code.
---

# Senior Frontend Engineer Skill

This skill enforces high-level engineering standards, performance optimization techniques, and architectural excellence for modern frontend development (React 19, Next.js 15, TypeScript).

## 🚀 1. Performance & Core Web Vitals (CWV)

- **LCP (Largest Contentful Paint)**:
  - Optimize key hero images using `next/image` with `priority` attribute.
  - Preload critical fonts using `next/font`.
- **INP (Interaction to Next Paint)**:
  - Avoid blocking the main JS thread during user events.
  - Wrap expensive state transitions in `useTransition` or `startTransition`.
- **CLS (Cumulative Layout Shift)**:
  - Always define explicit width/height aspect ratios for images and skeletons.
  - Avoid dynamic insertion of un-sized DOM elements above the fold.

## 🏗️ 2. State & Component Architecture

1. **State Isolation**:
   - Keep state local whenever possible (`useState`).
   - Use URL search parameters (`useSearchParams`, Next.js App Router) for shareable UI filters and pagination.
   - Use Zustand ONLY for client-wide UI state (e.g. drawers, modals, notification queues).
   - Use TanStack Query for server data fetching, background revalidation, and optimistic updates.

2. **Component Composition & SRP**:
   - Every component must do ONE thing well.
   - Prefer composition (`children` or render props) over bloated prop lists.

3. **TypeScript Excellence**:
   - Prohibit `any` types. Use explicit discriminated unions and generics.
   - Define immutable props and state interfaces.

## ♿ 3. Accessibility (a11y) & UX Standards

- **Keyboard Navigation**: Ensure all interactive elements (`button`, `a`, `input`) are focusable with `focus-visible:ring-2`.
- **Screen Reader Support**: Use proper ARIA attributes (`aria-expanded`, `aria-label`, `aria-controls`, `role`).
- **Semantic HTML**: Use proper HTML elements (`<header>`, `<main>`, `<nav>`, `<article>`, `<aside>`, `<footer>`).
- **Skeleton Loaders**: Provide immediate feedback with skeleton states during async data loads.
