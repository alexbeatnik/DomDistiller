import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByLocator } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// DISAMBIGUATION LAB — Distinguishing Similar Elements Gauntlet
//
// Validates that DomDistiller produces unique, stable locators for
// elements that share the same visible text but differ in attributes:
// 1. Antonym pairs (Increase/Decrease, Yes/No, Next/Previous)
// 2. String containment (Follow/Following, Save/Save Changes)
// 3. Ordinal specificity (Episode 1 vs Episode 2)
// 4. Multiple identical-text buttons with different data-testid
// 5. Container div vs specific button inside it
// 6. ARIA label disambiguation
// ─────────────────────────────────────────────────────────────────────────────

const DISAMBIGUATION_DOM = `
<!DOCTYPE html><html><head><title>Disambiguation Lab</title></head><body>

<!-- Group A: Yes / No radio pairs -->
<fieldset>
  <legend>Account Active?</legend>
  <input type="radio" id="rad_yes" name="active" value="yes"><label for="rad_yes">Yes</label>
  <input type="radio" id="rad_no" name="active" value="no"><label for="rad_no">No</label>
</fieldset>

<!-- Group B: Increase / Decrease counters (no id, only aria-label) -->
<div>
  Adults
  <button aria-label="Decrease Adults">-</button>
  <span>2</span>
  <button aria-label="Increase Adults">+</button>
</div>

<!-- Group C: Next / Previous navigation (no id, only aria-label) -->
<nav>
  <button aria-label="Previous Page">&lt; Prev</button>
  <button aria-label="Next Page">Next &gt;</button>
</nav>

<!-- Group D: Enable / Disable -->
<button id="btn_enable"  >Enable Notifications</button>
<button id="btn_disable" >Disable Notifications</button>

<!-- Group E: Follow / Following / Unfollow -->
<button id="btn_follow"    class="btn-follow">Follow</button>
<button id="btn_following" class="btn-following">Following</button>
<button id="btn_unfollow"  class="btn-unfollow">Unfollow</button>

<!-- Group F: Save variants -->
<button id="btn_save">Save</button>
<button id="btn_save_changes">Save Changes</button>
<button id="btn_save_draft">Save Draft</button>
<button id="btn_save_template">Save as Template</button>

<!-- Group G: Identical text, different data-testid -->
<button id="btn_conf_1" data-testid="confirm-delete">Confirm</button>
<button id="btn_conf_2" data-testid="confirm-archive">Confirm</button>
<button id="btn_conf_3" data-testid="confirm-merge">Confirm</button>

<!-- Group H: Container vs button -->
<div id="container_actions">
  <button id="btn_edit">Edit</button>
  <button id="btn_delete">Delete</button>
</div>

<!-- Group I: ARIA label disambiguation (no id) -->
<button aria-label="Save playlist">Save</button>
<button aria-label="Save to playlist">Save</button>

<!-- Group J: Episode buttons -->
<button id="btn_ep1">Play Episode 1</button>
<button id="btn_ep2">Play Episode 2</button>
<button id="btn_ep_all">Play All</button>

<!-- Group K: Sort variants -->
<button id="btn_sort_asc">Sort Ascending</button>
<button id="btn_sort_desc">Sort Descending</button>

</body></html>
`;

function findNodeByAriaLabel(ast: DistilledNode[], label: string): DistilledNode | undefined {
  const queue = [...ast];
  while (queue.length) {
    const node = queue.shift()!;
    if (node.attributes['aria-label'] === label) return node;
    queue.push(...node.children);
  }
  return undefined;
}

const TRAPS = [
  // ── Group A: Yes / No ──
  {
    n: "1. Yes radio has unique id locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'rad_yes');
      return node !== undefined && node.locator === 'id=rad_yes';
    },
  },
  {
    n: "2. No radio has unique id locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'rad_no');
      return node !== undefined && node.locator === 'id=rad_no';
    },
  },
  // ── Group B: Increase / Decrease ──
  {
    n: "3. Decrease Adults has aria-label locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByAriaLabel(ast, 'Decrease Adults');
      return node !== undefined && node.locator === 'aria-label=Decrease Adults';
    },
  },
  {
    n: "4. Increase Adults has aria-label locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByAriaLabel(ast, 'Increase Adults');
      return node !== undefined && node.locator === 'aria-label=Increase Adults';
    },
  },
  // ── Group C: Next / Previous ──
  {
    n: "5. Previous Page has aria-label locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByAriaLabel(ast, 'Previous Page');
      return node !== undefined && node.locator === 'aria-label=Previous Page';
    },
  },
  {
    n: "6. Next Page has aria-label locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByAriaLabel(ast, 'Next Page');
      return node !== undefined && node.locator === 'aria-label=Next Page';
    },
  },
  // ── Group D: Enable / Disable ──
  {
    n: "7. Enable Notifications has id locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'btn_enable');
      return node !== undefined && node.locator === 'id=btn_enable';
    },
  },
  {
    n: "8. Disable Notifications has id locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'btn_disable');
      return node !== undefined && node.locator === 'id=btn_disable';
    },
  },
  // ── Group E: Follow variants ──
  {
    n: "9. Follow button has unique id",
    assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn_follow')?.locator === 'id=btn_follow',
  },
  {
    n: "10. Following button has unique id",
    assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn_following')?.locator === 'id=btn_following',
  },
  {
    n: "11. Unfollow button has unique id",
    assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn_unfollow')?.locator === 'id=btn_unfollow',
  },
  // ── Group F: Save variants ──
  {
    n: "12. Save has id locator",
    assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn_save')?.locator === 'id=btn_save',
  },
  {
    n: "13. Save Changes has id locator",
    assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn_save_changes')?.locator === 'id=btn_save_changes',
  },
  {
    n: "14. Save Draft has id locator",
    assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn_save_draft')?.locator === 'id=btn_save_draft',
  },
  // ── Group G: Identical text, different data-testid ──
  {
    n: "15. Confirm-delete has data-testid locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'btn_conf_1');
      return node !== undefined && node.locator === 'data-testid=confirm-delete';
    },
  },
  {
    n: "16. Confirm-archive has data-testid locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'btn_conf_2');
      return node !== undefined && node.locator === 'data-testid=confirm-archive';
    },
  },
  {
    n: "17. Confirm-merge has data-testid locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeById(ast, 'btn_conf_3');
      return node !== undefined && node.locator === 'data-testid=confirm-merge';
    },
  },
  // ── Group H: Container vs button ──
  {
    n: "18. Container div exists but is not interactable",
    assert: (ast: DistilledNode[]) => {
      const container = findNodeById(ast, 'container_actions');
      const edit = findNodeById(ast, 'btn_edit');
      const del = findNodeById(ast, 'btn_delete');
      return container !== undefined && container.interactable === false &&
             edit !== undefined && edit.interactable === true &&
             del !== undefined && del.interactable === true;
    },
  },
  // ── Group I: ARIA label disambiguation ──
  {
    n: "19. Save playlist has aria-label locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByAriaLabel(ast, 'Save playlist');
      return node !== undefined && node.locator === 'aria-label=Save playlist';
    },
  },
  {
    n: "20. Save to playlist has aria-label locator",
    assert: (ast: DistilledNode[]) => {
      const node = findNodeByAriaLabel(ast, 'Save to playlist');
      return node !== undefined && node.locator === 'aria-label=Save to playlist';
    },
  },
  // ── Group J: Episode buttons ──
  {
    n: "21. Play Episode 1 has id locator",
    assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn_ep1')?.locator === 'id=btn_ep1',
  },
  {
    n: "22. Play Episode 2 has id locator",
    assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn_ep2')?.locator === 'id=btn_ep2',
  },
  // ── Group K: Sort variants ──
  {
    n: "23. Sort Ascending has id locator",
    assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn_sort_asc')?.locator === 'id=btn_sort_asc',
  },
  {
    n: "24. Sort Descending has id locator",
    assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn_sort_desc')?.locator === 'id=btn_sort_desc',
  },
  // ── Meta: all Confirm buttons have unique locators ──
  {
    n: "25. All three Confirm buttons have different locators",
    assert: (ast: DistilledNode[]) => {
      const n1 = findNodeById(ast, 'btn_conf_1');
      const n2 = findNodeById(ast, 'btn_conf_2');
      const n3 = findNodeById(ast, 'btn_conf_3');
      return n1 !== undefined && n2 !== undefined && n3 !== undefined &&
             n1.locator !== n2.locator && n2.locator !== n3.locator && n1.locator !== n3.locator;
    },
  },
];

describe('Disambiguation Lab', () => {
  it('should pass all disambiguation traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'Disambiguation Lab',
      DISAMBIGUATION_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 DISAMBIGUATION FLAWLESS — Unique locators for every element!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} disambiguation trap(s) failed`);
  });
});
