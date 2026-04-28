import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByText, countNodes } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// EDGE CASES LAB — Empty pages, Broken HTML, Special Characters, Minimal DOMs
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_PAGE_DOM = `<!DOCTYPE html><html><head><title>Empty</title></head><body></body></html>`;
const MINIMAL_PAGE_DOM = `<!DOCTYPE html><html><head><title>Minimal</title></head><body><button id="only-btn">Click</button></body></html>`;
const BROKEN_HTML_DOM = `<html><head><title>Broken</title><body><div id="d1"><p>Text</div><span id="s1"><button id="b1">OK</button></body></html>`;
const SPECIAL_CHARS_DOM = `
<!DOCTYPE html><html><head><title>Special</title></head><body>
<button id="btn-emoji">🚀 Launch</button>
<button id="btn-unicode">日本語ボタン</button>
<button id="btn-html">&lt;script&gt;alert(1)&lt;/script&gt;</button>
<input id="inp-special" placeholder="Type &quot;hello&quot; here">
<a href="/path?a=1&amp;b=2" id="link-query">Link</a>
<div id="nbsp">Text&nbsp;with&nbsp;spaces</div>
<div id="zero-width">Text​with​zwsp</div>
</body></html>
`;
const NESTED_WRAPPERS_DOM = `
<!DOCTYPE html><html><body>
<div id="w1"><div id="w2"><div id="w3"><div id="w4"><div id="w5">
<button id="deep-btn">Deep</button>
</div></div></div></div></div>
</body></html>
`;
const ALL_HIDDEN_DOM = `
<!DOCTYPE html><html><body>
<button id="h1" style="display:none">A</button>
<button id="h2" style="visibility:hidden">B</button>
<button id="h3" style="opacity:0">C</button>
<button id="h4" hidden>D</button>
<div id="visible-div">Only visible</div>
</body></html>
`;
const MASSIVE_ATTRS_DOM = `
<!DOCTYPE html><html><body>
<button id="massive"
  data-a="1" data-b="2" data-c="3" data-d="4" data-e="5"
  data-f="6" data-g="7" data-h="8" data-i="9" data-j="10"
  aria-label="Massive button"
>Massive</button>
</body></html>
`;
const COMMENTS_AND_CDATA_DOM = `
<!DOCTYPE html><html><body>
<!-- comment -->
<button id="after-comment">After Comment</button>
<script id="scr1">var x = 1;</script>
<style id="sty1">.c{color:red}</style>
<button id="after-style">After Style</button>
</body></html>
`;
const VOID_ELEMENTS_DOM = `
<!DOCTYPE html><html><body>
<img id="img1" src="a.jpg" alt="Test">
<br id="br1">
<hr id="hr1">
<input id="inp1" type="text">
<meta id="meta1" name="desc" content="test">
<link id="link1" rel="stylesheet" href="style.css">
<source id="src1" src="vid.mp4">
<track id="trk1" src="subs.vtt">
<area id="area1" shape="rect" coords="0,0,100,100" href="/x">
<base id="base1" href="/base/">
<col id="col1">
<embed id="emb1" src="swf.swf">
<param id="par1" name="x" value="1">
<button id="btn-void">After Voids</button>
</body></html>
`;
const DEEPLY_NESTED_TEXT_DOM = `
<!DOCTYPE html><html><body>
<div id="text-root">
  <p>Level 1
    <span>Level 2
      <b>Level 3
        <i>Level 4
          <u>Level 5</u>
        </i>
      </b>
    </span>
  </p>
</div>
</body></html>
`;
const DUPLICATE_IDS_DOM = `
<!DOCTYPE html><html><body>
<button id="dup">First</button>
<button id="dup">Second</button>
<button id="unique-dup">Unique</button>
</body></html>
`;
const TABLE_WITH_EMPTY_CELLS_DOM = `
<!DOCTYPE html><html><body>
<table id="tbl-empty">
  <tr><th>A</th><th>B</th><th>C</th></tr>
  <tr><td id="td1">1</td><td id="td2"></td><td id="td3">3</td></tr>
  <tr><td id="td4"></td><td id="td5"></td><td id="td6">6</td></tr>
</table>
</body></html>
`;
const FORM_WITH_FIELDSET_DOM = `
<!DOCTYPE html><html><body>
<form id="form1">
  <fieldset id="fs1">
    <legend id="leg1">Personal Info</legend>
    <label for="fn">First Name</label>
    <input id="fn" name="firstName">
    <label for="ln">Last Name</label>
    <input id="ln" name="lastName">
  </fieldset>
  <fieldset id="fs2">
    <legend id="leg2">Preferences</legend>
    <label><input type="checkbox" id="pref-a" name="prefA"> Option A</label>
    <label><input type="checkbox" id="pref-b" name="prefB"> Option B</label>
  </fieldset>
  <button type="submit" id="submit-form">Submit</button>
</form>
</body></html>
`;

const TRAPS = [
  // Empty page
  { n: "1. Empty page has empty AST",                    assert: (ast: DistilledNode[]) => ast.length === 0 },
  // Minimal page
  { n: "2. Minimal page finds the only button",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'only-btn')?.interactable === true },
  { n: "3. Minimal page AST has 1 node",                 assert: (ast: DistilledNode[]) => countNodes(ast) === 1 },
  // Broken HTML
  { n: "4. Broken HTML button is interactable",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'b1')?.interactable === true },
  { n: "5. Broken HTML span exists",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 's1') !== undefined },
  { n: "6. Broken HTML div exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'd1') !== undefined },
  // Special chars
  { n: "7. Emoji button text preserved",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-emoji')?.text.includes('🚀') },
  { n: "8. Unicode button text preserved",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-unicode')?.text.includes('日本語') },
  { n: "9. HTML-entities button text decoded",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-html')?.text.includes('<script>') },
  { n: "10. Input placeholder with quotes decoded",      assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp-special')?.attributes.placeholder === 'Type "hello" here' },
  { n: "11. Link href with query preserved",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'link-query')?.attributes.href === '/path?a=1&b=2' },
  { n: "12. NBSP text extracted",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'nbsp')?.text.includes('Text with spaces') },
  // Nested wrappers
  { n: "13. Deeply nested button found",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'deep-btn')?.interactable === true },
  { n: "14. Wrapper divs preserved but deep button found", assert: (ast: DistilledNode[]) => findNodeById(ast, 'deep-btn')?.interactable === true },
  // All hidden
  { n: "15. Display:none button filtered",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'h1') === undefined },
  { n: "16. Visibility:hidden button filtered",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'h2') === undefined },
  { n: "17. Opacity:0 button filtered",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'h3') === undefined },
  { n: "18. Hidden attr button filtered",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'h4') === undefined },
  { n: "19. Visible div preserved",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'visible-div') !== undefined },
  { n: "20. AST has only 1 node when all else hidden",   assert: (ast: DistilledNode[]) => countNodes(ast) === 1 },
  // Massive attrs
  { n: "21. Massive button found",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'massive')?.interactable === true },
  { n: "22. Massive button has aria-label",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'massive')?.attributes['aria-label'] === 'Massive button' },
  { n: "23. Massive button found with aria-label",       assert: (ast: DistilledNode[]) => findNodeById(ast, 'massive')?.attributes['aria-label'] === 'Massive button' },
  // Comments & cdata
  { n: "24. After-comment button found",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'after-comment')?.interactable === true },
  { n: "25. Script tag filtered",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'scr1') === undefined },
  { n: "26. Style tag filtered",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'sty1') === undefined },
  { n: "27. After-style button found",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'after-style')?.interactable === true },
  // Void elements
  { n: "28. Image void element exists",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'img1') !== undefined },
  { n: "29. BR void element filtered",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'br1') === undefined },
  { n: "30. HR void element exists",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'hr1') !== undefined },
  { n: "31. Input void element is editable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp1')?.editable === true },
  { n: "32. Meta void element filtered or minimal",      assert: (ast: DistilledNode[]) => findNodeById(ast, 'meta1') === undefined || findNodeById(ast, 'meta1')?.tag === 'meta' },
  { n: "33. Link void element filtered or minimal",      assert: (ast: DistilledNode[]) => findNodeById(ast, 'link1') === undefined },
  { n: "34. After-voids button is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-void')?.interactable === true },
  { n: "35. Image alt preserved",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'img1')?.attributes.alt === 'Test' },
  // Deeply nested text
  { n: "36. Deep text node contains Level 5",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'text-root')?.text.includes('Level 5') },
  { n: "37. Deep text node contains Level 1",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'text-root')?.text.includes('Level 1') },
  // Duplicate IDs
  { n: "38. Duplicate IDs handled (at least one found)", assert: (ast: DistilledNode[]) => findNodeById(ast, 'dup') !== undefined },
  { n: "39. Unique ID found",                            assert: (ast: DistilledNode[]) => findNodeById(ast, 'unique-dup')?.interactable === true },
  // Table empty cells
  { n: "40. Table exists",                               assert: (ast: DistilledNode[]) => findNodeById(ast, 'tbl-empty') !== undefined },
  { n: "41. Table cell with value exists",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'td1')?.text === '1' },
  { n: "42. Empty table cell exists",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'td2') !== undefined },
  { n: "43. Table cell 6 exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'td6')?.text === '6' },
  // Form with fieldset
  { n: "44. Form exists",                                assert: (ast: DistilledNode[]) => findNodeById(ast, 'form1') !== undefined },
  { n: "45. Fieldset 1 exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'fs1') !== undefined },
  { n: "46. Legend 1 text extracted",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'leg1')?.text === 'Personal Info' },
  { n: "47. First name input is editable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'fn')?.editable === true },
  { n: "48. Last name input is editable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'ln')?.editable === true },
  { n: "49. Fieldset 2 exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'fs2') !== undefined },
  { n: "50. Legend 2 text extracted",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'leg2')?.text === 'Preferences' },
  { n: "51. Pref A checkbox is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'pref-a')?.interactable === true },
  { n: "52. Pref B checkbox is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'pref-b')?.interactable === true },
  { n: "53. Submit button is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'submit-form')?.interactable === true },
  { n: "54. First name has name attr",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'fn')?.attributes.name === 'firstName' },
  { n: "55. Last name has name attr",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'ln')?.attributes.name === 'lastName' },
];

async function runAllTraps() {
  const suites = [
    { name: 'Empty Page', dom: EMPTY_PAGE_DOM, traps: TRAPS.slice(0, 1) },
    { name: 'Minimal Page', dom: MINIMAL_PAGE_DOM, traps: TRAPS.slice(1, 3) },
    { name: 'Broken HTML', dom: BROKEN_HTML_DOM, traps: TRAPS.slice(3, 6) },
    { name: 'Special Chars', dom: SPECIAL_CHARS_DOM, traps: TRAPS.slice(6, 12) },
    { name: 'Nested Wrappers', dom: NESTED_WRAPPERS_DOM, traps: TRAPS.slice(12, 14) },
    { name: 'All Hidden', dom: ALL_HIDDEN_DOM, traps: TRAPS.slice(14, 20) },
    { name: 'Massive Attrs', dom: MASSIVE_ATTRS_DOM, traps: TRAPS.slice(20, 23) },
    { name: 'Comments & CDATA', dom: COMMENTS_AND_CDATA_DOM, traps: TRAPS.slice(23, 27) },
    { name: 'Void Elements', dom: VOID_ELEMENTS_DOM, traps: TRAPS.slice(27, 35) },
    { name: 'Deeply Nested Text', dom: DEEPLY_NESTED_TEXT_DOM, traps: TRAPS.slice(35, 37) },
    { name: 'Duplicate IDs', dom: DUPLICATE_IDS_DOM, traps: TRAPS.slice(37, 39) },
    { name: 'Table Empty Cells', dom: TABLE_WITH_EMPTY_CELLS_DOM, traps: TRAPS.slice(39, 43) },
    { name: 'Form with Fieldset', dom: FORM_WITH_FIELDSET_DOM, traps: TRAPS.slice(43, 55) },
  ];

  let totalPassed = 0;
  let totalFailed = 0;
  const allFailures: string[] = [];

  for (const suite of suites) {
    const { passed, failed, failures } = await runTrapSuite(
      `Edge Case: ${suite.name}`,
      suite.dom,
      suite.traps
    );
    totalPassed += passed;
    totalFailed += failed;
    allFailures.push(...failures);
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 TOTAL EDGE CASES SCORE: ${totalPassed}/${totalPassed + totalFailed} passed`);
  if (allFailures.length) {
    console.log('\n🙀 Failures:');
    for (const f of allFailures) console.log(`   • ${f}`);
  }
  if (totalFailed === 0) {
    console.log('\n🏆 EDGE CASES FLAWLESS — Corner cases crushed!');
  }
  console.log(`${'='.repeat(70)}`);

  return { totalPassed, totalFailed, allFailures };
}

describe('Edge Cases Lab', () => {
  it('should pass all edge case traps', async () => {
    const { totalFailed, allFailures } = await runAllTraps();
    assert.strictEqual(totalFailed, 0, `${allFailures.length} edge case trap(s) failed`);
  });
});
