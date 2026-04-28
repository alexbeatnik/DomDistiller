# DomDistiller

> **A DOM compiler for LLM agents.** Stop letting Copilot, Claude, and your QA agents read the raw DOM. They shouldn't. They were never supposed to.

[![npm version](https://badge.fury.io/js/dom-distiller.svg)](https://www.npmjs.com/package/dom-distiller)
[![Tests](https://img.shields.io/badge/tests-1202%2F1202%20passing-brightgreen)]()
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

Supported columns include the standard fields (`role`, `text`, `locator`, `tag`, `editable`, `interactable`, `disabled`, `checked`) plus v3 Semantic AST fields:
- `confidence` — shows `locatorStrategy.confidence`
- `semanticContext` — shows the detected form/dialog group label
- `intent` — shows the inferred intent (e.g. `login`, `search`)
- `relations` — shows a comma-separated list of relation types
- `alias` — shows the auto-generated camelCase alias
- `suggestedActions` — shows `fill(alias)`, `click(alias)` action sequence

### `getInteractable(controlMap)` / `getEditable(controlMap)`

Filter to only controls the agent can actually click / type into.

### `findControls(controlMap, query)` / `findControl(controlMap, query)`

Fuzzy-search by `text`, `role`, `tag`, or `locator` substring. Returns matching `DistilledNode`s.

### `resolveIntent(controlMap, intentName)`

Resolve a semantic intent block from the AST. Returns only the nodes that belong to semantic contexts whose `intent` or `label` matches the given name.

```typescript
import { resolveIntent } from 'dom-distiller';

const loginNodes = resolveIntent(controlMap, 'login');
// → DistilledNode[] inside the Login Form semantic block

const loginCtx = loginNodes[0]?.semanticContext;
// → { type: 'form', intent: 'login', label: 'User Login', fields: [...], submitTarget: '...' }

const actions = loginNodes[0]?.suggestedActions;
// → [{ type: 'fill', targetAlias: 'emailAddress' }, { type: 'click', targetAlias: 'signIn' }]
```

This is the primary API for **intent-driven Copilot workflows** — instead of dumping the entire page into the LLM context, you give it only the semantic block it needs.

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
  alias?: string;             // camelCase variable name for Copilot (e.g. "emailField")
  semanticContext?: SemanticContext; // structured semantic block
  groupId?: string;           // stable group identifier
  suggestedActions?: SuggestedAction[]; // auto-detected action sequence
}

interface SemanticContext {
  type: 'form' | 'fieldset' | 'dialog' | 'generic';
  intent?: string;            // inferred intent: 'login', 'search', 'payment', ...
  label: string;              // human-readable block name
  fields?: string[];          // locators of editable fields inside this block
  submitTarget?: string;      // locator of the submit/primary action
}

interface SuggestedAction {
  type: 'fill' | 'click' | 'select' | 'check' | 'uncheck';
  targetAlias: string;        // which alias to act on
  value?: string;             // optional value hint (for fill/select)
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

### v3 Extraction Engine — Semantic AST with Intent

The browser injection layer (`src/core/`) performs **six passes** after the initial TreeWalker extraction. All run in the browser and emit a **Semantic AST with Intent** — a control map where every node carries not just context, but **actionable intent**.

#### 1. Semantic Grouping (Structured Schema)

Every node queries its DOM ancestry for `<form>`, `<fieldset>`, `<dialog>`, or `[role="dialog"]` containers. When found, the node is tagged with a **structured** `SemanticContext` object:

```typescript
{
  type: "form",
  intent: "login",          // inferred from label text
  label: "User Login",
  fields: ["id=email", "id=password"],
  submitTarget: "data-testid=login-btn"
}
```

This removes the LLM's need to guess form boundaries or field order. Copilot sees: `"The Login Form has 2 fields (email, password) and a submit button."`

Implementation: `detectSemanticContext()` in `src/core/extractor.ts` uses `element.closest()` + keyword intent inference — O(depth) per node, effectively free inside the TreeWalker pass.

#### 2. Alias Generation (Variable Naming)

For every control, the extractor generates a camelCase `alias` that Copilot can use as a JavaScript variable name:

- `<label for="email">Email Address</label>` → `emailAddress`
- `<input placeholder="Coupon Code">` → `couponCode`
- `<button>Sign In</button>` → `signIn`

Priority chain: `aria-label` → `label text` → `name` attr → `placeholder` → `text content`.

This lets Copilot write **self-documenting Playwright code**:
```typescript
const emailAddress = page.locator('[data-testid="email"]');
await emailAddress.fill('user@example.com');
```

Implementation: `generateAlias()` in `src/core/extractor.ts`.

#### 3. Relations Graph (Contextual Awareness)

A post-pass resolves ID-based relationships:

- **`label-for`**: a `<label for="email">` gets a relation pointing to the input.
- **`aria-controls`**: a tab button gets a relation to its tabpanel.
- **`aria-describedby`**: an input gets a relation to its help text.
- **`aria-labelledby`**: an input gets a relation to its label element(s).
- **`spatial-near`**: up to 2 nearest neighbors within the same `groupId`.

Implementation: `resolveRelations()` and `computeSpatialProximity()` in `src/core/extractor.ts`.

#### 4. Action Suggestion Layer (Not Execution)

For every semantic block, the extractor auto-generates a `suggestedActions` array:

```typescript
[
  { type: "fill", targetAlias: "emailAddress" },
  { type: "fill", targetAlias: "password" },
  { type: "click", targetAlias: "signIn" }
]
```

**Critical constraint:** these are suggestions. The library **never** executes them. Copilot reads the array and translates it into native Playwright code:

```typescript
await emailAddress.fill('user@example.com');
await password.fill('secret123');
await signIn.click();
```

This reduces LLM reasoning to **zero** for standard form flows.

Implementation: `enrichSemanticBlocks()` in `src/core/extractor.ts` scans each group for editable fields + submit button.

#### 5. Multi-Locator Strategy (Stability Engine)

The extractor returns a `LocatorStrategy` object:

```typescript
{
  primary:    "data-testid=login-btn",
  fallbacks:  ["id=submit", "text=Log In"],
  confidence: "high"
}
```

The Node layer exposes `controlToPlaywrightSelfHealingLocator(node)`:
```typescript
page.locator('[name="email"]').or(page.locator('[aria-label="Work Email"]'))
```

#### 6. Incremental Distillation (MutationObserver)

The injected script sets up a `MutationObserver` on `document.body`. After the first `distillPage()` call:

- The AST is **cached** in memory inside the browser page.
- Subsequent calls to `window.domDistiller()` return the **cached AST in < 5 ms**.
- If the DOM changes (mutation), a dirty flag is set; the next call triggers a **full re-distill** automatically.

This gives Copilot **0-latency state checks** after clicks, form fills, and navigation.

Implementation: `MutationObserver` inside the browser bundle (`scripts/bundle-injected.js`).

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
  resolveIntent,
  controlToPlaywrightLocator,
  describePage,
} from 'dom-distiller';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://my-app.com/login');

// 1. Compile the page into a Semantic AST with Intent
const controlMap = await distillPage(page);

// 2. Copilot already knows the user wants to "login".
//    Instead of dumping the whole page, resolve ONLY the login intent block.
const loginBlock = resolveIntent(controlMap, 'login');

// 3. Build a focused Markdown table with aliases and suggested actions
const markdown = astToMarkdown(loginBlock, {
  columns: ['alias', 'role', 'locator', 'confidence', 'suggestedActions'],
});

// 4. Get the semantic context object for the login form
const loginCtx = loginBlock[0]?.semanticContext;

// 5. Copilot prompt — now the LLM has ZERO guessing to do
const prompt = `
Task: log in as user@example.com with password "secret123".

The page exposes a Login Form with the following structured intent:
- Intent: ${loginCtx?.intent}
- Label: ${loginCtx?.label}
- Fields: ${loginCtx?.fields?.join(', ')}
- Submit: ${loginCtx?.submitTarget}

Available controls (with auto-generated aliases):
${markdown}

Suggested action sequence (translate these into native Playwright code):
${loginBlock[0]?.suggestedActions?.map((a, i) => `${i + 1}. ${a.type}("${a.targetAlias}")`).join('\n')}

RULES:
- Use ONLY the locators above.
- Use the aliases as JavaScript variable names (e.g. const emailAddress = page.locator('...')).
- Write standard, native Playwright TypeScript. NO custom wrappers.
- The final output must be plain Playwright code that runs in any .spec.ts file.
`;

// 6. Copilot generates this exact code block:
//    const emailAddress = page.locator('[data-testid="email"]');
//    const password = page.locator('#password');
//    const signIn = page.locator('[data-testid="login-btn"]');
//    await emailAddress.fill('user@example.com');
//    await password.fill('secret123');
//    await signIn.click();

// 7. After the click, check state with 0-latency cached AST
//    (MutationObserver keeps the AST warm; no full re-parse)
const stateAfterClick = await distillPage(page);
// → returns cached AST instantly if DOM hasn't changed,
//   or auto-refreshes AST if MutationObserver detected a change
```

### How the v3 Semantic AST eliminates LLM reasoning

**Before (flat AST):**
```markdown
| role    | text     | locator               | tag    |
|---------|----------|-----------------------|--------|
| textbox | Email    | id=email              | input  |
| textbox | Password | id=password           | input  |
| button  | Sign In  | data-testid=login-btn | button |
| button  | Sign In  | data-testid=oauth-btn | button |
```

Copilot sees two "Sign In" buttons and has to guess which one to click, what to fill, and in what order.

**After (v3 Intent-Aware AST):**
```markdown
| alias        | role    | locator               | confidence | suggestedActions   |
|--------------|---------|-----------------------|------------|--------------------|
| emailAddress | textbox | id=email              | medium     | fill(emailAddress) |
| password     | textbox | id=password           | medium     | fill(password)     |
| signIn       | button  | data-testid=login-btn | high       | click(signIn)      |
```

Copilot receives:
- **Structured intent**: `{ type: "form", intent: "login", fields: [...], submitTarget: "..." }`
- **Auto-generated aliases**: `emailAddress`, `password`, `signIn`
- **Suggested action sequence**: `fill → fill → click`

The LLM's job is reduced to **mechanical translation** — no reasoning, no guessing, no hallucinated selectors. The output is still **100% standard Playwright**.

---

## Development

```bash
npm install
npx playwright install chromium    # one-time (only for integration tests)
npm run build
npm test                           # full suite: unit + integration
npm run test:unit                  # 9 suites, pure Node, no browser (~150 ms)
npm run test:integration           # 24 suites, real headless Chromium (~1162 traps)
```

`src/injected.ts`, `dist/injected.js`, and `src/generated/script.ts` are **auto-generated**. Do not hand-edit.

---

## License

Apache-2.0
