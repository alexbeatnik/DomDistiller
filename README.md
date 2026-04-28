# DomDistiller

> **A DOM compiler for LLM agents.** Stop letting Copilot, Claude, and your QA agents read the raw DOM. They shouldn't. They were never supposed to.

[![npm version](https://badge.fury.io/js/dom-distiller.svg)](https://www.npmjs.com/package/dom-distiller)
[![Tests](https://img.shields.io/badge/tests-1106%2F1106%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)]()

---

## The Problem: AI Agents Are Eating the DOM Raw

Every AI coding assistant and agentic QA tool on the market today does the same dumb thing: **to write a single click, it reads the entire raw DOM.**

That means feeding an LLM:

- 2&nbsp;MB of nested `<div>` wrappers from React/Vue/Svelte runtimes
- Inline `<svg>` paths with thousands of `d=` coordinates
- `<style>` blocks, `<script>` blobs, hidden modals, off-screen routes
- Hashed class names, generated `id`s, ad-tracking attributes
- Shadow roots, slotted content, and `display: none` branches the user will never see

The cost of this is enormous and totally avoidable:

| Symptom | Cause |
|---|---|
| **Context window obliterated in one tool call** | 90%+ of the DOM is non-interactive noise |
| **Token bills that scale with markup, not intent** | The agent re-reads the page on every step |
| **Hallucinated, brittle locators** | The model picks a hashed `class` because nothing stable was surfaced |
| **Slow generation** | The model has to *re-derive* what's clickable every time |
| **Flaky tests** | Selectors break the moment a wrapper `<div>` is added |

The root cause is a category error: **the LLM should never see the raw DOM in the first place.**

---

## The Solution: Compile the DOM Before the LLM Sees It

DomDistiller is a **compiler**. The browser is the source. A token-optimized **Control Map** is the target.

```
   Raw DOM (≈2 MB, 10k+ nodes)
            │
            ▼
   ┌─────────────────────────┐
   │  DomDistiller (in-page)  │   ← runs inside the browser
   │  • TreeWalker (C++ speed)│
   │  • prune <script>/<style>/<svg>
   │  • drop display:none / aria-hidden
   │  • flatten empty wrappers
   │  • rank stable locators
   └─────────────────────────┘
            │
            ▼
   Control Map  (≈2 KB, JSON AST)
            │
            ▼
   LLM / Copilot / Claude  →  deterministic Playwright code
```

**The contract:**

1. The LLM **never** receives raw HTML.
2. The browser does the heavy lifting natively (`TreeWalker`, `getComputedStyle`, `elementFromPoint`).
3. Node.js receives a tiny AST of *only* what is interactable, with *only* the locators that are actually stable.
4. The LLM consumes a Markdown table or fuzzy-search result. That's it.

**Result:** ~99% token reduction on a typical SaaS page. No hallucinated selectors. Generation that's faster, cheaper, and deterministic.

---

## Why This Is a Compiler, Not a Scraper

A scraper extracts data. A compiler **lowers** one representation into another, preserving semantics while discarding everything that isn't load-bearing for the target consumer. DomDistiller does the second.

| Pass | What it strips |
|---|---|
| **Tag prune** | `<script>`, `<style>`, `<noscript>`, `<svg>`, `<template>`, `<head>`, `<meta>`, `<link>` — never reach the AST |
| **Visibility** | `display: none`, `visibility: hidden`, `opacity < 0.01`, zero-size, `aria-hidden="true"` |
| **Interactivity** | Anything that isn't a real control (no role, no handler, no editable surface, no stable attrs) |
| **Wrapper flatten** | Empty `<div>` / `<span>` chains promoted out — children replace the parent |
| **Locator rank** | `data-testid` ▶ `data-test` ▶ `data-qa` ▶ `id`* ▶ `name` ▶ `aria-label` ▶ `placeholder` ▶ `href` ▶ `xpath` |

\* `id`s starting with a digit or containing 5+ consecutive digits are rejected as dynamic.

This all happens **inside the browser**, in a single `TreeWalker` pass. By the time Node.js receives the result, the page has already been compressed by ~99%.

---

## Install

```bash
npm install dom-distiller
npm install playwright-core   # peer dependency
```

---

## Quick Start

### 1. Compile the page into a Control Map

```typescript
import { chromium } from 'playwright';
import { distillPage } from 'dom-distiller';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://example.com/login');

const controlMap = await distillPage(page);
// → DistilledNode[]  (a tiny AST, typically <2 KB serialized)
```

### 2. Hand it to the LLM as Markdown

```typescript
import { astToMarkdown, getInteractable } from 'dom-distiller';

const markdown = astToMarkdown(getInteractable(controlMap));
console.log(markdown);
```

```markdown
| role    | text              | locator                  | tag    | editable |
|---------|-------------------|--------------------------|--------|----------|
| button  | Sign In           | data-testid=login-btn    | button | false    |
| textbox | Email             | id=email                 | input  | true     |
| textbox | Password          | id=password              | input  | true     |
| link    | Forgot password?  | href=/reset              | a      | false    |
```

That table is **the entire page**, as far as the LLM is concerned. No scrolling through wrappers. No guessing.

### 3. Prompt Copilot / Claude with deterministic context

```typescript
const prompt = `
You are writing Playwright code. The page exposes exactly these controls:

${markdown}

Task: log in as user@example.com with password "secret123".
Use ONLY the locators above — do not invent selectors.
`;
```

### 4. Or: skip the LLM and resolve locators directly

```typescript
import { findControls, controlToPlaywrightLocator } from 'dom-distiller';

const [signIn] = findControls(controlMap, { text: 'sign in', role: 'button' });
const code = controlToPlaywrightLocator(signIn);
// → page.locator('[data-testid="login-btn"]')
```

---

## API Reference

### `distillPage(page, options?)`

Inject the compiler into a Playwright page and return the Control Map.

```typescript
import type { Page } from 'playwright-core';
import type { DistilledNode, DistillOptions, ControlMap } from 'dom-distiller';

function distillPage(page: Page, options?: DistillOptions): Promise<ControlMap>;
```

| Option | Type | Default | Description |
|---|---|---|---|
| `maxTextLength` | `number` | `200` | Cap on the `text` field per node |
| `includeHidden` | `boolean` | `false` | Keep hidden branches (debug only) |
| `checkObscured` | `boolean` | `false` | Use `elementFromPoint` to detect z-index occlusion |

### `distillScript`

Raw JS string. Defines `window.domDistiller(options)`. Use it when you need full control over injection — or when running outside Playwright.

```typescript
import { distillScript } from 'dom-distiller';

await page.addScriptTag({ content: distillScript });
const controlMap = await page.evaluate(
  (opts) => (window as any).domDistiller(opts),
  { maxTextLength: 200 }
);
```

> **Why `addScriptTag` + `evaluate` instead of `page.evaluate(distillScript)`?** Playwright can hang on string-form `evaluate` payloads that contain named function declarations. Loading via `<script>` tag and then calling the global is the only reliable shape across Playwright versions.

### `astToMarkdown(controlMap, options?)`

Lower the Control Map into a Markdown table — the canonical input shape for an LLM prompt.

```typescript
function astToMarkdown(
  controlMap: ControlMap,
  options?: { columns?: string[]; maxRows?: number }
): string;
```

Supported columns include the standard fields (`role`, `text`, `locator`, `tag`, `editable`, `interactable`, `disabled`, `checked`) plus v2 Semantic AST fields:
- `confidence` — shows `locatorStrategy.confidence`
- `semanticContext` — shows the detected form/dialog group name
- `relations` — shows a comma-separated list of relation types

### `getInteractable(controlMap)` / `getEditable(controlMap)`

Filter to only controls the agent can actually click / type into.

### `findControls(controlMap, query)` / `findControl(controlMap, query)`

Fuzzy-search by `text`, `role`, `tag`, or `locator` substring. Returns matching `DistilledNode`s.

### `controlToPlaywrightLocator(node)`

Lower a single `DistilledNode` into a `page.locator(...)` source string — the final compiler stage.

```
data-testid=login-btn  →  page.locator('[data-testid="login-btn"]')
id=email               →  page.locator('#email')
aria-label=Search      →  page.locator('[aria-label="Search"]')
xpath=/html/body/...   →  page.locator('xpath=/html/body/...')
```

### `controlToPlaywrightSelfHealingLocator(node)`

Build a resilient Playwright locator using `.or()` chains across the node's ranked fallback locators. Skips low-confidence `xpath=` fallbacks.

```typescript
// LocatorStrategy: primary="name=email", fallbacks=["aria-label=Work Email"]
page.locator('[name="email"]').or(page.locator('[aria-label="Work Email"]'))

// LocatorStrategy: primary="data-testid=save-btn", fallbacks=[]
page.locator('[data-testid="save-btn"]')
```

### `describePage(controlMap)`

One-line natural-language summary of the page. Useful as a system-message preamble.

```
Page contains 4 interactable controls (2 editable). Breakdown:
2 textboxes, 1 button, 1 link. Key controls: Sign In (data-testid=login-btn),
Email (id=email), Password (id=password), Forgot password? (href=/reset).
```

### `flattenAST(controlMap)`

Depth-first flatten of the AST into a single array.

---

## The Control Map (AST shape)

```typescript
type ControlMap = DistilledNode[];

interface DistilledNode {
  role: string;               // semantic role or tag name
  tag: string;                // HTML tag
  text: string;               // cleaned visible text / accessible name
  locator: string;            // best stable locator (compiler-ranked)
  locatorFallback: string[];  // ranked fallbacks
  locatorStrategy: {          // structured stability engine output
    primary: string;
    fallbacks: string[];
    confidence: 'high' | 'medium' | 'low';
  };
  interactable: boolean;
  visible: boolean;
  editable: boolean;
  checked?: boolean;
  disabled?: boolean;
  attributes: Record<string, string>;
  rect: { top; left; bottom; right; width; height };
  children: DistilledNode[];
  relations: NodeRelation[];  // contextual awareness graph
  semanticContext?: string;   // e.g. "Login Form", "Payment Dialog"
  groupId?: string;           // stable group identifier
}

interface NodeRelation {
  type: 'label-for' | 'aria-controls' | 'aria-describedby' | 'aria-labelledby' | 'spatial-near';
  targetLocator: string;
  targetText?: string;
  description: string;        // human-readable, e.g. "Labels Email"
}
```

A typical 10,000-element page compiles to ~30–80 nodes.

---

## Architecture

DomDistiller has a **strict two-world boundary** that you must preserve when contributing:

```
src/
  types.ts            # Shared TS interfaces (browser-safe)
  core/               # ⚠ BROWSER-ONLY — runs inside the page
    visibility.ts     # display/opacity/aria-hidden/occlusion
    extractor.ts      # interactivity + locator ranking + relations + semantic grouping
    flattener.ts      # wrapper compression
  llm/                # ⚠ NODE-ONLY — runs on the compiled AST
    markdown.ts       # AST → Markdown table
    query.ts          # fuzzy search + filters
    playwright.ts     # AST → page.locator() source + self-healing chains
  injected.ts         # AUTO-GENERATED bundle (do not edit)
  generated/script.ts # AUTO-GENERATED string export (do not edit)
  index.ts            # Public Node entry point
scripts/
  bundle-injected.js  # concatenates types.ts + core/* into injected.ts
  generate-script.js  # embeds dist/injected.js as a string
```

### The two-world rule

- **`src/core/*` runs inside the browser.** It can use `document`, `window`, `Element`, `getComputedStyle`. It must **never** import `fs`, `path`, `process`, or anything from `src/llm/`. The bundler concatenates these files; an unresolved import compiles fine and **breaks at runtime in the page**.
- **`src/llm/*` runs in Node.** It consumes a `ControlMap` that has already been compiled. It never touches the DOM.

Mixing them is the #1 way to break this library. See [CLAUDE.md](CLAUDE.md) for the full architectural contract.

### v2 Extraction Engine — Semantic AST

The browser injection layer (`src/core/`) now performs four additional passes after the initial TreeWalker extraction. All of them run in the browser and emit a **Semantic AST** — a control map where every node carries context, not just coordinates.

#### 1. Semantic Grouping (Form Detection)

During extraction, every node queries its DOM ancestry for `<form>`, `<fieldset>`, `<dialog>`, or `[role="dialog"]` containers. When found, the node is tagged with:

- `groupId`: a stable slug derived from the container's `id`, `name`, `aria-label`, or heading text (e.g. `form-login`, `dialog-delete-account`).
- `semanticContext`: the human-readable name of that container (e.g. `"Login Form"`, `"Delete Account"`).

This means Copilot no longer sees a flat list of 12 inputs and 3 buttons. It sees a **structured control map** with clear boundaries: `"These 3 inputs + 1 button belong to the Login Form. Those 2 inputs + 1 button belong to the 2FA Verification dialog."`

Implementation: `detectSemanticContext()` in `src/core/extractor.ts` uses `element.closest()` — O(depth) per node, effectively free inside the TreeWalker pass.

#### 2. Relations Graph (Contextual Awareness)

After the tree is flattened, a second pass resolves ID-based relationships that were captured as raw attributes during extraction:

- **`label-for`**: a `<label for="email">` gets a relation pointing to the input with `id="email"`.
- **`aria-controls`**: a tab button gets a relation to its tabpanel.
- **`aria-describedby`**: an input gets a relation to its help text.
- **`aria-labelledby`**: an input gets a relation to its label element(s).
- **`spatial-near`**: for every interactable node, up to 2 nearest neighbors within the same `groupId` are linked using their bounding-box distance.

Each relation carries `targetLocator`, `targetText`, and a `description` string that the LLM can read directly.

Implementation: `resolveRelations()` and `computeSpatialProximity()` in `src/core/extractor.ts`. This is a post-pass over the already-pruned AST (typically ~50 nodes), so O(n²) spatial checks are trivial.

#### 3. Multi-Locator Strategy (Stability Engine)

The extractor no longer returns a single string locator. It returns a `LocatorStrategy` object:

```typescript
{
  primary:    "data-testid=login-btn",
  fallbacks:  ["id=submit", "text=Log In"],
  confidence: "high"   // "high" | "medium" | "low"
}
```

Confidence is assigned by the extractor:
- **high** — `data-testid`, `data-test`, `data-qa`
- **medium** — stable `id`, `name`, `aria-label`, `placeholder`, `href`
- **low** — `xpath` fallback

The Node layer exposes `controlToPlaywrightSelfHealingLocator(node)`, which turns a `LocatorStrategy` into a resilient Playwright expression:

```typescript
page.locator('[name="email"]').or(page.locator('[aria-label="Work Email"]'))
```

This lets Copilot emit **self-healing selectors** that survive minor DOM churn without hallucinating new ones.

#### 4. Incremental Distillation (MutationObserver) — Architecture Note

The current release runs a full distillation on every call. The architecture is designed to support `observeDOMChanges()` in a future release: a `MutationObserver` inside the browser page would maintain a patched AST in memory, providing 0-latency updates when Copilot needs to check state after a click. This is **not yet implemented** — the current workflow is still `distillPage(page)` per step — but the AST shape (`relations`, `groupId`, `locatorStrategy`) is designed to make incremental patching straightforward.

### Build pipeline (`npm run build`)

1. **`bundle:injected`** — concatenate `src/types.ts` + `src/core/*` into a single `function domDistiller(options)` at `src/injected.ts`.
2. **`compile:injected`** — `tsc` with browser-only libs → `dist/injected.js`.
3. **`generate:script`** — embed `dist/injected.js` as a string export at `src/generated/script.ts`.
4. **`build:node`** — `tsup` bundles `src/index.ts` into `dist/index.{js,mjs,d.ts}`.

After editing `src/core/` or `src/types.ts`, **rebuild** before running tests. The test harness loads the compiled bundle.

---

## Performance

- **Single-pass `TreeWalker`** over the live DOM — C++-speed traversal, no JS overhead per node
- **Shadow DOM** is pierced recursively in the same pass
- **Zero runtime dependencies** in the browser payload
- **Typical execution: < 20 ms** for a 10,000-element page
- **Token reduction: ~99%** for a real SaaS app (measured: 1.8 MB DOM → 1.6 KB AST)

---

## Full Agent Workflow

```typescript
import { chromium } from 'playwright';
import {
  distillPage,
  astToMarkdown,
  getInteractable,
  findControls,
  controlToPlaywrightLocator,
  controlToPlaywrightSelfHealingLocator,
  describePage,
} from 'dom-distiller';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://my-app.com/login');

// 1. Compile the page into a Semantic AST
const controlMap = await distillPage(page);
const controls = getInteractable(controlMap);

// 2. Build LLM context (Markdown table + summary)
//    Include semantic context so the LLM understands form boundaries
const markdown = astToMarkdown(controls, {
  columns: ['role', 'text', 'locator', 'confidence', 'semanticContext'],
  maxRows: 30,
});
const description = describePage(controls);

// 3. Resolve a specific control without an LLM round-trip
const [signIn] = findControls(controls, { text: 'sign in', role: 'button' });
console.log(controlToPlaywrightLocator(signIn));
// → page.locator('[data-testid="login-btn"]')

// 4. Emit a self-healing locator for resilient tests
const [emailInput] = findControls(controls, { text: 'email', role: 'textbox' });
console.log(controlToPlaywrightSelfHealingLocator(emailInput));
// → page.locator('[name="email"]').or(page.locator('[aria-label="Work Email"]'))

// 5. Use in a Copilot / Claude prompt with Semantic AST context
const prompt = `
Page: Login
${description}

Available controls:
${markdown}

IMPORTANT SEMANTIC NOTES:
- The "Login Form" group contains the email input, password input, and Sign In button.
- The email input has a label-for relation to the "Email" label.
- The Sign In button has confidence "high" (data-testid). Use it as the primary locator.
- The password input has confidence "medium" (id). Its fallback is aria-label.

Task: log in as user@example.com with password "secret123".
Write Playwright TypeScript. Use ONLY the locators above.
Prefer high-confidence locators. Use .or() chains only when confidence is medium or low.
`;
```

### How the Semantic AST helps Copilot write better code

**Before (flat AST):**
```markdown
| role    | text     | locator               | tag    |
|---------|----------|-----------------------|--------|
| textbox | Email    | id=email              | input  |
| textbox | Password | id=password           | input  |
| button  | Sign In  | data-testid=login-btn | button |
| button  | Sign In  | data-testid=oauth-btn | button |
```

Copilot sees two "Sign In" buttons and has to guess which one to click.

**After (Semantic AST):**
```markdown
| role    | text     | locator               | confidence | semanticContext |
|---------|----------|-----------------------|------------|-----------------|
| textbox | Email    | id=email              | medium     | Login Form      |
| textbox | Password | id=password           | medium     | Login Form      |
| button  | Sign In  | data-testid=login-btn | high       | Login Form      |
| button  | Sign In  | data-testid=oauth-btn | high       | OAuth Dialog    |
```

Now Copilot knows: `"Click the Sign In button inside the Login Form — not the one in the OAuth Dialog."` No guessing. No hallucinated selectors.

---

## Development

```bash
npm install
npx playwright install chromium    # one-time
npm run build
npm test                           # 23 suites, ~1106 traps, real headless Chromium
```

`src/injected.ts`, `dist/injected.js`, and `src/generated/script.ts` are **auto-generated**. Do not hand-edit.

---

## License

Apache-2.0
