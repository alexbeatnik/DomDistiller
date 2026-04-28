import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByText } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// COMPLEX LAYOUTS LAB — Grid, Flex, Sticky, Fixed, Sidebar, Split panes
// ─────────────────────────────────────────────────────────────────────────────

const LAYOUTS_DOM = `
<!DOCTYPE html>
<html lang="en">
<head><title>Layouts</title>
<style>
  .sticky-header { position: sticky; top: 0; }
  .fixed-footer { position: fixed; bottom: 0; left: 0; right: 0; }
  .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 200px; }
  .offcanvas { position: fixed; left: -300px; top: 0; bottom: 0; width: 300px; }
  .modal-fixed { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .popover { position: absolute; top: 20px; left: 20px; }
  .sr-only { position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden; }
</style>
</head>
<body>
<header class="sticky-header" id="sticky-h">
  <a href="/" id="sticky-logo">Logo</a>
  <nav>
    <a href="/a" id="sticky-a">A</a>
    <a href="/b" id="sticky-b">B</a>
  </nav>
  <button id="sticky-menu">Menu</button>
</header>

<aside class="sidebar" id="sidebar-fixed">
  <h3>Sidebar</h3>
  <a href="/s1" id="side-link-1">Link 1</a>
  <a href="/s2" id="side-link-2">Link 2</a>
  <a href="/s3" id="side-link-3">Link 3</a>
  <button id="side-action">Action</button>
</aside>

<main id="main-area">
  <section id="grid-section">
    <div class="grid-container">
      <div class="grid-item" id="grid-1">Grid 1</div>
      <div class="grid-item" id="grid-2">Grid 2</div>
      <div class="grid-item" id="grid-3">Grid 3</div>
      <div class="grid-item" id="grid-4">Grid 4</div>
    </div>
  </section>

  <section id="flex-section">
    <div class="flex-container">
      <div class="flex-item" id="flex-1">Flex 1</div>
      <div class="flex-item" id="flex-2">Flex 2</div>
      <div class="flex-item" id="flex-3">Flex 3</div>
    </div>
  </section>

  <section id="split-pane">
    <div class="pane" id="pane-left">
      <h3>Left Pane</h3>
      <input type="text" id="pane-left-input">
      <button id="pane-left-btn">Left Action</button>
    </div>
    <div class="pane" id="pane-right">
      <h3>Right Pane</h3>
      <input type="text" id="pane-right-input">
      <button id="pane-right-btn">Right Action</button>
    </div>
  </section>

  <section id="card-layout">
    <article class="card" id="card-1">
      <h4>Card 1</h4>
      <p>Card content 1</p>
      <button id="card-btn-1">Card Action 1</button>
    </article>
    <article class="card" id="card-2">
      <h4>Card 2</h4>
      <p>Card content 2</p>
      <button id="card-btn-2">Card Action 2</button>
    </article>
    <article class="card" id="card-3">
      <h4>Card 3</h4>
      <p>Card content 3</p>
      <button id="card-btn-3">Card Action 3</button>
    </article>
  </section>

  <div class="popover" id="pop-1">
    <p>Popover content</p>
    <button id="pop-btn">Popover Action</button>
  </div>

  <div class="offcanvas" id="offcanvas-menu">
    <h3>Offcanvas</h3>
    <a href="/oc1" id="oc-link-1">OC 1</a>
    <a href="/oc2" id="oc-link-2">OC 2</a>
    <button id="oc-close">Close</button>
  </div>

  <div class="sr-only" id="sr-only-div">
    <a href="/skip" id="skip-link">Skip to content</a>
  </div>

  <div id="float-container">
    <div style="float:left" id="float-left">Left float</div>
    <div style="float:right" id="float-right">Right float</div>
    <button id="float-btn">Float Action</button>
  </div>

  <div id="z-index-stack">
    <div style="position:relative; z-index:1" id="z1">Layer 1</div>
    <div style="position:relative; z-index:2" id="z2">Layer 2 <button id="z2-btn">Z2</button></div>
    <div style="position:relative; z-index:3" id="z3">Layer 3 <button id="z3-btn">Z3</button></div>
  </div>
</main>

<footer class="fixed-footer" id="fixed-f">
  <p>Fixed Footer</p>
  <a href="/terms" id="footer-terms">Terms</a>
  <a href="/privacy" id="footer-privacy">Privacy</a>
  <button id="footer-close">Close</button>
</footer>
</body>
</html>
`;

const TRAPS = [
  // Sticky header
  { n: "1. Sticky header exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'sticky-h') !== undefined },
  { n: "2. Sticky logo is interactable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'sticky-logo')?.interactable === true },
  { n: "3. Sticky link A is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'sticky-a')?.interactable === true },
  { n: "4. Sticky link B is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'sticky-b')?.interactable === true },
  { n: "5. Sticky menu button is interactable",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'sticky-menu')?.interactable === true },
  // Sidebar
  { n: "6. Sidebar exists",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'sidebar-fixed') !== undefined },
  { n: "7. Sidebar link 1 is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'side-link-1')?.interactable === true },
  { n: "8. Sidebar link 2 is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'side-link-2')?.interactable === true },
  { n: "9. Sidebar link 3 is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'side-link-3')?.interactable === true },
  { n: "10. Sidebar action is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'side-action')?.interactable === true },
  // Grid
  { n: "11. Grid section exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'grid-section') !== undefined },
  { n: "12. Grid item 1 exists",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'grid-1')?.text === 'Grid 1' },
  { n: "13. Grid item 2 exists",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'grid-2')?.text === 'Grid 2' },
  { n: "14. Grid item 3 exists",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'grid-3')?.text === 'Grid 3' },
  { n: "15. Grid item 4 exists",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'grid-4')?.text === 'Grid 4' },
  // Flex
  { n: "16. Flex section exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'flex-section') !== undefined },
  { n: "17. Flex item 1 exists",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'flex-1')?.text === 'Flex 1' },
  { n: "18. Flex item 2 exists",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'flex-2')?.text === 'Flex 2' },
  { n: "19. Flex item 3 exists",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'flex-3')?.text === 'Flex 3' },
  // Split pane
  { n: "20. Left pane exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'pane-left') !== undefined },
  { n: "21. Left pane input is editable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'pane-left-input')?.editable === true },
  { n: "22. Left pane button is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'pane-left-btn')?.interactable === true },
  { n: "23. Right pane exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'pane-right') !== undefined },
  { n: "24. Right pane input is editable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'pane-right-input')?.editable === true },
  { n: "25. Right pane button is interactable",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'pane-right-btn')?.interactable === true },
  // Cards
  { n: "26. Card 1 exists",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'card-1') !== undefined },
  { n: "27. Card 1 button is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'card-btn-1')?.interactable === true },
  { n: "28. Card 2 exists",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'card-2') !== undefined },
  { n: "29. Card 2 button is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'card-btn-2')?.interactable === true },
  { n: "30. Card 3 exists",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'card-3') !== undefined },
  { n: "31. Card 3 button is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'card-btn-3')?.interactable === true },
  // Popover
  { n: "32. Popover exists",                             assert: (ast: DistilledNode[]) => findNodeById(ast, 'pop-1') !== undefined },
  { n: "33. Popover button is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'pop-btn')?.interactable === true },
  // Offcanvas (offscreen but not hidden - should exist)
  { n: "34. Offcanvas exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'offcanvas-menu') !== undefined },
  { n: "35. Offcanvas link 1 is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'oc-link-1')?.interactable === true },
  { n: "36. Offcanvas link 2 is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'oc-link-2')?.interactable === true },
  { n: "37. Offcanvas close is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'oc-close')?.interactable === true },
  // Screen reader only (offscreen)
  { n: "38. SR-only skip link is interactable",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'skip-link')?.interactable === true },
  // Float
  { n: "39. Float left exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'float-left')?.text === 'Left float' },
  { n: "40. Float right exists",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'float-right')?.text === 'Right float' },
  { n: "41. Float button is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'float-btn')?.interactable === true },
  // Z-index
  { n: "42. Z-layer 1 exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'z1')?.text === 'Layer 1' },
  { n: "43. Z-layer 2 exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'z2')?.text.includes('Layer 2') },
  { n: "44. Z-layer 2 button is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'z2-btn')?.interactable === true },
  { n: "45. Z-layer 3 exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'z3')?.text.includes('Layer 3') },
  { n: "46. Z-layer 3 button is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'z3-btn')?.interactable === true },
  // Fixed footer
  { n: "47. Fixed footer exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'fixed-f') !== undefined },
  { n: "48. Footer terms is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'footer-terms')?.interactable === true },
  { n: "49. Footer privacy is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'footer-privacy')?.interactable === true },
  { n: "50. Footer close is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'footer-close')?.interactable === true },
  { n: "51. Main area exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'main-area') !== undefined },
  { n: "52. No script/style leaked",                     assert: (ast: DistilledNode[]) => {
    let ok = true;
    const walk = (nodes: DistilledNode[]) => { for (const n of nodes) { if (n.tag === 'script' || n.tag === 'style') ok = false; walk(n.children); } };
    walk(ast);
    return ok;
  }},
  { n: "53. Card 1 text includes Card content 1",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'card-1')?.text.includes('Card content 1') },
  { n: "54. Card 2 text includes Card content 2",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'card-2')?.text.includes('Card content 2') },
  { n: "55. Card 3 text includes Card content 3",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'card-3')?.text.includes('Card content 3') },
];

describe('Complex Layouts Lab', () => {
  it('should pass all layout traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'Complex Layouts Lab',
      LAYOUTS_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 LAYOUTS FLAWLESS — Complex layouts mastered!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} layout trap(s) failed`);
  });
});
