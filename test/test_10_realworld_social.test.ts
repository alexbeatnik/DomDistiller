import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByText } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// REAL-WORLD SOCIAL LAB — Profile, Feed, Comments, Messenger
// ─────────────────────────────────────────────────────────────────────────────

const SOCIAL_DOM = `
<!DOCTYPE html>
<html lang="en">
<head><title>SocialNet</title></head>
<body>
<header id="top-nav">
  <a href="/home" id="nav-home" aria-label="Home">🏠</a>
  <a href="/explore" id="nav-explore">Explore</a>
  <a href="/notifications" id="nav-notif">Notifications <span id="notif-badge">5</span></a>
  <a href="/messages" id="nav-messages">Messages <span id="msg-badge">2</span></a>
  <a href="/profile/me" id="nav-profile">Profile</a>
  <input type="search" id="global-search" placeholder="Search SocialNet">
  <button id="search-go">Search</button>
</header>

<main>
  <aside id="left-sidebar">
    <div id="user-mini-profile">
      <img src="avatar.jpg" alt="User Avatar" id="mini-avatar">
      <h2 id="mini-name">Alex Johnson</h2>
      <p id="mini-handle">@alexj</p>
    </div>
    <nav id="side-nav">
      <a href="/feed" id="side-feed">My Feed</a>
      <a href="/friends" id="side-friends">Friends <span>142</span></a>
      <a href="/groups" id="side-groups">Groups</a>
      <a href="/events" id="side-events">Events</a>
      <a href="/saved" id="side-saved">Saved Posts</a>
      <a href="/settings" id="side-settings">Settings</a>
    </nav>
    <button id="create-post-btn" data-testid="create-post">Create Post</button>
  </aside>

  <section id="feed">
    <article class="post" id="post-1" data-post-id="1">
      <header class="post-header">
        <img src="u1.jpg" alt="Sarah Lee" id="post-avatar-1">
        <div>
          <h3 id="post-author-1">Sarah Lee</h3>
          <time id="post-time-1">2 hours ago</time>
        </div>
        <button id="post-menu-1" aria-label="Post options">⋯</button>
      </header>
      <p id="post-text-1">Just visited the new café downtown! Highly recommend their oat milk latte. ☕</p>
      <img src="cafe.jpg" alt="Café photo" id="post-img-1">
      <footer class="post-footer">
        <button id="like-1" data-testid="like-btn-1" aria-pressed="false">👍 Like</button>
        <button id="comment-toggle-1" data-testid="comment-toggle-1">💬 Comment</button>
        <button id="share-1" data-testid="share-btn-1">↗️ Share</button>
        <button id="save-1" data-testid="save-btn-1" aria-label="Save post">🔖</button>
      </footer>
      <section class="comments" id="comments-1">
        <div class="comment" id="comment-1-1">
          <img src="u2.jpg" alt="Tom" id="comment-avatar-1-1">
          <div>
            <strong id="comment-author-1-1">Tom</strong>
            <p id="comment-text-1-1">Looks amazing!</p>
          </div>
          <button id="comment-like-1-1">Like</button>
          <button id="comment-reply-1-1">Reply</button>
        </div>
        <div class="comment-form">
          <input type="text" id="comment-input-1" placeholder="Write a comment...">
          <button id="comment-submit-1">Post</button>
        </div>
      </section>
    </article>

    <article class="post" id="post-2" data-post-id="2">
      <header class="post-header">
        <img src="u3.jpg" alt="Mike Chen" id="post-avatar-2">
        <div>
          <h3 id="post-author-2">Mike Chen</h3>
          <time id="post-time-2">5 hours ago</time>
        </div>
        <button id="post-menu-2" aria-label="Post options">⋯</button>
      </header>
      <p id="post-text-2">Working on a new open-source project. Check it out!</p>
      <a href="https://github.com/example" id="post-link-2">github.com/example</a>
      <footer class="post-footer">
        <button id="like-2" data-testid="like-btn-2">👍 Like</button>
        <button id="comment-toggle-2" data-testid="comment-toggle-2">💬 Comment</button>
        <button id="share-2" data-testid="share-btn-2">↗️ Share</button>
        <button id="save-2" data-testid="save-btn-2" aria-label="Save post">🔖</button>
      </footer>
      <section class="comments" id="comments-2">
        <div class="comment-form">
          <input type="text" id="comment-input-2" placeholder="Write a comment...">
          <button id="comment-submit-2">Post</button>
        </div>
      </section>
    </article>
  </section>

  <aside id="right-sidebar">
    <div id="trending">
      <h3>Trending</h3>
      <ol>
        <li><a href="/t/1" id="trend-1">#WebDevelopment</a></li>
        <li><a href="/t/2" id="trend-2">#AI</a></li>
        <li><a href="/t/3" id="trend-3">#CoffeeLovers</a></li>
        <li><a href="/t/4" id="trend-4">#Travel</a></li>
        <li><a href="/t/5" id="trend-5">#Photography</a></li>
      </ol>
    </div>
    <div id="suggested-users">
      <h3>Who to follow</h3>
      <div class="user-suggestion" id="suggest-1">
        <img src="s1.jpg" alt="Anna">
        <span id="suggest-name-1">Anna Smith</span>
        <button id="follow-1" data-testid="follow-btn-1">Follow</button>
      </div>
      <div class="user-suggestion" id="suggest-2">
        <img src="s2.jpg" alt="David">
        <span id="suggest-name-2">David Kim</span>
        <button id="follow-2" data-testid="follow-btn-2">Follow</button>
      </div>
      <div class="user-suggestion" id="suggest-3">
        <img src="s3.jpg" alt="Emma">
        <span id="suggest-name-3">Emma Wilson</span>
        <button id="follow-3" data-testid="follow-btn-3">Follow</button>
      </div>
    </div>
  </aside>
</main>

<div id="compose-modal" role="dialog" aria-modal="true" aria-labelledby="compose-title">
  <h2 id="compose-title">Create Post</h2>
  <textarea id="compose-text" placeholder="What's on your mind?"></textarea>
  <div id="compose-actions">
    <button id="compose-img">📷 Add Photo</button>
    <button id="compose-emoji">😀 Emoji</button>
    <button id="compose-poll">📊 Poll</button>
  </div>
  <select id="compose-audience" aria-label="Who can see this post">
    <option value="public">Public</option>
    <option value="friends">Friends</option>
    <option value="only-me">Only Me</option>
  </select>
  <button id="compose-post" data-testid="submit-post">Post</button>
  <button id="compose-cancel">Cancel</button>
</div>

<footer id="main-footer">
  <a href="/about" id="f-about">About</a>
  <a href="/privacy" id="f-privacy">Privacy</a>
  <a href="/terms" id="f-terms">Terms</a>
  <a href="/help" id="f-help">Help Center</a>
  <a href="/api" id="f-api">API</a>
  <span id="f-copy">© 2024 SocialNet</span>
</footer>
</body>
</html>
`;

const TRAPS = [
  // Header nav
  { n: "1. Home nav is interactable",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-home')?.interactable === true },
  { n: "2. Explore nav is interactable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-explore')?.interactable === true },
  { n: "3. Notifications nav is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-notif')?.interactable === true },
  { n: "4. Messages nav is interactable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-messages')?.interactable === true },
  { n: "5. Profile nav is interactable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-profile')?.interactable === true },
  { n: "6. Global search input is editable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'global-search')?.editable === true },
  { n: "7. Search go button is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'search-go')?.interactable === true },
  // Left sidebar
  { n: "8. Mini avatar exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'mini-avatar') !== undefined },
  { n: "9. Mini profile name extracted",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'mini-name')?.text === 'Alex Johnson' },
  { n: "10. Mini handle extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'mini-handle')?.text === '@alexj' },
  { n: "11. Side feed link is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'side-feed')?.interactable === true },
  { n: "12. Side friends link is interactable",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'side-friends')?.interactable === true },
  { n: "13. Side groups link is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'side-groups')?.interactable === true },
  { n: "14. Side events link is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'side-events')?.interactable === true },
  { n: "15. Side saved link is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'side-saved')?.interactable === true },
  { n: "16. Side settings link is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'side-settings')?.interactable === true },
  { n: "17. Create post button is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'create-post-btn')?.interactable === true },
  // Post 1
  { n: "18. Post 1 author extracted",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-author-1')?.text === 'Sarah Lee' },
  { n: "19. Post 1 time extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-time-1')?.text === '2 hours ago' },
  { n: "20. Post 1 menu button is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-menu-1')?.interactable === true },
  { n: "21. Post 1 text extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-text-1')?.text.includes('café') },
  { n: "22. Post 1 image exists",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-img-1') !== undefined },
  { n: "23. Post 1 like button is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'like-1')?.interactable === true },
  { n: "24. Post 1 comment toggle is interactable",      assert: (ast: DistilledNode[]) => findNodeById(ast, 'comment-toggle-1')?.interactable === true },
  { n: "25. Post 1 share button is interactable",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'share-1')?.interactable === true },
  { n: "26. Post 1 save button is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'save-1')?.interactable === true },
  { n: "27. Comment 1 author extracted",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'comment-author-1-1')?.text === 'Tom' },
  { n: "28. Comment 1 text extracted",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'comment-text-1-1')?.text === 'Looks amazing!' },
  { n: "29. Comment 1 like is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'comment-like-1-1')?.interactable === true },
  { n: "30. Comment 1 reply is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'comment-reply-1-1')?.interactable === true },
  { n: "31. Comment input 1 is editable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'comment-input-1')?.editable === true },
  { n: "32. Comment submit 1 is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'comment-submit-1')?.interactable === true },
  // Post 2
  { n: "33. Post 2 author extracted",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-author-2')?.text === 'Mike Chen' },
  { n: "34. Post 2 link is interactable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-link-2')?.interactable === true },
  { n: "35. Post 2 like button is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'like-2')?.interactable === true },
  { n: "36. Comment input 2 is editable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'comment-input-2')?.editable === true },
  { n: "37. Comment submit 2 is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'comment-submit-2')?.interactable === true },
  // Right sidebar
  { n: "38. Trending 1 is interactable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'trend-1')?.interactable === true },
  { n: "39. Trending 2 is interactable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'trend-2')?.interactable === true },
  { n: "40. Trending 3 is interactable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'trend-3')?.interactable === true },
  { n: "41. Trending 4 is interactable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'trend-4')?.interactable === true },
  { n: "42. Trending 5 is interactable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'trend-5')?.interactable === true },
  { n: "43. Suggest 1 name extracted",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'suggest-name-1')?.text === 'Anna Smith' },
  { n: "44. Suggest 2 name extracted",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'suggest-name-2')?.text === 'David Kim' },
  { n: "45. Suggest 3 name extracted",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'suggest-name-3')?.text === 'Emma Wilson' },
  { n: "46. Follow 1 button is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'follow-1')?.interactable === true },
  { n: "47. Follow 2 button is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'follow-2')?.interactable === true },
  { n: "48. Follow 3 button is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'follow-3')?.interactable === true },
  // Compose modal
  { n: "49. Compose modal has role dialog",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'compose-modal')?.role === 'dialog' },
  { n: "50. Compose textarea is editable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'compose-text')?.editable === true },
  { n: "51. Compose img button is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'compose-img')?.interactable === true },
  { n: "52. Compose emoji button is interactable",       assert: (ast: DistilledNode[]) => findNodeById(ast, 'compose-emoji')?.interactable === true },
  { n: "53. Compose poll button is interactable",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'compose-poll')?.interactable === true },
  { n: "54. Compose audience select is interactable",    assert: (ast: DistilledNode[]) => findNodeById(ast, 'compose-audience')?.interactable === true },
  { n: "55. Compose post button is interactable",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'compose-post')?.interactable === true },
  { n: "56. Compose cancel button is interactable",      assert: (ast: DistilledNode[]) => findNodeById(ast, 'compose-cancel')?.interactable === true },
  // Footer
  { n: "57. Footer About is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'f-about')?.interactable === true },
  { n: "58. Footer Privacy is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'f-privacy')?.interactable === true },
  { n: "59. Footer Terms is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'f-terms')?.interactable === true },
  { n: "60. Footer Help is interactable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'f-help')?.interactable === true },
  { n: "61. Footer API is interactable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'f-api')?.interactable === true },
  { n: "62. Footer copyright extracted",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'f-copy')?.text.includes('2024') },
  // Data integrity
  { n: "63. Post 1 exists",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-1') !== undefined },
  { n: "64. Post 2 exists",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-2') !== undefined },
  { n: "65. Like 1 is interactable",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'like-1')?.interactable === true },
  { n: "66. Save 1 has aria-label",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'save-1')?.attributes['aria-label'] === 'Save post' },
  { n: "67. Notification badge shows 5",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'notif-badge')?.text === '5' },
  { n: "68. Message badge shows 2",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'msg-badge')?.text === '2' },
  { n: "69. Compose audience is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'compose-audience')?.interactable === true },
  { n: "70. Post 1 text contains recommend",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-text-1')?.text.includes('recommend') },
  { n: "71. Post 2 link has href",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-link-2')?.attributes.href === 'https://github.com/example' },
  { n: "72. Global search placeholder correct",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'global-search')?.attributes.placeholder === 'Search SocialNet' },
  { n: "73. No script/style leaked",                     assert: (ast: DistilledNode[]) => {
    let ok = true;
    const walk = (nodes: DistilledNode[]) => { for (const n of nodes) { if (n.tag === 'script' || n.tag === 'style') ok = false; walk(n.children); } };
    walk(ast);
    return ok;
  }},
  { n: "74. At least 50 nodes in AST",                   assert: (ast: DistilledNode[]) => {
    let count = 0;
    const walk = (nodes: DistilledNode[]) => { for (const n of nodes) { count++; walk(n.children); } };
    walk(ast);
    return count >= 50;
  }},
  { n: "75. Create post has data-testid",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'create-post-btn')?.attributes['data-testid'] === 'create-post' },
  { n: "76. Follow 1 has data-testid",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'follow-1')?.attributes['data-testid'] === 'follow-btn-1' },
  { n: "77. Compose modal title extracted",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'compose-title')?.text === 'Create Post' },
  { n: "78. Comment form input placeholder correct",     assert: (ast: DistilledNode[]) => findNodeById(ast, 'comment-input-1')?.attributes.placeholder === 'Write a comment...' },
  { n: "79. Post menu has aria-label",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'post-menu-1')?.attributes['aria-label'] === 'Post options' },
  { n: "80. Nav home has aria-label",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-home')?.attributes['aria-label'] === 'Home' },
];

describe('Real-World Social Lab', () => {
  it('should pass all social network traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'Real-World Social Lab',
      SOCIAL_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 SOCIAL FLAWLESS — Social flows mastered!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} social trap(s) failed`);
  });
});
