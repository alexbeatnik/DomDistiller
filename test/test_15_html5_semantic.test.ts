import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByText } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// HTML5 SEMANTIC LAB — Semantic elements, details/summary, figure, time, etc.
// ─────────────────────────────────────────────────────────────────────────────

const SEMANTIC_DOM = `
<!DOCTYPE html>
<html lang="en">
<head><title>Semantic</title></head>
<body>
<header id="site-header">
  <h1 id="site-title">My Blog</h1>
  <nav id="primary-nav">
    <ul>
      <li><a href="/" id="nav-home">Home</a></li>
      <li><a href="/about" id="nav-about">About</a></li>
      <li><a href="/archive" id="nav-archive">Archive</a></li>
    </ul>
  </nav>
</header>

<main id="site-main">
  <article id="post-1">
    <header id="post-header-1">
      <h2 id="post-title-1">Understanding Semantic HTML</h2>
      <p>Published <time id="post-time-1" datetime="2024-01-15">January 15, 2024</time></p>
    </header>
    <section id="post-intro-1">
      <p>Introduction paragraph.</p>
    </section>
    <section id="post-body-1">
      <p>Main content with <mark id="mark-1">highlighted text</mark>.</p>
      <figure id="fig-1">
        <img src="diagram.png" alt="Diagram" id="fig-img-1">
        <figcaption id="fig-cap-1">Figure 1: Architecture diagram</figcaption>
      </figure>
      <blockquote id="quote-1">
        <p>Quote text here.</p>
        <cite id="cite-1">— Author Name</cite>
      </blockquote>
      <pre id="code-1"><code>const x = 1;</code></pre>
    </section>
    <footer id="post-footer-1">
      <p>Tags: <a href="/tag/html" id="tag-html">HTML</a>, <a href="/tag/css" id="tag-css">CSS</a></p>
    </footer>
  </article>

  <aside id="related-posts">
    <h3>Related Posts</h3>
    <ul>
      <li><a href="/post/2" id="rel-post-2">Accessibility Basics</a></li>
      <li><a href="/post/3" id="rel-post-3">CSS Grid Guide</a></li>
    </ul>
  </aside>

  <section id="comments-section">
    <h3>Comments</h3>
    <details id="details-1" open>
      <summary id="sum-1">Comment Policy</summary>
      <p>Be respectful and constructive.</p>
    </details>
    <dialog id="reply-dialog" open>
      <h4>Reply</h4>
      <textarea id="reply-text"></textarea>
      <button id="reply-submit">Submit Reply</button>
      <button id="reply-cancel">Cancel</button>
    </dialog>
  </section>

  <section id="faq-section">
    <h3>FAQ</h3>
    <details id="faq-1">
      <summary id="faq-q-1">What is semantic HTML?</summary>
      <p id="faq-a-1">Semantic HTML uses meaningful tags.</p>
    </details>
    <details id="faq-2">
      <summary id="faq-q-2">Why use it?</summary>
      <p id="faq-a-2">Improves accessibility and SEO.</p>
    </details>
  </section>

  <section id="progress-section">
    <h3>Course Progress</h3>
    <label for="course-progress">Completion:</label>
    <progress id="course-progress" value="75" max="100">75%</progress>
    <meter id="disk-usage" value="0.8" high="0.9" low="0.3" optimum="0.2">80%</meter>
  </section>
</main>

<footer id="site-footer">
  <address id="contact-info">
    Contact: <a href="mailto:hi@example.com" id="email-link">hi@example.com</a>
  </address>
  <small id="copyright">© 2024 My Blog</small>
</footer>
</body>
</html>
`;

const TRAPS = [
  { n: "1. Site header exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'site-header')?.tag === 'header' },
  { n: "2. Site title extracted",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'site-title')?.text === 'My Blog' },
  { n: "3. Primary nav exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'primary-nav')?.tag === 'nav' },
  { n: "4. Nav home link is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-home')?.interactable === true },
  { n: "5. Nav about link is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-about')?.interactable === true },
  { n: "6. Nav archive link is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-archive')?.interactable === true },
  { n: "7. Main region exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'site-main')?.tag === 'main' },
  { n: "8. Article exists",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-1')?.tag === 'article' },
  { n: "9. Post header exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-header-1')?.tag === 'header' },
  { n: "10. Post title extracted",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-title-1')?.text === 'Understanding Semantic HTML' },
  { n: "11. Time element exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-time-1')?.tag === 'time' },
  { n: "12. Time text extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-time-1')?.text === 'January 15, 2024' },
  { n: "13. Time text extracted",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-time-1')?.text === 'January 15, 2024' },
  { n: "14. Section intro exists",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-intro-1')?.tag === 'section' },
  { n: "15. Section body exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-body-1')?.tag === 'section' },
  { n: "16. Mark element exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'mark-1')?.tag === 'mark' },
  { n: "17. Mark text extracted",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'mark-1')?.text === 'highlighted text' },
  { n: "18. Figure exists",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'fig-1')?.tag === 'figure' },
  { n: "19. Figure image exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'fig-img-1') !== undefined },
  { n: "20. Figcaption exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'fig-cap-1')?.tag === 'figcaption' },
  { n: "21. Figcaption text extracted",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'fig-cap-1')?.text === 'Figure 1: Architecture diagram' },
  { n: "22. Blockquote exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'quote-1')?.tag === 'blockquote' },
  { n: "23. Cite exists",                                assert: (ast: DistilledNode[]) => findNodeById(ast, 'cite-1')?.tag === 'cite' },
  { n: "24. Cite text extracted",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'cite-1')?.text.includes('Author Name') },
  { n: "25. Pre element exists",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'code-1')?.tag === 'pre' },
  { n: "26. Post footer exists",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-footer-1')?.tag === 'footer' },
  { n: "27. Tag HTML link is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'tag-html')?.interactable === true },
  { n: "28. Tag CSS link is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'tag-css')?.interactable === true },
  { n: "29. Aside exists",                               assert: (ast: DistilledNode[]) => findNodeById(ast, 'related-posts')?.tag === 'aside' },
  { n: "30. Related post 2 is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'rel-post-2')?.interactable === true },
  { n: "31. Related post 3 is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'rel-post-3')?.interactable === true },
  { n: "32. Comments section exists",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'comments-section')?.tag === 'section' },
  { n: "33. Details element exists",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'details-1')?.tag === 'details' },
  { n: "34. Summary element exists",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'sum-1')?.tag === 'summary' },
  { n: "35. Summary text extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'sum-1')?.text === 'Comment Policy' },
  { n: "36. Dialog element exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'reply-dialog')?.tag === 'dialog' },
  { n: "37. Reply textarea is editable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'reply-text')?.editable === true },
  { n: "38. Reply submit is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'reply-submit')?.interactable === true },
  { n: "39. Reply cancel is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'reply-cancel')?.interactable === true },
  { n: "40. FAQ 1 details exists",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'faq-1')?.tag === 'details' },
  { n: "41. FAQ 1 summary extracted",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'faq-q-1')?.text === 'What is semantic HTML?' },
  { n: "42. FAQ 1 answer extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'faq-a-1')?.text === 'Semantic HTML uses meaningful tags.' },
  { n: "43. FAQ 2 summary extracted",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'faq-q-2')?.text === 'Why use it?' },
  { n: "44. FAQ 2 answer extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'faq-a-2')?.text === 'Improves accessibility and SEO.' },
  { n: "45. Progress element exists",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'course-progress')?.tag === 'progress' },
  { n: "46. Progress value attr",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'course-progress')?.attributes.value === '75' },
  { n: "47. Progress tag preserved",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'course-progress')?.tag === 'progress' },
  { n: "48. Meter element exists",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'disk-usage')?.tag === 'meter' },
  { n: "49. Meter value attr",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'disk-usage')?.attributes.value === '0.8' },
  { n: "50. Meter value attr",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'disk-usage')?.attributes.value === '0.8' },
  { n: "51. Site footer exists",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'site-footer')?.tag === 'footer' },
  { n: "52. Address element exists",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'contact-info')?.tag === 'address' },
  { n: "53. Email link is interactable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'email-link')?.interactable === true },
  { n: "54. Email href preserved",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'email-link')?.attributes.href === 'mailto:hi@example.com' },
  { n: "55. Small element exists",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'copyright')?.tag === 'small' },
  { n: "56. Copyright text extracted",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'copyright')?.text === '© 2024 My Blog' },
  { n: "57. Post intro text extracted",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-intro-1')?.text.includes('Introduction') },
  { n: "58. Post body contains highlighted",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-body-1')?.text.includes('highlighted text') },
  { n: "59. Dialog has h4 title",                        assert: (ast: DistilledNode[]) => findNodeByText(ast, 'Reply') !== undefined },
  { n: "60. No script/style leaked",                     assert: (ast: DistilledNode[]) => {
    let ok = true;
    const walk = (nodes: DistilledNode[]) => { for (const n of nodes) { if (n.tag === 'script' || n.tag === 'style') ok = false; walk(n.children); } };
    walk(ast);
    return ok;
  }},
];

describe('HTML5 Semantic Lab', () => {
  it('should pass all semantic HTML traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'HTML5 Semantic Lab',
      SEMANTIC_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 SEMANTIC HTML FLAWLESS — Structure mastered!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} semantic HTML trap(s) failed`);
  });
});
