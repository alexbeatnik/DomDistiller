# CLAUDE.md

Architectural guide for working on DomDistiller. Read this before changing code in `src/`.

## What this library does

DomDistiller is imported into a Playwright project. It injects a script into the browser page, walks the DOM, and returns a compact AST of interactable controls (`DistilledNode[]`). The Node-side `llm/*` helpers convert that AST into Markdown tables, fuzzy-search results, or Playwright locator strings — input shapes that an LLM can reason about to write automation code.

```
Playwright Page  ──addScriptTag──▶  window.domDistiller(opts)  ──evaluate──▶  DistilledNode[]
                                                                                  │
                                       ┌──────────────────────────────────────────┤
                                       ▼                ▼                ▼        ▼
                                astToMarkdown   findControls   controlToPlaywrightLocator   describePage
```

## The two-world rule (most important)

The codebase is split into two execution environments. Mixing them causes silent failures.

- **`src/core/*.ts` and `src/types.ts`** run **inside the browser**. They may use `document`, `window`, `Element`, `getComputedStyle`, etc. They must never import from Node (`fs`, `path`, `process`) or from `src/llm/*` or `src/index.ts`. The bundler (`scripts/bundle-injected.js`) string-concatenates these files; any unresolved import will compile but break at runtime.
- **`src/llm/*.ts` and `src/index.ts`** run **in Node**. They consume `DistilledNode[]` already returned from the page. They never touch the DOM directly.

If you need a new helper that uses the DOM, it goes in `src/core/`. If it operates on the AST after extraction, it goes in `src/llm/`.

## Build pipeline (`npm run build`)

The injected browser bundle is generated, not source. Four scripted steps:

1. **`bundle:injected`** — `scripts/bundle-injected.js` strips imports/exports from `src/types.ts` and `src/core/*.ts`, wraps them in `function domDistiller(options)`, and writes [src/injected.ts](src/injected.ts).
2. **`compile:injected`** — `tsc -p tsconfig.inject.json` compiles that file to [dist/injected.js](dist/injected.js) using browser-only types (`lib: ["DOM"]`, no `@types/node`).
3. **`generate:script`** — `scripts/generate-script.js` reads `dist/injected.js` and embeds it as a string export `distillScript` in [src/generated/script.ts](src/generated/script.ts).
4. **`build:node`** — `tsup` bundles [src/index.ts](src/index.ts) → `dist/index.{js,mjs,d.ts}`.

After editing anything under `src/core/` or `src/types.ts`, **rebuild** before running tests. The test helpers read `dist/injected.js` directly.

## How the injected script works at runtime

The shape of [src/generated/script.ts](src/generated/script.ts) is, in plain JS:

```js
function domDistiller(options) {
  // ... bundled core/* code ...
  return distill(options);
}
```

That's it — a single top-level function declaration. When it's loaded via `page.addScriptTag({ content: distillScript })`, the browser parses the `<script>` tag and `domDistiller` becomes available as `window.domDistiller`. The Node side then calls `page.evaluate((opts) => window.domDistiller(opts), opts)` to invoke it with options.

**Do not append `return domDistiller();` at the top level of the bundled string** — that is a `SyntaxError` inside a `<script>` element, the script fails to register, and `window.domDistiller` is undefined. This was a real bug; see the comment block in [scripts/generate-script.js](scripts/generate-script.js).

**Do not rename the function** — `distillPage()` calls it by name through `window.domDistiller`.

## Public API surface ([src/index.ts](src/index.ts))

| Export | Kind | Purpose |
|--------|------|---------|
| `distillPage(page, options?)` | async fn | One-shot Playwright helper: inject + evaluate |
| `distillScript` | string | Raw injector script — for users who want manual control |
| `astToMarkdown(ast, options?)` | fn | AST → Markdown table for LLM prompts |
| `flattenAST`, `getInteractable`, `getEditable`, `findControls`, `findControl` | fn | Querying / filtering |
| `controlToPlaywrightLocator`, `describePage` | fn | Locator string + page summary |
| `DistilledNode`, `DistillOptions` | type | Public types |

There is no `distill()` Node helper. A previous version exposed one that read `window.__domDistillerResult`, but nothing ever wrote to that key, so the function always returned `undefined`. It was removed.

## Testing

```bash
npm test           # 21 suites, ~1070 traps, real headless Chromium
npx playwright install chromium    # if browser binaries are missing
```

Each test in `test/test_*.test.ts`:

1. Launches a headless Chromium via `playwright-core` (`test/_helpers.ts` :: `launchBrowser`).
2. Sets HTML via `page.setContent(...)`.
3. Injects via `page.addScriptTag({ content: ... })` — see `runDistiller` in [test/_helpers.ts](test/_helpers.ts).
4. Asserts on the returned AST using `findNodeById`, `findNodeByText`, `collectIds`, `countNodes`.

The helper appends `\nreturn domDistiller();` to the script and then strips it — this is a leftover from the old broken bundle layout and is now a no-op. It's safe to leave alone.

## Locator priority chain ([src/core/extractor.ts](src/core/extractor.ts) :: `buildLocator`)

When an element has multiple stable attributes, the primary locator is chosen in this order:

1. `data-testid`
2. `data-test`
3. `data-qa`
4. `id` — rejected if it starts with a digit or contains 5+ consecutive digits (anti-dynamic-id heuristic)
5. `name`
6. `aria-label`
7. `placeholder`
8. `href` (links only)
9. `xpath` (last resort)

To add a new strategy (e.g., `data-cy`), add it to `STABLE_ATTRS`, add a branch in `buildLocator()`, and add a corresponding branch in [src/llm/playwright.ts](src/llm/playwright.ts) :: `controlToPlaywrightLocator()`. Then rebuild.

## Visibility rules ([src/core/visibility.ts](src/core/visibility.ts))

An element is filtered out by default if any of:

- `display: none`
- `visibility: hidden`
- `opacity < 0.01`
- `width <= 0` or `height <= 0`
- `aria-hidden="true"`
- `checkObscured: true` and `elementFromPoint(center)` returns a different node

**Exception**: `<input type="checkbox|radio|file">` are always extracted even when hidden, because they are routinely visually replaced by a styled label that forwards clicks.

## Common pitfalls

- **Forgot to rebuild after editing `src/core/`** — tests load `dist/injected.js`, not the TS source. Symptom: tests pass but new assertions don't reflect your change.
- **Imported a Node module into `src/core/*.ts`** — bundler will silently emit it; the page will throw `ReferenceError` at runtime.
- **Added a new public API in `src/index.ts` but didn't export it** — `tsup` only sees what's reachable from `src/index.ts`.
- **`.d.ts` looks stale** — `build:node` runs with `--clean false` to preserve the parallel-built `dist/injected.js`. If you renamed an export and old types persist, delete `dist/index.d.ts` manually before `npm run build`.
- **Top-level types referenced in the injected wrapper** — the `domDistiller` function signature uses `any`, not `DistilledNode`/`DistillOptions`. Those interfaces live inside the closure (bundled from `src/types.ts`); pulling them into the outer scope would leak globals into the page. Don't change this.

## Quick recipes

### Add a new LLM helper

1. Create `src/llm/my-helper.ts` (Node-side, operates on `DistilledNode[]`).
2. Export from `src/index.ts`.
3. Add a unit test in `test/test_NN_my_helper.test.ts`.
4. `npm run build && npm test`.

### Add a new interactive role

Edit `INTERACTIVE_ROLES` in [src/core/extractor.ts](src/core/extractor.ts), then rebuild.

### Debug an element that didn't appear in the AST

1. Confirm it's not pruned by tag (`SCRIPT`, `STYLE`, `NOSCRIPT`, `SVG`, `TEMPLATE`, `HEAD`, `META`, `LINK` are dropped wholesale — see the `PRUNE` set in [scripts/bundle-injected.js](scripts/bundle-injected.js)).
2. Confirm it passes `isVisible()` — try `distillPage(page, { includeHidden: true })`.
3. Confirm it passes `extractNode()`'s `hasValue` check (must be interactive, visible, have text, or have stable attrs).
4. Confirm the flattener didn't drop it as a "meaningless wrapper" — see `isMeaninglessWrapper()` in [src/core/flattener.ts](src/core/flattener.ts).
