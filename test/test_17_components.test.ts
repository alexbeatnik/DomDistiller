import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByText } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENTS LAB — Tabs, Accordions, Modals, Dropdowns, Carousels, Toasts
// ─────────────────────────────────────────────────────────────────────────────

const COMPONENTS_DOM = `
<!DOCTYPE html>
<html lang="en">
<head><title>UI Components</title></head>
<body>
<!-- Tabs -->
<div class="tabs" id="tabs-comp">
  <div role="tablist" aria-label="Product tabs">
    <button role="tab" id="tab-desc" aria-selected="true" aria-controls="panel-desc">Description</button>
    <button role="tab" id="tab-specs" aria-selected="false" aria-controls="panel-specs">Specifications</button>
    <button role="tab" id="tab-reviews" aria-selected="false" aria-controls="panel-reviews">Reviews</button>
  </div>
  <div role="tabpanel" id="panel-desc" aria-labelledby="tab-desc">
    <p>Product description content.</p>
    <button id="read-more-desc">Read More</button>
  </div>
  <div role="tabpanel" id="panel-specs" aria-labelledby="tab-specs" hidden>
    <table>
      <tr><th>Weight</th><td>1.2kg</td></tr>
      <tr><th>Dimensions</th><td>10x20x5cm</td></tr>
    </table>
  </div>
  <div role="tabpanel" id="panel-reviews" aria-labelledby="tab-reviews" hidden>
    <p>No reviews yet.</p>
    <button id="write-review">Write a Review</button>
  </div>
</div>

<!-- Accordion -->
<div class="accordion" id="accordion-comp">
  <div class="accordion-item" id="acc-item-1">
    <button id="acc-btn-1" aria-expanded="true" aria-controls="acc-panel-1">Section 1</button>
    <div id="acc-panel-1" class="accordion-panel">
      <p>Content for section 1.</p>
      <a href="/link1" id="acc-link-1">Learn more</a>
    </div>
  </div>
  <div class="accordion-item" id="acc-item-2">
    <button id="acc-btn-2" aria-expanded="false" aria-controls="acc-panel-2">Section 2</button>
    <div id="acc-panel-2" class="accordion-panel" hidden>
      <p>Content for section 2.</p>
      <input type="text" id="acc-input-2" placeholder="Type here">
    </div>
  </div>
  <div class="accordion-item" id="acc-item-3">
    <button id="acc-btn-3" aria-expanded="false" aria-controls="acc-panel-3">Section 3</button>
    <div id="acc-panel-3" class="accordion-panel" hidden>
      <p>Content for section 3.</p>
    </div>
  </div>
</div>

<!-- Modal -->
<div id="modal-overlay" class="modal-overlay">
  <div role="dialog" id="modal-1" aria-modal="true" aria-labelledby="modal-title">
    <h2 id="modal-title">Confirm Action</h2>
    <p id="modal-body">Are you sure you want to proceed?</p>
    <div class="modal-actions">
      <button id="modal-confirm" data-testid="modal-confirm">Confirm</button>
      <button id="modal-cancel" data-testid="modal-cancel">Cancel</button>
    </div>
  </div>
</div>

<!-- Dropdown -->
<div class="dropdown" id="dropdown-comp">
  <button id="dropdown-trigger" aria-haspopup="true" aria-expanded="false">Actions</button>
  <ul id="dropdown-menu" role="menu" aria-labelledby="dropdown-trigger">
    <li role="menuitem" id="dd-edit">Edit</li>
    <li role="menuitem" id="dd-duplicate">Duplicate</li>
    <li role="menuitem" id="dd-delete">Delete</li>
    <li role="separator" id="dd-sep"></li>
    <li role="menuitem" id="dd-export">Export</li>
  </ul>
</div>

<!-- Carousel -->
<div class="carousel" id="carousel-comp" role="region" aria-label="Image carousel">
  <div class="carousel-slide" id="slide-1" aria-hidden="false">
    <img src="img1.jpg" alt="Image 1" id="carousel-img-1">
    <p id="slide-cap-1">Caption 1</p>
  </div>
  <div class="carousel-slide" id="slide-2" aria-hidden="true">
    <img src="img2.jpg" alt="Image 2" id="carousel-img-2">
    <p id="slide-cap-2">Caption 2</p>
  </div>
  <button id="carousel-prev" aria-label="Previous slide">◀</button>
  <button id="carousel-next" aria-label="Next slide">▶</button>
  <div class="carousel-dots">
    <button id="dot-1" aria-label="Go to slide 1" aria-current="true">●</button>
    <button id="dot-2" aria-label="Go to slide 2">○</button>
  </div>
</div>

<!-- Toast notifications -->
<div id="toast-container" role="region" aria-label="Notifications">
  <div class="toast toast-success" id="toast-1" role="status">
    <span id="toast-msg-1">Profile updated successfully</span>
    <button id="toast-close-1" aria-label="Close notification">×</button>
  </div>
  <div class="toast toast-error" id="toast-2" role="alert">
    <span id="toast-msg-2">Failed to save changes</span>
    <button id="toast-close-2" aria-label="Close notification">×</button>
  </div>
</div>

<!-- Tooltip (visually hidden trigger) -->
<div class="tooltip-wrapper" id="tooltip-wrap">
  <button id="tooltip-trigger" aria-describedby="tooltip-content">Hover me</button>
  <div id="tooltip-content" role="tooltip" class="tooltip">This is a helpful tooltip</div>
</div>

<!-- Breadcrumb -->
<nav aria-label="Breadcrumb" id="breadcrumb-comp">
  <ol>
    <li><a href="/" id="bc-home-2">Home</a></li>
    <li><a href="/cat" id="bc-cat-2">Category</a></li>
    <li><a href="/sub" id="bc-sub-2">Subcategory</a></li>
    <li aria-current="page" id="bc-current-2">Current Page</li>
  </ol>
</nav>

<!-- Pagination -->
<nav aria-label="Pagination" id="pagination-comp">
  <button id="page-first">First</button>
  <button id="page-prev">Previous</button>
  <button id="page-1" aria-current="page">1</button>
  <button id="page-2">2</button>
  <button id="page-3">3</button>
  <span id="page-ellipsis">…</span>
  <button id="page-10">10</button>
  <button id="page-next">Next</button>
  <button id="page-last">Last</button>
</nav>

<!-- Steps/Wizard -->
<div class="steps" id="steps-comp" aria-label="Checkout steps">
  <div class="step step-complete" id="step-1">
    <span class="step-number" id="step-num-1">1</span>
    <span class="step-label" id="step-label-1">Cart</span>
  </div>
  <div class="step step-active" id="step-2" aria-current="step">
    <span class="step-number" id="step-num-2">2</span>
    <span class="step-label" id="step-label-2">Shipping</span>
  </div>
  <div class="step" id="step-3">
    <span class="step-number" id="step-num-3">3</span>
    <span class="step-label" id="step-label-3">Payment</span>
  </div>
  <div class="step" id="step-4">
    <span class="step-number" id="step-num-4">4</span>
    <span class="step-label" id="step-label-4">Confirmation</span>
  </div>
</div>

<!-- Command palette -->
<div id="cmd-palette" role="dialog" aria-label="Command palette" aria-modal="true">
  <input type="text" id="cmd-input" placeholder="Type a command..." role="combobox" aria-expanded="false">
  <ul id="cmd-list" role="listbox">
    <li role="option" id="cmd-1">Copy</li>
    <li role="option" id="cmd-2">Paste</li>
    <li role="option" id="cmd-3">Delete</li>
  </ul>
</div>
</body>
</html>
`;

const TRAPS = [
  // Tabs
  { n: "1. Tab description is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'tab-desc')?.interactable === true },
  { n: "2. Tab specs is interactable",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'tab-specs')?.interactable === true },
  { n: "3. Tab reviews is interactable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'tab-reviews')?.interactable === true },
  { n: "4. Tab desc has role tab",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'tab-desc')?.role === 'tab' },
  { n: "5. Tab specs has role tab",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'tab-specs')?.role === 'tab' },
  { n: "6. Tab reviews has role tab",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'tab-reviews')?.role === 'tab' },
  { n: "7. Panel desc exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'panel-desc')?.role === 'tabpanel' },
  { n: "8. Panel specs hidden and filtered",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'panel-specs') === undefined },
  { n: "9. Panel reviews hidden and filtered",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'panel-reviews') === undefined },
  { n: "10. Read more desc is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'read-more-desc')?.interactable === true },
  { n: "11. Write review hidden",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'write-review') === undefined },
  // Accordion
  { n: "12. Accordion button 1 is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'acc-btn-1')?.interactable === true },
  { n: "13. Accordion button 2 is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'acc-btn-2')?.interactable === true },
  { n: "14. Accordion button 3 is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'acc-btn-3')?.interactable === true },
  { n: "15. Accordion panel 1 exists",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'acc-panel-1') !== undefined },
  { n: "16. Accordion panel 2 hidden",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'acc-panel-2') === undefined },
  { n: "17. Accordion link 1 is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'acc-link-1')?.interactable === true },
  { n: "18. Accordion input 2 hidden",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'acc-input-2') === undefined },
  // Modal
  { n: "19. Modal dialog has role dialog",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'modal-1')?.role === 'dialog' },
  { n: "20. Modal title extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'modal-title')?.text === 'Confirm Action' },
  { n: "21. Modal body extracted",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'modal-body')?.text.includes('sure') },
  { n: "22. Modal confirm is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'modal-confirm')?.interactable === true },
  { n: "23. Modal cancel is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'modal-cancel')?.interactable === true },
  { n: "24. Modal confirm has data-testid",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'modal-confirm')?.attributes['data-testid'] === 'modal-confirm' },
  // Dropdown
  { n: "25. Dropdown trigger is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'dropdown-trigger')?.interactable === true },
  { n: "26. Dropdown trigger text",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'dropdown-trigger')?.text === 'Actions' },
  { n: "27. Dropdown menu exists",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'dropdown-menu')?.role === 'menu' },
  { n: "28. Dropdown edit is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'dd-edit')?.interactable === true },
  { n: "29. Dropdown duplicate is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'dd-duplicate')?.interactable === true },
  { n: "30. Dropdown delete is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'dd-delete')?.interactable === true },
  { n: "31. Dropdown export is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'dd-export')?.interactable === true },
  // Carousel
  { n: "32. Carousel region exists",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'carousel-comp')?.role === 'region' },
  { n: "33. Carousel prev is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'carousel-prev')?.interactable === true },
  { n: "34. Carousel next is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'carousel-next')?.interactable === true },
  { n: "35. Carousel dot 1 is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'dot-1')?.interactable === true },
  { n: "36. Carousel dot 2 is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'dot-2')?.interactable === true },
  { n: "37. Slide 1 image exists",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'carousel-img-1') !== undefined },
  { n: "38. Slide 1 caption extracted",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'slide-cap-1')?.text === 'Caption 1' },
  { n: "39. Slide 2 hidden",                             assert: (ast: DistilledNode[]) => findNodeById(ast, 'slide-2') === undefined },
  // Toasts
  { n: "40. Toast 1 exists",                             assert: (ast: DistilledNode[]) => findNodeById(ast, 'toast-1')?.role === 'status' },
  { n: "41. Toast 1 message extracted",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'toast-msg-1')?.text === 'Profile updated successfully' },
  { n: "42. Toast 1 close is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'toast-close-1')?.interactable === true },
  { n: "43. Toast 2 exists",                             assert: (ast: DistilledNode[]) => findNodeById(ast, 'toast-2')?.role === 'alert' },
  { n: "44. Toast 2 message extracted",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'toast-msg-2')?.text === 'Failed to save changes' },
  { n: "45. Toast 2 close is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'toast-close-2')?.interactable === true },
  // Tooltip
  { n: "46. Tooltip trigger is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'tooltip-trigger')?.interactable === true },
  { n: "47. Tooltip trigger text",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'tooltip-trigger')?.text === 'Hover me' },
  { n: "48. Tooltip content has role tooltip",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'tooltip-content')?.role === 'tooltip' },
  // Breadcrumb
  { n: "49. Breadcrumb home is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'bc-home-2')?.interactable === true },
  { n: "50. Breadcrumb cat is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'bc-cat-2')?.interactable === true },
  { n: "51. Breadcrumb sub is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'bc-sub-2')?.interactable === true },
  { n: "52. Breadcrumb current text",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'bc-current-2')?.text === 'Current Page' },
  // Pagination
  { n: "53. Page first is interactable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'page-first')?.interactable === true },
  { n: "54. Page prev is interactable",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'page-prev')?.interactable === true },
  { n: "55. Page 1 is interactable",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'page-1')?.interactable === true },
  { n: "56. Page 2 is interactable",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'page-2')?.interactable === true },
  { n: "57. Page 3 is interactable",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'page-3')?.interactable === true },
  { n: "58. Page ellipsis exists",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'page-ellipsis') !== undefined },
  { n: "59. Page 10 is interactable",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'page-10')?.interactable === true },
  { n: "60. Page next is interactable",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'page-next')?.interactable === true },
  { n: "61. Page last is interactable",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'page-last')?.interactable === true },
  // Steps
  { n: "62. Step 1 exists",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'step-1') !== undefined },
  { n: "63. Step 1 label extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'step-label-1')?.text === 'Cart' },
  { n: "64. Step 2 text extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'step-2')?.text.includes('Shipping') },
  { n: "65. Step 2 label extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'step-label-2')?.text === 'Shipping' },
  { n: "66. Step 3 label extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'step-label-3')?.text === 'Payment' },
  { n: "67. Step 4 label extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'step-label-4')?.text === 'Confirmation' },
  // Command palette
  { n: "68. Cmd palette dialog exists",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'cmd-palette')?.role === 'dialog' },
  { n: "69. Cmd input is editable",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'cmd-input')?.editable === true },
  { n: "70. Cmd input has role combobox",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'cmd-input')?.role === 'combobox' },
  { n: "71. Cmd option 1 is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'cmd-1')?.interactable === true },
  { n: "72. Cmd option 2 is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'cmd-2')?.interactable === true },
  { n: "73. Cmd option 3 is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'cmd-3')?.interactable === true },
  { n: "74. No script/style leaked",                     assert: (ast: DistilledNode[]) => {
    let ok = true;
    const walk = (nodes: DistilledNode[]) => { for (const n of nodes) { if (n.tag === 'script' || n.tag === 'style') ok = false; walk(n.children); } };
    walk(ast);
    return ok;
  }},
  { n: "75. Modal overlay exists",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'modal-overlay') !== undefined },
  { n: "76. Toast container exists",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'toast-container') !== undefined },
  { n: "77. Tabs component exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'tabs-comp') !== undefined },
  { n: "78. Accordion component exists",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'accordion-comp') !== undefined },
  { n: "79. Carousel exists",                            assert: (ast: DistilledNode[]) => findNodeById(ast, 'carousel-comp') !== undefined },
  { n: "80. Command palette exists",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'cmd-palette') !== undefined },
];

describe('UI Components Lab', () => {
  it('should pass all UI component traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'UI Components Lab',
      COMPONENTS_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 UI COMPONENTS FLAWLESS — Patterns mastered!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} UI component trap(s) failed`);
  });
});
