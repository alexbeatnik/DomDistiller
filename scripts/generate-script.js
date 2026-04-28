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

const code = `// AUTO-GENERATED — do not edit manually
export const distillScript = \`${escaped}
return domDistiller();\`;
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, code);
console.log('Generated src/generated/script.ts');
