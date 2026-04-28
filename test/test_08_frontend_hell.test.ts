import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByText } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// FRONTEND HELL LAB — Anti-Pattern & Edge-Case Gauntlet
//
// Validates extraction on extreme frontend anti-patterns:
// - Split text nodes across child elements
// - Hidden decoys (display:none, opacity:0, visibility:hidden, offscreen)
// - SVG-only buttons
// - Uppercase CSS transforms
// - Whitespace/normalization in placeholders
// - Partial text matches ("Update Profile Info" vs "Update Profile")
// - Custom elements
// ─────────────────────────────────────────────────────────────────────────────

const HELL_DOM = `
<!DOCTYPE html><html><head><title>Frontend Hell</title>
<style>
    .hidden-offscreen { position: absolute; left: -9999px; }
    .uppercase { text-transform: uppercase; }
    .zero-size { width: 0; height: 0; overflow: hidden; display: inline-block; }
</style>
</head><body>

<div role="button" id="t1"><span>Con</span><b>firm</b> <i>Action</i></div>

<button id="fake2" style="display:none;">Settings</button>
<button id="t2" style="display:block;">Settings</button>

<button id="t3" aria-label="Notifications"><svg><path d="M10..."></path></svg></button>

<div class="form-group">
    <div class="label-text">Delivery Address</div>
    <input type="text" id="t4">
</div>

<button id="t5" class="uppercase">proceed</button>

<input id="t6" placeholder="Promo Code">

<input id="t7" aria-label="Credit Card Number">

<input type="submit" id="t8" value="Pay Now">

<div id="t9" role="button" tabindex="0">
    <div><span><em>Finalize Order</em></span></div>
</div>

<label for="t10">Agree to Terms</label>
<input type="checkbox" id="t10">

<div id="t11" title="Download Invoice">PDF</div>

<input id="t12" placeholder="  First   Name  ">

<button id="fake13">Update Profile Info</button>
<button id="t13">Update Profile</button>

<button id="fake14" style="opacity: 0;">Logout</button>
<button id="t14" style="opacity: 1;">Logout</button>

<button id="fake15" style="visibility: hidden;">Delete Account</button>
<button id="t15" style="visibility: visible;">Delete Account</button>

<button id="t16"><svg></svg> Search Items</button>

<button id="t17">Upload<br>Avatar</button>

<p>Please enter your <b>Date of Birth</b> below:</p>
<input id="t18" type="date">

<div id="t19" role="textbox" contenteditable="true" aria-label="Biography"></div>

<button id="fake20" class="hidden-offscreen">Subscribe</button>
<button id="t20">Subscribe</button>

<button id="fake21" aria-hidden="true">Connect Wallet</button>
<button id="t21" aria-hidden="false">Connect Wallet</button>

<input id="t22" name="security_pin" type="password">

<a href="/checkout" id="t23" class="btn-primary">Go to Checkout</a>

<button id="fake24" class="zero-size">Refresh Page</button>
<button id="t24">Refresh Page</button>

<img src="scan.png" alt="Scan QR Code" id="t25" onclick="scan()">

<span id="lbl26">Secret Token</span>
<input id="t26" aria-labelledby="lbl26">

<div role="menuitem" id="t27">Dark Theme</div>

<button id="t28">  Send   Message  </button>

<input id="fake29" placeholder="Phone Number (Optional)">
<input id="t29" placeholder="Phone Number">

<custom-btn id="t30">Launch Rocket</custom-btn>

</body></html>
`;

const TRAPS = [
  { n: "1. Split-text role=button has merged text",       assert: (ast: DistilledNode[]) => findNodeById(ast, 't1')?.text === 'Confirm Action' },
  { n: "2. Hidden Settings decoy is filtered",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'fake2') === undefined },
  { n: "3. Visible Settings button is interactable",     assert: (ast: DistilledNode[]) => findNodeById(ast, 't2')?.interactable === true },
  { n: "4. SVG-only button text uses aria-label",       assert: (ast: DistilledNode[]) => findNodeById(ast, 't3')?.text === 'Notifications' },
  { n: "5. Delivery Address input is editable",          assert: (ast: DistilledNode[]) => findNodeById(ast, 't4')?.editable === true },
  { n: "6. Uppercase CSS button text uppercase",         assert: (ast: DistilledNode[]) => findNodeById(ast, 't5')?.text === 'PROCEED' },
  { n: "7. Promo Code input is editable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 't6')?.editable === true },
  { n: "8. Credit Card input text uses aria-label",      assert: (ast: DistilledNode[]) => findNodeById(ast, 't7')?.text === 'Credit Card Number' },
  { n: "9. Pay Now submit button is interactable",       assert: (ast: DistilledNode[]) => findNodeById(ast, 't8')?.interactable === true },
  { n: "10. Deeply nested Finalize Order button found",  assert: (ast: DistilledNode[]) => findNodeById(ast, 't9')?.text === 'Finalize Order' },
  { n: "11. Checkbox is interactable",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 't10')?.interactable === true },
  { n: "12. Title attribute button has title locator",   assert: (ast: DistilledNode[]) => findNodeById(ast, 't11')?.attributes.title === 'Download Invoice' },
  { n: "13. Whitespace placeholder trimmed",             assert: (ast: DistilledNode[]) => findNodeById(ast, 't12')?.attributes.placeholder === 'First   Name' },
  { n: "14. Partial text decoy exists",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'fake13')?.text === 'Update Profile Info' },
  { n: "15. Exact text match exists",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 't13')?.text === 'Update Profile' },
  { n: "16. Opacity-0 decoy filtered",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'fake14') === undefined },
  { n: "17. Visible Logout button found",                assert: (ast: DistilledNode[]) => findNodeById(ast, 't14')?.interactable === true },
  { n: "18. Visibility-hidden decoy filtered",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'fake15') === undefined },
  { n: "19. SVG + text button found",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 't16')?.text === 'Search Items' },
  { n: "20. BR inside button text normalized",           assert: (ast: DistilledNode[]) => findNodeById(ast, 't17')?.text === 'Upload Avatar' },
  { n: "21. Date input is editable",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 't18')?.editable === true },
  { n: "22. Contenteditable div is editable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 't19')?.editable === true },
  { n: "23. Offscreen decoy exists",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'fake20')?.text === 'Subscribe' },
  { n: "24. aria-hidden=true decoy exists",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'fake21') === undefined },
  { n: "25. Password input is editable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 't22')?.editable === true },
  { n: "26. Checkout link has href",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 't23')?.attributes.href === '/checkout' },
  { n: "27. Zero-size decoy exists",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'fake24')?.text === 'Refresh Page' },
  { n: "28. Image with onclick is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 't25')?.interactable === true },
  { n: "29. aria-labelledby input uses label text",      assert: (ast: DistilledNode[]) => findNodeById(ast, 't26')?.text === 'Secret Token' },
  { n: "30. Menuitem role is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 't27')?.interactable === true },
  { n: "31. Whitespace in button text normalized",       assert: (ast: DistilledNode[]) => findNodeById(ast, 't28')?.text === 'Send Message' },
  { n: "32. Optional placeholder decoy not primary",     assert: (ast: DistilledNode[]) => {
    const opt = findNodeById(ast, 'fake29');
    const real = findNodeById(ast, 't29');
    return opt !== undefined && real !== undefined && opt.locator !== real.locator;
  }},
  { n: "33. Custom element is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 't30')?.interactable === true },
];

describe('Frontend Hell Lab', () => {
  it('should pass all frontend anti-pattern traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'Frontend Hell Lab',
      HELL_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 FRONTEND HELL FLAWLESS — Anti-patterns crushed!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} frontend hell trap(s) failed`);
  });
});
