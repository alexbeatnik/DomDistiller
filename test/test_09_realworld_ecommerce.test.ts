import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByText, countNodes } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// REAL-WORLD ECOMMERCE LAB — Shop Catalog, Product, Cart, Checkout
// ─────────────────────────────────────────────────────────────────────────────

const ECOMMERCE_DOM = `
<!DOCTYPE html>
<html lang="en">
<head><title>MegaShop</title></head>
<body>
<header>
  <a href="/" id="logo" data-testid="site-logo">MegaShop</a>
  <input type="search" id="search-input" placeholder="Search products..." data-testid="search-input">
  <button id="search-btn" data-testid="search-button">Search</button>
  <nav>
    <a href="/categories" id="nav-cat">Categories</a>
    <a href="/deals" id="nav-deals">Deals</a>
    <a href="/account" id="nav-account">My Account</a>
  </nav>
  <button id="cart-toggle" data-testid="cart-toggle">
    Cart <span id="cart-count" data-testid="cart-count">3</span>
  </button>
</header>

<main>
  <section id="hero-banner">
    <h1>Summer Sale</h1>
    <a href="/sale" id="hero-cta" class="btn-primary">Shop Now</a>
  </section>

  <aside id="filters-sidebar">
    <h3>Filters</h3>
    <div class="filter-group">
      <label for="price-min">Min Price</label>
      <input type="number" id="price-min" name="price-min" placeholder="0">
      <label for="price-max">Max Price</label>
      <input type="number" id="price-max" name="price-max" placeholder="1000">
    </div>
    <div class="filter-group">
      <label><input type="checkbox" id="filter-instock" name="instock"> In Stock Only</label>
      <label><input type="checkbox" id="filter-sale" name="onsale"> On Sale</label>
    </div>
    <div class="filter-group">
      <label for="sort-order">Sort By</label>
      <select id="sort-order" name="sort">
        <option value="relevance">Relevance</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="newest">Newest</option>
      </select>
    </div>
    <button id="apply-filters" data-testid="apply-filters">Apply Filters</button>
    <button id="clear-filters" data-testid="clear-filters">Clear All</button>
  </aside>

  <section id="product-grid">
    <article class="product-card" data-product-id="101">
      <img src="shoe.jpg" alt="Running Shoes" id="prod-img-101">
      <h2 id="prod-title-101">Running Shoes Pro</h2>
      <p class="price" id="prod-price-101">$89.99</p>
      <p class="rating" id="prod-rating-101">4.5 stars (120 reviews)</p>
      <label for="qty-101">Qty</label>
      <input type="number" id="qty-101" value="1" min="1" max="10">
      <button id="add-101" data-testid="add-to-cart-101" data-product-id="101">Add to Cart</button>
      <button id="wish-101" class="secondary" aria-label="Add to wishlist">♡</button>
    </article>

    <article class="product-card" data-product-id="102">
      <img src="watch.jpg" alt="Smart Watch" id="prod-img-102">
      <h2 id="prod-title-102">Smart Watch Series 5</h2>
      <p class="price" id="prod-price-102"><del>$299.00</del> $249.00</p>
      <p class="rating" id="prod-rating-102">4.8 stars (89 reviews)</p>
      <label for="qty-102">Qty</label>
      <input type="number" id="qty-102" value="1" min="1" max="5">
      <button id="add-102" data-testid="add-to-cart-102">Add to Cart</button>
      <button id="wish-102" class="secondary" aria-label="Add to wishlist">♡</button>
    </article>

    <article class="product-card" data-product-id="103">
      <img src="headphones.jpg" alt="Wireless Headphones" id="prod-img-103">
      <h2 id="prod-title-103">Wireless Headphones X</h2>
      <p class="price" id="prod-price-103">$129.99</p>
      <p class="rating" id="prod-rating-103">4.2 stars (45 reviews)</p>
      <label for="qty-103">Qty</label>
      <input type="number" id="qty-103" value="1" min="1" max="10">
      <button id="add-103" data-testid="add-to-cart-103">Add to Cart</button>
      <button id="wish-103" class="secondary" aria-label="Add to wishlist">♡</button>
    </article>
  </section>

  <section id="cart-drawer" class="drawer">
    <h2>Your Cart</h2>
    <ul id="cart-items">
      <li data-cart-item="1">
        <span class="cart-item-name">Running Shoes Pro</span>
        <input type="number" class="cart-qty" id="cart-qty-1" value="1">
        <button class="remove-item" id="remove-1" data-testid="remove-item-1">Remove</button>
      </li>
      <li data-cart-item="2">
        <span class="cart-item-name">Smart Watch Series 5</span>
        <input type="number" class="cart-qty" id="cart-qty-2" value="2">
        <button class="remove-item" id="remove-2" data-testid="remove-item-2">Remove</button>
      </li>
    </ul>
    <div id="cart-total-section">
      <p>Subtotal: <span id="cart-subtotal">$587.99</span></p>
      <p>Tax: <span id="cart-tax">$47.04</span></p>
      <p>Total: <strong id="cart-total">$635.03</strong></p>
    </div>
    <a href="/checkout" id="checkout-btn" class="btn-primary">Proceed to Checkout</a>
    <button id="continue-shopping">Continue Shopping</button>
  </section>

  <section id="quick-view-modal" role="dialog" aria-modal="true" aria-labelledby="qv-title">
    <h2 id="qv-title">Quick View</h2>
    <img src="" alt="" id="qv-img">
    <p id="qv-desc">Product description goes here.</p>
    <select id="qv-size" aria-label="Select size">
      <option value="">Select Size</option>
      <option value="S">Small</option>
      <option value="M">Medium</option>
      <option value="L">Large</option>
    </select>
    <button id="qv-add" data-testid="quick-view-add">Add to Cart</button>
    <button id="qv-close" aria-label="Close quick view">×</button>
  </section>
</main>

<footer>
  <div id="newsletter">
    <label for="newsletter-email">Subscribe to our newsletter</label>
    <input type="email" id="newsletter-email" placeholder="your@email.com">
    <button id="newsletter-submit" data-testid="subscribe-btn">Subscribe</button>
  </div>
  <nav>
    <a href="/about" id="footer-about">About Us</a>
    <a href="/contact" id="footer-contact">Contact</a>
    <a href="/shipping" id="footer-shipping">Shipping Policy</a>
    <a href="/returns" id="footer-returns">Returns</a>
    <a href="/privacy" id="footer-privacy">Privacy Policy</a>
  </nav>
  <p id="copyright">© 2024 MegaShop Inc.</p>
</footer>

<div id="toast-container" aria-live="polite" aria-atomic="true">
  <div class="toast" id="toast-1">Item added to cart</div>
</div>

</body>
</html>
`;

const TRAPS = [
  // Header
  { n: "1. Site logo is interactable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'logo')?.interactable === true },
  { n: "2. Search input is editable",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'search-input')?.editable === true },
  { n: "3. Search button is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'search-btn')?.interactable === true },
  { n: "4. Categories nav link is interactable",       assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-cat')?.interactable === true },
  { n: "5. Deals nav link is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-deals')?.interactable === true },
  { n: "6. Account nav link is interactable",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-account')?.interactable === true },
  { n: "7. Cart toggle is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'cart-toggle')?.interactable === true },
  // Hero
  { n: "8. Hero CTA is interactable",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'hero-cta')?.interactable === true },
  // Filters
  { n: "9. Min price input is editable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'price-min')?.editable === true },
  { n: "10. Max price input is editable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'price-max')?.editable === true },
  { n: "11. In-stock checkbox is interactable",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'filter-instock')?.interactable === true },
  { n: "12. On-sale checkbox is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'filter-sale')?.interactable === true },
  { n: "13. Sort dropdown is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'sort-order')?.interactable === true },
  { n: "14. Apply filters button is interactable",     assert: (ast: DistilledNode[]) => findNodeById(ast, 'apply-filters')?.interactable === true },
  { n: "15. Clear filters button is interactable",     assert: (ast: DistilledNode[]) => findNodeById(ast, 'clear-filters')?.interactable === true },
  // Product 101
  { n: "16. Product 101 add-to-cart is interactable",  assert: (ast: DistilledNode[]) => findNodeById(ast, 'add-101')?.interactable === true },
  { n: "17. Product 101 qty input is editable",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'qty-101')?.editable === true },
  { n: "18. Product 101 wishlist btn is interactable", assert: (ast: DistilledNode[]) => findNodeById(ast, 'wish-101')?.interactable === true },
  { n: "19. Product 101 image exists",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'prod-img-101') !== undefined },
  // Product 102
  { n: "20. Product 102 add-to-cart is interactable",  assert: (ast: DistilledNode[]) => findNodeById(ast, 'add-102')?.interactable === true },
  { n: "21. Product 102 qty input is editable",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'qty-102')?.editable === true },
  { n: "22. Product 102 wishlist btn is interactable", assert: (ast: DistilledNode[]) => findNodeById(ast, 'wish-102')?.interactable === true },
  // Product 103
  { n: "23. Product 103 add-to-cart is interactable",  assert: (ast: DistilledNode[]) => findNodeById(ast, 'add-103')?.interactable === true },
  { n: "24. Product 103 qty input is editable",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'qty-103')?.editable === true },
  { n: "25. Product 103 wishlist btn is interactable", assert: (ast: DistilledNode[]) => findNodeById(ast, 'wish-103')?.interactable === true },
  // Cart drawer
  { n: "26. Cart item 1 qty is editable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'cart-qty-1')?.editable === true },
  { n: "27. Cart item 1 remove is interactable",       assert: (ast: DistilledNode[]) => findNodeById(ast, 'remove-1')?.interactable === true },
  { n: "28. Cart item 2 qty is editable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'cart-qty-2')?.editable === true },
  { n: "29. Cart item 2 remove is interactable",       assert: (ast: DistilledNode[]) => findNodeById(ast, 'remove-2')?.interactable === true },
  { n: "30. Checkout button is interactable",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'checkout-btn')?.interactable === true },
  { n: "31. Continue shopping is interactable",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'continue-shopping')?.interactable === true },
  // Quick view modal
  { n: "32. Quick view size select is interactable",   assert: (ast: DistilledNode[]) => findNodeById(ast, 'qv-size')?.interactable === true },
  { n: "33. Quick view add is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'qv-add')?.interactable === true },
  { n: "34. Quick view close is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'qv-close')?.interactable === true },
  // Footer
  { n: "35. Newsletter email is editable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'newsletter-email')?.editable === true },
  { n: "36. Newsletter submit is interactable",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'newsletter-submit')?.interactable === true },
  { n: "37. Footer About link is interactable",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'footer-about')?.interactable === true },
  { n: "38. Footer Contact link is interactable",      assert: (ast: DistilledNode[]) => findNodeById(ast, 'footer-contact')?.interactable === true },
  { n: "39. Footer Shipping link is interactable",     assert: (ast: DistilledNode[]) => findNodeById(ast, 'footer-shipping')?.interactable === true },
  { n: "40. Footer Returns link is interactable",      assert: (ast: DistilledNode[]) => findNodeById(ast, 'footer-returns')?.interactable === true },
  { n: "41. Footer Privacy link is interactable",      assert: (ast: DistilledNode[]) => findNodeById(ast, 'footer-privacy')?.interactable === true },
  // Locators & attributes
  { n: "42. Search input has correct placeholder",     assert: (ast: DistilledNode[]) => findNodeById(ast, 'search-input')?.attributes.placeholder === 'Search products...' },
  { n: "43. Logo has data-testid",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'logo')?.attributes['data-testid'] === 'site-logo' },
  { n: "44. Cart toggle text includes Cart",           assert: (ast: DistilledNode[]) => (findNodeById(ast, 'cart-toggle')?.text || '').includes('Cart') },
  { n: "45. Sort order is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'sort-order')?.interactable === true },
  { n: "46. Product 101 title extracted",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'prod-title-101')?.text === 'Running Shoes Pro' },
  { n: "47. Product 102 price extracted",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'prod-price-102')?.text.includes('$249.00') },
  { n: "48. Product 103 rating extracted",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'prod-rating-103')?.text.includes('4.2') },
  { n: "49. Checkout button has href",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'checkout-btn')?.attributes.href === '/checkout' },
  { n: "50. Wishlist button uses aria-label",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'wish-101')?.attributes['aria-label'] === 'Add to wishlist' },
  // Structural
  { n: "51. Toast container exists",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'toast-container') !== undefined },
  { n: "52. Toast message exists",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'toast-1') !== undefined },
  { n: "53. Product grid has children",                assert: (ast: DistilledNode[]) => {
    const grid = findNodeById(ast, 'product-grid');
    return grid !== undefined && grid.children.length >= 3;
  }},
  { n: "54. Cart drawer has children",                 assert: (ast: DistilledNode[]) => {
    const drawer = findNodeById(ast, 'cart-drawer');
    return drawer !== undefined && drawer.children.length > 0;
  }},
  { n: "55. Filters sidebar exists",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'filters-sidebar') !== undefined },
  { n: "56. Hero banner exists",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'hero-banner') !== undefined },
  { n: "57. Footer newsletter section exists",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'newsletter') !== undefined },
  { n: "58. Copyright text extracted",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'copyright')?.text.includes('2024') },
  { n: "59. Search button has data-testid",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'search-btn')?.attributes['data-testid'] === 'search-button' },
  { n: "60. Price min has name attr",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'price-min')?.attributes.name === 'price-min' },
  { n: "61. Apply filters has data-testid",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'apply-filters')?.attributes['data-testid'] === 'apply-filters' },
  { n: "62. Quick view modal has role dialog",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'quick-view-modal')?.role === 'dialog' },
  { n: "63. Quick view title text extracted",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'qv-title')?.text === 'Quick View' },
  { n: "64. Cart subtotal extracted",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'cart-subtotal')?.text === '$587.99' },
  { n: "65. Cart tax extracted",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'cart-tax')?.text === '$47.04' },
  { n: "66. Cart total extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'cart-total')?.text === '$635.03' },
  { n: "67. Product 101 add button exists",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'add-101')?.interactable === true },
  { n: "68. Product 102 add button exists",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'add-102')?.interactable === true },
  { n: "69. Product 103 add button exists",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'add-103')?.interactable === true },
  { n: "70. Cart item 1 remove exists",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'remove-1')?.interactable === true },
  { n: "71. Cart count shows 3",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'cart-count')?.text === '3' },
  { n: "72. QV size select is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'qv-size')?.interactable === true },
  { n: "73. Nav links count >= 3",                     assert: (ast: DistilledNode[]) => {
    const ids = ['nav-cat','nav-deals','nav-account'];
    return ids.every(id => findNodeById(ast, id)?.interactable === true);
  }},
  { n: "74. Footer links count >= 5",                  assert: (ast: DistilledNode[]) => {
    const ids = ['footer-about','footer-contact','footer-shipping','footer-returns','footer-privacy'];
    return ids.every(id => findNodeById(ast, id)?.interactable === true);
  }},
  { n: "75. At least 30 interactable elements",        assert: (ast: DistilledNode[]) => {
    let count = 0;
    const walk = (nodes: DistilledNode[]) => {
      for (const n of nodes) { if (n.interactable) count++; walk(n.children); }
    };
    walk(ast);
    return count >= 30;
  }},
  { n: "76. No script or style nodes leaked",          assert: (ast: DistilledNode[]) => {
    let ok = true;
    const walk = (nodes: DistilledNode[]) => {
      for (const n of nodes) { if (n.tag === 'script' || n.tag === 'style') ok = false; walk(n.children); }
    };
    walk(ast);
    return ok;
  }},
  { n: "77. Product 101 image alt preserved",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'prod-img-101')?.attributes.alt === 'Running Shoes' },
  { n: "78. Min price placeholder is 0",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'price-min')?.attributes.placeholder === '0' },
  { n: "79. Max price placeholder is 1000",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'price-max')?.attributes.placeholder === '1000' },
  { n: "80. Newsletter label text extracted",          assert: (ast: DistilledNode[]) => findNodeByText(ast, 'Subscribe to our newsletter') !== undefined },
];

describe('Real-World Ecommerce Lab', () => {
  it('should pass all ecommerce traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'Real-World Ecommerce Lab',
      ECOMMERCE_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 ECOMMERCE FLAWLESS — Shop flows mastered!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} ecommerce trap(s) failed`);
  });
});
