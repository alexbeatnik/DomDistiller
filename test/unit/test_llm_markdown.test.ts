import { describe, it } from 'node:test';
import assert from 'node:assert';
import { astToMarkdown } from '../../src/llm/markdown';
import type { DistilledNode } from '../../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// LLM MARKDOWN UNIT TESTS — Pure Node, no Playwright
//
// Validates astToMarkdown output shape, column selection, escaping,
// and v2 Semantic AST columns without touching the browser.
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

describe('astToMarkdown (unit)', () => {
  it('renders default columns', () => {
    const ast = [makeNode({ role: 'button', text: 'Save', locator: 'data-testid=save' })];
    const md = astToMarkdown(ast);
    assert.ok(md.includes('| role | text | locator | tag | editable |'));
    assert.ok(md.includes('| button | Save | data-testid=save | button | false |'));
  });

  it('escapes pipe characters in markdown', () => {
    const ast = [makeNode({ text: 'A | B', locator: 'id=x' })];
    const md = astToMarkdown(ast);
    assert.ok(md.includes('A \\| B'));
  });

  it('trims long text to 80 chars', () => {
    const long = 'a'.repeat(200);
    const ast = [makeNode({ text: long })];
    const md = astToMarkdown(ast);
    const row = md.split('\n').find((l) => l.startsWith('| button'))!;
    const cell = row.split('|').map((c) => c.trim())[2]; // text cell
    assert.strictEqual(cell!.length, 80);
  });

  it('renders v2 confidence column', () => {
    const ast = [makeNode({ locatorStrategy: { primary: 'id=x', fallbacks: [], confidence: 'medium' } })];
    const md = astToMarkdown(ast, { columns: ['role', 'locator', 'confidence'] });
    assert.ok(md.includes('| role | locator | confidence |'));
    assert.ok(md.includes('medium'));
  });

  it('renders v2 semanticContext column', () => {
    const ast = [makeNode({ semanticContext: 'Login Form' })];
    const md = astToMarkdown(ast, { columns: ['role', 'semanticContext'] });
    assert.ok(md.includes('Login Form'));
  });

  it('renders v2 relations column as type list', () => {
    const ast = [makeNode({
      relations: [
        { type: 'label-for', targetLocator: 'id=email', description: 'Labels Email' },
        { type: 'spatial-near', targetLocator: 'id=pass', description: 'Near Password' },
      ],
    })];
    const md = astToMarkdown(ast, { columns: ['role', 'relations'] });
    assert.ok(md.includes('label-for, spatial-near'));
  });

  it('renders children recursively', () => {
    const ast = [
      makeNode({
        role: 'form',
        tag: 'form',
        locator: 'id=f1',
        children: [
          makeNode({ role: 'textbox', tag: 'input', locator: 'id=email', editable: true }),
          makeNode({ role: 'button', tag: 'button', locator: 'id=submit' }),
        ],
      }),
    ];
    const md = astToMarkdown(ast);
    assert.ok(md.includes('form'));
    assert.ok(md.includes('textbox'));
    assert.ok(md.includes('button'));
  });

  it('respects maxRows limit', () => {
    const ast = Array.from({ length: 10 }, (_, i) =>
      makeNode({ locator: `id=btn${i}` })
    );
    const md = astToMarkdown(ast, { maxRows: 5 });
    const rows = md.split('\n').filter((l) => l.startsWith('| button'));
    assert.strictEqual(rows.length, 5);
  });

  it('renders unknown attribute columns as dash when missing', () => {
    const ast = [makeNode({ attributes: {} })];
    const md = astToMarkdown(ast, { columns: ['role', 'data-custom'] });
    assert.ok(md.includes('| button | - |'));
  });

  it('renders checked and disabled booleans', () => {
    const ast = [makeNode({ role: 'checkbox', checked: true, disabled: true })];
    const md = astToMarkdown(ast, { columns: ['role', 'checked', 'disabled'] });
    assert.ok(md.includes('true'));
  });
});
