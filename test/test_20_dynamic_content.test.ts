import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByText } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC CONTENT LAB — Skeletons, Spinners, Live regions, Lazy load
// ─────────────────────────────────────────────────────────────────────────────

const DYNAMIC_DOM = `
<!DOCTYPE html>
<html lang="en">
<head><title>Dynamic</title></head>
<body>
<div id="loading-state">
  <div class="skeleton" id="skel-1">Loading title...</div>
  <div class="skeleton" id="skel-2">Loading content...</div>
  <div class="spinner" id="spinner-1" role="status" aria-label="Loading">
    <span class="visually-hidden">Loading...</span>
  </div>
  <progress id="load-progress" value="30" max="100">30%</progress>
</div>

<div id="content-loaded" style="display:none">
  <h1 id="loaded-title">Actual Title</h1>
  <p id="loaded-body">Actual content loaded dynamically.</p>
  <button id="loaded-btn">Loaded Button</button>
</div>

<div id="infinite-scroll">
  <div class="item" id="is-item-1">Item 1</div>
  <div class="item" id="is-item-2">Item 2</div>
  <div class="item" id="is-item-3">Item 3</div>
  <button id="load-more">Load More</button>
</div>

<div id="live-region" aria-live="polite" aria-atomic="true">
  <p id="live-msg">Waiting for updates...</p>
</div>

<div id="polling-region" aria-live="assertive">
  <p id="poll-msg">Polling...</p>
</div>

<div id="lazy-images">
  <img data-src="img1.jpg" alt="Lazy 1" id="lazy-img-1" class="lazy">
  <img data-src="img2.jpg" alt="Lazy 2" id="lazy-img-2" class="lazy">
  <img src="eager.jpg" alt="Eager" id="eager-img">
</div>

<div id="accordion-dynamic">
  <button id="dyn-acc-btn" aria-expanded="false" aria-controls="dyn-acc-panel">Dynamic Section</button>
  <div id="dyn-acc-panel" hidden>
    <p>Hidden by default, shown via JS.</p>
    <input type="text" id="dyn-acc-input" placeholder="Dynamic input">
  </div>
</div>

<div id="modal-dynamic" role="dialog" aria-modal="true" aria-labelledby="dyn-modal-title" hidden>
  <h2 id="dyn-modal-title">Dynamic Modal</h2>
  <p>Modal content loaded via AJAX.</p>
  <button id="dyn-modal-close">Close</button>
  <button id="dyn-modal-ok">OK</button>
</div>

<div id="tooltip-dynamic">
  <button id="dyn-tt-trigger" aria-describedby="dyn-tt-content">Hover for tooltip</button>
  <div id="dyn-tt-content" role="tooltip" hidden>Dynamic tooltip text</div>
</div>

<div id="dropdown-dynamic">
  <button id="dyn-dd-trigger" aria-haspopup="true" aria-expanded="false">Dynamic Dropdown</button>
  <ul id="dyn-dd-menu" role="menu" hidden>
    <li role="menuitem" id="dyn-dd-1">Action 1</li>
    <li role="menuitem" id="dyn-dd-2">Action 2</li>
  </ul>
</div>

<div id="form-dynamic">
  <label for="dyn-select">Dynamic Select</label>
  <select id="dyn-select">
    <option value="">Loading options...</option>
  </select>
  <button id="dyn-refresh">Refresh Options</button>
</div>

<div id="search-autocomplete">
  <label for="ac-input">Search</label>
  <input type="text" id="ac-input" role="combobox" aria-expanded="false" aria-controls="ac-list" autocomplete="off">
  <ul id="ac-list" role="listbox" hidden>
    <li role="option" id="ac-opt-1">Apple</li>
    <li role="option" id="ac-opt-2">Banana</li>
    <li role="option" id="ac-opt-3">Cherry</li>
  </ul>
</div>

<div id="notification-center">
  <button id="notif-toggle" aria-expanded="false" aria-controls="notif-list">Notifications <span id="notif-badge-count">3</span></button>
  <div id="notif-list" hidden>
    <div class="notif" id="notif-1">Message 1</div>
    <div class="notif" id="notif-2">Message 2</div>
    <div class="notif" id="notif-3">Message 3</div>
  </div>
</div>

<div id="virtual-scroll">
  <div style="height: 2000px">
    <div class="virtual-item" id="v-item-1">Virtual 1</div>
    <div class="virtual-item" id="v-item-2">Virtual 2</div>
    <div class="virtual-item" id="v-item-3">Virtual 3</div>
  </div>
</div>
</body>
</html>
`;

const TRAPS = [
  // Loading state
  { n: "1. Skeleton 1 exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'skel-1') !== undefined },
  { n: "2. Skeleton 2 exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'skel-2') !== undefined },
  { n: "3. Spinner exists",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'spinner-1') !== undefined },
  { n: "4. Spinner has aria-label",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'spinner-1')?.attributes['aria-label'] === 'Loading' },
  { n: "5. Spinner text extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'spinner-1')?.text.includes('Loading') },
  { n: "6. Load progress exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'load-progress') !== undefined },
  { n: "7. Load progress value",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'load-progress')?.attributes.value === '30' },
  // Content loaded (display:none - should be filtered)
  { n: "8. Loaded title is hidden (display:none)",       assert: (ast: DistilledNode[]) => findNodeById(ast, 'loaded-title') === undefined },
  { n: "9. Loaded body is hidden",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'loaded-body') === undefined },
  { n: "10. Loaded button is hidden",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'loaded-btn') === undefined },
  // Infinite scroll
  { n: "11. IS item 1 exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'is-item-1')?.text === 'Item 1' },
  { n: "12. IS item 2 exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'is-item-2')?.text === 'Item 2' },
  { n: "13. IS item 3 exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'is-item-3')?.text === 'Item 3' },
  { n: "14. Load more button is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'load-more')?.interactable === true },
  // Live regions
  { n: "15. Live region exists",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'live-region') !== undefined },
  { n: "16. Live message extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'live-msg')?.text === 'Waiting for updates...' },
  { n: "17. Polling region exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'polling-region') !== undefined },
  { n: "18. Polling message extracted",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'poll-msg')?.text === 'Polling...' },
  // Lazy images
  { n: "19. Lazy image 1 exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'lazy-img-1') !== undefined },
  { n: "20. Lazy image 1 alt preserved",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'lazy-img-1')?.attributes.alt === 'Lazy 1' },
  { n: "21. Lazy image 2 exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'lazy-img-2') !== undefined },
  { n: "22. Eager image exists",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'eager-img') !== undefined },
  { n: "23. Eager image alt preserved",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'eager-img')?.attributes.alt === 'Eager' },
  // Dynamic accordion
  { n: "24. Dynamic accordion button is interactable",   assert: (ast: DistilledNode[]) => findNodeById(ast, 'dyn-acc-btn')?.interactable === true },
  { n: "25. Dynamic accordion button text",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'dyn-acc-btn')?.text === 'Dynamic Section' },
  { n: "26. Dynamic accordion panel is hidden",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'dyn-acc-panel') === undefined },
  // Dynamic modal (hidden)
  { n: "27. Dynamic modal is hidden",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'modal-dynamic') === undefined },
  // Dynamic tooltip
  { n: "28. Dynamic tooltip trigger is interactable",    assert: (ast: DistilledNode[]) => findNodeById(ast, 'dyn-tt-trigger')?.interactable === true },
  { n: "29. Dynamic tooltip trigger text",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'dyn-tt-trigger')?.text === 'Hover for tooltip' },
  { n: "30. Dynamic tooltip content hidden",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'dyn-tt-content') === undefined },
  // Dynamic dropdown
  { n: "31. Dynamic dropdown trigger is interactable",   assert: (ast: DistilledNode[]) => findNodeById(ast, 'dyn-dd-trigger')?.interactable === true },
  { n: "32. Dynamic dropdown trigger text",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'dyn-dd-trigger')?.text === 'Dynamic Dropdown' },
  { n: "33. Dynamic dropdown menu is hidden",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'dyn-dd-menu') === undefined },
  // Dynamic form
  { n: "34. Dynamic select is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'dyn-select')?.interactable === true },
  { n: "35. Dynamic select text uses label",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'dyn-select')?.text === 'Dynamic Select' },
  { n: "36. Dynamic refresh button is interactable",     assert: (ast: DistilledNode[]) => findNodeById(ast, 'dyn-refresh')?.interactable === true },
  // Search autocomplete
  { n: "37. AC input is editable",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'ac-input')?.editable === true },
  { n: "38. AC input has role combobox",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'ac-input')?.role === 'combobox' },
  { n: "39. AC list is hidden",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'ac-list') === undefined },
  // Notification center
  { n: "40. Notif toggle is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'notif-toggle')?.interactable === true },
  { n: "41. Notif toggle text",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'notif-toggle')?.text.includes('Notifications') },
  { n: "42. Notif badge shows 3",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'notif-badge-count')?.text === '3' },
  { n: "43. Notif list is hidden",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'notif-list') === undefined },
  // Virtual scroll
  { n: "44. Virtual item 1 exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'v-item-1')?.text === 'Virtual 1' },
  { n: "45. Virtual item 2 exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'v-item-2')?.text === 'Virtual 2' },
  { n: "46. Virtual item 3 exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'v-item-3')?.text === 'Virtual 3' },
  { n: "47. Virtual scroll container exists",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'virtual-scroll') !== undefined },
  { n: "48. No script/style leaked",                     assert: (ast: DistilledNode[]) => {
    let ok = true;
    const walk = (nodes: DistilledNode[]) => { for (const n of nodes) { if (n.tag === 'script' || n.tag === 'style') ok = false; walk(n.children); } };
    walk(ast);
    return ok;
  }},
  { n: "49. Loading state section exists",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'loading-state') !== undefined },
  { n: "50. Infinite scroll section exists",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'infinite-scroll') !== undefined },
  { n: "51. Lazy images section exists",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'lazy-images') !== undefined },
  { n: "52. Form dynamic section exists",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'form-dynamic') !== undefined },
  { n: "53. Search autocomplete section exists",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'search-autocomplete') !== undefined },
  { n: "54. Notification center exists",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'notification-center') !== undefined },
  { n: "55. Modal dynamic hidden",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'modal-dynamic') === undefined },
];

describe('Dynamic Content Lab', () => {
  it('should pass all dynamic content traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'Dynamic Content Lab',
      DYNAMIC_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 DYNAMIC CONTENT FLAWLESS — State changes mastered!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} dynamic content trap(s) failed`);
  });
});
