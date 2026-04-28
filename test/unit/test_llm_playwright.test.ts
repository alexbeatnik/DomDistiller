import { describe, it } from 'node:test';
import assert from 'node:assert';
import { controlToPlaywrightLocator, controlToPlaywrightSelfHealingLocator, describePage } from '../../src/llm/playwright';
import type { DistilledNode } from '../../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// LLM PLAYWRIGHT UNIT TESTS — Pure Node, no Playwright
// ─────────────────────────────────────────────────────────────────────────────

function makeNode(partial: Partial<DistilledNode> = {}): DistilledNode {
  return {
    role: partial.role ?? 'button',
    tag: partial.tag ?? 'button',
    text: partial.text ?? 'Click',
    locator: partial.locator ?? 'data-testid=btn',
    locatorFallback: partial.locatorFallback ?? [],
    locatorStrategy: partial.locatorStrategy ?? { primary: 'data-testid=btn', fallbacks: [], confidence: 'high' },
    interactable: partial.interactable ?? true,
    visible: partial.visible ?? true,
    editable: partial.editable ?? false,
    attributes: partial.attributes ?? {},
    rect: partial.rect ?? { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 },
    children: partial.children ?? [],
    relations: partial.relations ?? [],
    ...partial,
  };
}

describe('controlToPlaywrightLocator (unit)', () => {
  it('converts data-testid', () => {
    const code = controlToPlaywrightLocator(makeNode({ locator: 'data-testid=login-btn' }));
    assert.strictEqual(code, `page.locator('[data-testid="login-btn"]')`);
  });

  it('converts id', () => {
    const code = controlToPlaywrightLocator(makeNode({ locator: 'id=email' }));
    assert.strictEqual(code, `page.locator('#email')`);
  });

  it('converts name', () => {
    const code = controlToPlaywrightLocator(makeNode({ locator: 'name=username' }));
    assert.strictEqual(code, `page.locator('[name="username"]')`);
  });

  it('converts aria-label', () => {
    const code = controlToPlaywrightLocator(makeNode({ locator: 'aria-label=Search' }));
    assert.strictEqual(code, `page.locator('[aria-label="Search"]')`);
  });

  it('converts placeholder', () => {
    const code = controlToPlaywrightLocator(makeNode({ locator: 'placeholder=Type here' }));
    assert.strictEqual(code, `page.locator('[placeholder="Type here"]')`);
  });

  it('converts href with tag', () => {
    const code = controlToPlaywrightLocator(makeNode({ locator: 'href=/about', tag: 'a' }));
    assert.strictEqual(code, `page.locator('a[href="/about"]')`);
  });

  it('converts xpath', () => {
    const code = controlToPlaywrightLocator(makeNode({ locator: 'xpath=/html/body/div[1]' }));
    assert.strictEqual(code, `page.locator('xpath=/html/body/div[1]')`);
  });

  it('falls back to getByText for button without known locator prefix', () => {
    const code = controlToPlaywrightLocator(makeNode({ tag: 'button', text: 'Submit', locator: 'unknown=val' }));
    assert.strictEqual(code, `page.getByText('Submit')`);
  });

  it('falls back to generic tag locator for unknown', () => {
    const code = controlToPlaywrightLocator(makeNode({ tag: 'div', text: '', locator: 'unknown=val' }));
    assert.strictEqual(code, `page.locator('div')`);
  });
});

describe('controlToPlaywrightSelfHealingLocator (unit)', () => {
  it('returns simple locator when no fallbacks', () => {
    const node = makeNode({
      locator: 'data-testid=save',
      locatorStrategy: { primary: 'data-testid=save', fallbacks: [], confidence: 'high' },
    });
    const code = controlToPlaywrightSelfHealingLocator(node);
    assert.strictEqual(code, `page.locator('[data-testid="save"]')`);
  });

  it('builds .or() chain with fallbacks', () => {
    const node = makeNode({
      tag: 'input',
      locator: 'name=email',
      locatorStrategy: {
        primary: 'name=email',
        fallbacks: ['aria-label=Work Email'],
        confidence: 'medium',
      },
    });
    const code = controlToPlaywrightSelfHealingLocator(node);
    assert.ok(code.includes('.or('));
    assert.ok(code.includes('name="email"'));
    assert.ok(code.includes('aria-label="Work Email"'));
  });

  it('skips xpath fallback in .or() chain', () => {
    const node = makeNode({
      tag: 'button',
      locator: 'name=btn',
      locatorStrategy: {
        primary: 'name=btn',
        fallbacks: ['xpath=/html/body/button[1]', 'aria-label=Close'],
        confidence: 'medium',
      },
    });
    const code = controlToPlaywrightSelfHealingLocator(node);
    assert.ok(code.includes('.or('));
    assert.ok(!code.includes('xpath='));
    assert.ok(code.includes('aria-label="Close"'));
  });

  it('limits .or() chain to max 3 locators', () => {
    const node = makeNode({
      tag: 'input',
      locator: 'name=a',
      locatorStrategy: {
        primary: 'name=a',
        fallbacks: ['name=b', 'name=c', 'name=d', 'name=e'],
        confidence: 'medium',
      },
    });
    const code = controlToPlaywrightSelfHealingLocator(node);
    const orCount = (code.match(/\.or\(/g) || []).length;
    assert.strictEqual(orCount, 2); // primary + 2 fallbacks = 3 total
  });
});

describe('describePage (unit)', () => {
  it('describes empty page', () => {
    const text = describePage([]);
    assert.ok(text.includes('0 interactable'));
  });

  it('describes interactable counts', () => {
    const ast = [
      makeNode({ role: 'button', text: 'Save' }),
      makeNode({ role: 'button', text: 'Delete' }),
      makeNode({ role: 'textbox', text: 'Email', editable: true }),
    ];
    const text = describePage(ast);
    assert.ok(text.includes('3 interactable controls'));
    assert.ok(text.includes('1 editable'));
    assert.ok(text.includes('2 buttons'));
    assert.ok(text.includes('1 textbox'));
  });

  it('lists key controls', () => {
    const ast = [
      makeNode({ role: 'button', text: 'A', locator: 'id=a' }),
      makeNode({ role: 'button', text: 'B', locator: 'id=b' }),
    ];
    const text = describePage(ast);
    assert.ok(text.includes('Key controls:'));
    assert.ok(text.includes('id=a'));
  });
});
