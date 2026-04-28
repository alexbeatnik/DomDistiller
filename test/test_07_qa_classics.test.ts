import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, collectIds } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// QA CLASSICS LAB — Rahul Shetty & Blogspot Automation Practice
//
// Validates extraction on classic QA teaching-page patterns:
// radio buttons, suggestion class inputs, dropdowns, checkboxes,
// alerts, show/hide, web tables, date pickers, Wikipedia search,
// double-click, drag-and-drop, HTML tables.
// ─────────────────────────────────────────────────────────────────────────────

const CLASSICS_DOM = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .tableFixHead { overflow: auto; height: 100px; }
        .mouse-hover-content { display: none; position: absolute; background-color: #f9f9f9; }
        .mouse-hover:hover .mouse-hover-content { display: block; }
    </style>
</head>
<body>

<h1>Rahul Shetty Academy - Automation Practice</h1>

<div id="radio-btn-example">
    <fieldset>
        <legend>Radio Button Example</legend>
        <label><input value="radio1" name="radioButton" type="radio" id="rs_rad1"> Radio1</label>
        <label><input value="radio2" name="radioButton" type="radio" id="rs_rad2"> Radio2</label>
        <label><input value="radio3" name="radioButton" type="radio" id="rs_rad3"> Radio3</label>
    </fieldset>
</div>

<div id="select-class-example">
    <fieldset>
        <legend>Suggession Class Example</legend>
        <input type="text" id="autocomplete" placeholder="Type to Select Countries">
    </fieldset>
</div>

<div id="dropdown-example">
    <fieldset>
        <legend>Dropdown Example</legend>
        <select id="dropdown-class-example" name="dropdown-class-example">
            <option value="">Select</option>
            <option value="option1">Option1</option>
            <option value="option2">Option2</option>
            <option value="option3">Option3</option>
        </select>
    </fieldset>
</div>

<div id="checkbox-example">
    <fieldset>
        <legend>Checkbox Example</legend>
        <label><input id="checkBoxOption1" value="option1" type="checkbox"> Option1</label>
        <label><input id="checkBoxOption2" value="option2" type="checkbox"> Option2</label>
        <label><input id="checkBoxOption3" value="option3" type="checkbox"> Option3</label>
    </fieldset>
</div>

<div id="alert-example">
    <fieldset>
        <legend>Switch To Alert Example</legend>
        <input id="name" name="enter-name" placeholder="Enter Your Name" type="text">
        <input id="alertbtn" value="Alert" type="button">
        <input id="confirmbtn" value="Confirm" type="button">
    </fieldset>
</div>

<div id="element-displayed-example">
    <fieldset>
        <legend>Element Displayed Example</legend>
        <input id="hide-textbox" value="Hide" type="button">
        <input id="show-textbox" value="Show" type="button">
        <input id="displayed-text" name="show-hide" placeholder="Hide/Show Example" type="text">
    </fieldset>
</div>

<div class="table-example">
    <fieldset>
        <legend>Web Table Example</legend>
        <table id="product" name="courses" border="1" cellpadding="5">
            <tbody>
                <tr><th>Instructor</th><th>Course</th><th>Price</th></tr>
                <tr><td>Rahul Shetty</td><td>Selenium Webdriver</td><td>30</td></tr>
                <tr><td>Rahul Shetty</td><td>Learn SQL</td><td>25</td></tr>
            </tbody>
        </table>
    </fieldset>
</div>

<div class="mouse-hover">
    <button id="mousehover">Mouse Hover</button>
    <div class="mouse-hover-content">
        <a href="#top" id="rs_top">Top</a>
        <a href="" id="rs_reload">Reload</a>
    </div>
</div>

<hr>
<h1>TestAutomationPractice Blogspot</h1>

<div class="widget-content">
    <label for="Wikipedia1_wikipedia-search-input">Wikipedia Search:</label>
    <input id="Wikipedia1_wikipedia-search-input" type="text">
    <input type="button" value="🔍" id="bs_wiki_btn">
</div>

<button id="bs_new_window">New Browser Window</button>

<div class="form-group">
    <label>Date Picker:</label>
    <input type="text" id="datepicker">
</div>

<div class="form-group">
    <label for="speed">Select Speed</label>
    <select name="speed" id="speed">
        <option value="Slow">Slow</option>
        <option value="Medium" selected>Medium</option>
        <option value="Fast">Fast</option>
    </select>
</div>

<div class="form-group">
    <label for="files">Select a file</label>
    <select name="files" id="files">
        <option value="jquery">jQuery.js</option>
        <option value="ui">ui.jQuery.js</option>
    </select>
</div>

<div class="form-group">
    <p>Double Click Example</p>
    <button id="bs_dbl_click">Copy Text</button>
    <input type="text" id="bs_field1" value="Hello World">
    <input type="text" id="bs_field2">
</div>

<div class="table-container">
    <h2>HTML Table</h2>
    <table name="BookTable" id="BookTable" border="1">
        <tbody>
            <tr><th>BookName</th><th>Author</th><th>Subject</th><th>Price</th></tr>
            <tr><td>Learn Selenium</td><td>Amit</td><td>Selenium</td><td>300</td></tr>
            <tr><td>Learn Java</td><td>Mukesh</td><td>Java</td><td>500</td></tr>
        </tbody>
    </table>
</div>

</body>
</html>
`;

const TRAPS = [
  // ── Rahul Shetty Academy ──
  { n: "1. Radio2 input is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'rs_rad2')?.interactable === true },
  { n: "2. Autocomplete input is editable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'autocomplete')?.editable === true },
  { n: "3. Dropdown select is interactable",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'dropdown-class-example')?.interactable === true },
  { n: "4. Checkbox Option1 is interactable",       assert: (ast: DistilledNode[]) => findNodeById(ast, 'checkBoxOption1')?.interactable === true },
  { n: "5. Checkbox Option2 is interactable",       assert: (ast: DistilledNode[]) => findNodeById(ast, 'checkBoxOption2')?.interactable === true },
  { n: "6. Name input is editable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'name')?.editable === true },
  { n: "7. Alert button is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'alertbtn')?.interactable === true },
  { n: "8. Confirm button is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'confirmbtn')?.interactable === true },
  { n: "9. Hide button is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'hide-textbox')?.interactable === true },
  { n: "10. Show button is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'show-textbox')?.interactable === true },
  { n: "11. Displayed text input is editable",      assert: (ast: DistilledNode[]) => findNodeById(ast, 'displayed-text')?.editable === true },
  { n: "12. Web table has rows",                    assert: (ast: DistilledNode[]) => {
    const table = findNodeById(ast, 'product');
    return table !== undefined && table.children.length > 0;
  }},
  { n: "13. Mouse hover button is interactable",    assert: (ast: DistilledNode[]) => findNodeById(ast, 'mousehover')?.interactable === true },
  { n: "14. Top link in hover menu hidden (no hover)",assert: (ast: DistilledNode[]) => findNodeById(ast, 'rs_top') === undefined },
  // ── Blogspot ──
  { n: "15. Wikipedia search input is editable",    assert: (ast: DistilledNode[]) => findNodeById(ast, 'Wikipedia1_wikipedia-search-input')?.editable === true },
  { n: "16. Wiki search button is interactable",    assert: (ast: DistilledNode[]) => findNodeById(ast, 'bs_wiki_btn')?.interactable === true },
  { n: "17. New window button is interactable",     assert: (ast: DistilledNode[]) => findNodeById(ast, 'bs_new_window')?.interactable === true },
  { n: "18. Datepicker input is editable",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'datepicker')?.editable === true },
  { n: "19. Speed select is interactable",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'speed')?.interactable === true },
  { n: "20. Files select is interactable",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'files')?.interactable === true },
  { n: "21. Double click button is interactable",   assert: (ast: DistilledNode[]) => findNodeById(ast, 'bs_dbl_click')?.interactable === true },
  { n: "22. Field1 input is editable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'bs_field1')?.editable === true },
  { n: "23. Field2 input is editable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'bs_field2')?.editable === true },
  { n: "24. BookTable exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'BookTable') !== undefined },
  { n: "25. No script/style tags leaked",           assert: (ast: DistilledNode[]) => {
    const ids = collectIds(ast);
    return !ids.has('script') && !ids.has('style');
  }},
];

describe('QA Classics Lab', () => {
  it('should pass all classic QA automation traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'QA Classics Lab',
      CLASSICS_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 QA CLASSICS FLAWLESS — Classic patterns mastered!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} QA classic trap(s) failed`);
  });
});
