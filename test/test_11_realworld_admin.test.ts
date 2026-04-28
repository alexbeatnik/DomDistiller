import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByText } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// REAL-WORLD ADMIN DASHBOARD LAB — Analytics, Tables, CRUD, Settings
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_DOM = `
<!DOCTYPE html>
<html lang="en">
<head><title>Admin Dashboard</title></head>
<body>
<aside id="sidebar">
  <div id="brand">AdminPanel</div>
  <nav>
    <a href="/dashboard" id="nav-dash" class="active">📊 Dashboard</a>
    <a href="/users" id="nav-users">👥 Users</a>
    <a href="/orders" id="nav-orders">📦 Orders</a>
    <a href="/products" id="nav-products">🛍️ Products</a>
    <a href="/analytics" id="nav-analytics">📈 Analytics</a>
    <a href="/messages" id="nav-msgs">✉️ Messages</a>
    <a href="/settings" id="nav-set">⚙️ Settings</a>
  </nav>
  <button id="collapse-sidebar">Collapse</button>
</aside>

<main id="main-content">
  <header id="topbar">
    <button id="menu-toggle">☰</button>
    <input type="search" id="global-search" placeholder="Search...">
    <button id="notif-bell" aria-label="Notifications">🔔 <span id="notif-count">3</span></button>
    <div id="user-menu">
      <img src="admin.jpg" alt="Admin" id="user-avatar">
      <span id="user-name">Admin User</span>
      <button id="logout-btn">Logout</button>
    </div>
  </header>

  <section id="dashboard-stats">
    <div class="stat-card" id="stat-users">
      <h3>Total Users</h3>
      <p class="stat-value">12,345</p>
      <span class="stat-change positive">+5.2%</span>
    </div>
    <div class="stat-card" id="stat-revenue">
      <h3>Revenue</h3>
      <p class="stat-value">$45,678</p>
      <span class="stat-change positive">+12.1%</span>
    </div>
    <div class="stat-card" id="stat-orders">
      <h3>Orders</h3>
      <p class="stat-value">1,234</p>
      <span class="stat-change negative">-2.3%</span>
    </div>
    <div class="stat-card" id="stat-visitors">
      <h3>Visitors</h3>
      <p class="stat-value">89,012</p>
      <span class="stat-change positive">+8.7%</span>
    </div>
  </section>

  <section id="charts-section">
    <div class="chart-container" id="revenue-chart">
      <h3>Revenue Overview</h3>
      <canvas id="canvas-revenue" width="600" height="300"></canvas>
      <button id="export-revenue">Export CSV</button>
    </div>
    <div class="chart-container" id="traffic-chart">
      <h3>Traffic Sources</h3>
      <canvas id="canvas-traffic" width="400" height="300"></canvas>
      <button id="export-traffic">Export CSV</button>
    </div>
  </section>

  <section id="users-table-section">
    <div class="section-header">
      <h2>Users</h2>
      <button id="add-user-btn" data-testid="add-user">+ Add User</button>
      <button id="bulk-delete-btn">Bulk Delete</button>
      <input type="text" id="user-search" placeholder="Filter users...">
    </div>
    <table id="users-table">
      <thead>
        <tr>
          <th><input type="checkbox" id="select-all-users"></th>
          <th id="th-name">Name</th>
          <th id="th-email">Email</th>
          <th id="th-role">Role</th>
          <th id="th-status">Status</th>
          <th id="th-created">Created</th>
          <th id="th-actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr id="user-row-1">
          <td><input type="checkbox" id="sel-user-1"></td>
          <td id="user-name-1">Alice Smith</td>
          <td id="user-email-1">alice@example.com</td>
          <td id="user-role-1">
            <select id="role-sel-1">
              <option value="admin">Admin</option>
              <option value="editor" selected>Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </td>
          <td id="user-status-1"><span class="badge active">Active</span></td>
          <td id="user-created-1">2024-01-15</td>
          <td>
            <button id="edit-user-1" data-testid="edit-user-1">Edit</button>
            <button id="delete-user-1" data-testid="delete-user-1">Delete</button>
          </td>
        </tr>
        <tr id="user-row-2">
          <td><input type="checkbox" id="sel-user-2"></td>
          <td id="user-name-2">Bob Johnson</td>
          <td id="user-email-2">bob@example.com</td>
          <td id="user-role-2">
            <select id="role-sel-2">
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer" selected>Viewer</option>
            </select>
          </td>
          <td id="user-status-2"><span class="badge inactive">Inactive</span></td>
          <td id="user-created-2">2024-02-20</td>
          <td>
            <button id="edit-user-2" data-testid="edit-user-2">Edit</button>
            <button id="delete-user-2" data-testid="delete-user-2">Delete</button>
          </td>
        </tr>
        <tr id="user-row-3">
          <td><input type="checkbox" id="sel-user-3"></td>
          <td id="user-name-3">Carol White</td>
          <td id="user-email-3">carol@example.com</td>
          <td id="user-role-3">
            <select id="role-sel-3">
              <option value="admin" selected>Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </td>
          <td id="user-status-3"><span class="badge active">Active</span></td>
          <td id="user-created-3">2024-03-10</td>
          <td>
            <button id="edit-user-3" data-testid="edit-user-3">Edit</button>
            <button id="delete-user-3" data-testid="delete-user-3">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div id="pagination">
      <button id="prev-page">Previous</button>
      <span id="page-info">Page 1 of 5</span>
      <button id="next-page">Next</button>
      <select id="page-size">
        <option value="10">10 per page</option>
        <option value="25" selected>25 per page</option>
        <option value="50">50 per page</option>
      </select>
    </div>
  </section>

  <section id="orders-section">
    <h2>Recent Orders</h2>
    <div class="order-card" id="order-1001">
      <div class="order-header">
        <span id="order-id-1001">Order #1001</span>
        <span id="order-date-1001">2024-04-01</span>
        <span id="order-status-1001" class="status shipped">Shipped</span>
      </div>
      <p id="order-total-1001">Total: $156.00</p>
      <button id="view-order-1001">View Details</button>
      <button id="track-order-1001">Track Shipment</button>
    </div>
    <div class="order-card" id="order-1002">
      <div class="order-header">
        <span id="order-id-1002">Order #1002</span>
        <span id="order-date-1002">2024-04-02</span>
        <span id="order-status-1002" class="status pending">Pending</span>
      </div>
      <p id="order-total-1002">Total: $89.50</p>
      <button id="view-order-1002">View Details</button>
      <button id="cancel-order-1002">Cancel Order</button>
    </div>
  </section>

  <section id="settings-section">
    <h2>Site Settings</h2>
    <form id="settings-form">
      <div class="form-group">
        <label for="site-name">Site Name</label>
        <input type="text" id="site-name" value="AdminPanel">
      </div>
      <div class="form-group">
        <label for="site-url">Site URL</label>
        <input type="url" id="site-url" value="https://admin.example.com">
      </div>
      <div class="form-group">
        <label for="timezone">Timezone</label>
        <select id="timezone">
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time</option>
          <option value="Europe/London">London</option>
          <option value="Asia/Tokyo" selected>Tokyo</option>
        </select>
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="enable-notif" checked> Enable Notifications</label>
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="enable-2fa"> Enable 2FA</label>
      </div>
      <div class="form-group">
        <label for="theme-select">Theme</label>
        <select id="theme-select">
          <option value="light">Light</option>
          <option value="dark" selected>Dark</option>
          <option value="auto">Auto</option>
        </select>
      </div>
      <button type="submit" id="save-settings" data-testid="save-settings">Save Settings</button>
      <button type="reset" id="reset-settings">Reset</button>
    </form>
  </section>
</main>

<div id="user-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
  <h2 id="user-modal-title">Edit User</h2>
  <form id="user-form">
    <label for="edit-name">Name</label>
    <input type="text" id="edit-name">
    <label for="edit-email">Email</label>
    <input type="email" id="edit-email">
    <label for="edit-role">Role</label>
    <select id="edit-role">
      <option value="admin">Admin</option>
      <option value="editor">Editor</option>
      <option value="viewer">Viewer</option>
    </select>
    <label><input type="checkbox" id="edit-active"> Active</label>
    <button type="submit" id="save-user">Save</button>
    <button type="button" id="cancel-edit">Cancel</button>
  </form>
</div>
</body>
</html>
`;

const TRAPS = [
  // Sidebar
  { n: "1. Dashboard nav is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-dash')?.interactable === true },
  { n: "2. Users nav is interactable",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-users')?.interactable === true },
  { n: "3. Orders nav is interactable",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-orders')?.interactable === true },
  { n: "4. Products nav is interactable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-products')?.interactable === true },
  { n: "5. Analytics nav is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-analytics')?.interactable === true },
  { n: "6. Messages nav is interactable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-msgs')?.interactable === true },
  { n: "7. Settings nav is interactable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'nav-set')?.interactable === true },
  { n: "8. Collapse sidebar is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'collapse-sidebar')?.interactable === true },
  { n: "9. Brand text extracted",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'brand')?.text === 'AdminPanel' },
  // Topbar
  { n: "10. Menu toggle is interactable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'menu-toggle')?.interactable === true },
  { n: "11. Global search is editable",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'global-search')?.editable === true },
  { n: "12. Notif bell is interactable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'notif-bell')?.interactable === true },
  { n: "13. Logout button is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'logout-btn')?.interactable === true },
  { n: "14. User avatar exists",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'user-avatar') !== undefined },
  { n: "15. User name extracted",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'user-name')?.text === 'Admin User' },
  { n: "16. Notif count shows 3",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'notif-count')?.text === '3' },
  // Stats
  { n: "17. Stat users value extracted",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'stat-users')?.text.includes('12,345') },
  { n: "18. Stat revenue value extracted",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'stat-revenue')?.text.includes('$45,678') },
  { n: "19. Stat orders value extracted",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'stat-orders')?.text.includes('1,234') },
  { n: "20. Stat visitors value extracted",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'stat-visitors')?.text.includes('89,012') },
  // Charts
  { n: "21. Revenue chart container exists",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'revenue-chart') !== undefined },
  { n: "22. Revenue canvas exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'canvas-revenue') !== undefined },
  { n: "23. Export revenue is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'export-revenue')?.interactable === true },
  { n: "24. Traffic chart container exists",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'traffic-chart') !== undefined },
  { n: "25. Export traffic is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'export-traffic')?.interactable === true },
  // Users table header
  { n: "26. Select all checkbox is interactable",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'select-all-users')?.interactable === true },
  { n: "27. Add user button is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'add-user-btn')?.interactable === true },
  { n: "28. Bulk delete button is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'bulk-delete-btn')?.interactable === true },
  { n: "29. User search input is editable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'user-search')?.editable === true },
  // User row 1
  { n: "30. User 1 checkbox is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'sel-user-1')?.interactable === true },
  { n: "31. User 1 name extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'user-name-1')?.text === 'Alice Smith' },
  { n: "32. User 1 email extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'user-email-1')?.text === 'alice@example.com' },
  { n: "33. User 1 role select is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'role-sel-1')?.interactable === true },
  { n: "34. User 1 edit is interactable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'edit-user-1')?.interactable === true },
  { n: "35. User 1 delete is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'delete-user-1')?.interactable === true },
  // User row 2
  { n: "36. User 2 checkbox is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'sel-user-2')?.interactable === true },
  { n: "37. User 2 name extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'user-name-2')?.text === 'Bob Johnson' },
  { n: "38. User 2 email extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'user-email-2')?.text === 'bob@example.com' },
  { n: "39. User 2 role select is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'role-sel-2')?.interactable === true },
  { n: "40. User 2 edit is interactable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'edit-user-2')?.interactable === true },
  { n: "41. User 2 delete is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'delete-user-2')?.interactable === true },
  // User row 3
  { n: "42. User 3 checkbox is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'sel-user-3')?.interactable === true },
  { n: "43. User 3 name extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'user-name-3')?.text === 'Carol White' },
  { n: "44. User 3 email extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'user-email-3')?.text === 'carol@example.com' },
  { n: "45. User 3 role select is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'role-sel-3')?.interactable === true },
  { n: "46. User 3 edit is interactable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'edit-user-3')?.interactable === true },
  { n: "47. User 3 delete is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'delete-user-3')?.interactable === true },
  // Pagination
  { n: "48. Previous page is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'prev-page')?.interactable === true },
  { n: "49. Next page is interactable",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'next-page')?.interactable === true },
  { n: "50. Page size select is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'page-size')?.interactable === true },
  { n: "51. Page info extracted",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'page-info')?.text === 'Page 1 of 5' },
  // Orders
  { n: "52. Order 1001 ID extracted",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'order-id-1001')?.text === 'Order #1001' },
  { n: "53. Order 1001 date extracted",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'order-date-1001')?.text === '2024-04-01' },
  { n: "54. Order 1001 status extracted",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'order-status-1001')?.text === 'Shipped' },
  { n: "55. Order 1001 total extracted",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'order-total-1001')?.text === 'Total: $156.00' },
  { n: "56. Order 1001 view is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'view-order-1001')?.interactable === true },
  { n: "57. Order 1001 track is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'track-order-1001')?.interactable === true },
  { n: "58. Order 1002 ID extracted",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'order-id-1002')?.text === 'Order #1002' },
  { n: "59. Order 1002 status extracted",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'order-status-1002')?.text === 'Pending' },
  { n: "60. Order 1002 cancel is interactable",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'cancel-order-1002')?.interactable === true },
  // Settings
  { n: "61. Site name input is editable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'site-name')?.editable === true },
  { n: "62. Site URL input is editable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'site-url')?.editable === true },
  { n: "63. Timezone select is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'timezone')?.interactable === true },
  { n: "64. Enable notif checkbox is interactable",      assert: (ast: DistilledNode[]) => findNodeById(ast, 'enable-notif')?.interactable === true },
  { n: "65. Enable 2FA checkbox is interactable",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'enable-2fa')?.interactable === true },
  { n: "66. Theme select is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'theme-select')?.interactable === true },
  { n: "67. Save settings is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'save-settings')?.interactable === true },
  { n: "68. Reset settings is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'reset-settings')?.interactable === true },
  { n: "69. Site name value preserved",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'site-name')?.attributes.value === 'AdminPanel' },
  { n: "70. Timezone is interactable",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'timezone')?.interactable === true },
  // Modal
  { n: "71. User modal has role dialog",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'user-modal')?.role === 'dialog' },
  { n: "72. Edit name input is editable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'edit-name')?.editable === true },
  { n: "73. Edit email input is editable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'edit-email')?.editable === true },
  { n: "74. Edit role select is interactable",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'edit-role')?.interactable === true },
  { n: "75. Edit active checkbox is interactable",       assert: (ast: DistilledNode[]) => findNodeById(ast, 'edit-active')?.interactable === true },
  { n: "76. Save user is interactable",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'save-user')?.interactable === true },
  { n: "77. Cancel edit is interactable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'cancel-edit')?.interactable === true },
  { n: "78. User modal title extracted",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'user-modal-title')?.text === 'Edit User' },
  { n: "79. Table has thead with Name header",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'th-name')?.text === 'Name' },
  { n: "80. Add user has data-testid",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'add-user-btn')?.attributes['data-testid'] === 'add-user' },
];

describe('Real-World Admin Dashboard Lab', () => {
  it('should pass all admin dashboard traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'Real-World Admin Dashboard Lab',
      ADMIN_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 ADMIN DASHBOARD FLAWLESS — CRUD flows mastered!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} admin dashboard trap(s) failed`);
  });
});
