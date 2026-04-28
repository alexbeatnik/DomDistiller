import type { DistillOptions, Rect } from '../types';

export function getRect(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return {
    top: Math.round(r.top * 100) / 100,
    left: Math.round(r.left * 100) / 100,
    bottom: Math.round(r.bottom * 100) / 100,
    right: Math.round(r.right * 100) / 100,
    width: Math.round(r.width * 100) / 100,
    height: Math.round(r.height * 100) / 100,
  };
}

export function isVisible(el: Element, opts: DistillOptions = {}): boolean {
  const cs = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();

  if (cs.display === 'none') return false;
  if (cs.visibility === 'hidden') return false;
  if (parseFloat(cs.opacity) < 0.01) return false;
  if (rect.width <= 0 || rect.height <= 0) return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;

  if (opts.checkObscured) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) {
      return false;
    }
    const topEl = document.elementFromPoint(cx, cy);
    if (!topEl) return false;
    if (topEl !== el && !el.contains(topEl) && !topEl.contains(el)) {
      return false;
    }
  }

  return true;
}
