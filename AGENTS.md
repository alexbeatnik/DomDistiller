# DomDistiller — Agent Guide

## Project Purpose

DomDistiller is a **DOM compiler for LLM agents** (GitHub Copilot, Claude, GPT-4).

It runs inside a browser (injected via Playwright) and returns a compressed AST of all interactable controls on the page — buttons, links, inputs, selects, etc. Each control has a **stable locator** (`data-testid`, `id`, `aria-label`, etc.) that the LLM can use to generate correct Playwright automation code.

## Core Workflow

```
Playwright page → distillPage() → DistilledNode[] → LLM helpers → Copilot prompt
```

1. **`distillPage(page)`** — injects browser script, returns AST
2. **`getInteractable(ast)`** — filters only clickable/focusable nodes
3. **`astToMarkdown(controls)`** — converts to Markdown table for the LLM prompt
4. **`findControls(ast, { text: 'save' })`** — fuzzy search when LLM asks for a specific control
5. **`controlToPlaywrightLocator(node)`** — converts a node to `page.locator(...)` string

## File Layout

```
src/
  types.ts           # DistilledNode, DistillOptions, ControlQuery, MarkdownOptions
  core/
    visibility.ts    # isVisible(), getRect() — filters hidden/occluded elements
    extractor.ts     # isInteractive(), extractNode() — builds nodes with locators
    flattener.ts     # flattenNodes(), pruneEmpty() — removes wrapper divs
  llm/
    markdown.ts      # astToMarkdown() — AST → Markdown table
    query.ts         # findControls(), findControl(), getInteractable(), flattenAST()
    playwright.ts    # controlToPlaywrightLocator(), describePage()
  injected.ts        # Auto-generated browser bundle (no Node APIs)
  generated/
    script.ts        # Minified JS string embedded at build time
  index.ts           # Public API: distillPage(), distillScript, all LLM helpers
```

## Build Pipeline

```bash
npm run build
```

1. `scripts/bundle-injected.js` — strips imports/exports from `src/core/*.ts`, assembles `src/injected.ts`
2. `tsc -p tsconfig.inject.json` — compiles browser script to `dist/injected.js`
3. `scripts/generate-script.js` — embeds minified JS as string in `src/generated/script.ts`
4. `tsup` — bundles Node entry point to `dist/index.js` / `dist/index.mjs` with `.d.ts`

**Critical constraint**: The injected browser script (`src/injected.ts` / `dist/injected.js`) must be **pure browser JS** — no `fs`, `path`, `process`, or any Node API. It runs via `page.addScriptTag()`.

## Key Design Decisions

- **Visibility filtering at extraction time** (not just `visible: false`) keeps the AST small
- **Locator priority chain**: `data-testid > data-test > data-qa > id (heuristic) > name > aria-label > placeholder > href > xpath`
- **Special inputs** (checkbox/radio/file) are always included even if visually hidden, because they may be covered by a custom label
- **Custom elements** (`tag.includes('-')`) are treated as interactable by default
- **Text normalization**: collapse whitespace, trim, slice to 200 chars by default
- **No CSS transform text normalization** — `text-transform: uppercase` is NOT normalized (browser reports rendered text)

## Testing

```bash
npm test          # runs all 21 test suites (~1070 traps)
```

Tests are in `test/*.test.ts`. Each test:
1. Launches a headless Chromium page
2. Sets HTML content
3. Injects `dist/injected.js` via `page.addScriptTag()`
4. Calls `window.domDistiller()`
5. Asserts on the returned AST

**Test helpers** (`test/_helpers.ts`):
- `runTrapSuite(name, html, traps)` — runs a batch of assertions
- `findNodeById(ast, id)` — BFS search by `attributes.id`
- `findNodeByText(ast, text)` — BFS substring search
- `countNodes(ast)` — total node count

## Adding New Features

### Adding a new LLM helper

1. Create function in `src/llm/` (e.g., `src/llm/my-helper.ts`)
2. Export it from `src/index.ts`
3. Add unit tests in `test/test_XX_my_feature.test.ts`
4. Run `npm run build && npm test`

### Modifying the browser extractor

1. Edit `src/core/extractor.ts` or `src/core/visibility.ts`
2. Run `npm run build` to regenerate `src/injected.ts` and `dist/injected.js`
3. Run `npm test` — ALL tests must pass

### Adding new stable attributes

Edit `STABLE_ATTRS` array in `src/core/extractor.ts`. The attribute will automatically appear in `node.attributes` and can be used as a locator if you also add logic in `buildLocator()`.

## Common Pitfalls

- **Do NOT use `page.evaluate(() => { function domDistiller() {...} })`** — Playwright v1.59 hangs on named function declarations inside evaluate. Always use `page.addScriptTag({ content: script })` followed by `page.evaluate(() => window.domDistiller())`.
- **Do NOT import Node modules into `src/core/*.ts`** — these files are bundled for the browser.
- **Do NOT forget to rebuild after editing `src/core/`** — `dist/injected.js` is generated, not source-controlled.
- **Test HTML must be self-contained** — no external CSS/JS in test fixtures.

## Agent Workflow (How Copilot Uses This)

When an agent (Copilot) needs to interact with a web page:

1. Agent calls `distillPage(page)` to get the AST
2. Agent calls `getInteractable(ast)` to get only actionable controls
3. Agent calls `astToMarkdown(controls)` to create a compact table
4. Agent injects this table into its system prompt / context window
5. Now Copilot "sees" the page as structured data and can generate precise `page.locator('[data-testid="..."]')` calls instead of guessing selectors

This is the primary value proposition of DomDistiller: **turning an opaque web page into a structured control map that LLMs can reason about.**
