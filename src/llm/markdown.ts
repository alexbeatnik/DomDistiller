import type { DistilledNode, MarkdownOptions } from '../types';

const DEFAULT_COLUMNS = ['role', 'text', 'locator', 'tag', 'editable'];

function nodeToRow(node: DistilledNode, columns: string[]): string {
  const cells = columns.map((col) => {
    let val: string;
    switch (col) {
      case 'role':
        val = node.role;
        break;
      case 'text':
        val = node.text || '-';
        break;
      case 'locator':
        val = node.locator;
        break;
      case 'tag':
        val = node.tag;
        break;
      case 'editable':
        val = node.editable ? 'true' : 'false';
        break;
      case 'interactable':
        val = node.interactable ? 'true' : 'false';
        break;
      case 'disabled':
        val = node.disabled ? 'true' : 'false';
        break;
      case 'checked':
        val = node.checked ? 'true' : 'false';
        break;
      case 'confidence':
        val = node.locatorStrategy.confidence;
        break;
      case 'semanticContext':
        val = node.semanticContext?.label || '-';
        break;
      case 'relations':
        val = node.relations.map((r) => r.type).join(', ') || '-';
        break;
      case 'alias':
        val = node.alias || '-';
        break;
      case 'intent':
        val = node.semanticContext?.intent || '-';
        break;
      case 'suggestedActions':
        val = node.suggestedActions?.map((a) => `${a.type}(${a.targetAlias})`).join(', ') || '-';
        break;
      default:
        val = node.attributes[col] || '-';
    }
    // Escape pipe characters in markdown
    return (val || '-').replace(/\|/g, '\\|').slice(0, 80);
  });
  return '| ' + cells.join(' | ') + ' |';
}

/**
 * Convert AST nodes to a compact Markdown table suitable for LLM prompts.
 */
export function astToMarkdown(
  ast: DistilledNode[],
  options: MarkdownOptions = {}
): string {
  const columns = options.columns || DEFAULT_COLUMNS;
  const maxRows = options.maxRows ?? Infinity;

  const header = '| ' + columns.join(' | ') + ' |';
  const separator = '|' + columns.map(() => '------').join('|') + '|';

  const rows: string[] = [];

  function walk(nodes: DistilledNode[]) {
    for (const node of nodes) {
      if (rows.length >= maxRows) return;
      rows.push(nodeToRow(node, columns));
      walk(node.children);
    }
  }

  walk(ast);

  return [header, separator, ...rows].join('\n');
}
