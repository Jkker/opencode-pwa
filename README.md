# React 2026 Template

Your 1st React template for 2026, designed for humans and AI alike, with bleeding-edge everything.

## Getting Started

```bash
curl https://mise.run | sh

git clone https://github.com/Jkker/2026-web-dev-template.git
cd 2026-web-dev-template
pnpm install
```

## Tech Stack

| Category       | Technology               | Version       |
| -------------- | ------------------------ | ------------- |
| **Core**       | React                    | 19 + Compiler |
| **Build**      | Vite                     | v8            |
| **Routing**    | TanStack Router          | v1            |
| **State**      | TanStack Query + Zustand | v5 + v5       |
| **Styling**    | Tailwind CSS             | v4            |
| **UI**         | Shadcn + Base UI         | v3            |
| **Validation** | Arktype + ArkRegex       | v2            |
| **Env Vars**   | ArkEnv                   | v0.8          |
| **Testing**    | Vitest + Playwright      | v3            |
| **Tooling**    | Oxlint + Oxfmt + Knip    | Latest        |

## Developer Experience

### Extensions ([`extensions.json`](.vscode/extensions.json))

- **Oxc**: Crazy fast linting and formatting.
- **Tailwind CSS IntelliSense**: Class name autocompletion, highlighting, and linting.
- **Vitest Explorer**: Visual test runner.
- **Mise**: Integrated runtime management.
- **Native TypeScript**: Native TypeScript language server.
- **ArkType**: Syntax highlighting and inline errors.
- **Tombi**: TOML formatting, linting, and language server.
- **Color Highlight**: Visual color previews.
- **Nx Console**: GUI for monorepo tasks.

### MCP Servers ([`mcp.json`](.vscode/mcp.json))

- **Playwright**: Browser-based verification.
- **Context7**: Documentation lookups.
- **Shadcn**: Component management.

### Shared Config

- **[`settings.shared.json`](.vscode/settings.shared.json)**: Editor behaviors, file nesting, and Copilot rules.
- **[`tasks.shared.json`](.vscode/tasks.shared.json)**: Integrated maintenance scripts.

### Code Quality

- **Oxlint**: Type-aware linting with React, TypeScript, and import rules ([`.oxlintrc.json`](.oxlintrc.json)).
- **Knip**: Dead code elimination and dependency analysis ([`knip.json`](knip.json)).

### Instructions ([`AGENTS.md`](AGENTS.md))

Defines the operational standards and workflows for this project:

- **Core Principles**: Concise code, DRY patterns, and strict type safety.
- **Tech Standards**: React 19 (Compiler), TanStack Router/Query, Tailwind CSS 4, and Shadcn UI.
- **Testing**: Browser-based testing with Vitest and manual verification via Playwright MCP.
- **Workflow**: Structured protocol (Plan → Build → Review) emphasizing documentation lookups and self-correction.

## Commands

| Command          | Description                      |
| ---------------- | -------------------------------- |
| `pnpm dev`       | Start the development server     |
| `pnpm build`     | Build for production             |
| `pnpm test`      | Run tests with Vitest            |
| `pnpm lint`      | Type-aware linting with Oxlint   |
| `pnpm lint:fix`  | Fix linting issues automatically |
| `pnpm format`    | Format code with Oxfmt           |
| `pnpm storybook` | Start Storybook server           |

## Project Structure

```text
├── src/
│   ├── components/
│   │   ├── ui/           # Shadcn UI components (auto-generated)
│   │   ├── layout/       # Layout components (Header, Sidebar)
│   │   └── ...           # Feature-specific components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities & configurations (i18n, query, utils)
│   ├── routes/           # File-based routing (TanStack Router)
│   │   ├── __root.tsx    # Root route layout
│   │   └── index.tsx     # Homepage
│   ├── main.tsx          # Entry point
│   └── vite-env.d.ts     # Type definitions
├── public/
│   └── locales/          # i18n JSON resources
├── stories/              # Storybook stories
└── scripts/              # Build/Maintenance scripts
```
