import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByLocator, findNodeByText } from './_helpers';
import type { DistilledNode } from '../src/types';
import { controlToPlaywrightSelfHealingLocator } from '../src/llm/playwright';

// ─────────────────────────────────────────────────────────────────────────────
// SEMANTIC AST EDGE CASES — v2 Extraction Engine Deep Gauntlet
//
// Validates edge cases, cross-group isolation, missing IDs, priority chains,
// spatial-near limits, and self-healing locator behavior under stress.
// ─────────────────────────────────────────────────────────────────────────────

const EDGE_DOM = `
<!DOCTYPE html><html><head><title>Semantic Edge Cases</title></head><body>

<!-- Group 1: form without aria-label or name uses legend -->
<form>
  <legend>Shipping Address</legend>
  <input id="g1-street" type="text" name="street">
  <button id="g1-save" type="submit">Save</button>
</form>

<!-- Group 2: form with name attr (name beats id) -->
<form name="billing" id="g2-form">
  <input id="g2-card" type="text" name="card">
</form>

<!-- Group 3: standalone control outside any container -->
<button id="standalone-btn">Standalone</button>

<!-- Group 4: tablist with aria-controls -->
<div role="tablist">
  <button id="tab1" role="tab" aria-controls="panel1">Tab 1</button>
  <button id="tab2" role="tab" aria-controls="panel2">Tab 2</button>
</div>
<div id="panel1" role="tabpanel">Panel 1</div>
<div id="panel2" role="tabpanel" hidden>Panel 2</div>

<!-- Group 5: two separate forms for cross-group spatial isolation -->
<form aria-label="Form Alpha" id="form-alpha">
  <input id="alpha-input" type="text" name="alpha">
  <button id="alpha-btn">Alpha</button>
</form>
<form aria-label="Form Beta" id="form-beta">
  <input id="beta-input" type="text" name="beta">
  <button id="beta-btn">Beta</button>
</form>

<!-- Group 6: dynamic id rejected, name used instead -->
<input id="12345" name="real-name" type="text">

<!-- Group 7: data-test beats name -->
<input data-test="pref-email" name="email" id="g7-email" type="email">

<!-- Group 8: label points to missing id -->
<label for="missing-id" id="g8-label">Missing Target</label>

<!-- Group 9: dialog with heading but no aria-label -->
<div role="dialog" id="g9-dialog">
  <h2>Confirm Action</h2>
  <button id="g9-ok">OK</button>
</div>

<!-- Group 10: dialog without heading or aria-label -->
<div role="alertdialog" id="g10-dialog">
  <button id="g10-close">Close</button>
</div>

<!-- Group 11: only xpath fallback (no stable attrs) -->
<button>XPath Only</button>

<!-- Group 12: multiple fallbacks stacked (no id so name becomes primary) -->
<input name="multi" aria-label="Multi Input" placeholder="Type here" type="text">

</body></html>
`;

const TRAPS = [
  // ── Semantic Grouping: fallback chain ──
  {
    n: "1. Form without aria-label uses legend as semanticContext",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'g1-street');
      return node !== undefined && node.semanticContext === 'Shipping Address';
    },
  },
  {
    n: "2. Form with name attr uses name (not id) as semanticContext",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'g2-card');
      return node !== undefined && node.semanticContext === 'billing';
    },
  },
  {
    n: "3. Standalone button has no semanticContext",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'standalone-btn');
      return node !== undefined && node.semanticContext === undefined;
    },
  },
  {
    n: "4. Standalone button has no groupId",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'standalone-btn');
      return node !== undefined && node.groupId === undefined;
    },
  },
  {
    n: "5. Dialog with heading but no aria-label uses heading text",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'g9-ok');
      return node !== undefined && node.semanticContext === 'Confirm Action';
    },
  },
  {
    n: "6. Dialog without heading or aria-label uses fallback 'Dialog'",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'g10-close');
      return node !== undefined && node.semanticContext === 'Dialog';
    },
  },
  // ── Relations: aria-controls ──
  {
    n: "7. Tab button has aria-controls relation to visible panel",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'tab1');
      if (!node) return false;
      const rel = node.relations.find((r) => r.type === 'aria-controls');
      return rel !== undefined && rel.targetLocator.includes('panel1');
    },
  },
  {
    n: "8. Tab button does NOT have aria-controls to hidden panel (filtered)",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'tab2');
      if (!node) return false;
      const rel = node.relations.find((r) => r.type === 'aria-controls' && r.targetLocator.includes('panel2'));
      return rel === undefined;
    },
  },
  // ── Relations: cross-group spatial isolation ──
  {
    n: "9. Alpha button has no spatial-near relation to Beta button (different group)",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'alpha-btn');
      if (!node) return false;
      const rel = node.relations.find((r) => r.type === 'spatial-near' && r.description.includes('Beta'));
      return rel === undefined;
    },
  },
  // ── Relations: spatial-near limit ──
  {
    n: "10. Node has at most 2 spatial-near relations",
    assert: (ast: DistilledNode[]) => {
      const walk = (nodes: DistilledNode[]): boolean => {
        for (const n of nodes) {
          const count = n.relations.filter((r) => r.type === 'spatial-near').length;
          if (count > 2) return false;
          if (!walk(n.children)) return false;
        }
        return true;
      };
      return walk(ast);
    },
  },
  // ── Relations: missing target ──
  {
    n: "11. Label pointing to missing id has no label-for relation",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'g8-label');
      if (!node) return false;
      const rel = node.relations.find((r) => r.type === 'label-for');
      return rel === undefined;
    },
  },
  // ── Locator Strategy: priority & dynamic ids ──
  {
    n: "12. Dynamic numeric id is rejected, name used as primary",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByLocator(ast, 'name=real-name');
      return node !== undefined && node.locatorStrategy.confidence === 'medium';
    },
  },
  {
    n: "13. data-test beats name in locator priority",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'g7-email');
      return node !== undefined && node.locator === 'data-test=pref-email' && node.locatorStrategy.confidence === 'high';
    },
  },
  {
    n: "14. Node with only xpath fallback gets low confidence",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByText(ast, 'XPath Only');
      return node !== undefined && node.locatorStrategy.confidence === 'low' && node.locator.startsWith('xpath=');
    },
  },
  {
    n: "15. Stacked attrs populate fallbacks correctly",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByLocator(ast, 'name=multi');
      return (
        node !== undefined &&
        node.locator === 'name=multi' &&
        node.locatorFallback.includes('aria-label=Multi Input') &&
        node.locatorFallback.includes('placeholder=Type here')
      );
    },
  },
  // ── Self-healing locators ──
  {
    n: "16. Self-healing with only xpath fallback returns simple locator (no .or)",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByText(ast, 'XPath Only');
      if (!node) return false;
      const code = controlToPlaywrightSelfHealingLocator(node);
      return !code.includes('.or(') && code.includes('xpath=');
    },
  },
  {
    n: "17. Self-healing skips xpath when mixed with other fallbacks",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByLocator(ast, 'name=multi');
      if (!node) return false;
      const code = controlToPlaywrightSelfHealingLocator(node);
      // Should include .or() because there are non-xpath fallbacks,
      // but should NOT include xpath in the chain
      return code.includes('.or(') && !code.includes('xpath=');
    },
  },
  // ── Consistency ──
  {
    n: "18. locator string always matches locatorStrategy.primary",
    assert: (ast: DistilledNode[]) => {
      const walk = (nodes: DistilledNode[]): boolean => {
        for (const n of nodes) {
          if (n.locator !== n.locatorStrategy.primary) return false;
          if (!walk(n.children)) return false;
        }
        return true;
      };
      return walk(ast);
    },
  },
  {
    n: "19. locatorFallback array always matches locatorStrategy.fallbacks",
    assert: (ast: DistilledNode[]) => {
      const walk = (nodes: DistilledNode[]): boolean => {
        for (const n of nodes) {
          if (JSON.stringify(n.locatorFallback) !== JSON.stringify(n.locatorStrategy.fallbacks)) return false;
          if (!walk(n.children)) return false;
        }
        return true;
      };
      return walk(ast);
    },
  },
  {
    n: "20. Standalone control without aria attrs has empty relations",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'standalone-btn');
      return node !== undefined && node.relations.length === 0;
    },
  },
];

describe('Semantic AST Edge Cases', () => {
  it('should pass all v2 edge case traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'Semantic AST Edge Cases',
      EDGE_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 SEMANTIC EDGE CASES FLAWLESS — v2 engine handles stress perfectly!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} semantic edge case trap(s) failed`);
  });
});
