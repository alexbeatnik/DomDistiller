const fs = require('fs');
const path = require('path');

const injectedPath = path.join(__dirname, '..', 'dist', 'injected.js');
const outputPath = path.join(__dirname, '..', 'src', 'generated', 'script.ts');

if (!fs.existsSync(injectedPath)) {
  throw new Error(
    'dist/injected.js not found. Run `npm run compile:injected` first.'
  );
}

const script = fs.readFileSync(injectedPath, 'utf8');
const escaped = script
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\${/g, '\\${');

// The injected script defines `function domDistiller(options)` at top level
// (which becomes `window.domDistiller`). It is meant to be loaded via
// `page.addScriptTag({ content: distillScript })` and then invoked with
// `page.evaluate((opts) => window.domDistiller(opts), opts)`. Do NOT append
// a top-level `return` here — that would be a SyntaxError inside a <script>
// element and prevent the function from being registered on `window`.
const code = `// AUTO-GENERATED — do not edit manually
export const distillScript = \`${escaped}\`;
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, code);
console.log('Generated src/generated/script.ts');
