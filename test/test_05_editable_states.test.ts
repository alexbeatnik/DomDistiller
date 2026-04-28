import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// EDITABLE & STATE LAB — Input Types, Readonly, Disabled, Checked Gauntlet
//
// Validates:
// 1. Editable detection for text, email, password, number, search, date, textarea
// 2. Non-editable inputs: button, submit, reset, checkbox, radio, file, hidden, image
// 3. Disabled state propagation
// 4. Checked state for checkbox and radio
// 5. Readonly prevents editable flag
// 6. contenteditable="true" on div makes it editable
// 7. select and option handling
// ─────────────────────────────────────────────────────────────────────────────

const EDITABLE_DOM = `
<!DOCTYPE html><html><head><title>Editable & State Lab</title></head><body>

<!-- Group 1: editable text inputs -->
<input id="inp_text"     type="text"     placeholder="Name">
<input id="inp_email"    type="email"    placeholder="Email">
<input id="inp_password" type="password" placeholder="Password">
<input id="inp_number"   type="number"   placeholder="Age">
<input id="inp_search"   type="search"   placeholder="Search">
<input id="inp_date"     type="date">
<input id="inp_tel"      type="tel"      placeholder="Phone">
<input id="inp_url"      type="url"      placeholder="Website">

<!-- Group 2: non-editable input types -->
<input id="inp_button"  type="button"  value="Click">
<input id="inp_submit"  type="submit"  value="Send">
<input id="inp_reset"   type="reset"   value="Reset">
<input id="inp_checkbox" type="checkbox">
<input id="inp_radio"   type="radio">
<input id="inp_file"    type="file">
<input id="inp_hidden"  type="hidden">
<input id="inp_image"   type="image"   alt="Go">

<!-- Group 3: textarea -->
<textarea id="ta_normal" placeholder="Comments"></textarea>

<!-- Group 4: disabled inputs -->
<input id="inp_disabled_text"  type="text"     disabled placeholder="Disabled">
<input id="inp_disabled_btn"   type="button"   disabled value="Disabled">
<select id="sel_disabled" disabled><option>A</option></select>
<textarea id="ta_disabled" disabled></textarea>

<!-- Group 5: readonly inputs -->
<input id="inp_readonly_text"  type="text"     readonly value="Readonly">
<input id="inp_readonly_num"   type="number"   readonly value="42">

<!-- Group 6: checked states -->
<input id="chk_on"  type="checkbox" checked>
<input id="chk_off" type="checkbox">
<input id="rad_on"  type="radio" name="grp" checked>
<input id="rad_off" type="radio" name="grp">

<!-- Group 7: aria-checked on role=checkbox div -->
<div id="role_chk_on"  role="checkbox" aria-checked="true">Accept</div>
<div id="role_chk_off" role="checkbox" aria-checked="false">Decline</div>

<!-- Group 8: contenteditable div -->
<div id="wysiwyg" contenteditable="true">Edit me</div>

<!-- Group 9: select -->
<select id="sel_normal"><option>Red</option><option>Blue</option></select>

<!-- Group 10: mixed attributes -->
<input id="mixed_email" type="email" name="email" aria-label="Work Email" placeholder="work@example.com">

</body></html>
`;

const TRAPS = [
  // ── Group 1: editable text inputs ──
  { n: "1. text input is editable",       assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_text')?.editable === true },
  { n: "2. email input is editable",      assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_email')?.editable === true },
  { n: "3. password input is editable",   assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_password')?.editable === true },
  { n: "4. number input is editable",     assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_number')?.editable === true },
  { n: "5. search input is editable",     assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_search')?.editable === true },
  { n: "6. date input is editable",       assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_date')?.editable === true },
  { n: "7. tel input is editable",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_tel')?.editable === true },
  { n: "8. url input is editable",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_url')?.editable === true },

  // ── Group 2: non-editable input types ──
  { n: "9. button input is NOT editable",  assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_button')?.editable === false },
  { n: "10. submit input is NOT editable", assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_submit')?.editable === false },
  { n: "11. reset input is NOT editable",  assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_reset')?.editable === false },
  { n: "12. checkbox is NOT editable",     assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_checkbox')?.editable === false },
  { n: "13. radio is NOT editable",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_radio')?.editable === false },
  { n: "14. file input is NOT editable",   assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_file')?.editable === false },
  { n: "15. hidden input is NOT interactable", assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_hidden') === undefined },
  { n: "16. image input is NOT editable",  assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_image')?.editable === false },

  // ── Group 3: textarea ──
  { n: "17. textarea is editable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'ta_normal')?.editable === true },

  // ── Group 4: disabled inputs ──
  { n: "18. disabled text has disabled=true",    assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_disabled_text')?.disabled === true },
  { n: "19. disabled text is NOT editable",       assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_disabled_text')?.editable === false },
  { n: "20. disabled button has disabled=true",   assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_disabled_btn')?.disabled === true },
  { n: "21. disabled select has disabled=true",   assert: (ast: DistilledNode[]) => findNodeById(ast, 'sel_disabled')?.disabled === true },
  { n: "22. disabled textarea has disabled=true", assert: (ast: DistilledNode[]) => findNodeById(ast, 'ta_disabled')?.disabled === true },

  // ── Group 5: readonly inputs ──
  { n: "23. readonly text is NOT editable",       assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_readonly_text')?.editable === false },
  { n: "24. readonly number is NOT editable",     assert: (ast: DistilledNode[]) => findNodeById(ast, 'inp_readonly_num')?.editable === false },

  // ── Group 6: checked states ──
  { n: "25. checked checkbox has checked=true",   assert: (ast: DistilledNode[]) => findNodeById(ast, 'chk_on')?.checked === true },
  { n: "26. unchecked checkbox has checked=false",assert: (ast: DistilledNode[]) => findNodeById(ast, 'chk_off')?.checked === false },
  { n: "27. checked radio has checked=true",      assert: (ast: DistilledNode[]) => findNodeById(ast, 'rad_on')?.checked === true },
  { n: "28. unchecked radio has checked=false",   assert: (ast: DistilledNode[]) => findNodeById(ast, 'rad_off')?.checked === false },

  // ── Group 7: aria-checked on div ──
  { n: "29. role=checkbox aria-checked=true",     assert: (ast: DistilledNode[]) => findNodeById(ast, 'role_chk_on')?.checked === true },
  { n: "30. role=checkbox aria-checked=false",    assert: (ast: DistilledNode[]) => findNodeById(ast, 'role_chk_off')?.checked === false },

  // ── Group 8: contenteditable ──
  { n: "31. contenteditable div is editable",     assert: (ast: DistilledNode[]) => findNodeById(ast, 'wysiwyg')?.editable === true },

  // ── Group 9: select ──
  { n: "32. select is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'sel_normal')?.interactable === true },
  { n: "33. select is NOT editable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'sel_normal')?.editable === false },

  // ── Group 10: mixed attributes ──
  { n: "34. mixed email has all stable attrs",    assert: (ast: DistilledNode[]) => {
    const n = findNodeById(ast, 'mixed_email');
    return n !== undefined && n.attributes.type === 'email' && n.attributes.name === 'email' &&
           n.attributes['aria-label'] === 'Work Email' && n.attributes.placeholder === 'work@example.com';
  }},
];

describe('Editable & State Lab', () => {
  it('should pass all editable and state traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'Editable & State Lab',
      EDITABLE_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 EDITABLE & STATE FLAWLESS — Input detection is airtight!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} editable/state trap(s) failed`);
  });
});
