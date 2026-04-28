# DomDistiller

> A **DOM compiler for LLM agents**. Injects into a browser via Playwright and returns a clean, token-optimized AST of interactable controls — so Copilot (or any LLM) can generate precise automation code instead of guessing selectors.

[![npm version](https://badge.fury.io/js/dom-distiller.svg)](https://www.npmjs.com/package/dom-distiller)
[![Tests](https://img.shields.io/badge/tests-1150%2F1150%20passing-brightgreen)]()

## The Problem

LLMs can't see the page. You can give them a screenshot, but they still don't know:
- Which elements are actually clickable
- What stable selectors exist (`data-testid`, `aria-label`, `id`)
- How the page is structured

So they guess. And guessing produces brittle, broken automation code.

## The Solution

DomDistiller turns an opaque web page into a **structured control map** that LLMs can reason about:

```
Playwright page → distillPage() → DistilledNode[] → Markdown table → Copilot prompt
```

1. **Extract** every interactable control (buttons, links, inputs, selects, ARIA roles)
2. **Build stable locators** in priority order: `data-testid` → `id` → `name` → `aria-label` → `placeholder` → `href` → `xpath`
3. **Filter noise** — remove `<script>`, `<style>`, empty wrapper `<div>`s, hidden elements
4. **Return an AST** that you can convert to Markdown tables, Playwright locators, or fuzzy-search

## Install

```bash
npm install dom-distiller
```

Peer dependency (for the Node helpers):

```bash
npm install playwright-core
```

## Quick Start

### Step 1 — Distill the page

```typescript
import { chromium } from 'playwright';
import { distillPage } from 'dom-distiller';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://example.com');

const ast = await distillPage(page);
```

### Step 2 — Convert to Markdown for your LLM prompt

```typescript
import { astToMarkdown, getInteractable } from 'dom-distiller';

const controls = getInteractable(ast);
const markdown = astToMarkdown(controls);

console.log(markdown);
```

Output:

```markdown
| role | text | locator | tag | editable |
|------|------|---------|-----|----------|
| button | Sign In | data-testid=login-btn | button | false |
| textbox | Email | id=email | input | true |
| textbox | Password | id=password | input | true |
| link | Forgot password? | href=/reset | a | false |
```

### Step 3 — Feed it to Copilot / LLM

```typescript
const prompt = `
The page has these controls:
${markdown}

Write Playwright code to log in:
1. Fill Email with "user@example.com"
2. Fill Password with "secret123"
3. Click the Sign In button

Use the locators from the table above.
`;
```

### Step 4 — Fuzzy-find controls at runtime

```typescript
import { findControls, controlToPlaywrightLocator } from 'dom-distiller';

// Find buttons containing "save" or "submit"
const saveButtons = findControls(ast, { text: 'save', role: 'button' });
// → [{ text: 'Save Changes', locator: 'id=save-btn', ... }]

// Convert to Playwright locator string
const locator = controlToPlaywrightLocator(saveButtons[0]);
// → page.locator('[data-testid="save-btn"]')
```

## API Reference

### `distillPage(page, options?)`

Injects the distiller into the browser page and returns the AST.

```typescript
import type { Page } from 'playwright-core';
import type { DistilledNode, DistillOptions } from 'dom-distiller';

async function distillPage(
  page: Page,
  options?: DistillOptions
): Promise<DistilledNode[]>;
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxTextLength` | `number` | `200` | Max characters for `text` field |
| `includeHidden` | `boolean` | `false` | Include hidden elements in AST |
| `checkObscured` | `boolean` | `false` | Check z-index occlusion via `elementFromPoint` |

### `distillScript`

Raw JavaScript string of the injector. Use when you need full control over injection:

```typescript
import { distillScript } from 'dom-distiller';
await page.addScriptTag({ content: distillScript });
const ast = await page.evaluate(() => (window as any).domDistiller());
```

### `astToMarkdown(ast, options?)`

Converts AST nodes to a compact Markdown table suitable for LLM prompts.

```typescript
function astToMarkdown(
  ast: DistilledNode[],
  options?: { columns?: string[]; maxRows?: number }
): string;
```

### `getInteractable(ast)`

Returns only interactable nodes (buttons, links, inputs, etc.).

```typescript
function getInteractable(ast: DistilledNode[]): DistilledNode[];
```

### `findControls(ast, query)`

Fuzzy-search controls by text substring, role, tag, or locator substring.

```typescript
function findControls(
  ast: DistilledNode[],
  query: {
    text?: string;
    role?: string;
    tag?: string;
    locator?: string;
  }
): DistilledNode[];
```

### `controlToPlaywrightLocator(node)`

Converts a `DistilledNode` into a `page.locator(...)` string.

```typescript
function controlToPlaywrightLocator(node: DistilledNode): string;

// Examples:
// data-testid=login-btn  →  page.locator('[data-testid="login-btn"]')
// id=email               →  page.locator('#email')
// aria-label=Search      →  page.locator('[aria-label="Search"]')
// xpath=/html/body/...   →  page.locator('xpath=/html/body/...')
```

### `describePage(ast)`

Generates a human-readable summary of the page controls.

```typescript
function describePage(ast: DistilledNode[]): string;
// → "Page contains 3 interactable controls (1 editable). Breakdown:
//    1 button, 1 textbox, 1 link. Key controls: Sign In (data-testid=login-btn),
//    Email (id=email), Forgot password? (href=/reset)."
```

## Data Format

```typescript
interface DistilledNode {
  role: string;               // semantic role or tag name
  tag: string;                // HTML tag
  text: string;               // cleaned visible text / accessible name
  locator: string;            // best stable locator
  locatorFallback: string[];  // fallback locators
  interactable: boolean;      // clickable / focusable / editable?
  visible: boolean;
  editable: boolean;
  checked?: boolean;
  disabled?: boolean;
  attributes: Record<string, string>;
  rect: { top; left; bottom; right; width; height };
  children: DistilledNode[];
}
```

## Architecture

```
src/
  types.ts           # Shared TypeScript interfaces
  core/
    visibility.ts    # Visibility heuristics (display:none, opacity, aria-hidden)
    extractor.ts     # Interactivity detection & attribute extraction
    flattener.ts     # Tree compression (remove empty wrapper divs)
  llm/
    markdown.ts      # AST → Markdown table
    query.ts         # Fuzzy search & filtering
    playwright.ts    # Playwright locator generation
  injected.ts        # Auto-generated browser bundle (no Node APIs)
  generated/
    script.ts        # Minified JS string embedded at build time
  index.ts           # Node.js API entry point
```

### How it works

1. **Visibility Engine** (`src/core/visibility.ts`)  
   Filters `display: none`, `visibility: hidden`, `opacity: 0`, zero-size elements, and `aria-hidden="true"`. Optionally checks z-index occlusion.

2. **Extractor** (`src/core/extractor.ts`)  
   Detects interactive tags and ARIA roles. Builds locators in priority order. Extracts `aria-label`, placeholder, label text, title, alt. Cleans `innerText`.

3. **Flattener** (`src/core/flattener.ts`)  
   Removes meaningless wrappers (`<div>`/`<span>` with no text, no stable attributes, no semantic role) by promoting children upward. Drops `<script>`, `<style>`, `<noscript>`, `<svg>`.

4. **LLM Layer** (`src/llm/*.ts`)  
   Converts AST into LLM-friendly formats: Markdown tables, fuzzy search, Playwright locators, page summaries.

5. **Self-contained Injection** (`src/injected.ts`)  
   Core modules are bundled at build time into a single serializable function. Zero Node.js APIs inside the browser payload.

## Full Copilot Workflow Example

```typescript
import { chromium } from 'playwright';
import {
  distillPage,
  astToMarkdown,
  getInteractable,
  findControls,
  controlToPlaywrightLocator,
  describePage,
} from 'dom-distiller';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://my-app.com/settings');

// 1. Distill the page
const ast = await distillPage(page);
const controls = getInteractable(ast);

// 2. Build context for the LLM
const markdown = astToMarkdown(controls, { maxRows: 30 });
const description = describePage(controls);

// 3. Find a specific control
const saveBtn = findControls(controls, { text: 'save', role: 'button' });
console.log(controlToPlaywrightLocator(saveBtn[0]));
// → page.locator('[data-testid="save-settings"]')

// 4. Use in a Copilot prompt
const prompt = `
Page: Settings
${description}

Available controls:
${markdown}

Task: change language to "Ukrainian" and save settings.
Write Playwright TypeScript code. Use locators from the table.
`;
```

## Performance

- Single-pass `TreeWalker` over the live DOM (C++-speed traversal)
- Shadow DOM recursively pierced in the same pass
- Zero runtime dependencies in the browser
- Typical execution time: **< 20 ms** for a 10,000-element page

## License

Apache-2.0
