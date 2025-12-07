# Import Path Aliases

This project uses TypeScript path aliases to simplify imports and keep file paths stable across the codebase.

| Alias | Path | Usage |
|-------|------|-------|
| `@/` | `src/` | General source files |
| `@/api/*` | `src/api/*` | API client and types |
| `@/app/*` | `src/app/*` | App configuration and app-level utilities |
| `@/features/*` | `src/features/*` | Feature modules (slices) |
| `@/shared/*` | `src/shared/*` | Shared components, hooks, utilities |
| `@/config/*` | `src/config/*` | Config and environment helpers |
| `@/contexts/*` | `src/contexts/*` | React context providers |
| `@/plugins/*` | `src/plugins/*` | Plugin implementations and definitions |
| `@/routes/*` | `src/routes/*` | Application route helpers |
| `@/styles/*` | `src/styles/*` | Global styling and utilities |

## Example Usage

Avoid deep relative imports:

```ts
// ❌ Not recommended
import { Button } from '../../../shared/components/ui/button';

// ✅ Use path alias
import { Button } from '@/shared/components/ui/button';
```

Please keep this list updated when adding new top-level folders that should expose aliases.
