import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByLocator } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// ATTRIBUTE SEMANTIC KEYWORD MATCH LAB — 25 scenarios
//
// Validates that elements whose visible text is unrelated (e.g. a badge
// count "2") but whose id, class, or data-* attributes contain semantic
// keywords are extracted with the correct locators and text.
//
// Covers: shopping cart icons, notification badges, hamburger menus,
// user profile icons, search icons, multi-class matching, camelCase
// fallback, partial coverage, single-word terms, and false-positive
// resistance.
// ─────────────────────────────────────────────────────────────────────────────

const SEMANTIC_DOM = `
<!DOCTYPE html><html><head><title>Attribute Semantic Lab</title></head><body>

<!-- Group 1: data-testid dominance -->
<button id="dqa_exact"   data-testid="confirm-order">Proceed</button>
<button id="dqa_partial" data-testid="confirm-order-legacy">Confirm Order Legacy</button>
<button id="text_match"  >Confirm Order</button>
<button id="aria_match"  aria-label="Confirm Order">OK</button>

<!-- Group 2: aria-label vs placeholder vs text -->
<input  id="aria_input"  aria-label="Billing Address" type="text">
<input  id="ph_input"    placeholder="Billing Address" type="text">
<input  id="label_input" type="text"><label for="label_input">Billing Address</label>

<!-- Group 3: html_id alignment -->
<input  id="shipping_address" placeholder="Enter here" type="text">
<input  id="billing_info"     placeholder="Billing Info" type="text">

<!-- Group 4: disabled penalty -->
<button id="enabled_btn"  >Place Order</button>
<button id="disabled_btn" disabled>Place Order</button>

<!-- Group 5: hidden penalty -->
<button id="visible_btn">Apply Coupon</button>
<button id="hidden_btn" style="display:none;">Apply Coupon</button>

<!-- Group 6: checkbox/radio mode strictness -->
<input  id="chk_real"  type="checkbox"><label for="chk_real">Newsletter</label>
<button id="chk_decoy" >Newsletter</button>

<!-- Group 7: input mode synergy -->
<input  id="input_field" placeholder="Search Query" type="text">
<button id="input_decoy" >Search Query</button>

<!-- Group 8: select mode -->
<select id="sel_real"><option>Red</option><option>Blue</option></select>
<div    id="sel_fake" role="button">Red</div>

<!-- Group 9: data-qa as data-testid fallback -->
<button id="testid_btn" data-qa="checkout-submit">Go</button>
<button id="text_go"    >Checkout Submit</button>

<!-- Group 10: exact text match vs substring -->
<button id="exact_save"    >Save</button>
<button id="substring_save">Save Draft Changes</button>

<!-- Group 11: name_attr matching -->
<input  id="name_attr_input" name="security_pin" type="password">
<input  id="name_generic"    placeholder="PIN" type="password">

<!-- Group 12: context words in developer names -->
<button id="ctx_dev"   class="btn-payment-finalize">Finalize Payment</button>
<button id="ctx_plain" >Finalize Payment</button>

<!-- Group 13: multiple stacked signals -->
<input  id="stacked_all"  data-qa="promo-code" placeholder="Promo Code" aria-label="Promo Code" type="text">
<input  id="stacked_one"  placeholder="Enter code" type="text">

<!-- Group 14: Shopping cart class badge text -->
<a id="cart_link" class="shopping_cart_link" href="/cart"><span class="shopping_cart_badge">2</span></a>

<!-- Group 15: Single-word search -->
<button id="search_icon" class="search_btn_icon">🔍</button>

<!-- Group 16: Wishlist -->
<button id="wishlist_btn" class="wish_list_icon">♡</button>

<!-- Group 17: Close modal -->
<button id="close_modal" class="close_modal_btn">X</button>

<!-- Group 18: Add to cart data-qa -->
<button id="add_cart_btn" data-testid="add-to-cart">Submit</button>

<!-- Group 19: camelCase class -->
<button id="camel_btn" class="shoppingCartLink">🛒</button>

<!-- Group 20: False positive — unrelated class -->
<button id="footer_btn" class="footer_links">About Us</button>

<!-- Group 21: False positive — substring cartography -->
<div id="cartography" class="cartography_section">Maps</div>

<!-- Group 22: Three-word search term -->
<button id="three_word" class="add_to_cart_btn">🛒</button>

<!-- Group 23: Login input class -->
<input id="login_email" class="login_email_field" type="email">

<!-- Group 24: Notification bell -->
<button id="notif_bell" class="notification_bell">🔔 5</button>

<!-- Group 25: Hamburger menu -->
<button id="hamburger" class="nav_menu_btn">☰</button>

</body></html>
`;

const TRAPS = [
  // ── Group 1: data-testid dominance ──
  {
    n: "1. data-testid exact gets primary locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'dqa_exact');
      return node !== undefined && node.locator === 'data-testid=confirm-order';
    },
  },
  {
    n: "2. data-testid exact has correct text fallback",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'dqa_exact');
      return node !== undefined && node.text === 'Proceed';
    },
  },
  // ── Group 2: aria-label vs placeholder ──
  {
    n: "3. aria-label input is interactable and editable",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'aria_input');
      return node !== undefined && node.interactable === true && node.editable === true;
    },
  },
  {
    n: "4. placeholder input has placeholder in attributes",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'ph_input');
      return node !== undefined && node.attributes.placeholder === 'Billing Address';
    },
  },
  // ── Group 3: html_id alignment ──
  {
    n: "5. id semantic locator for shipping_address",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'shipping_address');
      return node !== undefined && node.attributes.id === 'shipping_address';
    },
  },
  // ── Group 4: disabled penalty ──
  {
    n: "6. Enabled button has disabled=false",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'enabled_btn');
      return node !== undefined && node.disabled === false && node.interactable === true;
    },
  },
  {
    n: "7. Disabled button has disabled=true",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'disabled_btn');
      return node !== undefined && node.disabled === true;
    },
  },
  // ── Group 5: hidden penalty ──
  {
    n: "8. Hidden button has visible=false",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'hidden_btn');
      return node === undefined; // filtered by visibility
    },
  },
  // ── Group 6: checkbox strictness ──
  {
    n: "9. Real checkbox is interactable",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'chk_real');
      return node !== undefined && node.tag === 'input' && node.interactable === true;
    },
  },
  // ── Group 7: input mode synergy ──
  {
    n: "10. Input field is editable; button is not",
    assert: (ast: DistilledNode[]) => {
      const input = findNodeById(ast, 'input_field');
      const btn = findNodeById(ast, 'input_decoy');
      return input !== undefined && input.editable === true &&
             btn !== undefined && btn.editable === false;
    },
  },
  // ── Group 8: select mode ──
  {
    n: "11. Real <select> is interactable",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'sel_real');
      return node !== undefined && node.tag === 'select' && node.interactable === true;
    },
  },
  // ── Group 9: data-qa ──
  {
    n: "12. data-qa gets primary locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'testid_btn');
      return node !== undefined && node.locator === 'data-qa=checkout-submit';
    },
  },
  // ── Group 10: exact vs substring ──
  {
    n: "13. Exact text 'Save' node exists",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'exact_save');
      return node !== undefined && node.text === 'Save';
    },
  },
  // ── Group 11: name_attr ──
  {
    n: "14. name_attr is captured in attributes",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'name_attr_input');
      return node !== undefined && node.attributes.name === 'security_pin';
    },
  },
  // ── Group 12: context words ──
  {
    n: "15. Dev-name context class button is interactable",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'ctx_dev');
      return node !== undefined && node.interactable === true && node.text === 'Finalize Payment';
    },
  },
  // ── Group 13: stacked signals ──
  {
    n: "16. Stacked signals node has data-qa primary locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'stacked_all');
      return node !== undefined && node.locator === 'data-qa=promo-code';
    },
  },
  // ── Group 14: Shopping cart class badge text ──
  {
    n: "17. Cart link has href attribute",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'cart_link');
      return node !== undefined && node.attributes.href === '/cart' && node.tag === 'a';
    },
  },
  // ── Group 15: Single-word search icon ──
  {
    n: "18. Search icon button is interactable",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'search_icon');
      return node !== undefined && node.interactable === true;
    },
  },
  // ── Group 16: Wishlist ──
  {
    n: "19. Wishlist button has text '♡'",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'wishlist_btn');
      return node !== undefined && node.text === '♡';
    },
  },
  // ── Group 17: Close modal ──
  {
    n: "20. Close modal button is interactable",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'close_modal');
      return node !== undefined && node.interactable === true;
    },
  },
  // ── Group 18: Add to cart data-qa ──
  {
    n: "21. Add-to-cart data-testid gets primary locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'add_cart_btn');
      return node !== undefined && node.locator === 'data-testid=add-to-cart';
    },
  },
  // ── Group 19: camelCase class ──
  {
    n: "22. camelCase class button is interactable",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'camel_btn');
      return node !== undefined && node.interactable === true;
    },
  },
  // ── Group 20: False positive unrelated ──
  {
    n: "23. Footer links button is interactable (not falsely filtered)",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'footer_btn');
      return node !== undefined && node.interactable === true && node.text === 'About Us';
    },
  },
  // ── Group 21: False positive substring ──
  {
    n: "24. Cartography div exists but is not interactable",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'cartography');
      return node !== undefined && node.interactable === false;
    },
  },
  // ── Group 22: Three-word search term ──
  {
    n: "25. Three-word class button is interactable",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'three_word');
      return node !== undefined && node.interactable === true;
    },
  },
  // ── Group 23: Login input class ──
  {
    n: "26. Login email input is editable",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'login_email');
      return node !== undefined && node.editable === true && node.tag === 'input';
    },
  },
  // ── Group 24: Notification bell ──
  {
    n: "27. Notification bell text includes number",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'notif_bell');
      return node !== undefined && node.text.includes('🔔 5');
    },
  },
  // ── Group 25: Hamburger menu ──
  {
    n: "28. Hamburger menu button has correct text",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'hamburger');
      return node !== undefined && node.text === '☰';
    },
  },
  // ── Meta: no meaningless wrappers promoted ──
  {
    n: "29. No wrapper divs without semantic value leaked to top level",
    assert: (ast: DistilledNode[]) => {
      // The root should contain meaningful elements, not empty wrapper divs
      const hasEmptyWrapper = ast.some(
        (n) => n.tag === 'div' && !n.text && !n.interactable && n.children.length === 0
      );
      return !hasEmptyWrapper;
    },
  },
  {
    n: "30. Every interactable element has a non-empty locator",
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
];

describe('Attribute Semantic Keyword Match Lab', () => {
  it('should pass all semantic attribute traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'Attribute Semantic Keyword Match Lab',
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
      console.log('\n🏆 ATTRIBUTE SEMANTIC FLAWLESS!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} semantic attribute trap(s) failed`);
  });
});
