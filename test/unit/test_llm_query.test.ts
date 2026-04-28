import { describe, it } from 'node:test';
import assert from 'node:assert';
import { flattenAST, getInteractable, getEditable, findControls, findControl } from '../../src/llm/query';
import type { DistilledNode } from '../../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// LLM QUERY UNIT TESTS — Pure Node, no Playwright
// ─────────────────────────────────────────────────────────────────────────────

function makeNode(partial: Partial<DistilledNode> = {}, children: DistilledNode[] = []): DistilledNode {
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
    children,
    relations: partial.relations ?? [],
    ...partial,
  };
}

describe('flattenAST (unit)', () => {
  it('flattens nested children depth-first', () => {
    const ast = [
      makeNode({ text: 'A' }, [
        makeNode({ text: 'B' }, [
          makeNode({ text: 'C' }),
        ]),
      ]),
    ];
    const flat = flattenAST(ast);
    assert.strictEqual(flat.length, 3);
    assert.deepStrictEqual(flat.map((n) => n.text), ['A', 'B', 'C']);
  });

  it('handles empty array', () => {
    assert.deepStrictEqual(flattenAST([]), []);
  });
});

describe('getInteractable (unit)', () => {
  it('filters only interactable nodes', () => {
    const ast = [
      makeNode({ interactable: true, text: 'Btn' }),
      makeNode({ interactable: false, text: 'Div' }),
    ];
    const res = getInteractable(ast);
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0].text, 'Btn');
  });

  it('searches recursively', () => {
    const ast = [
      makeNode({ interactable: false }, [
        makeNode({ interactable: true, text: 'Nested' }),
      ]),
    ];
    const res = getInteractable(ast);
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0].text, 'Nested');
  });
});

describe('getEditable (unit)', () => {
  it('filters only editable nodes', () => {
    const ast = [
      makeNode({ editable: true, role: 'textbox' }),
      makeNode({ editable: false, role: 'button' }),
    ];
    const res = getEditable(ast);
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0].role, 'textbox');
  });
});

describe('findControls (unit)', () => {
  const ast = [
    makeNode({ role: 'button', tag: 'button', text: 'Save', locator: 'data-testid=save' }),
    makeNode({ role: 'button', tag: 'button', text: 'Delete', locator: 'data-testid=del' }),
    makeNode({ role: 'textbox', tag: 'input', text: 'Email', locator: 'id=email', editable: true }),
  ];

  it('finds by text substring', () => {
    const res = findControls(ast, { text: 'save' });
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0].text, 'Save');
  });

  it('finds by role', () => {
    const res = findControls(ast, { role: 'button' });
    assert.strictEqual(res.length, 2);
  });

  it('finds by tag', () => {
    const res = findControls(ast, { tag: 'button' });
    assert.strictEqual(res.length, 2);
  });

  it('finds by locator substring', () => {
    const res = findControls(ast, { locator: 'email' });
    assert.strictEqual(res.length, 1);
  });

  it('finds by combined query', () => {
    const res = findControls(ast, { text: 'save', role: 'button' });
    assert.strictEqual(res.length, 1);
  });

  it('returns empty when no match', () => {
    const res = findControls(ast, { text: 'nonexistent' });
    assert.deepStrictEqual(res, []);
  });

  it('is case-insensitive for text', () => {
    const res = findControls(ast, { text: 'SAVE' });
    assert.strictEqual(res.length, 1);
  });
});

describe('findControl (unit)', () => {
  const ast = [
    makeNode({ text: 'First' }),
    makeNode({ text: 'Second' }),
  ];

  it('returns first match', () => {
    const node = findControl(ast, { text: 'first' });
    assert.strictEqual(node?.text, 'First');
  });

  it('returns undefined when no match', () => {
    const node = findControl(ast, { text: 'nope' });
    assert.strictEqual(node, undefined);
  });
});
