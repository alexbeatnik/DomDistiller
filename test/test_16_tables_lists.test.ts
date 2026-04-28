import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByText } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// TABLES & LISTS LAB — Complex tables, nested lists, definition lists
// ─────────────────────────────────────────────────────────────────────────────

const TABLES_DOM = `
<!DOCTYPE html>
<html lang="en">
<head><title>Tables & Lists</title></head>
<body>
<table id="simple-table">
  <caption id="cap-1">Monthly Sales</caption>
  <thead>
    <tr><th id="th-month">Month</th><th id="th-sales">Sales</th></tr>
  </thead>
  <tbody>
    <tr><td id="td-jan">January</td><td id="td-jan-sales">$10,000</td></tr>
    <tr><td id="td-feb">February</td><td id="td-feb-sales">$12,000</td></tr>
  </tbody>
  <tfoot>
    <tr><td id="td-total-label">Total</td><td id="td-total-val">$22,000</td></tr>
  </tfoot>
</table>

<table id="complex-table">
  <thead>
    <tr>
      <th id="th-product" rowspan="2">Product</th>
      <th id="th-q1" colspan="3">Q1</th>
      <th id="th-q2" colspan="3">Q2</th>
    </tr>
    <tr>
      <th id="th-jan">Jan</th><th id="th-feb">Feb</th><th id="th-mar">Mar</th>
      <th id="th-apr">Apr</th><th id="th-may">May</th><th id="th-jun">Jun</th>
    </tr>
  </thead>
  <tbody>
    <tr><td id="td-prod-a">Widget A</td><td id="td-a-jan">100</td><td id="td-a-feb">120</td><td id="td-a-mar">110</td><td id="td-a-apr">130</td><td id="td-a-may">140</td><td id="td-a-jun">150</td></tr>
    <tr><td id="td-prod-b">Widget B</td><td id="td-b-jan">80</td><td id="td-b-feb">90</td><td id="td-b-mar">85</td><td id="td-b-apr">95</td><td id="td-b-may">100</td><td id="td-b-jun">105</td></tr>
  </tbody>
</table>

<table id="sortable-table">
  <thead>
    <tr>
      <th id="sort-name"><button id="sort-name-btn">Name ⬆</button></th>
      <th id="sort-age"><button id="sort-age-btn">Age ⬇</button></th>
      <th id="sort-city"><button id="sort-city-btn">City</button></th>
    </tr>
  </thead>
  <tbody>
    <tr><td id="st-1-name">Alice</td><td id="st-1-age">30</td><td id="st-1-city">NYC</td></tr>
    <tr><td id="st-2-name">Bob</td><td id="st-2-age">25</td><td id="st-2-city">LA</td></tr>
    <tr><td id="st-3-name">Carol</td><td id="st-3-age">35</td><td id="st-3-city">Chicago</td></tr>
  </tbody>
</table>

<ul id="unordered-list">
  <li id="ul-1">Item 1</li>
  <li id="ul-2">Item 2
    <ul>
      <li id="ul-2-1">Subitem 2.1</li>
      <li id="ul-2-2">Subitem 2.2</li>
    </ul>
  </li>
  <li id="ul-3">Item 3</li>
</ul>

<ol id="ordered-list">
  <li id="ol-1">First</li>
  <li id="ol-2">Second
    <ol type="a">
      <li id="ol-2-a">Sub a</li>
      <li id="ol-2-b">Sub b</li>
    </ol>
  </li>
  <li id="ol-3">Third</li>
</ol>

<dl id="definition-list">
  <dt id="dt-html">HTML</dt>
  <dd id="dd-html">HyperText Markup Language</dd>
  <dt id="dt-css">CSS</dt>
  <dd id="dd-css">Cascading Style Sheets</dd>
  <dt id="dt-js">JavaScript</dt>
  <dd id="dd-js">Programming language of the web</dd>
</dl>

<nav id="nav-list">
  <ul>
    <li><a href="/" id="nl-home">Home</a></li>
    <li><a href="/products" id="nl-products">Products</a></li>
    <li><a href="/about" id="nl-about">About</a></li>
    <li><a href="/contact" id="nl-contact">Contact</a></li>
  </ul>
</nav>

<div id="mixed-content">
  <p>Some text</p>
  <ul>
    <li id="mix-li-1">Mixed item 1</li>
    <li id="mix-li-2">Mixed item 2</li>
  </ul>
  <p>More text</p>
</div>
</body>
</html>
`;

const TRAPS = [
  // Simple table
  { n: "1. Simple table exists",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'simple-table')?.tag === 'table' },
  { n: "2. Caption exists",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'cap-1')?.tag === 'caption' },
  { n: "3. Caption text extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'cap-1')?.text === 'Monthly Sales' },
  { n: "4. TH Month exists",                             assert: (ast: DistilledNode[]) => findNodeById(ast, 'th-month')?.tag === 'th' },
  { n: "5. TH Sales exists",                             assert: (ast: DistilledNode[]) => findNodeById(ast, 'th-sales')?.tag === 'th' },
  { n: "6. TD January exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'td-jan')?.text === 'January' },
  { n: "7. TD Jan sales extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'td-jan-sales')?.text === '$10,000' },
  { n: "8. TD February exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'td-feb')?.text === 'February' },
  { n: "9. TD Feb sales extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'td-feb-sales')?.text === '$12,000' },
  { n: "10. Tfoot total label",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'td-total-label')?.text === 'Total' },
  { n: "11. Tfoot total value",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'td-total-val')?.text === '$22,000' },
  // Complex table
  { n: "12. Complex table exists",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'complex-table')?.tag === 'table' },
  { n: "13. Product header text",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'th-product')?.text === 'Product' },
  { n: "14. Q1 header text",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'th-q1')?.text === 'Q1' },
  { n: "15. Q2 header text",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'th-q2')?.text === 'Q2' },
  { n: "16. Widget A row exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'td-prod-a')?.text === 'Widget A' },
  { n: "17. Widget A Jan value",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'td-a-jan')?.text === '100' },
  { n: "18. Widget A Jun value",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'td-a-jun')?.text === '150' },
  { n: "19. Widget B row exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'td-prod-b')?.text === 'Widget B' },
  { n: "20. Widget B Mar value",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'td-b-mar')?.text === '85' },
  // Sortable table
  { n: "21. Sortable table exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'sortable-table')?.tag === 'table' },
  { n: "22. Sort name button is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'sort-name-btn')?.interactable === true },
  { n: "23. Sort age button is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'sort-age-btn')?.interactable === true },
  { n: "24. Sort city button is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'sort-city-btn')?.interactable === true },
  { n: "25. ST row 1 name",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'st-1-name')?.text === 'Alice' },
  { n: "26. ST row 1 age",                               assert: (ast: DistilledNode[]) => findNodeById(ast, 'st-1-age')?.text === '30' },
  { n: "27. ST row 1 city",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'st-1-city')?.text === 'NYC' },
  { n: "28. ST row 2 name",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'st-2-name')?.text === 'Bob' },
  { n: "29. ST row 3 name",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'st-3-name')?.text === 'Carol' },
  { n: "30. ST row 3 city",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'st-3-city')?.text === 'Chicago' },
  // Unordered list
  { n: "31. Unordered list exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'unordered-list')?.tag === 'ul' },
  { n: "32. UL item 1 exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'ul-1')?.tag === 'li' },
  { n: "33. UL item 1 text",                             assert: (ast: DistilledNode[]) => findNodeById(ast, 'ul-1')?.text === 'Item 1' },
  { n: "34. UL item 2 exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'ul-2')?.text.includes('Item 2') },
  { n: "35. UL nested subitem 2.1",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'ul-2-1')?.text === 'Subitem 2.1' },
  { n: "36. UL nested subitem 2.2",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'ul-2-2')?.text === 'Subitem 2.2' },
  { n: "37. UL item 3 exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'ul-3')?.text === 'Item 3' },
  // Ordered list
  { n: "38. Ordered list exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'ordered-list')?.tag === 'ol' },
  { n: "39. OL item 1 exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'ol-1')?.text === 'First' },
  { n: "40. OL item 2 exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'ol-2')?.text.includes('Second') },
  { n: "41. OL nested sub a",                            assert: (ast: DistilledNode[]) => findNodeById(ast, 'ol-2-a')?.text === 'Sub a' },
  { n: "42. OL nested sub b",                            assert: (ast: DistilledNode[]) => findNodeById(ast, 'ol-2-b')?.text === 'Sub b' },
  { n: "43. OL item 3 exists",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'ol-3')?.text === 'Third' },
  // Definition list
  { n: "44. Definition list exists",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'definition-list')?.tag === 'dl' },
  { n: "45. DT HTML exists",                             assert: (ast: DistilledNode[]) => findNodeById(ast, 'dt-html')?.tag === 'dt' },
  { n: "46. DT HTML text",                               assert: (ast: DistilledNode[]) => findNodeById(ast, 'dt-html')?.text === 'HTML' },
  { n: "47. DD HTML text",                               assert: (ast: DistilledNode[]) => findNodeById(ast, 'dd-html')?.tag === 'dd' },
  { n: "48. DD HTML definition",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'dd-html')?.text === 'HyperText Markup Language' },
  { n: "49. DT CSS exists",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'dt-css')?.text === 'CSS' },
  { n: "50. DD CSS definition",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'dd-css')?.text === 'Cascading Style Sheets' },
  { n: "51. DT JS exists",                               assert: (ast: DistilledNode[]) => findNodeById(ast, 'dt-js')?.text === 'JavaScript' },
  { n: "52. DD JS definition",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'dd-js')?.text === 'Programming language of the web' },
  // Nav list
  { n: "53. Nav list home is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'nl-home')?.interactable === true },
  { n: "54. Nav list products is interactable",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'nl-products')?.interactable === true },
  { n: "55. Nav list about is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'nl-about')?.interactable === true },
  { n: "56. Nav list contact is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'nl-contact')?.interactable === true },
  // Mixed content
  { n: "57. Mixed content div exists",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'mixed-content')?.tag === 'div' },
  { n: "58. Mixed li 1 exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'mix-li-1')?.text === 'Mixed item 1' },
  { n: "59. Mixed li 2 exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'mix-li-2')?.text === 'Mixed item 2' },
  { n: "60. No script/style leaked",                     assert: (ast: DistilledNode[]) => {
    let ok = true;
    const walk = (nodes: DistilledNode[]) => { for (const n of nodes) { if (n.tag === 'script' || n.tag === 'style') ok = false; walk(n.children); } };
    walk(ast);
    return ok;
  }},
];

describe('Tables & Lists Lab', () => {
  it('should pass all tables and lists traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'Tables & Lists Lab',
      TABLES_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 TABLES & LISTS FLAWLESS — Structure mastered!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} tables/lists trap(s) failed`);
  });
});
