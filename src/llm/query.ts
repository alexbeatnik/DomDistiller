import type { DistilledNode, ControlQuery } from '../types';

/**
 * Recursively flatten AST into a single array of nodes (depth-first).
 */
export function flattenAST(ast: DistilledNode[]): DistilledNode[] {
  const result: DistilledNode[] = [];
  function walk(nodes: DistilledNode[]) {
    for (const n of nodes) {
      result.push(n);
      walk(n.children);
    }
  }
  walk(ast);
  return result;
}

/**
 * Filter nodes that are interactable (buttons, links, inputs, etc.).
 */
export function getInteractable(ast: DistilledNode[]): DistilledNode[] {
  return flattenAST(ast).filter((n) => n.interactable);
}

/**
 * Filter nodes that are editable (text inputs, textareas, contenteditable).
 */
export function getEditable(ast: DistilledNode[]): DistilledNode[] {
  return flattenAST(ast).filter((n) => n.editable);
}

function matchesQuery(node: DistilledNode, query: ControlQuery): boolean {
  if (query.text) {
    const haystack = (node.text + ' ' + node.locator).toLowerCase();
    if (!haystack.includes(query.text.toLowerCase())) return false;
  }
  if (query.role && node.role.toLowerCase() !== query.role.toLowerCase()) {
    return false;
  }
  if (query.tag && node.tag.toLowerCase() !== query.tag.toLowerCase()) {
    return false;
  }
  if (query.locator) {
    if (!node.locator.toLowerCase().includes(query.locator.toLowerCase())) {
      return false;
    }
  }
  return true;
}

/**
 * Fuzzy-search controls in the AST by text, role, tag, or locator substring.
 */
export function findControls(
  ast: DistilledNode[],
  query: ControlQuery
): DistilledNode[] {
  return flattenAST(ast).filter((n) => matchesQuery(n, query));
}

/**
 * Find the single best matching control, or undefined if none found.
 */
export function findControl(
  ast: DistilledNode[],
  query: ControlQuery
): DistilledNode | undefined {
  return findControls(ast, query)[0];
}

/**
 * Resolve an intent by semantic context. Returns all nodes belonging to
 * semantic blocks whose intent or label matches the given intent name.
 *
 * Example:
 *   resolveIntent(ast, 'login') → nodes inside the Login Form semantic block
 */
export function resolveIntent(
  ast: DistilledNode[],
  intentName: string
): DistilledNode[] {
  const needle = intentName.toLowerCase();
  return flattenAST(ast).filter((n) => {
    const ctx = n.semanticContext;
    if (!ctx) return false;
    return (
      (ctx.intent && ctx.intent.toLowerCase() === needle) ||
      ctx.label.toLowerCase().includes(needle)
    );
  });
}
