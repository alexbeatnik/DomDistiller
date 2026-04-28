import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runTrapSuite, findNodeById, findNodeByText } from './_helpers';
import type { DistilledNode } from '../src/types';

// ─────────────────────────────────────────────────────────────────────────────
// I18N & MULTILINGUAL LAB — RTL, CJK, Cyrillic, Arabic, Accented chars
// ─────────────────────────────────────────────────────────────────────────────

const I18N_DOM = `
<!DOCTYPE html>
<html lang="en">
<head><title>I18N</title></head>
<body>
<div id="lang-en">
  <h1 id="title-en">Welcome</h1>
  <button id="btn-en">Submit</button>
  <input id="input-en" placeholder="Enter your name">
</div>

<div id="lang-de" dir="ltr">
  <h1 id="title-de">Willkommen</h1>
  <button id="btn-de">Absenden</button>
  <input id="input-de" placeholder="Geben Sie Ihren Namen ein">
</div>

<div id="lang-fr" dir="ltr">
  <h1 id="title-fr">Bienvenue</h1>
  <button id="btn-fr">Envoyer</button>
  <input id="input-fr" placeholder="Entrez votre nom">
</div>

<div id="lang-es" dir="ltr">
  <h1 id="title-es">Bienvenido</h1>
  <button id="btn-es">Enviar</button>
  <input id="input-es" placeholder="Ingrese su nombre">
</div>

<div id="lang-ja" dir="ltr">
  <h1 id="title-ja">ようこそ</h1>
  <button id="btn-ja">送信</button>
  <input id="input-ja" placeholder="名前を入力してください">
</div>

<div id="lang-zh" dir="ltr">
  <h1 id="title-zh">欢迎</h1>
  <button id="btn-zh">提交</button>
  <input id="input-zh" placeholder="请输入您的姓名">
</div>

<div id="lang-ko" dir="ltr">
  <h1 id="title-ko">환영합니다</h1>
  <button id="btn-ko">제출</button>
  <input id="input-ko" placeholder="이름을 입력하세요">
</div>

<div id="lang-ar" dir="rtl">
  <h1 id="title-ar">مرحباً</h1>
  <button id="btn-ar">إرسال</button>
  <input id="input-ar" placeholder="أدخل اسمك">
</div>

<div id="lang-he" dir="rtl">
  <h1 id="title-he">ברוך הבא</h1>
  <button id="btn-he">שלח</button>
  <input id="input-he" placeholder="הכנס את שמך">
</div>

<div id="lang-ru" dir="ltr">
  <h1 id="title-ru">Добро пожаловать</h1>
  <button id="btn-ru">Отправить</button>
  <input id="input-ru" placeholder="Введите ваше имя">
</div>

<div id="lang-uk" dir="ltr">
  <h1 id="title-uk">Ласкаво просимо</h1>
  <button id="btn-uk">Надіслати</button>
  <input id="input-uk" placeholder="Введіть ваше ім'я">
</div>

<div id="lang-pl" dir="ltr">
  <h1 id="title-pl">Witamy</h1>
  <button id="btn-pl">Wyślij</button>
  <input id="input-pl" placeholder="Wprowadź swoje imię">
</div>

<div id="lang-tr" dir="ltr">
  <h1 id="title-tr">Hoş geldiniz</h1>
  <button id="btn-tr">Gönder</button>
  <input id="input-tr" placeholder="Adınızı girin">
</div>

<div id="lang-th" dir="ltr">
  <h1 id="title-th">ยินดีต้อนรับ</h1>
  <button id="btn-th">ส่ง</button>
  <input id="input-th" placeholder="กรุณาใส่ชื่อของคุณ">
</div>

<div id="lang-vi" dir="ltr">
  <h1 id="title-vi">Chào mừng</h1>
  <button id="btn-vi">Gửi</button>
  <input id="input-vi" placeholder="Nhập tên của bạn">
</div>

<div id="lang-el" dir="ltr">
  <h1 id="title-el">Καλώς ήρθατε</h1>
  <button id="btn-el">Υποβολή</button>
  <input id="input-el" placeholder="Εισάγετε το όνομά σας">
</div>

<div id="lang-hi" dir="ltr">
  <h1 id="title-hi">स्वागत है</h1>
  <button id="btn-hi">भेजें</button>
  <input id="input-hi" placeholder="अपना नाम दर्ज करें">
</div>

<div id="lang-ta" dir="ltr">
  <h1 id="title-ta">வரவேற்கிறோம்</h1>
  <button id="btn-ta">சமர்ப்பிக்கவும்</button>
  <input id="input-ta" placeholder="உங்கள் பெயரை உள்ளிடவும்">
</div>

<div id="lang-emojis">
  <button id="btn-emoji-1">🚀 Blast off</button>
  <button id="btn-emoji-2">❤️ Like</button>
  <button id="btn-emoji-3">👍 Thumbs up</button>
  <button id="btn-emoji-4">🎉 Celebrate</button>
  <button id="btn-emoji-5">🔥 Fire</button>
</div>

<div id="lang-mixed">
  <button id="btn-mixed">Hello 你好 Bonjour مرحباً 🌍</button>
  <input id="input-mixed" placeholder="Type here | 在这里输入 | Écrivez ici">
</div>

<div id="lang-accents">
  <button id="btn-accent-1">Café</button>
  <button id="btn-accent-2">Naïve</button>
  <button id="btn-accent-3">Résumé</button>
  <button id="btn-accent-4">Zürich</button>
  <button id="btn-accent-5">Århus</button>
</div>
</body>
</html>
`;

const TRAPS = [
  // English
  { n: "1. English title extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'title-en')?.text === 'Welcome' },
  { n: "2. English button is interactable",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-en')?.interactable === true },
  { n: "3. English input is editable",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'input-en')?.editable === true },
  { n: "4. English placeholder correct",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'input-en')?.attributes.placeholder === 'Enter your name' },
  // German
  { n: "5. German title extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'title-de')?.text === 'Willkommen' },
  { n: "6. German button text",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-de')?.text === 'Absenden' },
  { n: "7. German placeholder",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'input-de')?.attributes.placeholder === 'Geben Sie Ihren Namen ein' },
  // French
  { n: "8. French title extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'title-fr')?.text === 'Bienvenue' },
  { n: "9. French button text",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-fr')?.text === 'Envoyer' },
  { n: "10. French placeholder",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'input-fr')?.attributes.placeholder === 'Entrez votre nom' },
  // Spanish
  { n: "11. Spanish title extracted",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'title-es')?.text === 'Bienvenido' },
  { n: "12. Spanish button text",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-es')?.text === 'Enviar' },
  // Japanese
  { n: "13. Japanese title extracted",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'title-ja')?.text === 'ようこそ' },
  { n: "14. Japanese button text",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-ja')?.text === '送信' },
  { n: "15. Japanese placeholder",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'input-ja')?.attributes.placeholder === '名前を入力してください' },
  // Chinese
  { n: "16. Chinese title extracted",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'title-zh')?.text === '欢迎' },
  { n: "17. Chinese button text",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-zh')?.text === '提交' },
  // Korean
  { n: "18. Korean title extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'title-ko')?.text === '환영합니다' },
  { n: "19. Korean button text",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-ko')?.text === '제출' },
  // Arabic (RTL)
  { n: "20. Arabic title extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'title-ar')?.text === 'مرحباً' },
  { n: "21. Arabic button text",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-ar')?.text === 'إرسال' },
  { n: "22. Arabic placeholder",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'input-ar')?.attributes.placeholder === 'أدخل اسمك' },
  // Hebrew (RTL)
  { n: "23. Hebrew title extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'title-he')?.text === 'ברוך הבא' },
  { n: "24. Hebrew button text",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-he')?.text === 'שלח' },
  { n: "25. Hebrew placeholder",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'input-he')?.attributes.placeholder === 'הכנס את שמך' },
  // Russian
  { n: "27. Russian title extracted",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'title-ru')?.text === 'Добро пожаловать' },
  { n: "28. Russian button text",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-ru')?.text === 'Отправить' },
  { n: "29. Russian placeholder",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'input-ru')?.attributes.placeholder === 'Введите ваше имя' },
  // Ukrainian
  { n: "30. Ukrainian title extracted",                  assert: (ast: DistilledNode[]) => findNodeById(ast, 'title-uk')?.text === 'Ласкаво просимо' },
  { n: "31. Ukrainian button text",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-uk')?.text === 'Надіслати' },
  // Polish
  { n: "32. Polish title extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'title-pl')?.text === 'Witamy' },
  { n: "33. Polish button text",                         assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-pl')?.text === 'Wyślij' },
  // Turkish
  { n: "34. Turkish title extracted",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'title-tr')?.text === 'Hoş geldiniz' },
  { n: "35. Turkish button text",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-tr')?.text === 'Gönder' },
  // Thai
  { n: "36. Thai title extracted",                       assert: (ast: DistilledNode[]) => findNodeById(ast, 'title-th')?.text === 'ยินดีต้อนรับ' },
  { n: "37. Thai button text",                           assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-th')?.text === 'ส่ง' },
  // Vietnamese
  { n: "38. Vietnamese title extracted",                 assert: (ast: DistilledNode[]) => findNodeById(ast, 'title-vi')?.text === 'Chào mừng' },
  { n: "39. Vietnamese button text",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-vi')?.text === 'Gửi' },
  // Greek
  { n: "40. Greek title extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'title-el')?.text === 'Καλώς ήρθατε' },
  { n: "41. Greek button text",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-el')?.text === 'Υποβολή' },
  // Hindi
  { n: "42. Hindi title extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'title-hi')?.text === 'स्वागत है' },
  { n: "43. Hindi button text",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-hi')?.text === 'भेजें' },
  // Tamil
  { n: "44. Tamil title extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'title-ta')?.text === 'வரவேற்கிறோம்' },
  { n: "45. Tamil button text",                          assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-ta')?.text === 'சமர்ப்பிக்கவும்' },
  // Emojis
  { n: "46. Emoji button 1 text",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-emoji-1')?.text.includes('🚀') },
  { n: "47. Emoji button 2 text",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-emoji-2')?.text.includes('❤️') },
  { n: "48. Emoji button 3 text",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-emoji-3')?.text.includes('👍') },
  { n: "49. Emoji button 4 text",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-emoji-4')?.text.includes('🎉') },
  { n: "50. Emoji button 5 text",                        assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-emoji-5')?.text.includes('🔥') },
  // Mixed
  { n: "51. Mixed lang button text",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-mixed')?.text.includes('Hello') },
  { n: "52. Mixed lang button has Chinese",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-mixed')?.text.includes('你好') },
  { n: "53. Mixed lang button has Arabic",               assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-mixed')?.text.includes('مرحباً') },
  { n: "54. Mixed lang button has emoji",                assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-mixed')?.text.includes('🌍') },
  { n: "55. Mixed placeholder has English",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'input-mixed')?.attributes.placeholder.includes('Type here') },
  { n: "56. Mixed placeholder has Chinese",              assert: (ast: DistilledNode[]) => findNodeById(ast, 'input-mixed')?.attributes.placeholder.includes('在这里输入') },
  // Accents
  { n: "57. Accent café extracted",                      assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-accent-1')?.text === 'Café' },
  { n: "58. Accent naïve extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-accent-2')?.text === 'Naïve' },
  { n: "59. Accent résumé extracted",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-accent-3')?.text === 'Résumé' },
  { n: "60. Accent Zürich extracted",                    assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-accent-4')?.text === 'Zürich' },
  { n: "61. Accent Århus extracted",                     assert: (ast: DistilledNode[]) => findNodeById(ast, 'btn-accent-5')?.text === 'Århus' },
  // All interactable
  { n: "62. All 19 language buttons interactable",       assert: (ast: DistilledNode[]) => {
    const ids = ['btn-en','btn-de','btn-fr','btn-es','btn-ja','btn-zh','btn-ko','btn-ar','btn-he','btn-ru','btn-uk','btn-pl','btn-tr','btn-th','btn-vi','btn-el','btn-hi','btn-ta','btn-mixed'];
    return ids.every(id => findNodeById(ast, id)?.interactable === true);
  }},
  { n: "63. All 19 language inputs editable",            assert: (ast: DistilledNode[]) => {
    const ids = ['input-en','input-de','input-fr','input-es','input-ja','input-zh','input-ko','input-ar','input-he','input-ru','input-uk','input-pl','input-tr','input-th','input-vi','input-el','input-hi','input-ta','input-mixed'];
    return ids.every(id => findNodeById(ast, id)?.editable === true);
  }},
  { n: "64. No script/style leaked",                     assert: (ast: DistilledNode[]) => {
    let ok = true;
    const walk = (nodes: DistilledNode[]) => { for (const n of nodes) { if (n.tag === 'script' || n.tag === 'style') ok = false; walk(n.children); } };
    walk(ast);
    return ok;
  }},
  { n: "65. Arabic input is editable",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'input-ar')?.editable === true },
  { n: "66. Hebrew input is editable",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'input-he')?.editable === true },
  { n: "67. German input is editable",                   assert: (ast: DistilledNode[]) => findNodeById(ast, 'input-de')?.editable === true },
];

describe('I18N & Multilingual Lab', () => {
  it('should pass all i18n traps', async () => {
    const { passed, failed, failures } = await runTrapSuite(
      'I18N & Multilingual Lab',
      I18N_DOM,
      TRAPS
    );

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${passed}/${passed + failed} passed`);
    if (failures.length) {
      console.log('\n🙀 Failures:');
      for (const f of failures) console.log(`   • ${f}`);
    }
    if (failed === 0) {
      console.log('\n🏆 I18N FLAWLESS — Globalization mastered!');
    }
    console.log(`${'='.repeat(70)}`);

    assert.strictEqual(failed, 0, `${failures.length} i18n trap(s) failed`);
  });
});
