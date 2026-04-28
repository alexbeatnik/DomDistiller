import type { DistilledNode } from '../types';

const MEANINGFUL_TAGS = new Set([
  'nav', 'main', 'article', 'section', 'aside', 'header', 'footer',
  'form', 'fieldset', 'ul', 'ol', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'li', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'dialog', 'menu',
]);

export function isMeaninglessWrapper(node: DistilledNode): boolean {
  if (node.interactable) return false;
  if (node.editable) return false;
  if (node.tag === 'body' || node.tag === 'html') return false;
  if (MEANINGFUL_TAGS.has(node.tag)) return false;
  if (node.text && node.text.trim().length > 0) return false;
  if (node.locator && node.locator.length > 0 && !node.locator.startsWith('xpath=')) return false;
  if (node.role && node.role !== node.tag && node.role !== 'presentation' && node.role !== 'none') return false;
  if (node.relations.length > 0) return false;
  return true;
}

export function flattenNodes(nodes: DistilledNode[]): DistilledNode[] {
  const result: DistilledNode[] = [];
  for (const node of nodes) {
    const flatChildren = flattenNodes(node.children);
    if (isMeaninglessWrapper(node)) {
      result.push(...flatChildren);
    } else {
      node.children = flatChildren;
      result.push(node);
    }
  }
  return result;
}

export function pruneEmpty(nodes: DistilledNode[]): DistilledNode[] {
  return nodes.filter((n) => {
    if (n.children.length > 0) {
      n.children = pruneEmpty(n.children);
    }
    return (
      n.interactable ||
      n.editable ||
      (n.text && n.text.trim().length > 0) ||
      n.children.length > 0 ||
      Object.keys(n.attributes).length > 0 ||
      n.relations.length > 0
    );
  });
}
