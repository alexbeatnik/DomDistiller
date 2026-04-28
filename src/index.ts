import type { Page } from 'playwright-core';
import { distillScript } from './generated/script';
import type { DistilledNode, DistillOptions } from './types';

export { distillScript };
export type { DistilledNode, DistillOptions };

// LLM helpers
export { astToMarkdown } from './llm/markdown';
export {
  flattenAST,
  getInteractable,
  getEditable,
  findControls,
  findControl,
} from './llm/query';
export {
  controlToPlaywrightLocator,
  describePage,
} from './llm/playwright';

/**
 * Typed Playwright helper. Injects the full distiller script into the page
 * and returns the cleaned DOM AST in a single round-trip.
 *
 * Usage:
 *   import { distillPage } from 'dom-distiller';
 *   const ast = await distillPage(page);
 */
export async function distillPage(
  page: Page,
  options?: DistillOptions
): Promise<DistilledNode[]> {
  // Build the script payload that includes options
  const scriptBody = distillScript;

  // We inject via addScriptTag + separate evaluate to avoid Playwright
  // hangs with named function declarations inside page.evaluate().
  await page.addScriptTag({ content: scriptBody });

  return page.evaluate((opts) => {
    return (window as any).domDistiller(opts);
  }, options || {});
}

/**
 * Two-step helper for advanced use-cases.
 * First call `page.evaluate(distillScript)` to populate `window.__domDistillerResult`,
 * then call `distill(page)` to retrieve it.
 */
export async function distill(
  page: Page,
  _options?: DistillOptions
): Promise<DistilledNode[]> {
  return page.evaluate(() => {
    return (window as any).__domDistillerResult;
  });
}
