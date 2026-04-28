import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByLocator } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// ARIA & ACCESSIBILITY LAB — Landmarks, Roles, Live Regions, States
// ─────────────────────────────────────────────────────────────────────────────

const ARIA_DOM = `
<!DOCTYPE html>
<html lang="en">
<head><title>ARIA Demo</title></head>
<body>
  <header role="banner" id="banner">
    <nav role="navigation" id="main-nav" aria-label="Main">
      <a href="/" id="nav-home">Home</a>
      <a href="/about" id="nav-about">About</a>
    </nav>
  </header>

  <main role="main" id="main-region">
    <section role="search" id="search-region" aria-label="Site search">
      <input type="search" id="search-input" aria-label="Search">
      <button id="search-btn" aria-label="Submit search">Go</button>
    </section>

    <nav role="navigation" id="breadcrumb-nav" aria-label="Breadcrumb">
      <ol>
        <li><a href="/" id="bc-home">Home</a></li>
        <li><a href="/cat" id="bc-cat">Category</a></li>
        <li aria-current="page" id="bc-current">Product</li>
      </ol>
    </nav>

    <section role="region" id="content-region" aria-labelledby="content-heading">
      <h2 id="content-heading">Product Details</h2>
      <p id="content-desc">Description here.</p>
    </section>

    <article role="article" id="article-1" aria-labelledby="art-title">
      <h3 id="art-title">Article Title</h3>
      <p>Article content.</p>
      <button id="art-read-more" aria-describedby="art-title">Read more</button>
    </article>

    <aside role="complementary" id="sidebar-comp">
      <h3>Related</h3>
      <a href="/rel1" id="rel-1">Related 1</a>
      <a href="/rel2" id="rel-2">Related 2</a>
    </aside>

    <div role="tablist" id="tabs" aria-label="Settings tabs">
      <button role="tab" id="tab-1" aria-selected="true" aria-controls="panel-1">General</button>
      <button role="tab" id="tab-2" aria-selected="false" aria-controls="panel-2">Security</button>
      <button role="tab" id="tab-3" aria-selected="false" aria-controls="panel-3">Notifications</button>
    </div>
    <div role="tabpanel" id="panel-1" aria-labelledby="tab-1">
      <p>General settings.</p>
      <input type="text" id="gen-name" aria-label="Your name">
    </div>
    <div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>
      <p>Security settings.</p>
      <input type="password" id="sec-pw" aria-label="New password">
    </div>
    <div role="tabpanel" id="panel-3" aria-labelledby="tab-3" hidden>
      <p>Notification settings.</p>
      <label><input type="checkbox" id="notif-email" aria-label="Email notifications"> Email</label>
    </div>

    <div role="toolbar" id="toolbar" aria-label="Text formatting">
      <button id="tb-bold" aria-pressed="false" aria-label="Bold">B</button>
      <button id="tb-italic" aria-pressed="false" aria-label="Italic">I</button>
      <button id="tb-underline" aria-pressed="false" aria-label="Underline">U</button>
    </div>

    <div role="radiogroup" id="theme-group" aria-label="Theme selection">
      <label><input type="radio" id="theme-light" name="theme" value="light" aria-checked="false"> Light</label>
      <label><input type="radio" id="theme-dark" name="theme" value="dark" aria-checked="true" checked> Dark</label>
      <label><input type="radio" id="theme-auto" name="theme" value="auto" aria-checked="false"> Auto</label>
    </div>

    <div role="listbox" id="listbox-1" aria-label="Choose a fruit" tabindex="0">
      <div role="option" id="opt-apple" aria-selected="true">Apple</div>
      <div role="option" id="opt-banana" aria-selected="false">Banana</div>
      <div role="option" id="opt-cherry" aria-selected="false">Cherry</div>
    </div>

    <div role="menu" id="ctx-menu" aria-label="Context menu">
      <div role="menuitem" id="ctx-cut">Cut</div>
      <div role="menuitem" id="ctx-copy">Copy</div>
      <div role="menuitem" id="ctx-paste">Paste</div>
    </div>

    <div role="tree" id="file-tree" aria-label="File tree">
      <div role="treeitem" id="tree-src" aria-expanded="true">
        src
        <div role="group">
          <div role="treeitem" id="tree-index">index.ts</div>
          <div role="treeitem" id="tree-utils">utils.ts</div>
        </div>
      </div>
    </div>

    <div role="dialog" id="confirm-dlg" aria-modal="true" aria-labelledby="dlg-title">
      <h2 id="dlg-title">Confirm Delete</h2>
      <p id="dlg-msg">Are you sure?</p>
      <button id="dlg-ok" aria-label="Confirm deletion">Yes</button>
      <button id="dlg-cancel">No</button>
    </div>

    <div role="alert" id="alert-box" aria-live="assertive">
      Error: Invalid input
    </div>

    <div role="status" id="status-box" aria-live="polite">
      Saved successfully
    </div>

    <progress id="prog-1" value="70" max="100" aria-label="Upload progress">70%</progress>
    <meter id="meter-1" value="0.6" min="0" max="1" aria-label="Disk usage">60%</meter>

    <div role="slider" id="vol-slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-label="Volume" tabindex="0">Volume</div>
    <div role="spinbutton" id="qty-spin" aria-valuemin="1" aria-valuemax="10" aria-valuenow="3" aria-label="Quantity" tabindex="0">3</div>

    <table role="grid" id="data-grid" aria-label="Data table">
      <tr role="row"><th role="columnheader" id="col-a">Name</th><th role="columnheader" id="col-b">Value</th></tr>
      <tr role="row"><td role="gridcell" id="cell-1">A</td><td role="gridcell" id="cell-2">1</td></tr>
    </table>

    <input type="text" id="combo-input" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="combo-list" aria-activedescendant="">
    <ul role="listbox" id="combo-list" aria-label="Suggestions">
      <li role="option" id="combo-opt-1">Option 1</li>
      <li role="option" id="combo-opt-2">Option 2</li>
    </ul>
  </main>

  <footer role="contentinfo" id="footer-info">
    <p>© 2024</p>
  </footer>
</body>
</html>
`;

const TRAPS = [
  // Landmarks
  { n: "1. Banner landmark exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'banner')?.role === 'banner' },
  { n: "2. Main landmark exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'main-region')?.role === 'main' },
  { n: "3. Contentinfo landmark exists",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'footer-info')?.role === 'contentinfo' },
  { n: "4. Complementary landmark exists",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'sidebar-comp')?.role === 'complementary' },
  { n: "5. Search landmark exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'search-region')?.role === 'search' },
  // Navigation
  { n: "6. Main nav has aria-label",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'main-nav')?.attributes['aria-label'] === 'Main' },
  { n: "7. Breadcrumb current text extracted",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'bc-current')?.text === 'Product' },
  { n: "8. Region heading text extracted",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'content-heading')?.text === 'Product Details' },
  // Tablist
  { n: "9. Tablist exists",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'tabs')?.role === 'tablist' },
  { n: "10. Tab 1 has role tab",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'tab-1')?.role === 'tab' },
  { n: "11. Tab 1 is interactable",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'tab-1')?.interactable === true },
  { n: "12. Tab 2 has role tab",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'tab-2')?.role === 'tab' },
  { n: "13. Tabpanel 1 exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'panel-1')?.role === 'tabpanel' },
  { n: "14. Tabpanel 2 hidden and filtered",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'panel-2') === undefined },
  { n: "15. Tabpanel 3 hidden and filtered",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'panel-3') === undefined },
  { n: "16. Tab 1 is interactable",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'tab-1')?.interactable === true },
  { n: "17. Tab 2 is interactable",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'tab-2')?.interactable === true },
  { n: "18. Tab 3 is interactable",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'tab-3')?.interactable === true },
  { n: "19. General settings input is editable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'gen-name')?.editable === true },
  // Toolbar
  { n: "20. Toolbar exists",                             assert: (ast: DistilledNode[]) => findNodeById(ast, 'toolbar')?.role === 'toolbar' },
  { n: "21. Bold button has aria-label",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'tb-bold')?.attributes['aria-label'] === 'Bold' },
  { n: "22. Bold button is interactable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'tb-bold')?.interactable === true },
  { n: "23. Italic button is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'tb-italic')?.interactable === true },
  { n: "24. Underline button is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'tb-underline')?.interactable === true },
  // Radiogroup
  { n: "25. Radiogroup exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'theme-group')?.role === 'radiogroup' },
  { n: "26. Theme light radio is interactable",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'theme-light')?.interactable === true },
  { n: "27. Theme dark radio is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'theme-dark')?.interactable === true },
  { n: "28. Theme auto radio is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'theme-auto')?.interactable === true },
  { n: "29. Theme dark radio is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'theme-dark')?.interactable === true },
  // Listbox
  { n: "30. Listbox exists",                             assert: (ast: DistilledNode[]) => findNodeById(ast, 'listbox-1')?.role === 'listbox' },
  { n: "31. Listbox option apple is interactable",       assert: (ast: DistilledNode[]) => findNodeById(ast, 'opt-apple')?.interactable === true },
  { n: "32. Listbox option banana is interactable",      assert: (ast: DistilledNode[]) => findNodeById(ast, 'opt-banana')?.interactable === true },
  { n: "33. Listbox option cherry is interactable",      assert: (ast: DistilledNode[]) => findNodeById(ast, 'opt-cherry')?.interactable === true },
  { n: "34. Apple has role option",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'opt-apple')?.role === 'option' },
  // Menu
  { n: "35. Menu exists",                                assert: (ast: DistilledNode[]) => findNodeById(ast, 'ctx-menu')?.role === 'menu' },
  { n: "36. Menuitem cut is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'ctx-cut')?.interactable === true },
  { n: "37. Menuitem copy is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'ctx-copy')?.interactable === true },
  { n: "38. Menuitem paste is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'ctx-paste')?.interactable === true },
  // Tree
  { n: "39. Tree exists",                                assert: (ast: DistilledNode[]) => findNodeById(ast, 'file-tree')?.role === 'tree' },
  { n: "40. Treeitem src exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'tree-src')?.role === 'treeitem' },
  { n: "41. Treeitem index exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'tree-index')?.role === 'treeitem' },
  { n: "42. Treeitem utils exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'tree-utils')?.role === 'treeitem' },
  // Dialog
  { n: "43. Dialog has role dialog",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'confirm-dlg')?.role === 'dialog' },
  { n: "44. Dialog OK is interactable",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'dlg-ok')?.interactable === true },
  { n: "45. Dialog cancel is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'dlg-cancel')?.interactable === true },
  { n: "46. Dialog OK has aria-label",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'dlg-ok')?.attributes['aria-label'] === 'Confirm deletion' },
  // Live regions
  { n: "47. Alert role exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'alert-box')?.role === 'alert' },
  { n: "48. Alert text extracted",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'alert-box')?.text.includes('Error') },
  { n: "49. Status role exists",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'status-box')?.role === 'status' },
  { n: "50. Status text extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'status-box')?.text.includes('Saved') },
  // Progress & meter
  { n: "51. Progress element exists",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'prog-1') !== undefined },
  { n: "52. Progress has aria-label",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'prog-1')?.attributes['aria-label'] === 'Upload progress' },
  { n: "53. Meter element exists",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'meter-1') !== undefined },
  { n: "54. Meter has aria-label",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'meter-1')?.attributes['aria-label'] === 'Disk usage' },
  // Slider & spinbutton
  { n: "55. Slider role exists",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'vol-slider')?.role === 'slider' },
  { n: "56. Slider is interactable",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'vol-slider')?.interactable === true },
  { n: "57. Spinbutton role exists",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'qty-spin')?.role === 'spinbutton' },
  { n: "58. Spinbutton is interactable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'qty-spin')?.interactable === true },
  // Grid
  { n: "59. Grid role exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'data-grid')?.role === 'grid' },
  { n: "60. Columnheader A exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'col-a')?.role === 'columnheader' },
  { n: "61. Gridcell 1 exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'cell-1')?.role === 'gridcell' },
  { n: "62. Gridcell 2 exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'cell-2')?.role === 'gridcell' },
  { n: "63. Grid has aria-label",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'data-grid')?.attributes['aria-label'] === 'Data table' },
  // Combobox
  { n: "64. Combobox input exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'combo-input')?.role === 'combobox' },
  { n: "65. Combobox is editable",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'combo-input')?.editable === true },
  { n: "66. Combobox listbox exists",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'combo-list')?.role === 'listbox' },
  { n: "67. Combobox option 1 exists",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'combo-opt-1')?.role === 'option' },
  { n: "68. Combobox option 2 exists",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'combo-opt-2')?.role === 'option' },
  // Article
  { n: "69. Article role exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'article-1')?.role === 'article' },
  { n: "70. Read more button text",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'art-read-more')?.text === 'Read more' },
  { n: "71. Read more is interactable",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'art-read-more')?.interactable === true },
  { n: "72. Search input has aria-label",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'search-input')?.attributes['aria-label'] === 'Search' },
  { n: "73. Search button has aria-label",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'search-btn')?.attributes['aria-label'] === 'Submit search' },
  { n: "74. Breadcrumb home is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'bc-home')?.interactable === true },
  { n: "75. Related 1 is interactable",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'rel-1')?.interactable === true },
  { n: "76. Notification checkbox is interactable",      assert: (ast: DistilledNode[]) => findNodeById(ast, 'notif-email')?.interactable === true },
  { n: "77. Panel 2 hidden so sec-pw filtered",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'sec-pw') === undefined },
  { n: "78. Dialog title extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'dlg-title')?.text === 'Confirm Delete' },
  { n: "79. Dialog message extracted",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'dlg-msg')?.text === 'Are you sure?' },
  { n: "80. Article title extracted",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'art-title')?.text === 'Article Title' },
];

describe('ARIA & Accessibility Lab', () => {
  it('should pass all ARIA traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'ARIA & Accessibility Lab',
      ARIA_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 ARIA FLAWLESS — Accessibility mastered!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} ARIA trap(s) failed`);
  });
});
