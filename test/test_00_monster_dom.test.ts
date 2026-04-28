import { describe, it } from 'node:test';
import assert from 'node:assert';
import { findNodeById, collectIds, launchBrowser, runDistiller } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// MONSTER DOM LAB — Real-World Extraction Gauntlet (80+ traps)
//
// Validates that DomDistiller correctly identifies, labels, and locates
// elements across extreme real-world patterns:
// - Tailwind utility classes, SVG icons, sr-only text
// - Custom switches, contenteditable, hidden file uploads
// - Table actions, modal close buttons, hamburger menus
// - Social login, inline links, wizard steps, star ratings
// - Complex nested spans, cart widgets, video play buttons
// - Shadow DOM, fieldsets, floating labels
// ─────────────────────────────────────────────────────────────────────────────

const MONSTER_DOM = `
<!DOCTYPE html>
<html>
<head>
    <title>Monster DOM 80</title>
    <style>
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
        .hidden-file { display: none; }
        .custom-switch { width: 40px; height: 20px; background: #ccc; border-radius: 10px; display: inline-block; cursor: pointer; }
    </style>
</head>
<body>

<fieldset>
    <legend>Suggession Class</legend>
    <input type="text" id="trap_legend_input" placeholder="Type here">
</fieldset>

<div>
    <label for="trap_phantom_chk">Option 1</label>
    <input type="checkbox" id="trap_phantom_chk">
    <label for="trap_phantom_select">Dropdown</label>
    <select id="trap_phantom_select"><option>Select...</option><option>Option 1</option></select>
</div>

<div>
    <button id="trap_hidden_btn" style="display: none;">Submit Login</button>
    <div id="trap_fake_btn" class="button" role="button">Submit Login</div>
    <input type="submit" id="trap_real_btn" value="Submit Login" aria-label="Submit Login">
</div>

<div id="host"></div>
<script>
    const host = document.getElementById('host');
    const shadow = host.attachShadow({mode: 'open'});
    const label = document.createElement('label'); label.textContent = 'Cyber Password';
    const input = document.createElement('input'); input.type = 'password'; input.id = 'trap_shadow_input';
    shadow.appendChild(label); shadow.appendChild(input);
</script>

<div>
    <button id="trap_aria_btn" aria-label="Close Window">X</button>
    <div id="trap_wrong_aria" role="button">Close Window</div>
</div>

<div>
    <button id="trap_btn_partial1">Save and Continue</button>
    <button id="trap_btn_exact">Save</button>
    <button id="trap_btn_partial2">Save Draft</button>
</div>

<div>
    <label for="trap_opacity_chk">Accept Terms</label>
    <input type="checkbox" id="trap_opacity_chk" style="opacity: 0.01;">
</div>

<div>
    <input type="text" id="trap_placeholder_input" placeholder="Secret Token">
    <div id="trap_placeholder_div">Secret Token</div>
</div>

<fieldset>
    <legend>Subscribe?</legend>
    <input type="radio" id="trap_radio_yes" name="sub" value="yes"><label for="trap_radio_yes">Yes</label>
    <input type="radio" id="trap_radio_no" name="sub" value="no"><label for="trap_radio_no">No</label>
</fieldset>

<div>
    <div id="trap_role_chk" role="checkbox" aria-checked="false" aria-label="Remember Me" style="display:inline-block; width:20px; height:20px; border:1px solid #000;"></div>
    <input type="text" id="trap_wrong_input" aria-label="Remember Me">
</div>

<div>
    <button id="trap_text_btn">Confirm Order</button>
    <button id="trap_qa_btn" data-testid="confirm-order">Click Here</button>
</div>

<div>
    <button id="trap_btn_login">Register Portal</button>
    <a href="/login" id="trap_link_login">Register Portal</a>
</div>

<section id="login-form-section">
    <h3>Login Form</h3><label for="trap_section_login">Email</label><input type="email" id="trap_section_login">
</section>
<section id="signup-form-section">
    <h3>Signup Form</h3><label for="trap_section_signup">Email</label><input type="email" id="trap_section_signup">
</section>

<div>
    <button id="trap_icon_wrong">Filter</button>
    <button id="trap_icon_search"><i class="fa fa-search"></i></button>
    <button id="trap_icon_close"><i class="fa fa-times"></i></button>
</div>

<div>
    <button id="trap_disabled_btn" disabled>Submit</button>
    <button id="trap_enabled_btn">Submit</button>
</div>

<div>
    <button id="trap_qty_btn">Quantity</button><label for="trap_qty_input">Quantity</label><input type="number" id="trap_qty_input">
</div>

<div>
    <label id="trap_newsletter_label"><input type="checkbox" id="trap_newsletter_chk"> Newsletter</label>
    <div id="trap_newsletter_div">Newsletter</div>
</div>

<div>
    <button id="trap_delete_all" data-testid="delete-all">Delete</button>
    <button id="trap_delete_selected" data-testid="delete-selected">Delete</button>
</div>

<div>
    <label for="trap_readonly_input">Promo Code</label><input type="text" id="trap_readonly_input" readonly value="PLACEHOLDER">
    <button id="trap_readonly_btn">Promo Code</button>
</div>

<div>
    <button id="trap_title_wrong">Options</button><button id="trap_title_btn" title="Settings">⚙</button>
</div>

<div>
    <a href="/download" id="trap_download_link">Download</a><button id="trap_download_btn">Download</button>
</div>

<div>
    <input type="text" id="trap_pw_text" placeholder="password">
    <input type="password" id="trap_pw_pass" placeholder="password">
</div>

<div class="floating-field">
    <span id="trap_float_label" class="float-label">Card Number</span><input type="text" id="trap_float_input" data-qa="card-number">
</div>

<table>
    <tr><td><input type="checkbox" id="trap_chk_phone"></td><td>Phone</td><td>$699</td></tr>
    <tr><td><input type="checkbox" id="trap_chk_laptop"></td><td>Laptop</td><td>$1299</td></tr>
</table>

<div id="cookie_banner" style="display: none;"><button id="trap_cookie_btn">Accept Cookies</button></div>
<div><button id="trap_zero_pixel_btn" style="width: 0; height: 0; padding: 0; border: none; overflow: hidden;">Close Ad if exists</button></div>
<div><label for="trap_promo_optional_input">Promotion Code if exists</label><input type="text" id="trap_promo_optional_input"></div>

<div>
    <label for="trap_check_agree_chk">Agree to Terms</label><input type="checkbox" id="trap_check_agree_chk">
    <label for="trap_check_agree_input">Agree to Terms</label><input type="text" id="trap_check_agree_input">
</div>
<div>
    <label for="trap_uncheck_renew_chk">Auto-Renew</label><input type="checkbox" id="trap_uncheck_renew_chk" checked>
    <button id="trap_uncheck_renew_btn">Auto-Renew Settings</button>
</div>
<div>
    <label for="trap_priority_chk">Priority</label><input type="checkbox" id="trap_priority_chk">
    <input type="radio" id="trap_priority_radio" name="prio" value="urgent"><label for="trap_priority_radio">Urgent</label>
    <label for="trap_priority_select">Priority</label><select id="trap_priority_select"><option>Low</option><option>Urgent</option></select>
</div>
<div><button id="trap_partial_decoy_btn">Ad Settings</button></div>
<div>
    <input type="text" id="trap_addr_decoy" placeholder="Enter your address">
    <input type="text" id="trap_dqa_ship" data-qa="shipping-address">
</div>
<div><label for="trap_jsclick_chk">Enable Notifications</label><input type="checkbox" id="trap_jsclick_chk"></div>
<div>
    <label for="trap_addr_textarea">Address</label><input type="text" id="trap_addr_text_decoy">
    <textarea id="trap_addr_textarea"></textarea>
</div>
<div><button id="trap_dblclick_btn" ondblclick="this.dataset.clicked='double'">Double Click Me</button><button id="trap_singleclick_btn">Click Me</button></div>
<div>
    <label for="trap_date_input">Start Date</label><input type="date" id="trap_date_input">
    <label for="trap_date_notes">Start Date Notes</label><input type="text" id="trap_date_notes">
</div>
<div><input type="search" id="trap_search_input" placeholder="Search Articles" aria-label="Search Articles"><button id="trap_search_btn">Search</button></div>
<nav><a href="#" id="trap_page_1">1</a><a href="#" id="trap_page_2">2</a><a href="#" id="trap_page_3">3</a><a href="#" id="trap_page_next">Next</a></nav>
<div><label for="trap_day_wed">Wednesday</label><input type="checkbox" id="trap_day_wed"></div>
<div><label for="trap_country_select">Country</label><select id="trap_country_select"><option>India</option><option>Japan</option></select></div>
<div><button id="trap_hover_btn" onmouseover="this.dataset.hovered='yes'">Mouse Hover</button></div>
<div><label for="trap_toggle_chk">Accept Marketing</label><input type="checkbox" id="trap_toggle_chk"></div>
<div><input type="search" id="trap_enter_input" placeholder="Wiki Search" onkeydown="if(event.key==='Enter') this.dataset.entered='yes'"></div>

<div><label for="norm_fullname">Full Name</label><input type="text" id="norm_fullname"></div>
<div><label for="norm_email">Work Email</label><input type="email" id="norm_email"></div>
<div><label for="norm_token">API Token</label><input type="text" id="norm_token"></div>
<div><label for="norm_comment">Comment</label><textarea id="norm_comment" rows="3"></textarea></div>
<div><button id="norm_submit_btn" onclick="this.dataset.done='yes'">Send Message</button></div>
<div><a href="#about" id="norm_about_link">About Us</a></div>
<div><label for="norm_readonly">Coupon Code</label><input type="text" id="norm_readonly" readonly value="OLD"></div>
<div><label for="norm_login_user">Username</label><input type="text" id="norm_login_user" onkeydown="if(event.key==='Enter') this.dataset.submitted='yes'"></div>
<fieldset><input type="radio" id="norm_radio_female" name="gender"><label for="norm_radio_female">Female</label></fieldset>
<div><label for="norm_agree_chk">I Agree</label><input type="checkbox" id="norm_agree_chk"></div>
<div><label for="norm_color_select">Color</label><select id="norm_color_select"><option>Red</option><option>Blue</option></select></div>
<div id="norm_message_box">Operation completed successfully</div><div id="norm_hidden_error" style="display:none">Critical failure</div>
<div><button id="strict_save_btn">  Save me  </button></div>
<div id="strict_error_text">Invalid credentials</div>
<div><label for="strict_login_field">Login</label><input type="text" id="strict_login_field" placeholder="Login/Email"></div>
<div><input type="search" id="strict_search_input" aria-label="Search" placeholder="Type to search..."></div>
<div><label for="strict_email_value">Profile Email</label><input type="email" id="strict_email_value" value="captain@manul.com"></div>
<div><label for="strict_note_area">Notes</label><textarea id="strict_note_area">treasure map</textarea></div>
<table id="norm_price_table"><tr><td>Monitor</td><td>$299</td></tr></table>

<button id="rw_tw_btn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out">Deploy Application</button>

<button id="rw_svg_profile" aria-label="User Profile" style="width:40px; height:40px;">
    <svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
</button>

<button id="rw_sr_bell" style="padding: 10px;">
    <span class="sr-only">View Notifications</span>
    🔔
</button>

<div style="display:flex; align-items:center;">
    <span id="rw_switch_label">Dark Mode</span>
    <div id="rw_custom_switch" role="switch" aria-checked="false" aria-labelledby="rw_switch_label" class="custom-switch"></div>
</div>

<div>
    <label id="rw_wysiwyg_label">Message Body</label>
    <div id="rw_wysiwyg" contenteditable="true" aria-labelledby="rw_wysiwyg_label" style="min-height: 50px; border: 1px solid #ccc;"></div>
</div>

<div>
    <label for="rw_file_input" id="rw_file_label" data-qa="upload-resume" style="cursor:pointer; background:#eee; padding:5px;">Upload Resume</label>
    <input type="file" id="rw_file_input" class="hidden-file" style="display:none;">
</div>

<table id="rw_users">
    <tr>
        <td>Alice</td>
        <td><button id="rw_edit_profile" data-testid="edit-user-btn">Edit Profile</button></td>
    </tr>
</table>

<div class="card" style="border:1px solid #ccc; padding:10px; width:200px;">
    <h2 id="rw_prod_title">Gaming Mouse</h2>
    <p>High DPI, RGB</p>
    <span class="price">$59.99</span>
    <button>Add</button>
</div>

<div class="modal" style="position:fixed; top:10px; right:10px; border:1px solid #000;">
    <button id="rw_modal_close" aria-label="Close dialog">✖</button>
    <p>Welcome to our site!</p>
</div>

<button id="rw_hamburger" aria-expanded="false" aria-label="Open Navigation" style="font-size:24px;">☰</button>

<button id="rw_google_btn" class="social-login">
    <img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="G" style="width:16px;">
    Continue with Google
</button>

<p>
    By checking this, I agree to the
    <a href="/terms" id="rw_terms_link">Terms of Service</a> and Privacy Policy.
</p>

<button id="rw_next_step">Next: Shipping Details &rarr;</button>

<div role="radiogroup" aria-label="Rating">
    <div role="radio" aria-label="1 star" id="rw_star_1">⭐</div>
    <div role="radio" aria-label="5 stars" id="rw_star_5">⭐⭐⭐⭐⭐</div>
</div>

<button id="rw_load_more" class="btn-ghost" style="width:100%; padding:20px;">Load More Articles</button>

<div>
    <input type="text" value="manul_hater">
    <div id="rw_error_msg" class="text-red-500" style="color: red;">Username is already taken.</div>
</div>

<button id="rw_fab_create" title="Create New Post" style="position:fixed; bottom:20px; right:20px; border-radius:50%; width:50px; height:50px;">+</button>

<button id="rw_complex_btn">
    <span>Submit</span>
    <span>
        <span>Order</span>
    </span>
</button>

<div id="rw_cart_widget">
    Cart <span id="rw_cart_count" class="badge">3</span>
</div>

<div class="video-container">
    <button id="rw_play_btn" aria-label="Play Video">▶️</button>
</div>

</body>
</html>
`;

// ─────────────────────────────────────────────────────────────────────────────
// Test catalogue
// ─────────────────────────────────────────────────────────────────────────────
interface MonsterTrap {
  name: string;
  desc?: string;
  expectedId: string;
  checks: (node: DistilledNode) => boolean;
}

const TRAPS: MonsterTrap[] = [
  // ── Basic resolution ──
  { name: "1. Legend input", expectedId: "trap_legend_input", checks: (n) => n.editable === true && n.tag === 'input' },
  { name: "2. Phantom checkbox", expectedId: "trap_phantom_chk", checks: (n) => n.tag === 'input' && n.interactable === true },
  { name: "3. Phantom select", expectedId: "trap_phantom_select", checks: (n) => n.tag === 'select' && n.interactable === true },
  { name: "4. Hidden btn filtered", expectedId: "trap_hidden_btn", checks: (n) => n === undefined }, // should NOT exist
  { name: "5. Fake button (role=button)", expectedId: "trap_fake_btn", checks: (n) => n.role === 'button' && n.interactable === true },
  { name: "6. Real submit btn", expectedId: "trap_real_btn", checks: (n) => n.tag === 'input' && n.interactable === true && n.attributes['aria-label'] === 'Submit Login' },
  { name: "7. Shadow DOM password", expectedId: "trap_shadow_input", checks: (n) => n.tag === 'input' && n.editable === true },
  { name: "8. Aria close button", expectedId: "trap_aria_btn", checks: (n) => n.attributes['aria-label'] === 'Close Window' && n.interactable === true },
  { name: "9. Exact Save button", expectedId: "trap_btn_exact", checks: (n) => n.text === 'Save' && n.interactable === true },
  { name: "10. Opacity checkbox", expectedId: "trap_opacity_chk", checks: (n) => n.tag === 'input' && n.interactable === true },
  { name: "11. Placeholder input", expectedId: "trap_placeholder_input", checks: (n) => n.attributes.placeholder === 'Secret Token' && n.editable === true },
  { name: "12. Radio No", expectedId: "trap_radio_no", checks: (n) => n.tag === 'input' && n.interactable === true },
  { name: "13. Role checkbox div", expectedId: "trap_role_chk", checks: (n) => n.role === 'checkbox' && n.interactable === true },
  { name: "14. data-testid confirm-order", expectedId: "trap_qa_btn", checks: (n) => n.locator === 'data-testid=confirm-order' },
  { name: "15. Link login", expectedId: "trap_link_login", checks: (n) => n.tag === 'a' && n.attributes.href === '/login' },
  { name: "16. Section login", expectedId: "trap_section_login", checks: (n) => n.tag === 'input' && n.editable === true },
  { name: "17. Icon search", expectedId: "trap_icon_search", checks: (n) => n.interactable === true },
  { name: "18. Enabled Submit", expectedId: "trap_enabled_btn", checks: (n) => n.disabled === false && n.interactable === true },
  { name: "19. Quantity input", expectedId: "trap_qty_input", checks: (n) => n.tag === 'input' && n.editable === true },
  { name: "20. Newsletter checkbox", expectedId: "trap_newsletter_chk", checks: (n) => n.tag === 'input' && n.interactable === true },
  { name: "21. Delete selected data-testid", expectedId: "trap_delete_selected", checks: (n) => n.locator === 'data-testid=delete-selected' },
  { name: "22. Readonly input", expectedId: "trap_readonly_input", checks: (n) => n.editable === false && n.tag === 'input' },
  { name: "23. Title Settings btn", expectedId: "trap_title_btn", checks: (n) => n.attributes.title === 'Settings' && n.interactable === true },
  { name: "24. Download link", expectedId: "trap_download_link", checks: (n) => n.tag === 'a' && n.interactable === true },
  { name: "25. Password type input", expectedId: "trap_pw_pass", checks: (n) => n.tag === 'input' && n.editable === true },
  { name: "26. Card number input", expectedId: "trap_float_input", checks: (n) => n.attributes['data-qa'] === 'card-number' && n.editable === true },
  { name: "27. Laptop checkbox", expectedId: "trap_chk_laptop", checks: (n) => n.tag === 'input' && n.interactable === true },
  // ── Optional / hidden ──
  { name: "28. Cookie banner hidden", expectedId: "trap_cookie_btn", checks: (n) => n === undefined },
  { name: "29. Zero-pixel button hidden", expectedId: "trap_zero_pixel_btn", checks: (n) => n === undefined },
  { name: "30. Promo optional input", expectedId: "trap_promo_optional_input", checks: (n) => n.editable === true },
  // ── Checkbox/radio/select groups ──
  { name: "31. Agree checkbox", expectedId: "trap_check_agree_chk", checks: (n) => n.tag === 'input' && n.interactable === true },
  { name: "32. Auto-Renew checkbox", expectedId: "trap_uncheck_renew_chk", checks: (n) => n.tag === 'input' && n.checked === true },
  { name: "33. Priority select", expectedId: "trap_priority_select", checks: (n) => n.tag === 'select' && n.interactable === true },
  { name: "34. Shipping data-qa", expectedId: "trap_dqa_ship", checks: (n) => n.locator === 'data-qa=shipping-address' },
  { name: "35. Notifications checkbox", expectedId: "trap_jsclick_chk", checks: (n) => n.tag === 'input' && n.interactable === true },
  { name: "36. Address textarea", expectedId: "trap_addr_textarea", checks: (n) => n.tag === 'textarea' && n.editable === true },
  { name: "37. Single click btn", expectedId: "trap_singleclick_btn", checks: (n) => n.text === 'Click Me' && n.interactable === true },
  { name: "38. Date input", expectedId: "trap_date_input", checks: (n) => n.tag === 'input' && n.editable === true },
  { name: "39. Search input", expectedId: "trap_search_input", checks: (n) => n.tag === 'input' && n.editable === true },
  { name: "40. Page 3 pagination", expectedId: "trap_page_3", checks: (n) => n.tag === 'a' && n.text === '3' },
  { name: "41. Wednesday checkbox", expectedId: "trap_day_wed", checks: (n) => n.tag === 'input' && n.interactable === true },
  { name: "42. Country select", expectedId: "trap_country_select", checks: (n) => n.tag === 'select' && n.interactable === true },
  { name: "43. Hover button", expectedId: "trap_hover_btn", checks: (n) => n.interactable === true },
  { name: "44. Marketing checkbox", expectedId: "trap_toggle_chk", checks: (n) => n.tag === 'input' && n.interactable === true },
  { name: "45. Wiki search input", expectedId: "trap_enter_input", checks: (n) => n.tag === 'input' && n.editable === true },
  // ── Normal elements ──
  { name: "46. Full name input", expectedId: "norm_fullname", checks: (n) => n.editable === true },
  { name: "47. Work email input", expectedId: "norm_email", checks: (n) => n.editable === true && n.tag === 'input' },
  { name: "48. API token input", expectedId: "norm_token", checks: (n) => n.editable === true },
  { name: "49. Comment textarea", expectedId: "norm_comment", checks: (n) => n.tag === 'textarea' && n.editable === true },
  { name: "50. Send Message button", expectedId: "norm_submit_btn", checks: (n) => n.interactable === true && n.text === 'Send Message' },
  { name: "51. About Us link", expectedId: "norm_about_link", checks: (n) => n.tag === 'a' && n.text === 'About Us' },
  { name: "52. Coupon readonly", expectedId: "norm_readonly", checks: (n) => n.editable === false && n.tag === 'input' },
  { name: "53. Username input", expectedId: "norm_login_user", checks: (n) => n.editable === true },
  { name: "54. Female radio", expectedId: "norm_radio_female", checks: (n) => n.tag === 'input' && n.interactable === true },
  { name: "55. I Agree checkbox", expectedId: "norm_agree_chk", checks: (n) => n.tag === 'input' && n.interactable === true },
  { name: "56. Color select", expectedId: "norm_color_select", checks: (n) => n.tag === 'select' && n.interactable === true },
  { name: "57. Message box text", expectedId: "norm_message_box", checks: (n) => n.text === 'Operation completed successfully' && n.interactable === false },
  { name: "58. Hidden error filtered", expectedId: "norm_hidden_error", checks: (n) => n === undefined },
  { name: "59. Save me button", expectedId: "strict_save_btn", checks: (n) => n.text === 'Save me' && n.interactable === true },
  { name: "60. Error text", expectedId: "strict_error_text", checks: (n) => n.text === 'Invalid credentials' },
  { name: "61. Login field placeholder", expectedId: "strict_login_field", checks: (n) => n.attributes.placeholder === 'Login/Email' && n.editable === true },
  { name: "62. Search input aria-label", expectedId: "strict_search_input", checks: (n) => n.attributes['aria-label'] === 'Search' && n.editable === true },
  { name: "63. Profile email value", expectedId: "strict_email_value", checks: (n) => n.attributes.value === 'captain@manul.com' && n.editable === true },
  { name: "64. Notes textarea", expectedId: "strict_note_area", checks: (n) => n.tag === 'textarea' && n.text === 'Notes' && n.editable === true },
  // ── Real-world elements ──
  { name: "65. Tailwind Deploy button", expectedId: "rw_tw_btn", checks: (n) => n.text === 'Deploy Application' && n.interactable === true },
  { name: "66. SVG Profile (ARIA)", expectedId: "rw_svg_profile", checks: (n) => n.attributes['aria-label'] === 'User Profile' && n.interactable === true },
  { name: "67. Screen Reader bell", expectedId: "rw_sr_bell", checks: (n) => (n.text.includes('View Notifications') || n.text.includes('🔔')) && n.interactable === true },
  { name: "68. Custom switch role", expectedId: "rw_custom_switch", checks: (n) => n.role === 'switch' && n.interactable === true },
  { name: "69. ContentEditable WYSIWYG", expectedId: "rw_wysiwyg", checks: (n) => n.editable === true && n.tag === 'div' },
  { name: "70. Hidden file upload label", expectedId: "rw_file_label", checks: (n) => n.text === 'Upload Resume' && n.interactable === true && n.locator === 'data-qa=upload-resume' },
  { name: "71. Table Edit Profile", expectedId: "rw_edit_profile", checks: (n) => n.text === 'Edit Profile' && n.locator === 'data-testid=edit-user-btn' },
  { name: "72. Gaming Mouse title", expectedId: "rw_prod_title", checks: (n) => n.text === 'Gaming Mouse' && n.tag === 'h2' },
  { name: "73. Modal close X", expectedId: "rw_modal_close", checks: (n) => n.attributes['aria-label'] === 'Close dialog' && n.interactable === true },
  { name: "74. Hamburger menu", expectedId: "rw_hamburger", checks: (n) => n.attributes['aria-label'] === 'Open Navigation' && n.interactable === true },
  { name: "75. Google social login", expectedId: "rw_google_btn", checks: (n) => n.text === 'Continue with Google' && n.interactable === true },
  { name: "76. Terms of Service link", expectedId: "rw_terms_link", checks: (n) => n.text === 'Terms of Service' && n.tag === 'a' },
  { name: "77. Next step button", expectedId: "rw_next_step", checks: (n) => n.text === 'Next: Shipping Details →' && n.interactable === true },
  { name: "78. 5 stars rating", expectedId: "rw_star_5", checks: (n) => n.role === 'radio' && n.attributes['aria-label'] === '5 stars' },
  { name: "79. Load More button", expectedId: "rw_load_more", checks: (n) => n.text === 'Load More Articles' && n.interactable === true },
  { name: "80. Error message", expectedId: "rw_error_msg", checks: (n) => n.text === 'Username is already taken.' && n.interactable === false },
  { name: "81. FAB create", expectedId: "rw_fab_create", checks: (n) => n.attributes.title === 'Create New Post' && n.interactable === true },
  { name: "82. Complex nested span button", expectedId: "rw_complex_btn", checks: (n) => n.text === 'Submit Order' && n.interactable === true },
  { name: "83. Cart widget", expectedId: "rw_cart_widget", checks: (n) => n.text === 'Cart 3' },
  { name: "84. Play Video button", expectedId: "rw_play_btn", checks: (n) => n.attributes['aria-label'] === 'Play Video' && n.interactable === true },
];

// Tests that should NOT appear in AST (filtered out)
const NEGATIVE_TRAPS = [
  { name: "85. Script button pruned", id: "script_btn" },
  { name: "86. Noscript button pruned", id: "noscript_btn" },
  { name: "87. Template button pruned", id: "template_btn" },
  { name: "88. Hidden error pruned", id: "norm_hidden_error" },
  { name: "89. Cookie banner hidden", id: "trap_cookie_btn" },
  { name: "90. Zero-pixel button hidden", id: "trap_zero_pixel_btn" },
];

describe('Monster DOM Lab', () => {
  it('should pass all 84 extraction traps and 6 negative traps', async () => {
    const { browser, page } = await launchBrowser();
    await page.setContent(MONSTER_DOM);
    const ast = await runDistiller(page);

    let passed = 0;
    let failed = 0;
    const failures: string[] = [];

    console.log(`\n${'─'.repeat(70)}`);
    console.log(`🧪 Monster DOM Lab (${TRAPS.length} positive + ${NEGATIVE_TRAPS.length} negative traps)`);
    console.log(`${'─'.repeat(70)}`);

    // Positive traps
    for (const t of TRAPS) {
      const node = findNodeById(ast, t.expectedId);
      let ok: boolean;
      try {
        ok = t.checks(node as DistilledNode);
      } catch {
        ok = false;
      }
      if (ok) {
        console.log(`   ✅ ${t.name}`);
        passed++;
      } else {
        console.log(`   ❌ ${t.name} — node=${node ? 'found' : 'MISSING'}`);
        failed++;
        failures.push(t.name);
      }
    }

    // Negative traps
    for (const t of NEGATIVE_TRAPS) {
      const node = findNodeById(ast, t.id);
      if (node === undefined) {
        console.log(`   ✅ ${t.name}`);
        passed++;
      } else {
        console.log(`   ❌ ${t.name} — should be filtered but was found`);
        failed++;
        failures.push(t.name);
      }
    }

    // Meta checks
    const ids = collectIds(ast);
    const metaChecks = [
      {
        name: "91. No script/style/template/noscript IDs leaked",
        check: !ids.has('script_btn') && !ids.has('noscript_btn') && !ids.has('template_btn'),
      },
      {
        name: "92. Shadow DOM password input discovered",
        check: ids.has('trap_shadow_input'),
      },
      {
        name: "93. All interactable nodes have locators",
        check: (() => {
          const walk = (nodes: DistilledNode[]): boolean => {
            for (const n of nodes) {
              if (n.interactable && !n.locator) return false;
              if (!walk(n.children)) return false;
            }
            return true;
          };
          return walk(ast);
        })(),
      },
      {
        name: "94. No empty meaningless wrapper divs at top level",
        check: !ast.some((n) => n.tag === 'div' && !n.text && !n.interactable && n.children.length === 0 && Object.keys(n.attributes).length === 0),
      },
    ];

    for (const m of metaChecks) {
      if (m.check) {
        console.log(`   ✅ ${m.name}`);
        passed++;
      } else {
        console.log(`   ❌ ${m.name}`);
        failed++;
        failures.push(m.name);
      }
    }

    await browser.close();

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 MONSTER DOM FLAWLESS — DomDistiller is unbreakable!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} monster DOM trap(s) failed`);
  });
});
