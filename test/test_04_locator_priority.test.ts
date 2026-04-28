import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByLocator, findNodeByText } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// LOCATOR PRIORITY LAB — Stable Attribute Scoring Gauntlet
//
// Validates the exact priority order for primary locator selection:
//   data-testid > data-test > data-qa > id (heuristic) > name > aria-label
//   > placeholder > href > xpath
//
// Also validates that fallbacks are populated correctly and that
// disambiguation-friendly attributes win over generic text.
// ─────────────────────────────────────────────────────────────────────────────

const LOCATOR_DOM = `
<!DOCTYPE html><html><head><title>Locator Priority Lab</title></head><body>

<!-- Group 1: data-testid wins over everything -->
<button id="g1" data-testid="save-btn" name="save" aria-label="Save">Go</button>

<!-- Group 2: data-test wins when no data-testid -->
<button id="g2" data-test="submit-btn" name="submit">Go</button>

<!-- Group 3: data-qa wins when no data-testid/data-test -->
<button id="g3" data-qa="login-btn" name="login">Go</button>

<!-- Group 4: id wins when no data-* attrs -->
<button id="g4" name="cancel" aria-label="Cancel">Go</button>

<!-- Group 5: name wins when no id/data-* -->
<button name="g5_name" aria-label="Delete">Go</button>

<!-- Group 6: aria-label wins when no name/id/data-* -->
<button aria-label="Go">Go</button>

<!-- Group 7: placeholder wins for inputs -->
<input placeholder="Search here" type="text">

<!-- Group 8: href wins for links -->
<a href="/dashboard">Dashboard</a>

<!-- Group 9: xpath fallback when nothing else -->
<button>Plain</button>

<!-- Group 10: numeric-only id is rejected as unstable -->
<button id="123456" name="stable_name">Go</button>

<!-- Group 11: id starting with digit is rejected -->
<button id="1abc" name="fallback_name">Go</button>

<!-- Group 12: multiple fallbacks collected when no id/data-* -->
<input name="email" aria-label="Work Email" placeholder="your@email.com" type="email">

<!-- Group 13: data-testid on link -->
<a id="g13" href="/home" data-testid="nav-home">Home</a>

<!-- Group 14: data-qa on input -->
<input id="g14" type="text" data-qa="promo-code" placeholder="Code">

<!-- Group 15: complex button with stacked attrs -->
<button id="g15" data-testid="primary-action" name="action" aria-label="Primary Action" title="Tooltip">Do It</button>

</body></html>
`;

const TRAPS = [
  {
    n: "1. data-testid gets primary locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'g1');
      return node !== undefined && node.locator === 'data-testid=save-btn';
    },
  },
  {
    n: "2. data-test gets primary locator when no data-testid",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'g2');
      return node !== undefined && node.locator === 'data-test=submit-btn';
    },
  },
  {
    n: "3. data-qa gets primary locator when no data-testid/data-test",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'g3');
      return node !== undefined && node.locator === 'data-qa=login-btn';
    },
  },
  {
    n: "4. id gets primary locator when no data-* attrs",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'g4');
      return node !== undefined && node.locator === 'id=g4';
    },
  },
  {
    n: "5. name gets primary locator when no id/data-*",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByLocator(ast, 'name=g5_name');
      return node !== undefined;
    },
  },
  {
    n: "6. aria-label gets primary locator when no name/id/data-*",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByLocator(ast, 'aria-label=Go');
      return node !== undefined;
    },
  },
  {
    n: "7. placeholder gets primary locator for input without id",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByLocator(ast, 'placeholder=Search here');
      return node !== undefined;
    },
  },
  {
    n: "8. href gets primary locator for link without id",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByLocator(ast, 'href=/dashboard');
      return node !== undefined;
    },
  },
  {
    n: "9. xpath fallback when no stable attrs",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByText(ast, 'Plain');
      return node !== undefined && node.locator.startsWith('xpath=');
    },
  },
  {
    n: "10. numeric-only id is rejected, name used instead",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByLocator(ast, 'name=stable_name');
      return node !== undefined;
    },
  },
  {
    n: "11. id starting with digit is rejected, name used instead",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByLocator(ast, 'name=fallback_name');
      return node !== undefined;
    },
  },
  {
    n: "12. name gets primary when no id/data-*; aria-label and placeholder are fallbacks",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByLocator(ast, 'name=email');
      return node !== undefined &&
             node.locator === 'name=email' &&
             node.locatorFallback.includes('aria-label=Work Email') &&
             node.locatorFallback.includes('placeholder=your@email.com');
    },
  },
  {
    n: "13. data-testid beats href on link",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'g13');
      return node !== undefined && node.locator === 'data-testid=nav-home';
    },
  },
  {
    n: "14. data-qa beats placeholder on input",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'g14');
      return node !== undefined && node.locator === 'data-qa=promo-code';
    },
  },
  {
    n: "15. data-testid beats all other stacked attrs",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'g15');
      return node !== undefined && node.locator === 'data-testid=primary-action';
    },
  },
  {
    n: "16. Every interactable node has at least one locator",
    assert: (ast: DistilledNode[]) => {
      const walk = (nodes: DistilledNode[]): boolean => {
        for (const n of nodes) {
          if (n.interactable && !n.locator) return false;
          if (!walk(n.children)) return false;
        }
        return true;
      };
      return walk(ast);
    },
  },
  {
    n: "17. No locator contains 'undefined' or empty string",
    assert: (ast: DistilledNode[]) => {
      const walk = (nodes: DistilledNode[]): boolean => {
        for (const n of nodes) {
          if (n.locator && (n.locator.includes('undefined') || n.locator === '')) return false;
          if (!walk(n.children)) return false;
        }
        return true;
      };
      return walk(ast);
    },
  },
];

describe('Locator Priority Lab', () => {
  it('should pass all locator priority traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'Locator Priority Lab',
      LOCATOR_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 LOCATOR PRIORITY FLAWLESS — Stable attribute chain is airtight!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} locator priority trap(s) failed`);
  });
});
