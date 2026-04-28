import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByText } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// FORMS & VALIDATION LAB — All input types, patterns, required, disabled
// ─────────────────────────────────────────────────────────────────────────────

const FORMS_DOM = `
<!DOCTYPE html>
<html lang="en">
<head><title>Forms</title></head>
<body>
<form id="registration-form" novalidate>
  <fieldset id="fs-account">
    <legend>Account Information</legend>
    <label for="reg-username">Username *</label>
    <input type="text" id="reg-username" name="username" required minlength="3" maxlength="20" pattern="^[a-zA-Z0-9_]+$">
    <span id="err-username" class="error">Username is required</span>

    <label for="reg-email">Email *</label>
    <input type="email" id="reg-email" name="email" required placeholder="you@example.com">
    <span id="err-email" class="error">Valid email required</span>

    <label for="reg-password">Password *</label>
    <input type="password" id="reg-password" name="password" required minlength="8">
    <meter id="pw-strength" min="0" max="4" value="0">Weak</meter>

    <label for="reg-confirm">Confirm Password *</label>
    <input type="password" id="reg-confirm" name="confirm" required>
  </fieldset>

  <fieldset id="fs-personal">
    <legend>Personal Information</legend>
    <label for="reg-firstname">First Name</label>
    <input type="text" id="reg-firstname" name="firstname" autocomplete="given-name">

    <label for="reg-lastname">Last Name</label>
    <input type="text" id="reg-lastname" name="lastname" autocomplete="family-name">

    <label for="reg-phone">Phone</label>
    <input type="tel" id="reg-phone" name="phone" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" placeholder="555-555-5555">

    <label for="reg-dob">Date of Birth</label>
    <input type="date" id="reg-dob" name="dob" max="2006-01-01">

    <label for="reg-website">Website</label>
    <input type="url" id="reg-website" name="website" placeholder="https://example.com">

    <label for="reg-bio">Bio</label>
    <textarea id="reg-bio" name="bio" rows="4" maxlength="500"></textarea>
  </fieldset>

  <fieldset id="fs-preferences">
    <legend>Preferences</legend>
    <label for="reg-country">Country</label>
    <select id="reg-country" name="country">
      <option value="">Select...</option>
      <option value="us">United States</option>
      <option value="uk">United Kingdom</option>
      <option value="ca">Canada</option>
      <option value="jp">Japan</option>
    </select>

    <label for="reg-language">Language</label>
    <select id="reg-language" name="language" multiple>
      <option value="en">English</option>
      <option value="es">Spanish</option>
      <option value="fr">French</option>
      <option value="de">German</option>
    </select>

    <label>Gender</label>
    <label><input type="radio" id="reg-gender-m" name="gender" value="male"> Male</label>
    <label><input type="radio" id="reg-gender-f" name="gender" value="female"> Female</label>
    <label><input type="radio" id="reg-gender-o" name="gender" value="other"> Other</label>
    <label><input type="radio" id="reg-gender-x" name="gender" value="prefer-not"> Prefer not to say</label>

    <label>Interests</label>
    <label><input type="checkbox" id="reg-int-tech" name="interests" value="tech"> Technology</label>
    <label><input type="checkbox" id="reg-int-sport" name="interests" value="sports"> Sports</label>
    <label><input type="checkbox" id="reg-int-music" name="interests" value="music"> Music</label>

    <label for="reg-color">Favorite Color</label>
    <input type="color" id="reg-color" name="color" value="#ff0000">

    <label for="reg-satisfaction">Satisfaction (1-10)</label>
    <input type="range" id="reg-satisfaction" name="satisfaction" min="1" max="10" value="5">
    <output id="satisfaction-val" for="reg-satisfaction">5</output>

    <label for="reg-avatar">Profile Picture</label>
    <input type="file" id="reg-avatar" name="avatar" accept="image/*">

    <label for="reg-search">Search Term</label>
    <input type="search" id="reg-search" name="search" results="5">
  </fieldset>

  <fieldset id="fs-security">
    <legend>Security</legend>
    <label for="reg-2fa">2FA Method</label>
    <select id="reg-2fa" name="2fa">
      <option value="none">None</option>
      <option value="sms">SMS</option>
      <option value="app">Authenticator App</option>
      <option value="hardware">Hardware Key</option>
    </select>

    <label for="reg-secret">Secret Question</label>
    <input type="text" id="reg-secret" name="secret" list="secret-list">
    <datalist id="secret-list">
      <option value="First pet name?">
      <option value="Mother maiden name?">
      <option value="City of birth?">
    </datalist>

    <label for="reg-pin">Security PIN</label>
    <input type="password" id="reg-pin" name="pin" inputmode="numeric" pattern="[0-9]{4}">
  </fieldset>

  <div id="form-actions">
    <button type="submit" id="btn-submit" data-testid="submit-registration">Create Account</button>
    <button type="reset" id="btn-reset">Clear Form</button>
    <button type="button" id="btn-save-draft">Save Draft</button>
    <button type="button" id="btn-preview" disabled>Preview</button>
  </div>
</form>

<form id="login-form">
  <label for="login-email">Email</label>
  <input type="email" id="login-email" name="login-email" autocomplete="username">
  <label for="login-password">Password</label>
  <input type="password" id="login-password" name="login-password" autocomplete="current-password">
  <label><input type="checkbox" id="login-remember" name="remember"> Remember me</label>
  <a href="/forgot" id="forgot-link">Forgot password?</a>
  <button type="submit" id="btn-login">Sign In</button>
</form>

<div id="disabled-section">
  <input type="text" id="disabled-input" disabled value="Disabled">
  <button id="disabled-btn" disabled>Disabled Button</button>
  <select id="disabled-select" disabled><option>A</option></select>
  <textarea id="disabled-textarea" disabled>Disabled</textarea>
</div>
</body>
</html>
`;

const TRAPS = [
  // Account info
  { n: "1. Username input is editable",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-username')?.editable === true },
  { n: "2. Username has type text",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-username')?.attributes.type === 'text' },
  { n: "3. Username placeholder not present",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-username')?.attributes.placeholder === undefined },
  { n: "4. Username name attr",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-username')?.attributes.name === 'username' },
  { n: "5. Username id preserved",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-username')?.attributes.id === 'reg-username' },
  { n: "6. Email input is editable",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-email')?.editable === true },
  { n: "7. Email has type email",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-email')?.attributes.type === 'email' },
  { n: "8. Email placeholder correct",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-email')?.attributes.placeholder === 'you@example.com' },
  { n: "9. Password input is editable",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-password')?.editable === true },
  { n: "10. Password has type password",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-password')?.attributes.type === 'password' },
  { n: "11. Password name attr",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-password')?.attributes.name === 'password' },
  { n: "12. Confirm password is editable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-confirm')?.editable === true },
  { n: "13. Password strength meter exists",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'pw-strength') !== undefined },
  // Personal info
  { n: "14. First name is editable",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-firstname')?.editable === true },
  { n: "15. First name name attr",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-firstname')?.attributes.name === 'firstname' },
  { n: "16. Last name is editable",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-lastname')?.editable === true },
  { n: "17. Phone input is editable",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-phone')?.editable === true },
  { n: "18. Phone has type tel",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-phone')?.attributes.type === 'tel' },
  { n: "19. Phone placeholder correct",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-phone')?.attributes.placeholder === '555-555-5555' },
  { n: "20. DOB input is editable",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-dob')?.editable === true },
  { n: "21. DOB has type date",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-dob')?.attributes.type === 'date' },
  { n: "22. DOB name attr",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-dob')?.attributes.name === 'dob' },
  { n: "23. Website input is editable",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-website')?.editable === true },
  { n: "24. Website has type url",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-website')?.attributes.type === 'url' },
  { n: "25. Bio textarea is editable",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-bio')?.editable === true },
  { n: "26. Bio name attr",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-bio')?.attributes.name === 'bio' },
  // Preferences
  { n: "27. Country select is interactable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-country')?.interactable === true },
  { n: "28. Country select has name",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-country')?.attributes.name === 'country' },
  { n: "29. Language select is interactable",            assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-language')?.interactable === true },
  { n: "30. Language select has name",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-language')?.attributes.name === 'language' },
  { n: "31. Gender male radio is interactable",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-gender-m')?.interactable === true },
  { n: "32. Gender female radio is interactable",        assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-gender-f')?.interactable === true },
  { n: "33. Gender other radio is interactable",         assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-gender-o')?.interactable === true },
  { n: "34. Gender prefer-not radio is interactable",    assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-gender-x')?.interactable === true },
  { n: "35. Interest tech checkbox is interactable",     assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-int-tech')?.interactable === true },
  { n: "36. Interest sport checkbox is interactable",    assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-int-sport')?.interactable === true },
  { n: "37. Interest music checkbox is interactable",    assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-int-music')?.interactable === true },
  { n: "38. Color input is editable",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-color')?.editable === true },
  { n: "39. Color has type color",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-color')?.attributes.type === 'color' },
  { n: "40. Color default value",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-color')?.attributes.value === '#ff0000' },
  { n: "41. Range input is editable",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-satisfaction')?.editable === true },
  { n: "42. Range has type range",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-satisfaction')?.attributes.type === 'range' },
  { n: "43. Range default value 5",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-satisfaction')?.attributes.value === '5' },
  { n: "44. Output element exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'satisfaction-val') !== undefined },
  { n: "45. File input is interactable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-avatar')?.interactable === true },
  { n: "46. File has type file",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-avatar')?.attributes.type === 'file' },
  { n: "47. Search input is editable",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-search')?.editable === true },
  { n: "48. Search has type search",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-search')?.attributes.type === 'search' },
  // Security
  { n: "49. 2FA select is interactable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-2fa')?.interactable === true },
  { n: "50. Secret input is editable",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-secret')?.editable === true },
  { n: "51. Datalist filtered",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'secret-list') === undefined },
  { n: "52. PIN input is editable",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-pin')?.editable === true },
  { n: "53. PIN has type password",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-pin')?.attributes.type === 'password' },
  { n: "54. PIN name attr",                              assert: (ast: DistilledNode[]) => findNodeById(ast, 'reg-pin')?.attributes.name === 'pin' },
  // Form actions
  { n: "55. Submit button is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-submit')?.interactable === true },
  { n: "56. Submit has data-testid",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-submit')?.attributes['data-testid'] === 'submit-registration' },
  { n: "57. Reset button is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-reset')?.interactable === true },
  { n: "58. Save draft button is interactable",          assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-save-draft')?.interactable === true },
  { n: "59. Preview button disabled but interactable",   assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-preview')?.interactable === true && findNodeById(ast, 'btn-preview')?.disabled === true },
  // Login form
  { n: "60. Login email is editable",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'login-email')?.editable === true },
  { n: "61. Login password is editable",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'login-password')?.editable === true },
  { n: "62. Login remember checkbox is interactable",    assert: (ast: DistilledNode[]) => findNodeById(ast, 'login-remember')?.interactable === true },
  { n: "63. Forgot password link is interactable",       assert: (ast: DistilledNode[]) => findNodeById(ast, 'forgot-link')?.interactable === true },
  { n: "64. Login button is interactable",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-login')?.interactable === true },
  { n: "65. Login email name attr",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'login-email')?.attributes.name === 'login-email' },
  { n: "66. Login password name attr",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'login-password')?.attributes.name === 'login-password' },
  // Disabled section
  { n: "67. Disabled input not editable",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'disabled-input')?.editable === false },
  { n: "68. Disabled input has disabled flag",           assert: (ast: DistilledNode[]) => findNodeById(ast, 'disabled-input')?.disabled === true },
  { n: "69. Disabled button interactable but disabled",  assert: (ast: DistilledNode[]) => findNodeById(ast, 'disabled-btn')?.interactable === true && findNodeById(ast, 'disabled-btn')?.disabled === true },
  { n: "70. Disabled select interactable but disabled",  assert: (ast: DistilledNode[]) => findNodeById(ast, 'disabled-select')?.interactable === true && findNodeById(ast, 'disabled-select')?.disabled === true },
  { n: "71. Disabled textarea not editable",             assert: (ast: DistilledNode[]) => findNodeById(ast, 'disabled-textarea')?.editable === false },
  { n: "72. Registration form exists",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'registration-form') !== undefined },
  { n: "73. Fieldset account exists",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'fs-account') !== undefined },
  { n: "74. Fieldset personal exists",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'fs-personal') !== undefined },
  { n: "75. Fieldset preferences exists",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'fs-preferences') !== undefined },
  { n: "76. Error username exists",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'err-username')?.text.includes('required') },
  { n: "77. Error email exists",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'err-email')?.text.includes('Valid') },
  { n: "78. Form actions section exists",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'form-actions') !== undefined },
  { n: "79. Login form exists",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'login-form') !== undefined },
  { n: "80. Disabled section exists",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'disabled-section') !== undefined },
];

describe('Forms & Validation Lab', () => {
  it('should pass all form traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'Forms & Validation Lab',
      FORMS_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 FORMS FLAWLESS — Validation mastered!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} form trap(s) failed`);
  });
});
