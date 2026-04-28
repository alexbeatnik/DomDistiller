import type { Page } from 'playwright-core';
import { distillScript } from './generated/script';
import type { DistilledNode, DistillOptions, LocatorStrategy, NodeRelation, SemanticContext, SuggestedAction } from './types';

export { distillScript };
export type { DistilledNode, DistillOptions, LocatorStrategy, NodeRelation, SemanticContext, SuggestedAction };

// LLM helpers
export { astToMarkdown } from './llm/markdown';
export {
  flattenAST,
  getInteractable,
  getEditable,
  findControls,
  findControl,
  resolveIntent,
} from './llm/query';
export {
  controlToPlaywrightLocator,
  controlToPlaywrightSelfHealingLocator,
  describePage,
} from './llm/playwright';

/**
 * Typed Playwright helper. Injects the distiller script into the page and
 * returns the cleaned DOM AST in a single round-trip.
 *
 * The script defines `window.domDistiller(options)`. We load it via
 * `addScriptTag` (a separate call from `evaluate`) because Playwright can
 * hang on named function declarations inside `page.evaluate()` strings.
 */
export async function distillPage(
  page: Page,
  options?: DistillOptions
): Promise<DistilledNode[]> {
  await page.addScriptTag({ content: distillScript });
  return page.evaluate(
    (opts) => (window as unknown as { domDistiller: (o?: DistillOptions) => DistilledNode[] }).domDistiller(opts),
    options ?? {}
  );
}
