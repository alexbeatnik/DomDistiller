import type { DistilledNode, DistillOptions, LocatorStrategy, NodeRelation } from '../types';
import { getRect, isVisible } from './visibility';

const INTERACTIVE_TAGS = new Set([
  'button', 'a', 'input', 'select', 'textarea', 'option', 'label',
  'summary', 'details', 'img', 'video', 'audio', 'canvas', 'iframe',
]);

const INTERACTIVE_ROLES = new Set([
  'button', 'link', 'menuitem', 'tab', 'checkbox', 'radio', 'switch',
  'slider', 'spinbutton', 'textbox', 'combobox', 'listbox', 'option',
  'treeitem', 'gridcell', 'columnheader', 'rowheader', 'row', 'cell',
  'searchbox', 'menuitemcheckbox', 'menuitemradio', 'progressbar',
]);

const STABLE_ATTRS = [
  'data-testid', 'data-test', 'data-qa', 'data-id',
  'id', 'name', 'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-controls',
  'placeholder', 'title', 'alt', 'href', 'type', 'value', 'for',
];

export function isInteractive(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (INTERACTIVE_TAGS.has(tag)) return true;

  const role = (el.getAttribute('role') || '').toLowerCase();
  if (INTERACTIVE_ROLES.has(role)) return true;

  if (el.getAttribute('contenteditable') === 'true') return true;
  if (el.hasAttribute('onclick')) return true;
  if ((el as HTMLElement).onclick != null) return true;

  const cursor = window.getComputedStyle(el).cursor;
  if (cursor === 'pointer' && (el as HTMLElement).tabIndex >= 0) return true;

  if (el.tagName.includes('-')) return true; // custom elements

  return false;
}

function normalizeText(text: string, maxLen = 200): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

function getLabelText(el: Element): string {
  if (el.id) {
    const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (lbl) return normalizeText((lbl as HTMLElement).innerText || lbl.textContent || '');
  }

  const parent = el.closest('label');
  if (parent) {
    const clone = parent.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('input,select,textarea').forEach((c) => c.remove());
    return normalizeText(clone.innerText || clone.textContent || '');
  }

  const lblIds = el.getAttribute('aria-labelledby');
  if (lblIds) {
    const text = lblIds
      .split(/\s+/)
      .map((id) => document.getElementById(id))
      .filter((e): e is HTMLElement => e !== null)
      .map((e) => normalizeText(e.innerText || e.textContent || ''))
      .join(' ');
    if (text) return text;
  }

  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) {
    const fieldset = el.closest('fieldset');
    if (fieldset) {
      const legend = fieldset.querySelector('legend');
      if (legend) return normalizeText((legend as HTMLElement).innerText || legend.textContent || '');
    }
  }

  return '';
}

function getAccessibleName(el: Element): string {
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return normalizeText(ariaLabel);

  const labelText = getLabelText(el);
  if (labelText) return labelText;

  const title = el.getAttribute('title');
  if (title) return normalizeText(title);

  const alt = el.getAttribute('alt');
  if (alt) return normalizeText(alt);

  return '';
}

function buildXPath(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;

  while (node && node.nodeType === Node.ELEMENT_NODE) {
    const tag = node.tagName.toLowerCase();
    let idx = 1;
    let sibling = node.previousElementSibling;
    while (sibling) {
      if (sibling.tagName.toLowerCase() === tag) idx++;
      sibling = sibling.previousElementSibling;
    }
    parts.unshift(`${tag}[${idx}]`);
    node = node.parentElement;
  }

  return '/' + parts.join('/');
}

function getStableAttributes(el: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const key of STABLE_ATTRS) {
    const val = el.getAttribute(key);
    if (val && val.trim()) {
      attrs[key] = val.trim();
    }
  }
  return attrs;
}

function buildLocator(el: Element, attrs: Record<string, string>): LocatorStrategy {
  const tag = el.tagName.toLowerCase();
  const fallbacks: string[] = [];

  if (attrs['data-testid']) {
    return { primary: `data-testid=${attrs['data-testid']}`, fallbacks, confidence: 'high' };
  }
  if (attrs['data-test']) {
    return { primary: `data-test=${attrs['data-test']}`, fallbacks, confidence: 'high' };
  }
  if (attrs['data-qa']) {
    return { primary: `data-qa=${attrs['data-qa']}`, fallbacks, confidence: 'high' };
  }

  if (attrs.id && !/^\d/.test(attrs.id) && !/\d{5,}/.test(attrs.id)) {
    return { primary: `id=${attrs.id}`, fallbacks, confidence: 'medium' };
  }

  if (attrs.name) fallbacks.push(`name=${attrs.name}`);
  if (attrs['aria-label']) fallbacks.push(`aria-label=${attrs['aria-label']}`);
  if (attrs.placeholder) fallbacks.push(`placeholder=${attrs.placeholder}`);
  if (tag === 'a' && attrs.href) fallbacks.push(`href=${attrs.href}`);

  fallbacks.push(`xpath=${buildXPath(el)}`);

  const confidence: 'high' | 'medium' | 'low' =
    fallbacks.length > 0 && !fallbacks[0].startsWith('xpath=') ? 'medium' : 'low';

  return { primary: fallbacks[0] || tag, fallbacks: fallbacks.slice(1), confidence };
}

function detectSemanticContext(el: Element): { groupId?: string; semanticContext?: string } {
  const form = el.closest('form');
  if (form) {
    // Prefer human-readable identifiers over machine ids
    const formName = form.getAttribute('aria-label') || form.getAttribute('name') || form.id;
    if (formName) {
      const ctx = normalizeText(formName, 60);
      return { groupId: `form-${ctx.replace(/\s+/g, '-').slice(0, 40)}`, semanticContext: ctx };
    }
    const legend = form.querySelector('legend, [role="heading"]');
    if (legend) {
      const text = normalizeText((legend as HTMLElement).innerText || legend.textContent || '');
      if (text) return { groupId: `form-${text.replace(/\s+/g, '-').slice(0, 40)}`, semanticContext: text };
    }
    return { groupId: 'form-unnamed', semanticContext: 'Form' };
  }

  const fieldset = el.closest('fieldset');
  if (fieldset) {
    const legend = fieldset.querySelector('legend');
    if (legend) {
      const text = normalizeText((legend as HTMLElement).innerText || legend.textContent || '');
      if (text) return { groupId: `fieldset-${text.replace(/\s+/g, '-').slice(0, 40)}`, semanticContext: text };
    }
    return { groupId: 'fieldset-unnamed', semanticContext: 'Fieldset' };
  }

  const dialog = el.closest('dialog, [role="dialog"], [role="alertdialog"]');
  if (dialog) {
    const title = dialog.getAttribute('aria-label') ||
      (dialog.querySelector('h1,h2,h3') as HTMLElement)?.innerText;
    if (title) {
      const text = normalizeText(title, 60);
      return { groupId: `dialog-${text.replace(/\s+/g, '-').slice(0, 40)}`, semanticContext: text };
    }
    return { groupId: 'dialog-unnamed', semanticContext: 'Dialog' };
  }

  return {};
}

function flattenForRelations(nodes: DistilledNode[]): DistilledNode[] {
  const out: DistilledNode[] = [];
  for (const n of nodes) {
    out.push(n);
    out.push(...flattenForRelations(n.children));
  }
  return out;
}

function rectDistance(a: { left: number; top: number; width: number; height: number }, b: { left: number; top: number; width: number; height: number }): number {
  const acx = a.left + a.width / 2;
  const acy = a.top + a.height / 2;
  const bcx = b.left + b.width / 2;
  const bcy = b.top + b.height / 2;
  const dx = acx - bcx;
  const dy = acy - bcy;
  return Math.sqrt(dx * dx + dy * dy);
}

export function resolveRelations(ast: DistilledNode[]): void {
  const flat = flattenForRelations(ast);
  const byId = new Map<string, DistilledNode>();

  for (const node of flat) {
    if (node.attributes.id) byId.set(node.attributes.id, node);
  }

  for (const node of flat) {
    const relations: NodeRelation[] = [];

    // label-for
    if (node.tag === 'label') {
      const forId = node.attributes.for;
      if (forId && byId.has(forId)) {
        const target = byId.get(forId)!;
        relations.push({
          type: 'label-for',
          targetLocator: target.locator,
          targetText: target.text,
          description: `Labels ${target.text || target.role}`,
        });
      }
    }

    // aria-controls
    const controlsIds = node.attributes['aria-controls'];
    if (controlsIds) {
      for (const id of controlsIds.split(/\s+/)) {
        if (byId.has(id)) {
          const target = byId.get(id)!;
          relations.push({
            type: 'aria-controls',
            targetLocator: target.locator,
            targetText: target.text,
            description: `Controls ${target.text || target.role}`,
          });
        }
      }
    }

    // aria-describedby
    const describedByIds = node.attributes['aria-describedby'];
    if (describedByIds) {
      for (const id of describedByIds.split(/\s+/)) {
        if (byId.has(id)) {
          const target = byId.get(id)!;
          relations.push({
            type: 'aria-describedby',
            targetLocator: target.locator,
            targetText: target.text,
            description: `Described by ${target.text || target.role}`,
          });
        }
      }
    }

    // aria-labelledby
    const labelledByIds = node.attributes['aria-labelledby'];
    if (labelledByIds) {
      for (const id of labelledByIds.split(/\s+/)) {
        if (byId.has(id)) {
          const target = byId.get(id)!;
          relations.push({
            type: 'aria-labelledby',
            targetLocator: target.locator,
            targetText: target.text,
            description: `Labelled by ${target.text || target.role}`,
          });
        }
      }
    }

    node.relations = relations;
  }
}

export function computeSpatialProximity(ast: DistilledNode[]): void {
  const flat = flattenForRelations(ast).filter((n) => n.interactable);

  for (const node of flat) {
    if (!node.groupId) continue;

    const sameGroup = flat.filter((n) => n !== node && n.groupId === node.groupId);
    sameGroup.sort((a, b) => rectDistance(node.rect, a.rect) - rectDistance(node.rect, b.rect));

    for (const near of sameGroup.slice(0, 2)) {
      node.relations.push({
        type: 'spatial-near',
        targetLocator: near.locator,
        targetText: near.text,
        description: `In same ${node.semanticContext || 'group'} as ${near.text || near.role}`,
      });
    }
  }
}

export function extractNode(el: Element, opts: DistillOptions = {}): DistilledNode | null {
  const tag = el.tagName.toLowerCase();
  const visible = isVisible(el, opts);
  const interactive = isInteractive(el);

  const inputType = (el as HTMLInputElement).type || '';
  const isSpecialInput = tag === 'input' && ['checkbox', 'radio', 'file'].includes(inputType.toLowerCase());

  // Filter hidden elements unless includeHidden is true or it's a special input
  if (!visible && !opts.includeHidden && !isSpecialInput) {
    return null;
  }

  const accessibleName = getAccessibleName(el);
  const visibleText = normalizeText(
    (el as HTMLElement).innerText || el.textContent || '',
    opts.maxTextLength
  );
  const text = accessibleName || visibleText;
  const attrs = getStableAttributes(el);

  const hasValue = interactive || visible || (text && text.length > 0) || Object.keys(attrs).length > 0;

  if (!hasValue) return null;

  const locatorInfo = buildLocator(el, attrs);
  const rect = getRect(el);
  const role = el.getAttribute('role') || tag;

  const editable =
    !(el as HTMLInputElement).disabled &&
    !(el as HTMLInputElement).readOnly &&
    ((tag === 'input' &&
      !['radio', 'checkbox', 'submit', 'button', 'image', 'reset', 'file', 'hidden'].includes(
        inputType.toLowerCase()
      )) ||
      tag === 'textarea' ||
      el.getAttribute('contenteditable') === 'true' ||
      (el.getAttribute('role') || '') === 'textbox');

  const semantic = detectSemanticContext(el);

  return {
    role,
    tag,
    text,
    locator: locatorInfo.primary,
    locatorFallback: locatorInfo.fallbacks,
    locatorStrategy: locatorInfo,
    interactable: interactive,
    visible,
    editable,
    checked: (el as HTMLInputElement).checked || el.getAttribute('aria-checked') === 'true',
    disabled: (el as HTMLInputElement).disabled || el.getAttribute('aria-disabled') === 'true',
    attributes: attrs,
    rect,
    children: [],
    relations: [],
    semanticContext: semantic.semanticContext,
    groupId: semantic.groupId,
  };
}
