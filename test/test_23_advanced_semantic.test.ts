import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByLocator } from './_helpers';
import type { DistilledNode } from '../src/types';
import { resolveIntent } from '../src/llm/query';

// ─────────────────────────────────────────────────────────────────────────────
// V3 SEMANTIC AST ADVANCED — Structured Context, Aliases, Actions, Intent
//
// Validates:
// 1. Structured Semantic Context (type, intent, fields, submitTarget)
// 2. Alias generation from labels/names/placeholders
// 3. SuggestedActions for forms (fill + click)
// 4. resolveIntent() Node.js helper
// 5. MutationObserver caching (0-latency second call)
// ─────────────────────────────────────────────────────────────────────────────

const ADVANCED_DOM = `
<!DOCTYPE html><html><head><title>Advanced Semantic AST</title></head><body>

<!-- Group 1: structured login form -->
<form aria-label="User Login" id="login-form">
  <label for="login-email">Email Address</label>
  <input id="login-email" type="email" name="email" placeholder="you@example.com">
  <label for="login-password">Password</label>
  <input id="login-password" type="password" name="password">
  <button id="login-submit" data-testid="login-btn" type="submit">Sign In</button>
</form>

<!-- Group 2: search form with intent inference -->
<form id="search-form">
  <legend>Search Products</legend>
  <input id="search-q" type="search" name="q" placeholder="Search...">
  <button id="search-go" type="submit">Search</button>
</form>

<!-- Group 3: dialog with confirm/cancel -->
<div role="dialog" aria-label="Delete Item" id="del-dialog">
  <p>Are you sure?</p>
  <button id="del-yes" data-testid="confirm-delete">Yes, Delete</button>
  <button id="del-no">Cancel</button>
</div>

<!-- Group 4: input with only placeholder (alias source) -->
<input id="coupon" type="text" placeholder="Enter coupon code" name="coupon">

<!-- Group 5: button with text alias -->
<button id="help-btn">Get Help</button>

</body></html>
`;

const TRAPS = [
  // ── Structured Semantic Context ──
  {
    n: "1. Form semanticContext has type 'form'",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'login-email');
      return node?.semanticContext?.type === 'form';
    },
  },
  {
    n: "2. Login form semanticContext has intent 'login'",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'login-email');
      return node?.semanticContext?.intent === 'login';
    },
  },
  {
    n: "3. Login form semanticContext.label matches aria-label",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'login-email');
      return node?.semanticContext?.label === 'User Login';
    },
  },
  {
    n: "4. Login form semanticContext.fields includes email and password locators",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'login-email');
      const fields = node?.semanticContext?.fields || [];
      return fields.includes('id=login-email') && fields.includes('id=login-password');
    },
  },
  {
    n: "5. Login form semanticContext.submitTarget points to submit button",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'login-email');
      return node?.semanticContext?.submitTarget === 'data-testid=login-btn';
    },
  },
  {
    n: "6. Search form infers intent 'search' from legend text",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'search-q');
      return node?.semanticContext?.intent === 'search';
    },
  },
  {
    n: "7. Dialog semanticContext has type 'dialog'",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'del-yes');
      return node?.semanticContext?.type === 'dialog';
    },
  },
  // ── Alias Generation ──
  {
    n: "8. Email input gets alias 'emailAddress' from label text",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'login-email');
      return node?.alias === 'emailAddress';
    },
  },
  {
    n: "9. Password input gets alias 'password' from label text",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'login-password');
      return node?.alias === 'password';
    },
  },
  {
    n: "10. Submit button gets alias 'signIn' from text",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'login-submit');
      return node?.alias === 'signIn';
    },
  },
  {
    n: "11. Coupon input gets alias 'coupon' from name (priority over placeholder)",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'coupon');
      return node?.alias === 'coupon';
    },
  },
  {
    n: "12. Help button gets alias 'getHelp' from text",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'help-btn');
      return node?.alias === 'getHelp';
    },
  },
  // ── Suggested Actions ──
  {
    n: "13. Login form root has suggestedActions array",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'login-email');
      return Array.isArray(node?.suggestedActions) && (node?.suggestedActions?.length || 0) > 0;
    },
  },
  {
    n: "14. Login form suggestedActions include fill for emailField",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'login-email');
      const actions = node?.suggestedActions || [];
      return actions.some((a) => a.type === 'fill' && a.targetAlias === 'emailAddress');
    },
  },
  {
    n: "15. Login form suggestedActions include fill for password",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'login-email');
      const actions = node?.suggestedActions || [];
      return actions.some((a) => a.type === 'fill' && a.targetAlias === 'password');
    },
  },
  {
    n: "16. Login form suggestedActions ends with click on signIn",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'login-email');
      const actions = node?.suggestedActions || [];
      const last = actions[actions.length - 1];
      return last?.type === 'click' && last?.targetAlias === 'signIn';
    },
  },
  // ── resolveIntent Node.js helper ──
  {
    n: "17. resolveIntent(ast, 'login') returns nodes inside login form",
    assert: (ast: DistilledNode[]) => {
      const resolved = resolveIntent(ast, 'login');
      return resolved.length >= 3 && resolved.some((n) => n.alias === 'emailAddress');
    },
  },
  {
    n: "18. resolveIntent(ast, 'search') returns search form nodes",
    assert: (ast: DistilledNode[]) => {
      const resolved = resolveIntent(ast, 'search');
      return resolved.some((n) => n.alias === 'searchProducts');
    },
  },
  {
    n: "19. resolveIntent(ast, 'nonexistent') returns empty array",
    assert: (ast: DistilledNode[]) => {
      const resolved = resolveIntent(ast, 'nonexistent');
      return resolved.length === 0;
    },
  },
  // ── MutationObserver caching ──
  {
    n: "20. Second distillPage call is 0-latency (cached AST returned)",
    assert: async (ast: DistilledNode[], page: any) => {
      const t0 = Date.now();
      const ast2 = await page.evaluate(() => (window as any).domDistiller());
      const t1 = Date.now();
      return ast2.length > 0 && t1 - t0 < 100; // cached response < 100ms
    },
  },
];

describe('Advanced Semantic AST v3', () => {
  it('should pass all v3 advanced traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'Advanced Semantic AST v3',
      ADVANCED_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 ADVANCED SEMANTIC AST V3 FLAWLESS — All 5 features rock-solid!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} v3 advanced trap(s) failed`);
  });
});
