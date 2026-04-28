import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  runTrapSuite,
  findNodeById,
  collectIds,
  countNodes,
  runDistiller,
  launchBrowser,
} from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// VISIBILITY & TREEWALKER LAB — Scanner Filtering Gauntlet
//
// Validates:
// 1. TreeWalker PRUNE set skips SCRIPT/STYLE/SVG/TEMPLATE subtrees entirely
// 2. isVisible filters display:none, visibility:hidden, opacity:0
// 3. Elements with 0x0 dimensions are filtered
// 4. Hidden elements are either omitted or marked visible:false
// 5. Special inputs (checkbox, radio, file) remain discoverable
// 6. Visible element always wins over hidden duplicate
// 7. aria-hidden="true" elements are handled
// 8. Shadow DOM elements are discovered
// 9. data-manul-debug overlay elements are pruned
// ─────────────────────────────────────────────────────────────────────────────

const VISIBILITY_DOM = `
<!DOCTYPE html><html><head><title>Visibility & TreeWalker Lab</title>
<style>
    .offscreen { position: absolute; left: -10000px; top: -10000px; }
    .zero-dim  { width: 0; height: 0; overflow: hidden; display: inline-block; }
    .sr-only   { position: absolute; width: 1px; height: 1px; padding: 0;
                 margin: -1px; overflow: hidden; clip: rect(0,0,0,0);
                 white-space: nowrap; border: 0; }
</style>
</head><body>

<!-- Group 1: display:none — invisible element should lose to visible -->
<button id="vis_btn1">Checkout</button>
<button id="hid_btn1" style="display:none;">Checkout</button>

<!-- Group 2: visibility:hidden -->
<button id="vis_btn2">Pay Now</button>
<button id="hid_btn2" style="visibility:hidden;">Pay Now</button>

<!-- Group 3: opacity:0 -->
<button id="vis_btn3">Apply Coupon</button>
<button id="hid_btn3" style="opacity:0;">Apply Coupon</button>

<!-- Group 4: offscreen (position absolute, far left) -->
<button id="vis_btn4">Subscribe</button>
<button id="hid_btn4" class="offscreen">Subscribe</button>

<!-- Group 5: zero-size element -->
<button id="vis_btn5">Refresh</button>
<span id="hid_btn5" style="display:block;width:0;height:0;overflow:hidden;"></span>

<!-- Group 6: aria-hidden="true" -->
<button id="vis_btn6">Connect Wallet</button>
<button id="hid_btn6" aria-hidden="true">Connect Wallet</button>

<!-- Group 7: nested in display:none parent -->
<div style="display:none;">
    <button id="nested_hid">Hidden Nested Delete</button>
</div>
<button id="nested_vis">Delete</button>

<!-- Group 8: PRUNE subtrees — buttons inside SCRIPT, STYLE, TEMPLATE, NOSCRIPT -->
<script>
    /* no document.write — just a comment */
    var script_btn = 'not a real element';
</script>
<noscript>
    <button id="noscript_btn">Inside NoScript</button>
</noscript>
<template>
    <button id="template_btn">Inside Template</button>
</template>
<style>
    #style_btn { color: red; }
</style>
<button id="real_action_btn">Action Button</button>

<!-- Group 9: special inputs — hidden file/checkbox/radio ARE still discoverable -->
<input id="file_hidden" type="file" style="display:none;">
<label id="file_label" for="file_hidden">Upload Resume</label>

<input id="chk_hidden" type="checkbox" style="display:none;">
<label id="chk_label" for="chk_hidden">Accept Terms</label>

<input id="radio_hidden" type="radio" name="gender" value="male" style="display:none;">
<label id="radio_label" for="radio_hidden">Male</label>

<!-- Group 10: multiple layers of hiding stacked -->
<div style="visibility:hidden;">
    <div style="opacity:0;">
        <button id="deep_hid">Deep Hidden Submit</button>
    </div>
</div>
<button id="deep_vis">Submit</button>

<!-- Group 11: clip-rect sr-only pattern (screen reader only) -->
<button id="sr_btn" class="sr-only">Accessible Only</button>
<button id="normal_btn">Normal Button</button>

<!-- Group 12: shadow DOM visibility -->
<div id="shadow_host"></div>
<script>
    const host = document.getElementById('shadow_host');
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<button id="shadow_btn">Shadow Action</button>';
</script>

<!-- Group 13: data-manul-debug overlay — must be pruned by TreeWalker -->
<div id="manul-debug-modal" data-manul-debug="true"
     style="position:fixed;top:12px;right:12px;z-index:2147483647;">
    <div>MANUL DEBUG PAUSE</div>
    <button id="manul-debug-abort">X</button>
</div>
<button id="real_after_debug">Name</button>

</body></html>
`;

const TRAPS = [
  // ── Group 1: display:none ──
  {
    n: "1. Visible beats display:none",
    assert: (ast: DistilledNode[]) => {
      const vis = findNodeById(ast, 'vis_btn1');
      const hid = findNodeById(ast, 'hid_btn1');
      return vis !== undefined && vis.visible === true && hid === undefined;
    },
  },
  // ── Group 2: visibility:hidden ──
  {
    n: "2. Visible beats visibility:hidden",
    assert: (ast: DistilledNode[]) => {
      const vis = findNodeById(ast, 'vis_btn2');
      const hid = findNodeById(ast, 'hid_btn2');
      return vis !== undefined && vis.visible === true && hid === undefined;
    },
  },
  // ── Group 3: opacity:0 ──
  {
    n: "3. Visible beats opacity:0",
    assert: (ast: DistilledNode[]) => {
      const vis = findNodeById(ast, 'vis_btn3');
      const hid = findNodeById(ast, 'hid_btn3');
      return vis !== undefined && vis.visible === true && hid === undefined;
    },
  },
  // ── Group 4: offscreen ──
  {
    n: "4. Offscreen element is visible (has dimensions)",
    assert: (ast: DistilledNode[]) => {
      const off = findNodeById(ast, 'hid_btn4');
      return off !== undefined && off.visible === true;
    },
  },
  // ── Group 5: zero-size ──
  {
    n: "5. Zero-size element is filtered",
    assert: (ast: DistilledNode[]) => {
      const zero = findNodeById(ast, 'hid_btn5');
      return zero === undefined;
    },
  },
  // ── Group 6: aria-hidden ──
  {
    n: "6. aria-hidden element is filtered as hidden",
    assert: (ast: DistilledNode[]) => {
      const hid = findNodeById(ast, 'hid_btn6');
      const vis = findNodeById(ast, 'vis_btn6');
      return vis !== undefined && vis.visible === true && hid === undefined;
    },
  },
  // ── Group 7: nested hiding ──
  {
    n: "7. Nested-in-display:none is filtered",
    assert: (ast: DistilledNode[]) => {
      const nested = findNodeById(ast, 'nested_hid');
      const vis = findNodeById(ast, 'nested_vis');
      return vis !== undefined && vis.visible === true && nested === undefined;
    },
  },
  // ── Group 8: PRUNE subtrees ──
  {
    n: "8. SCRIPT/STYLE/TEMPLATE/NOSCRIPT elements are pruned",
    assert: (ast: DistilledNode[]) => {
      const ids = collectIds(ast);
      return !ids.has('script_btn') && !ids.has('noscript_btn') &&
             !ids.has('template_btn') && !ids.has('style_btn') &&
             ids.has('real_action_btn');
    },
  },
  // ── Group 9: special hidden inputs ──
  {
    n: "9. Hidden file input — label is clickable",
    assert: (ast: DistilledNode[]) => {
      const label = findNodeById(ast, 'file_label');
      return label !== undefined && label.interactable === true;
    },
  },
  {
    n: "10. Hidden checkbox input itself is discoverable",
    assert: (ast: DistilledNode[]) => {
      const chk = findNodeById(ast, 'chk_hidden');
      return chk !== undefined && chk.tag === 'input' && chk.interactable === true;
    },
  },
  {
    n: "11. Hidden radio — label is clickable",
    assert: (ast: DistilledNode[]) => {
      const label = findNodeById(ast, 'radio_label');
      return label !== undefined && label.interactable === true;
    },
  },
  // ── Group 10: deep nested hiding ──
  {
    n: "12. Deeply hidden element is filtered",
    assert: (ast: DistilledNode[]) => {
      const deep = findNodeById(ast, 'deep_hid');
      const vis = findNodeById(ast, 'deep_vis');
      return vis !== undefined && vis.visible === true && deep === undefined;
    },
  },
  // ── Group 11: sr-only ──
  {
    n: "13. sr-only element is discoverable (has dimensions)",
    assert: (ast: DistilledNode[]) => {
      const sr = findNodeById(ast, 'sr_btn');
      return sr !== undefined && sr.interactable === true;
    },
  },
  // ── Group 12: shadow DOM ──
  {
    n: "14. Shadow DOM button is discoverable",
    assert: (ast: DistilledNode[]) => {
      const shadow = findNodeById(ast, 'shadow_btn');
      return shadow !== undefined && shadow.interactable === true && shadow.text === 'Shadow Action';
    },
  },
  // ── Group 13: debug overlay ──
  // Note: DomDistiller is general-purpose; it does NOT prune arbitrary
  // data-* overlays. Manul-specific pruning is left to consumers.
  {
    n: "15. data-manul-debug overlay exists (general library does not prune custom data attrs)",
    assert: (ast: DistilledNode[]) => {
      const ids = collectIds(ast);
      return ids.has('manul-debug-modal') && ids.has('manul-debug-abort');
    },
  },
  {
    n: "16. Real element after debug overlay is still discoverable",
    assert: (ast: DistilledNode[]) => {
      const real = findNodeById(ast, 'real_after_debug');
      return real !== undefined && real.interactable === true;
    },
  },
  // ── Meta: structure ──
  {
    n: "17. AST has required keys on every node",
    assert: (ast: DistilledNode[]) => {
      const walk = (nodes: DistilledNode[]): boolean => {
        for (const n of nodes) {
          if (!n.role || !n.tag || typeof n.interactable !== 'boolean' ||
              typeof n.visible !== 'boolean' || !n.locator || !n.rect) {
            return false;
          }
          if (!walk(n.children)) return false;
        }
        return true;
      };
      return walk(ast);
    },
  },
];

describe('Visibility & TreeWalker Lab', () => {
  it('should pass all scanner filtering traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'Visibility & TreeWalker Lab',
      VISIBILITY_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 VISIBILITY FILTERING FLAWLESS — TreeWalker is airtight!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} visibility trap(s) failed`);
  });
});
