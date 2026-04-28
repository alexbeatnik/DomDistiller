import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByLocator, findNodeByText } from './_helpers';
import type { DistilledNode } from '../src/types';
import { controlToPlaywrightSelfHealingLocator } from '../src/llm/playwright';

// ─────────────────────────────────────────────────────────────────────────────
// SEMANTIC AST LAB — v2 Extraction Engine Gauntlet
//
// Validates:
// 1. Semantic Grouping (form/fieldset/dialog detection)
// 2. Relations Graph (label-for, aria-describedby, spatial-near)
// 3. Multi-Locator Strategy (confidence scoring)
// 4. Self-healing Playwright locators
// ─────────────────────────────────────────────────────────────────────────────

const SEMANTIC_DOM = `
<!DOCTYPE html><html><head><title>Semantic AST Lab</title></head><body>

<!-- Group 1: form semantic context -->
<form id="login-form" aria-label="Login Form">
  <input id="email" type="email" name="email" placeholder="your@email.com">
  <input id="password" type="password" name="password" aria-describedby="pw-help">
  <span id="pw-help">Must be 8+ characters</span>
  <button id="signin" data-testid="signin-btn" type="submit">Sign In</button>
</form>

<!-- Group 2: fieldset semantic context -->
<fieldset id="prefs-fieldset">
  <legend>Notification Preferences</legend>
  <label for="notify-email">Email</label>
  <input id="notify-email" type="checkbox" name="notify-email">
  <label for="notify-sms">SMS</label>
  <input id="notify-sms" type="checkbox" name="notify-sms">
</fieldset>

<!-- Group 3: dialog semantic context -->
<div role="dialog" aria-label="Delete Account" id="del-dialog">
  <p>Are you sure?</p>
  <button id="confirm-del" data-testid="confirm-delete">Delete</button>
  <button id="cancel-del" id="cancel-delete">Cancel</button>
</div>

<!-- Group 4: label-for relation outside form -->
<div class="newsletter">
  <label for="nl-email" id="nl-label">Subscribe</label>
  <input id="nl-email" type="email" name="nl-email" placeholder="Enter email">
  <button id="nl-submit" type="submit">Subscribe</button>
</div>

<!-- Group 5: aria-labelledby -->
<div id="search-region">
  <h3 id="search-title">Search Users</h3>
  <input type="search" aria-labelledby="search-title" id="search-input" name="q">
  <button id="search-btn">Go</button>
</div>

<!-- Group 6: plain button with no stable attrs (low confidence) -->
<button id="123456">Plain</button>

<!-- Group 7: input with no id, name + placeholder fallbacks -->
<input name="fallback-email" placeholder="Fallback email" type="email">

</body></html>
`;

const TRAPS = [
  // ── Semantic Grouping ──
  {
    n: "1. Email input inside form gets semanticContext 'Login Form'",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'email');
      return node !== undefined && node.semanticContext?.label === 'Login Form';
    },
  },
  {
    n: "2. Sign In button inside form gets groupId derived from form aria-label",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'signin');
      return node !== undefined && node.groupId?.includes('Login-Form');
    },
  },
  {
    n: "3. Fieldset checkbox gets semanticContext from legend",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'notify-email');
      return node !== undefined && node.semanticContext?.label === 'Notification Preferences';
    },
  },
  {
    n: "4. Dialog button gets semanticContext from aria-label",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'confirm-del');
      return node !== undefined && node.semanticContext?.label === 'Delete Account';
    },
  },
  // ── Relations: label-for ──
  {
    n: "5. Newsletter label has label-for relation to email input",
    assert: (ast: DistilledNode[]) => {
      const label = findNodeById(ast, 'nl-label');
      if (!label) return false;
      const rel = label.relations.find((r) => r.type === 'label-for');
      return rel !== undefined && rel.targetLocator.includes('nl-email');
    },
  },
  // ── Relations: aria-describedby ──
  {
    n: "6. Password input has aria-describedby relation to help text",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'password');
      if (!node) return false;
      const rel = node.relations.find((r) => r.type === 'aria-describedby');
      return rel !== undefined && rel.description.includes('Must be');
    },
  },
  // ── Relations: aria-labelledby ──
  {
    n: "7. Search input has aria-labelledby relation to heading",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'search-input');
      if (!node) return false;
      const rel = node.relations.find((r) => r.type === 'aria-labelledby');
      return rel !== undefined && rel.targetLocator.includes('search-title');
    },
  },
  // ── Relations: spatial-near in same group ──
  {
    n: "8. Sign In button has spatial-near relation to email input (same form)",
    assert: (ast: DistilledNode[]) => {
      const btn = findNodeById(ast, 'signin');
      if (!btn) return false;
      const rel = btn.relations.find((r) => r.type === 'spatial-near');
      return rel !== undefined;
    },
  },
  // ── Multi-Locator Strategy: confidence ──
  {
    n: "9. data-testid locator gets high confidence",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'signin');
      return node !== undefined && node.locatorStrategy.confidence === 'high';
    },
  },
  {
    n: "10. id locator gets medium confidence",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'email');
      return node !== undefined && node.locatorStrategy.confidence === 'medium';
    },
  },
  {
    n: "11. plain button with no stable attrs gets low confidence",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, '123456');
      return node !== undefined && node.locatorStrategy.confidence === 'low';
    },
  },
  // ── Self-healing locator helper ──
  {
    n: "12. high-confidence node with no fallbacks returns simple locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'signin');
      if (!node) return false;
      const code = controlToPlaywrightSelfHealingLocator(node);
      return code === `page.locator('[data-testid="signin-btn"]')`;
    },
  },
  {
    n: "13. medium-confidence node with fallbacks returns .or() chain",
    assert: (ast: DistilledNode[]) => {
      // fallback-email has no id, so name is primary and placeholder is fallback
      const node = findNodeByLocator(ast, 'name=fallback-email');
      if (!node) return false;
      const code = controlToPlaywrightSelfHealingLocator(node);
      return code.includes('.or(') && code.includes('name="fallback-email"');
    },
  },
  // ── Backward compatibility ──
  {
    n: "14. locatorFallback array still populated for backward compatibility",
    assert: (ast: DistilledNode[]) => {
      // fallback-email has name as primary and placeholder as fallback
      const node = findNodeByLocator(ast, 'name=fallback-email');
      return node !== undefined && node.locatorFallback.length > 0;
    },
  },
  {
    n: "15. Every interactable node has a locatorStrategy object",
    assert: (ast: DistilledNode[]) => {
      const walk = (nodes: DistilledNode[]): boolean => {
        for (const n of nodes) {
          if (n.interactable && (!n.locatorStrategy || !n.locatorStrategy.primary)) return false;
          if (!walk(n.children)) return false;
        }
        return true;
      };
      return walk(ast);
    },
  },
  {
    n: "16. Every node has a relations array (may be empty)",
    assert: (ast: DistilledNode[]) => {
      const walk = (nodes: DistilledNode[]): boolean => {
        for (const n of nodes) {
          if (!Array.isArray(n.relations)) return false;
          if (!walk(n.children)) return false;
        }
        return true;
      };
      return walk(ast);
    },
  },
];

describe('Semantic AST Lab', () => {
  it('should pass all v2 semantic AST traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'Semantic AST Lab',
      SEMANTIC_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 SEMANTIC AST FLAWLESS — v2 extraction engine is airtight!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} semantic AST trap(s) failed`);
  });
});
