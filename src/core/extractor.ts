import type { DistilledNode, DistillOptions } from '../types';
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
  'id', 'name', 'aria-label', 'placeholder', 'title', 'alt', 'href', 'type', 'value',
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

function buildLocator(el: Element, attrs: Record<string, string>): { primary: string; fallbacks: string[] } {
  const tag = el.tagName.toLowerCase();
  const fallbacks: string[] = [];

  if (attrs['data-testid']) {
    return { primary: `data-testid=${attrs['data-testid']}`, fallbacks };
  }
  if (attrs['data-test']) {
    return { primary: `data-test=${attrs['data-test']}`, fallbacks };
  }
  if (attrs['data-qa']) {
    return { primary: `data-qa=${attrs['data-qa']}`, fallbacks };
  }

  if (attrs.id && !/^\d/.test(attrs.id) && !/\d{5,}/.test(attrs.id)) {
    return { primary: `id=${attrs.id}`, fallbacks };
  }

  if (attrs.name) fallbacks.push(`name=${attrs.name}`);
  if (attrs['aria-label']) fallbacks.push(`aria-label=${attrs['aria-label']}`);
  if (attrs.placeholder) fallbacks.push(`placeholder=${attrs.placeholder}`);
  if (tag === 'a' && attrs.href) fallbacks.push(`href=${attrs.href}`);

  fallbacks.push(`xpath=${buildXPath(el)}`);

  return { primary: fallbacks[0] || tag, fallbacks: fallbacks.slice(1) };
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

  return {
    role,
    tag,
    text,
    locator: locatorInfo.primary,
    locatorFallback: locatorInfo.fallbacks,
    interactable: interactive,
    visible,
    editable,
    checked: (el as HTMLInputElement).checked || el.getAttribute('aria-checked') === 'true',
    disabled: (el as HTMLInputElement).disabled || el.getAttribute('aria-disabled') === 'true',
    attributes: attrs,
    rect,
    children: [],
  };
}
