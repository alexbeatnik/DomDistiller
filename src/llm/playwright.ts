import type { DistilledNode } from '../types';

/**
 * Convert a DistilledNode's primary locator into a Playwright locator string.
 *
 * Examples:
 *   data-testid=login-btn  →  page.locator('[data-testid="login-btn"]')
 *   id=email               →  page.locator('#email')
 *   name=username          →  page.locator('[name="username"]')
 *   aria-label=Search      →  page.locator('[aria-label="Search"]')
 *   placeholder=Type here  →  page.locator('[placeholder="Type here"]')
 *   href=/about            →  page.locator('a[href="/about"]')
 *   xpath=/html/body/...   →  page.locator('xpath=/html/body/...')
 */
export function controlToPlaywrightLocator(node: DistilledNode): string {
  const { locator, tag } = node;

  if (locator.startsWith('data-testid=')) {
    const val = locator.slice('data-testid='.length);
    return `page.locator('[data-testid="${val}"]')`;
  }

  if (locator.startsWith('data-test=')) {
    const val = locator.slice('data-test='.length);
    return `page.locator('[data-test="${val}"]')`;
  }

  if (locator.startsWith('data-qa=')) {
    const val = locator.slice('data-qa='.length);
    return `page.locator('[data-qa="${val}"]')`;
  }

  if (locator.startsWith('id=')) {
    const val = locator.slice('id='.length);
    return `page.locator('#${val}')`;
  }

  if (locator.startsWith('name=')) {
    const val = locator.slice('name='.length);
    return `page.locator('[name="${val}"]')`;
  }

  if (locator.startsWith('aria-label=')) {
    const val = locator.slice('aria-label='.length);
    return `page.locator('[aria-label="${val}"]')`;
  }

  if (locator.startsWith('placeholder=')) {
    const val = locator.slice('placeholder='.length);
    return `page.locator('[placeholder="${val}"]')`;
  }

  if (locator.startsWith('href=')) {
    const val = locator.slice('href='.length);
    return `page.locator('${tag}[href="${val}"]')`;
  }

  if (locator.startsWith('xpath=')) {
    const val = locator.slice('xpath='.length);
    return `page.locator('xpath=${val}')`;
  }

  if (locator.startsWith('title=')) {
    const val = locator.slice('title='.length);
    return `page.locator('[title="${val}"]')`;
  }

  // Fallback: text-based locator for buttons and links
  if (tag === 'button' || tag === 'a' || tag === 'label') {
    return `page.getByText('${node.text}')`;
  }

  // Generic attribute fallback
  return `page.locator('${tag}')`;
}

/**
 * Generate a human-readable description of the page controls.
 */
export function describePage(ast: DistilledNode[]): string {
  const flat = (function walk(nodes: DistilledNode[]): DistilledNode[] {
    const out: DistilledNode[] = [];
    for (const n of nodes) {
      out.push(n);
      out.push(...walk(n.children));
    }
    return out;
  })(ast);

  const interactable = flat.filter((n) => n.interactable);
  const editable = flat.filter((n) => n.editable);

  const byRole = new Map<string, number>();
  for (const n of interactable) {
    byRole.set(n.role, (byRole.get(n.role) || 0) + 1);
  }

  const roleSummary = Array.from(byRole.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([role, count]) => `${count} ${role}${count > 1 ? 's' : ''}`)
    .join(', ');

  const keyControls = interactable
    .slice(0, 5)
    .map((n) => `${n.text || n.role} (${n.locator})`)
    .join(', ');

  return (
    `Page contains ${interactable.length} interactable controls` +
    (editable.length ? ` (${editable.length} editable)` : '') +
    `. Breakdown: ${roleSummary}.` +
    (keyControls ? ` Key controls: ${keyControls}.` : '')
  );
}
