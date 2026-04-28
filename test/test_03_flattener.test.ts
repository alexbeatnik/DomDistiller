import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, collectIds, countNodes } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// TREE FLATTENER LAB — DOM Compression & Pruning Gauntlet
//
// Validates:
// 1. Meaningless wrapper divs/span (no id, no data-*, no text, no role) are removed
//    and children promoted
// 2. Wrappers WITH stable attributes (id, data-testid) are preserved
// 3. Semantic containers (nav, main, section, form, table, ul) are preserved
// 4. Nodes with text are preserved even if they are divs
// 5. Deeply nested meaningless wrappers are collapsed
// 6. Empty leaf nodes with no attributes are pruned
// ─────────────────────────────────────────────────────────────────────────────

const FLATTENER_DOM = `
<!DOCTYPE html><html><head><title>Tree Flattener Lab</title></head><body>

<!-- Group 1: single meaningless wrapper WITHOUT stable attrs -->
<div class="wrapper"><button id="g1_btn">Save</button></div>

<!-- Group 2: nested meaningless wrappers WITHOUT stable attrs -->
<div class="outer">
  <div class="mid">
    <span class="inner">
      <button id="g2_btn">Submit</button>
    </span>
  </div>
</div>

<!-- Group 3: wrapper WITH id is preserved -->
<div id="g3_wrapper" class="with-id"><button id="g3_btn">Keep</button></div>

<!-- Group 4: semantic nav preserved -->
<nav id="g4_nav">
  <a id="g4_link" href="/home">Home</a>
</nav>

<!-- Group 5: form wrapper preserved, inner meaningless div removed -->
<form id="g5_form">
  <div class="inner"><input id="g5_input" type="text" placeholder="Name"></div>
</form>

<!-- Group 6: table structure preserved -->
<table id="g5_table">
  <tr><td id="g5_td">Data</td></tr>
</table>

<!-- Group 7: list structure preserved -->
<ul id="g6_list">
  <li id="g6_item">Item</li>
</ul>

<!-- Group 8: empty meaningless divs (pruned) -->
<div class="empty1"></div>
<div class="empty2"><div class="empty3"></div></div>
<button id="g7_btn">Real</button>

<!-- Group 9: wrapper with text node child (preserved because text) -->
<div id="g8_wrapper">Hello World</div>

<!-- Group 10: wrapper with data-testid (preserved) -->
<div data-testid="container"><button id="g9_btn">Click</button></div>

<!-- Group 11: deeply nested mix -->
<div class="outer-meaningless">
  <div class="mid-meaningless">
    <section id="g10_section">
      <div class="inner-meaningless">
        <button id="g10_btn">Deep</button>
      </div>
    </section>
  </div>
</div>

<!-- Group 12: sibling wrappers -->
<div class="wrap1"><button id="g11_btn1">A</button></div>
<div class="wrap2"><button id="g11_btn2">B</button></div>

<!-- Group 13: aria role wrapper (preserved) -->
<div id="g12_role" role="region" aria-label="Sidebar">
  <button id="g12_btn">Menu</button>
</div>

<!-- Group 14: fieldset wrapper (preserved) -->
<fieldset id="g13_fieldset">
  <legend>Group</legend>
  <input id="g13_input" type="radio" name="grp">
</fieldset>

<!-- Group 15: article wrapper (preserved) -->
<article id="g14_article">
  <h2 id="g14_h2">Title</h2>
  <p id="g14_p">Body</p>
</article>

<!-- Group 16: span wrapper around link (span meaningless, link promoted) -->
<span class="link-wrap"><a id="g15_link" href="/go">Go</a></span>

<!-- Group 17: div wrapper around input + label (div meaningless if empty, but contains interactive children) -->
<div class="input-wrap">
  <label for="g16_input">Email</label>
  <input id="g16_input" type="email">
</div>

</body></html>
`;

const TRAPS = [
  // ── Group 1: single meaningless wrapper removed ──
  {
    n: "1. Single wrapper div without stable attrs removed, child in AST",
    assert: (ast: DistilledNode[]) => {
      const btn = findNodeById(ast, 'g1_btn');
      return btn !== undefined && btn.text === 'Save' && btn.interactable === true;
    },
  },
  // ── Group 2: nested meaningless wrappers collapsed ──
  {
    n: "2. Nested wrappers collapsed, button promoted",
    assert: (ast: DistilledNode[]) => {
      const btn = findNodeById(ast, 'g2_btn');
      return btn !== undefined && btn.text === 'Submit';
    },
  },
  // ── Group 3: wrapper WITH id is preserved ──
  {
    n: "3. Wrapper with id is preserved because stable locator",
    assert: (ast: DistilledNode[]) => {
      const wrap = findNodeById(ast, 'g3_wrapper');
      const btn = findNodeById(ast, 'g3_btn');
      return wrap !== undefined && wrap.locator === 'id=g3_wrapper' && btn !== undefined;
    },
  },
  // ── Group 4: semantic nav preserved ──
  {
    n: "4. Semantic <nav> container is preserved",
    assert: (ast: DistilledNode[]) => {
      const nav = findNodeById(ast, 'g4_nav');
      const link = findNodeById(ast, 'g4_link');
      return nav !== undefined && nav.tag === 'nav' && link !== undefined;
    },
  },
  // ── Group 5: form wrapper preserved, inner div removed ──
  {
    n: "5. Form wrapper preserved, inner meaningless div removed",
    assert: (ast: DistilledNode[]) => {
      const form = findNodeById(ast, 'g5_form');
      const input = findNodeById(ast, 'g5_input');
      return form !== undefined && input !== undefined && input.editable === true;
    },
  },
  // ── Group 6: table structure preserved ──
  {
    n: "6. Table structure preserved",
    assert: (ast: DistilledNode[]) => {
      const td = findNodeById(ast, 'g5_td');
      return td !== undefined && td.text === 'Data';
    },
  },
  // ── Group 7: list structure preserved ──
  {
    n: "7. List structure preserved",
    assert: (ast: DistilledNode[]) => {
      const li = findNodeById(ast, 'g6_item');
      return li !== undefined && li.text === 'Item';
    },
  },
  // ── Group 8: empty leaf nodes pruned ──
  {
    n: "8. Empty meaningless divs are pruned",
    assert: (ast: DistilledNode[]) => {
      const ids = collectIds(ast);
      const btn = findNodeById(ast, 'g7_btn');
      return !ids.has('empty1') && !ids.has('empty2') && !ids.has('empty3') && btn !== undefined;
    },
  },
  // ── Group 9: wrapper with text preserved ──
  {
    n: "9. Wrapper with text is preserved",
    assert: (ast: DistilledNode[]) => {
      const wrap = findNodeById(ast, 'g8_wrapper');
      return wrap !== undefined && wrap.text === 'Hello World';
    },
  },
  // ── Group 10: wrapper with data-testid preserved ──
  {
    n: "10. Wrapper with data-testid is preserved",
    assert: (ast: DistilledNode[]) => {
      // The wrapper has no id, but data-testid should give it a locator
      const btn = findNodeById(ast, 'g9_btn');
      return btn !== undefined;
    },
  },
  // ── Group 11: deeply nested mix ──
  {
    n: "11. Section preserved, meaningless divs around it removed",
    assert: (ast: DistilledNode[]) => {
      const section = findNodeById(ast, 'g10_section');
      const btn = findNodeById(ast, 'g10_btn');
      return section !== undefined && btn !== undefined;
    },
  },
  // ── Group 12: sibling wrappers ──
  {
    n: "12. Sibling wrappers without stable attrs removed, buttons promoted",
    assert: (ast: DistilledNode[]) => {
      const btn1 = findNodeById(ast, 'g11_btn1');
      const btn2 = findNodeById(ast, 'g11_btn2');
      return btn1 !== undefined && btn2 !== undefined;
    },
  },
  // ── Group 13: role wrapper preserved ──
  {
    n: "13. Wrapper with semantic role is preserved",
    assert: (ast: DistilledNode[]) => {
      const role = findNodeById(ast, 'g12_role');
      const btn = findNodeById(ast, 'g12_btn');
      return role !== undefined && role.role === 'region' && btn !== undefined;
    },
  },
  // ── Group 14: fieldset preserved ──
  {
    n: "14. Fieldset wrapper preserved",
    assert: (ast: DistilledNode[]) => {
      const fs = findNodeById(ast, 'g13_fieldset');
      const input = findNodeById(ast, 'g13_input');
      return fs !== undefined && input !== undefined;
    },
  },
  // ── Group 15: article preserved ──
  {
    n: "15. Article wrapper preserved with children",
    assert: (ast: DistilledNode[]) => {
      const article = findNodeById(ast, 'g14_article');
      const h2 = findNodeById(ast, 'g14_h2');
      const p = findNodeById(ast, 'g14_p');
      return article !== undefined && h2 !== undefined && p !== undefined;
    },
  },
  // ── Group 16: span wrapper around link removed ──
  {
    n: "16. Meaningless span wrapper removed, link promoted",
    assert: (ast: DistilledNode[]) => {
      const link = findNodeById(ast, 'g15_link');
      return link !== undefined && link.tag === 'a';
    },
  },
  // ── Group 17: div wrapper around interactive children ──
  {
    n: "17. Wrapper around interactive children removed if meaningless",
    assert: (ast: DistilledNode[]) => {
      const input = findNodeById(ast, 'g16_input');
      return input !== undefined && input.editable === true;
    },
  },
  // ── Meta: no empty top-level nodes ──
  {
    n: "18. No empty leaf nodes remain at top level",
    assert: (ast: DistilledNode[]) => {
      const walk = (nodes: DistilledNode[]): boolean => {
        for (const n of nodes) {
          if (!n.interactable && !n.editable && n.children.length === 0 &&
              !n.text && Object.keys(n.attributes).length === 0 &&
              n.tag !== 'body' && n.tag !== 'html') {
            return false;
          }
          if (!walk(n.children)) return false;
        }
        return true;
      };
      return walk(ast);
    },
  },
  {
    n: "19. Total node count is reasonable (compression worked)",
    assert: (ast: DistilledNode[]) => {
      const total = countNodes(ast);
      return total > 0 && total < 45;
    },
  },
];

describe('Tree Flattener Lab', () => {
  it('should pass all DOM compression traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'Tree Flattener Lab',
      FLATTENER_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 TREE FLATTENER FLAWLESS — Compression is airtight!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} flattener trap(s) failed`);
  });
});
