# Instructions

- Be concise: sacrifice grammar for brevity if needed
- DRY: No code duplication; extract shared logic into utilities or hooks
- Ensure strong type-safety; treat warnings as errors

## Tools

- **pnpm**: Manage JS packages
- **mise**: Manage runtime & tools
- **Context7 MCP**: Lookup up-to-date docs
- **Playwright MCP**: Verify features manually

## File Structure

| Directory            | Purpose                                   |
| -------------------- | ----------------------------------------- |
| `src/routes/`        | TanStack Router route files               |
| `src/components/`    | React components                          |
| `src/components/ui/` | Shadcn UI components                      |
| `src/hooks/`         | Custom hooks                              |
| `src/lib/`           | Utility functions & library configuration |
| `public/locales/`    | i18n translation resources                |
| `stories/`           | Storybook stories                         |

## Standards

### React

- Rely on the React Compiler; manual memoization (`useMemo`, `useCallback`, `React.memo`) prohibited unless necessary
- Functional components only; no `React.FC`
- Use named imports: `import { useState } from 'react'`
- Never derive state in `useEffect`; compute during render

### Routing (TanStack Router)

- File-based routing in `src/routes/`. Vite automatically generates routes with `createFileRoute()`.
- Navigation: Use `<Link>` component with `preload="intent"`
- Type-safe params: Use `useParams` hook

### Data Fetching (TanStack Query)

- Server state: Use `useQuery` / `useMutation`
- Never fetch data in `useEffect`

### State Management (Zustand)

- Define stores with strict interfaces
- Declare store mutations outside of the store
- Call `store.setState()` for sparse updates

### Internationalization

```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t, i18n } = useTranslation('namespace')
  return <h1>{t('key')}</h1>
}
```

- Translation files: `public/locales/{lng}/{namespace}.json`
- Namespaces: `translation`, `routes`, etc.
- Numbers/Currency: Use `Intl.NumberFormat`
- Datetime: Use `Temporal` API with `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat`, `Intl.DurationFormat`. Never use `Date`, `date-fns`, `dayjs`, `moment`, etc.

```tsx
import { Temporal } from 'temporal-polyfill'

const dt = Temporal.PlainDateTime.from('2024-01-01T12:00:00')
const formatted = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeStyle: 'short',
}).format(dt.toZonedDateTime('America/New_York'))
```

### Styling (Tailwind CSS 4)

- Conditional: Use `cn()` utility (clsx + tailwind-merge)
- Variants: Use `cva` (Class Variance Authority)
- Icons: Lucide React
- Prohibit `@apply`; use CSS variables, `--spacing()` function, framework components
- Group classes logically

### UI Components (Shadcn UI)

Add components via CLI to `src/components/ui/`:

```bash
pnpx shadcn add button dialog
```

### Environment Variables

- Use ArkEnv for type-safe env var parsing; schema defined in `vite.config.ts`
- Access: `import.meta.env.VITE_API_URL`
- Never commit secrets, API keys, or credentials

### Validation

- Use ArkRegex for type-safe regular expressions
- Validate all user input with Arktype
- React Hook Form Resolver with Arktype

## Testing (Vitest)

- Use `vitest-browser-react` for browser-based component tests
- Use `toMatchInlineSnapshot()` for snapshot testing

```tsx
import { render, renderHook } from 'vitest-browser-react'
import { expect, test } from 'vitest'

test('renders button', async () => {
  const screen = await render(<Button>Click me</Button>)
  await expect.element(screen.getByRole('button')).toBeVisible()
  expect(screen.container).toMatchInlineSnapshot()
})

test('tests a custom hook', async () => {
  const { result, act } = await renderHook(useCounter)

  expect(result.current.count).toBe(0)

  // Use act to trigger state updates
  await act(() => result.current.increment())

  expect(result.current.count).toBe(1)
})
```

- Vitest Browser Mode uses Playwright as the provider. Do not use `@playwright/test` directly.
- Use Playwright MCP for manual verification.

### Mocking

Prefer dependency injection over mocking. Only if necessary:

- Use `vi` from `vitest` for all mocking utilities; `vi.mock()` is hoisted to the top
- Modules: `vi.mock()` for full or partial mocks (via `importOriginal()`)
- Functions/Spies: `vi.fn()`, `vi.spyOn(obj, 'method')`
- Globals: `vi.stubGlobal('name', value)` / `vi.unstubAllGlobals()`
- Env Variables: `vi.stubEnv('KEY', 'value')` / `vi.unstubAllEnvs()`
- Dates/Timers: `vi.setSystemTime(date)` / `vi.useRealTimers()`
- Automatic mocks: Implementation in `__mocks__/` directory next to module or at project root

```tsx
// Partial mock
vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'Mock' }),
}))

// Module Exports
import * as module from './module.ts'
vi.mock('./module.ts', { spy: true })
vi.mocked(module.method).mockImplementation(() => {
  // ...
})
```

### Storybook

CSF Next format with factory functions:

```tsx
import preview from '../.storybook/preview'
import { Button } from './Button'

const meta = preview.meta({ component: Button })

export const Primary = meta.story({
  args: { primary: true },
})
```

## TypeScript

- Strict type safety; `any`, `as unknown`, `@ts-ignore` prohibited
- Prefer `interface` for objects, `type` for unions/primitives
- Use type inference where possible
- Immutability: `.toSorted()`, `.toSpliced()`, `.with()`
- Nullish: `??`, `?.`
- Async: Always `async`/`await` with `try/catch`
- `as const` for literal arrays/objects
- Use Arktype for runtime schemas (search params, API responses)
- Prefer spread & object destructuring: `tasks.filter(({ status }) => status !== 'done')` over `tasks.filter((t) => t.status !== 'done')`
- Prefer arrow functions for setState callbacks: `store.setState(({ tasks }) => ({ tasks }))` over `store.setState((state) => ({ tasks: state.tasks }))`

## Documentation (TSDoc)

- Focus: Explain _why_ and _how_, not _what_
- Tags: `@remarks`, `@example`, `@see`
- Never restate types in comments

## Workflow

### Plan

1. Clarify user intent
2. Read docs with Context7
3. Explore relevant code
4. Create todos

### Build

1. Write self-documenting code; add comments for complex logic sparingly
2. Handle errors with meaningful messages
3. Write tests and run `pnpm test`
4. Run `pnpm lint` - includes type checking; no separate `typecheck` / `tsc` task needed
5. Verify changes with Playwright MCP if applicable

### Review

1. Prepare artifact/demo if applicable
2. Review changes against todos & standards
3. Commit with clear message
4. Fix issues from pre-commit hooks
5. Report completion with summary

## Tech Stack

| Category        | Technology                              |
| --------------- | --------------------------------------- |
| Framework       | React 19 + React Compiler + Vite 8 Beta |
| Routing         | TanStack Router                         |
| Data Fetching   | TanStack Query v5                       |
| Client State    | Zustand                                 |
| Styling         | Tailwind CSS 4                          |
| UI Library      | Shadcn + Base UI                        |
| Validation      | Arktype                                 |
| i18n            | react-i18next                           |
| Testing         | Vitest + Playwright                     |
| Linting         | Oxlint                                  |
| Formatting      | Oxfmt                                   |
| Package Manager | pnpm                                    |
