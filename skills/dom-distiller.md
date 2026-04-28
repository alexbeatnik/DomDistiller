# DomDistiller Skill

## When to use

Use this skill when:
- Writing or modifying Playwright automation code that needs to interact with web page controls
- Building LLM-agent workflows where Copilot/GPT needs to "see" and reason about page controls
- Adding new features to the DomDistiller library itself
- Debugging why a control was not found / incorrectly labeled in the AST

## Core Concepts

### 1. DistilledNode

The atomic unit returned by DomDistiller. Represents one control on the page:

```typescript
interface DistilledNode {
  role: string;               // semantic role or tag name
  tag: string;                // HTML tag
  text: string;               // visible text / accessible name
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

### 2. Locator Priority Chain

DomDistiller builds locators in this priority order:

1. `data-testid` — highest priority, meant for testing
2. `data-test`
3. `data-qa`
4. `id` — rejected if starts with digit or contains 5+ consecutive digits (anti-dynamic)
5. `name`
6. `aria-label`
7. `placeholder`
8. `href` (for links)
9. `xpath` — last resort

### 3. Visibility Rules

An element is filtered out if:
- `display: none`
- `visibility: hidden`
- `opacity < 0.01`
- `width <= 0 || height <= 0`
- `aria-hidden="true"`
- (optional) z-index occluded via `elementFromPoint`

**Exception**: checkbox, radio, and file inputs are always included even if hidden, because they are often visually hidden but functionally controlled by a custom label.

## Quick Recipes

### Recipe: Generate Copilot prompt from page

```typescript
import { distillPage, getInteractable, astToMarkdown, describePage } from 'dom-distiller';

const ast = await distillPage(page);
const controls = getInteractable(ast);

const prompt = `
You are a Playwright automation assistant.
The current page has these controls:

${astToMarkdown(controls, { maxRows: 40 })}

Summary: ${describePage(controls)}

Task: ${userTask}
Write TypeScript code using Playwright. Prefer data-testid and id locators.
`;
```

### Recipe: Find and click a button

```typescript
import { distillPage, findControls, controlToPlaywrightLocator } from 'dom-distiller';

const ast = await distillPage(page);
const buttons = findControls(ast, { text: 'submit', role: 'button' });

if (buttons.length === 0) throw new Error('Submit button not found');
if (buttons.length > 1) console.warn('Multiple submit buttons, using first');

const locatorStr = controlToPlaywrightLocator(buttons[0]);
// → page.locator('[data-testid="submit-form"]')

await page.locator(buttons[0].locator.replace(/^data-testid=/, '[data-testid="') + '"]').click();
```

### Recipe: Fill a form field by label text

```typescript
const ast = await distillPage(page);
const emailField = findControls(ast, { text: 'email', tag: 'input' })[0];

if (emailField?.locator.startsWith('id=')) {
  const id = emailField.locator.slice(3);
  await page.locator(`#${id}`).fill('user@example.com');
}
```

### Recipe: Verify page state

```typescript
const ast = await distillPage(page);
const errors = findControls(ast, { role: 'alert' });

for (const err of errors) {
  console.log('Error:', err.text);
}
```

## API Reference

### Browser-side (injected)

```javascript
// After injection, window.domDistiller is available
const ast = window.domDistiller(options);
```

### Node-side

| Function | Purpose |
|----------|---------|
| `distillPage(page, opts?)` | Inject and run distiller, return AST |
| `distill(page)` | Retrieve pre-computed `window.__domDistillerResult` |
| `getInteractable(ast)` | Filter only actionable controls |
| `getEditable(ast)` | Filter only text inputs |
| `findControls(ast, query)` | Fuzzy search by text/role/tag/locator |
| `findControl(ast, query)` | Find first match |
| `astToMarkdown(ast, opts?)` | AST → Markdown table |
| `controlToPlaywrightLocator(node)` | Node → `page.locator(...)` string |
| `describePage(ast)` | Human-readable page summary |

## Troubleshooting

### "Control not found in AST"

1. Check if it's hidden (`display: none`, `visibility: hidden`, `opacity: 0`)
2. Check if it's inside Shadow DOM (should be pierced automatically)
3. Check if it's a custom element (should be included as `interactable`)
4. Try `includeHidden: true` option

### "Locator is unstable / dynamic"

1. Add `data-testid` to the element in your app
2. Or add `aria-label` for accessibility + stability
3. DomDistiller auto-rejects numeric-only or highly numeric IDs

### "AST is too large for LLM context"

1. Use `getInteractable(ast)` instead of full AST
2. Use `astToMarkdown(controls, { maxRows: 30 })`
3. Filter by role: `findControls(ast, { role: 'button' })`

### "Text is wrong / truncated"

- Default `maxTextLength` is 200 chars
- `text-transform: uppercase` CSS is NOT normalized (browser reports rendered text)
- Whitespace is collapsed (`\s+` → single space)

## Extending DomDistiller

### Add a new locator strategy

Edit `src/core/extractor.ts`:

```typescript
// In buildLocator()
if (attrs['data-cy']) {
  return { primary: `data-cy=${attrs['data-cy']}`, fallbacks };
}
```

Rebuild: `npm run build`

### Add a new interactive role

Edit `INTERACTIVE_ROLES` Set in `src/core/extractor.ts`.

### Add a new LLM output format

Create `src/llm/my-format.ts`, implement function, export from `src/index.ts`.

## Testing New Changes

```bash
npm run build
npm test
```

All 21 test suites (~1150 traps) must pass. If you modify `src/core/`, the injected script is regenerated, so run the full build.
