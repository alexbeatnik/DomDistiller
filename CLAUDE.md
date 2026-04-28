# CLAUDE.md

System prompt for working in this repository. Read this before changing anything in `src/`.

## Identity

DomDistiller is a **DOM compiler for LLM agents**. It is not a scraper, an extractor, or a serializer. It is a compiler whose **source language is the live DOM** and whose **target language is a token-optimized Control Map** (`DistilledNode[]`) consumed by LLMs.

## The First Principle (do not violate this)

**The LLM must never see the raw DOM.**

Every architectural decision in this codebase exists to enforce that rule. AI coding assistants (Copilot, Claude, agentic QA frameworks) currently waste megabytes of context window re-reading the same page on every step. DomDistiller's job is to make that impossible — by performing aggressive in-browser compilation **before a single byte crosses into Node.js**.

If you ever find yourself:

- Returning raw `outerHTML` from the browser to Node
- Stringifying a DOM subtree in `src/llm/`
- Adding a "give me the page source" helper
- Letting `<script>`, `<style>`, `<svg>`, or hidden branches into the AST

…stop. That is the bug this library exists to prevent.

## The Two-World Rule (most important)

The codebase is split into two execution environments. Mixing them causes silent failures.

### Browser world — `src/core/*` and `src/types.ts`

- Runs **inside the page**, injected via `addScriptTag`.
- May use: `document`, `window`, `Element`, `Node`, `TreeWalker`, `getComputedStyle`, `elementFromPoint`, `MutationObserver`.
- **Must never import** from Node (`fs`, `path`, `process`, `url`, `os`, etc.).
- **Must never import** from `src/llm/*` or `src/index.ts`.
- The bundler ([scripts/bundle-injected.js](scripts/bundle-injected.js)) string-concatenates these files and strips imports/exports. An unresolved import compiles fine and **breaks at runtime in the page** as `ReferenceError`.
- Performance budget: must complete in **< 20 ms on a 10k-element page**. Use `TreeWalker` for traversal — never recursive `querySelectorAll`. The whole point is to do this work at C++ speed inside the browser.

### Node world — `src/llm/*` and `src/index.ts`

- Runs in Node, consumes a `DistilledNode[]` already compiled by the browser pass.
- **Must never touch the DOM directly.** No `jsdom`, no `cheerio`, no string-parsing of HTML.
- May import from `src/types.ts` (interfaces only) and from each other.

If a new helper needs the DOM → it goes in `src/core/`.
If it operates on the compiled AST → it goes in `src/llm/`.
There is no third option.

## Compilation Passes (the order matters)

The injected script performs these passes in a single `TreeWalker` traversal of the live DOM:

1. **Tag prune** — `<script>`, `<style>`, `<noscript>`, `<svg>`, `<template>`, `<head>`, `<meta>`, `<link>` are dropped wholesale. See `PRUNE` in [scripts/bundle-injected.js](scripts/bundle-injected.js).
2. **Visibility filter** ([src/core/visibility.ts](src/core/visibility.ts)) — drops `display: none`, `visibility: hidden`, `opacity < 0.01`, zero-size, `aria-hidden="true"`. Optional `checkObscured` uses `elementFromPoint`. **Exception:** `<input type="checkbox|radio|file">` are always kept even when hidden — they are routinely visually replaced by styled labels.
3. **Interactivity detection** ([src/core/extractor.ts](src/core/extractor.ts)) — keeps a node if it is interactive, has a stable attribute, has accessible text, or carries an ARIA role. Everything else is dropped.
4. **Locator ranking** ([src/core/extractor.ts](src/core/extractor.ts) :: `buildLocator`) — picks the most stable locator in this priority order:
   1. `data-testid`
   2. `data-test`
   3. `data-qa`
   4. `id` — rejected if it starts with a digit or contains 5+ consecutive digits (anti-dynamic-id heuristic)
   5. `name`
   6. `aria-label`
   7. `placeholder`
   8. `href` (links only)
   9. `xpath` (last resort)
5. **Wrapper flatten** ([src/core/flattener.ts](src/core/flattener.ts)) — empty `<div>` / `<span>` chains with no text, no stable attrs, no role are removed; their children are promoted upward.

The output is `DistilledNode[]` — typically 30–80 nodes for a 10k-element page.

## Build Pipeline (`npm run build`)

The injected browser bundle is **generated, not source**. Four steps:

1. **`bundle:injected`** — [scripts/bundle-injected.js](scripts/bundle-injected.js) strips imports/exports from `src/types.ts` and `src/core/*.ts`, wraps them in `function domDistiller(options)`, writes [src/injected.ts](src/injected.ts).
2. **`compile:injected`** — `tsc -p tsconfig.inject.json` compiles to [dist/injected.js](dist/injected.js) with browser-only libs (`lib: ["DOM"]`, no `@types/node`).
3. **`generate:script`** — [scripts/generate-script.js](scripts/generate-script.js) embeds `dist/injected.js` as a string export `distillScript` in [src/generated/script.ts](src/generated/script.ts).
4. **`build:node`** — `tsup` bundles [src/index.ts](src/index.ts) → `dist/index.{js,mjs,d.ts}`.

After editing anything under `src/core/` or `src/types.ts`, **rebuild before running tests.** Tests load `dist/injected.js` directly — not the TS source.

## Runtime Shape of the Injected Script

[src/generated/script.ts](src/generated/script.ts) exports a string whose body is:

```js
function domDistiller(options) {
  // ... bundled core/* code ...
  return distill(options);
}
```

When loaded via `page.addScriptTag({ content: distillScript })`, the browser parses it as a `<script>` element and `domDistiller` becomes available as `window.domDistiller`. Node then calls `page.evaluate((opts) => window.domDistiller(opts), opts)`.

**Hard constraints — do not break these:**

- **Do not append `return domDistiller();` at the top level of the bundled string.** That is a `SyntaxError` inside a `<script>` element; the script fails to register and `window.domDistiller` becomes undefined. This was a real bug — see the comment block in [scripts/generate-script.js](scripts/generate-script.js).
- **Do not rename the `domDistiller` function.** [src/index.ts](src/index.ts) calls it by name through `window.domDistiller`.
- **Do not use `DistilledNode` / `DistillOptions` in the outer wrapper signature.** Those interfaces live inside the closure (bundled from `src/types.ts`). Pulling them into the outer scope leaks globals into the page. The outer signature uses `any` on purpose.

## Public API ([src/index.ts](src/index.ts))

| Export | Kind | Purpose |
|---|---|---|
| `distillPage(page, options?)` | async fn | Compile a Playwright page → Control Map |
| `distillScript` | string | Raw injector source — for manual injection |
| `astToMarkdown(ast, options?)` | fn | Lower AST → Markdown table for LLM prompts |
| `flattenAST` / `getInteractable` / `getEditable` / `findControls` / `findControl` | fn | Query / filter the Control Map |
| `controlToPlaywrightLocator(node)` | fn | Lower a node → `page.locator(...)` source |
| `describePage(ast)` | fn | One-line natural-language summary |
| `DistilledNode` / `DistillOptions` / `ControlMap` | type | Public types |

There is no `distill()` Node helper. A previous version exposed one that read `window.__domDistillerResult`, but nothing ever wrote that key, so it always returned `undefined`. It was removed; do not reintroduce it.

## Testing

```bash
npm test                           # 21 suites, ~1070 traps, real headless Chromium
npx playwright install chromium    # if browser binaries are missing
```

Each `test/test_*.test.ts`:

1. Launches headless Chromium via `playwright-core` (`test/_helpers.ts` :: `launchBrowser`).
2. Sets HTML via `page.setContent(...)`.
3. Injects via `page.addScriptTag({ content: ... })` — see `runDistiller` in [test/_helpers.ts](test/_helpers.ts).
4. Asserts on the returned AST using `findNodeById`, `findNodeByText`, `collectIds`, `countNodes`.

The helper appends `\nreturn domDistiller();` and then strips it — leftover from the old broken bundle layout, now a no-op. Safe to leave alone.

## Common Pitfalls

- **Forgot to rebuild after editing `src/core/`** — tests load `dist/injected.js`, not the TS source. Symptom: tests pass but new assertions don't reflect your change.
- **Imported a Node module into `src/core/*.ts`** — bundler emits it silently; the page throws `ReferenceError` at runtime.
- **Added a public API in `src/index.ts` but didn't export it** — `tsup` only sees what's reachable from there.
- **Stale `.d.ts`** — `build:node` runs with `--clean false` to preserve `dist/injected.js`. If renamed exports persist, delete `dist/index.d.ts` manually before `npm run build`.
- **Letting raw HTML strings cross from browser to Node** — this is the failure mode the entire library exists to prevent. If a feature feels like it needs `outerHTML` on the Node side, redesign it to operate on the AST.

## Quick Recipes

### Add a new LLM-side helper
1. Create `src/llm/my-helper.ts` (Node-side, operates on `DistilledNode[]`).
2. Export from `src/index.ts`.
3. Add `test/test_NN_my_helper.test.ts`.
4. `npm run build && npm test`.

### Add a new locator strategy (e.g., `data-cy`)
1. Add the attribute to `STABLE_ATTRS` in [src/core/extractor.ts](src/core/extractor.ts).
2. Add a branch in `buildLocator()` at the priority position you want.
3. Add a matching branch in [src/llm/playwright.ts](src/llm/playwright.ts) :: `controlToPlaywrightLocator()`.
4. Rebuild.

### Add a new interactive role
Edit `INTERACTIVE_ROLES` in [src/core/extractor.ts](src/core/extractor.ts), then rebuild.

### Debug an element that didn't appear in the AST
1. Confirm it's not in the `PRUNE` set in [scripts/bundle-injected.js](scripts/bundle-injected.js).
2. Confirm it passes `isVisible()` — try `distillPage(page, { includeHidden: true })`.
3. Confirm `extractNode()`'s `hasValue` check passes (interactive, visible, has text, or has stable attrs).
4. Confirm the flattener didn't drop it as a meaningless wrapper — see `isMeaninglessWrapper()` in [src/core/flattener.ts](src/core/flattener.ts).

## When in Doubt

Ask: **"Does this change push raw DOM closer to the LLM, or further away?"** If closer, redesign it.
