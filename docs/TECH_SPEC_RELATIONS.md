# Technical Specification: Relation Mapping in the TreeWalker Pass

**Scope:** `src/core/extractor.ts` — browser-only extraction layer  
**Status:** Implemented  
**Target:** Single-pass TreeWalker with O(n) extraction + O(k²) post-pass, where k ≈ 30–80 (interactable nodes in the flattened AST)

---

## 1. Problem Statement

The LLM needs to know that `"the Email label describes the email input"` and `"the Save button is inside the Login Form"`. If we only emit a flat list of controls, Copilot must guess these relationships by re-deriving them from raw DOM coordinates. That defeats the purpose of DomDistiller.

The challenge: **how do we extract `label-for`, `aria-controls`, `aria-describedby`, and spatial proximity during a fast TreeWalker pass without regressing the < 20 ms budget?**

---

## 2. Design Principles

1. **Never slow down the TreeWalker.** The C++-speed traversal is sacred. No `querySelector` calls inside the per-node hot path unless they are O(1) and bounded.
2. **Resolve backward references in a post-pass.** TreeWalker walks forward. A `<label for="email">` appears *before* the `<input id="email">` roughly half the time. We cannot resolve `for` → `id` during the walk without look-ahead buffers.
3. **Keep the AST small before doing expensive work.** Spatial proximity is O(n²). We run it on the **flattened, pruned** AST (k ≈ 30–80), not on the raw DOM (n ≈ 10,000).
4. **Preserve the two-world boundary.** All relation logic lives in `src/core/extractor.ts` (browser). Node.js only consumes the finished `relations` array.

---

## 3. Two-Pass Architecture

### Pass 1: TreeWalker Extraction (O(n), n = DOM nodes)

For every `Element` visited by `document.createTreeWalker`:

1. **Visibility check** (`isVisible`) — reject hidden nodes immediately.
2. **Interactivity check** (`isInteractive`) — accept buttons, links, inputs, custom elements, etc.
3. **Attribute capture** (`getStableAttributes`) — collect `id`, `name`, `for`, `aria-controls`, `aria-describedby`, `aria-labelledby`, etc. into `node.attributes`.
4. **Locator build** (`buildLocator`) — rank stable attributes and assign confidence.
5. **Semantic context detection** (`detectSemanticContext`) — use `el.closest('form|fieldset|dialog|[role="dialog"]')` to tag the node with `groupId` and `semanticContext`.
6. **Tree assembly** — push the node onto the parent stack based on DOM containment.

**Key constraint:** `extractNode()` does **not** resolve any ID-based relationships. It only stores raw attribute values (e.g. `attributes.for = "email"`). This keeps the per-node cost at ~O(depth) for `closest()` calls, which is effectively constant.

### Pass 2: Relation Resolution (O(k²), k = flattened AST nodes)

After `flattenNodes()` and before `pruneEmpty()`, we call two functions on the flattened tree:

#### 2a. `resolveRelations(ast)` — ID graph (O(k))

```
1. Flatten the AST into a single array (recursive walk).
2. Build a Map<string, DistilledNode> by node.attributes.id.
3. For each node:
   a. If tag === 'label' and attributes.for exists:
      → look up target in Map. If found, push { type: 'label-for', ... }.
   b. If attributes['aria-controls'] exists:
      → split by whitespace, look up each ID in Map.
   c. Repeat for aria-describedby and aria-labelledby.
```

**Why this is fast:**
- `Map.get()` is O(1) amortized.
- Only nodes that expose these attributes create lookups.
- The flat array is tiny (~50 items) compared to the DOM.

**Why we wait until after flattening:**
- Flattening removes meaningless wrapper divs. If a label and its input were separated by three wrapper divs in the DOM, they might end up as siblings in the flattened AST, making the relation visually obvious to the LLM.
- Some referenced IDs might belong to wrapper divs that get pruned. We want to resolve relations **after** pruning decisions are finalized for wrappers, so we resolve on the flattened tree but before the final `pruneEmpty()`.

#### 2b. `computeSpatialProximity(ast)` — geometric graph (O(k²))

```
1. Flatten and filter to interactable nodes only.
2. For each node:
   a. Find all other interactable nodes sharing the same groupId.
   b. Sort by Euclidean distance between bounding-box centers.
   c. Take the 2 nearest neighbors.
   d. Push { type: 'spatial-near', targetLocator: near.locator, ... }.
```

**Why O(k²) is acceptable:**
- k is the number of **interactable** nodes in the flattened AST.
- On a 10,000-element SaaS page, k is typically 30–80.
- 80² = 6,400 distance calculations. Each calculation is 4 subtractions, 2 multiplications, 1 addition, and 1 `Math.sqrt`. At ~50 ns per op in V8, this is < 1 ms.

**Why we limit to same-group nodes:**
- A "Sign In" button in the "Login Form" should not be spatially linked to a "Delete Account" button in a footer 2,000 pixels below. Same-group proximity is semantically meaningful; global proximity is noise.

---

## 4. Attribute Capture Strategy

To resolve relations, the extractor must capture attributes that are **not** used as primary locators. We expanded `STABLE_ATTRS` to include:

```typescript
const STABLE_ATTRS = [
  'data-testid', 'data-test', 'data-qa', 'data-id',
  'id', 'name', 'aria-label',
  'aria-labelledby', 'aria-describedby', 'aria-controls',  // NEW
  'placeholder', 'title', 'alt', 'href', 'type', 'value',
  'for',  // NEW
];
```

These attributes appear in `node.attributes` even if `buildLocator()` does not use them as a primary or fallback locator. This gives the post-pass the raw material it needs without polluting the locator ranking.

---

## 5. Edge Cases & Mitigations

| Edge Case | Mitigation |
|---|---|
| **Missing target ID** (e.g. `for="missing"`) | `Map.get()` returns undefined; relation is silently skipped. |
| **Duplicate IDs** | `Map` stores the last-seen node. In practice, the first node with a duplicate ID is usually the visible one; the second is often hidden or in a template. We accept this best-effort behavior. |
| **ID belongs to a pruned wrapper** | Resolution happens on the **flattened** AST. If the wrapper was meaningless, it was flattened away and its children absorbed its semantic context. The real control (input/button) retains the `id` and receives the relation. |
| **Cross-shadow-DOM references** | `aria-controls` across shadow boundaries is rare and not supported by `document.getElementById()`. We document this limitation. TreeWalker already pierces shadow roots for element discovery, but ID resolution stays within `document` scope. |
| **Spatial proximity on off-screen groups** | We compute distance on all nodes, including those outside the viewport. This is intentional: a modal dialog may be centered off-screen before animation. The LLM still benefits from knowing that "Submit" is near "Cancel" inside the same dialog. |

---

## 6. Performance Budget

| Phase | Complexity | Typical Time |
|---|---|---|
| TreeWalker + extraction | O(n) | ~10 ms |
| Flatten + prune | O(k) | ~1 ms |
| `resolveRelations` | O(k) | ~0.1 ms |
| `computeSpatialProximity` | O(k²) | ~0.5 ms |
| **Total** | — | **< 15 ms** |

The v2 Semantic AST adds < 5 ms to the existing extraction pipeline.

---

## 7. Future Work: Incremental Patching

The current implementation rebuilds the entire AST on every `distillPage()` call. The `relations` and `groupId` fields are designed to make incremental updates straightforward:

- A `MutationObserver` could watch for `attributes` changes on `id`, `for`, `aria-controls`, etc.
- When a relation target is mutated, only the affected `NodeRelation` objects need recalculation.
- Spatial proximity only needs recomputation within the mutated `groupId`.

This is **not yet implemented** but is the intended next step for reducing latency in agentic loops.

---

## 8. Testing Strategy

Relation extraction is tested with dedicated traps in the test suite:

1. **Label-for round-trip**: `<label for="x"><input id="x">` → label node has `relations[0].type === 'label-for'`.
2. **Aria-describedby resolution**: `<input aria-describedby="help"><span id="help">` → input has relation to help text.
3. **Spatial proximity in forms**: Two inputs + one button inside the same `<form>` → button has `spatial-near` relations to both inputs.
4. **Cross-group isolation**: A button in Form A must NOT have `spatial-near` relations to a button in Form B, even if they are physically close in the DOM.
5. **Performance trap**: A 5,000-element DOM must still distill in < 50 ms with relations enabled.

---

*Author: DomDistiller Core Team*  
*Last updated: 2025-04-28*
