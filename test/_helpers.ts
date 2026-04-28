import { chromium, type Browser, type Page } from 'playwright-core';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { DistilledNode } from '../src/types';

const INJECTED_PATH = join(__dirname, '..', 'dist', 'injected.js');

let _scriptCache: string | null = null;

export function getDistillerScript(): string {
  if (!_scriptCache) {
    _scriptCache = readFileSync(INJECTED_PATH, 'utf-8') + '\nreturn domDistiller();';
  }
  return _scriptCache;
}

export interface TestContext {
  browser: Browser;
  page: Page;
}

export async function launchBrowser(): Promise<TestContext> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  return { browser, page };
}

export async function runDistiller(page: Page): Promise<DistilledNode[]> {
  // Use addScriptTag to inject the distiller function definition,
  // then call it in a separate evaluate to avoid a Playwright hang
  // with named function declarations inside page.evaluate().
  const scriptBody = getDistillerScript().replace(/\nreturn domDistiller\(\);$/, '');
  await page.addScriptTag({ content: scriptBody });
  return page.evaluate(() => (window as any).domDistiller());
}

export function findNodeById(ast: DistilledNode[], id: string): DistilledNode | undefined {
  const queue = [...ast];
  while (queue.length) {
    const node = queue.shift()!;
    if (node.attributes.id === id) return node;
    queue.push(...node.children);
  }
  return undefined;
}

export function findNodeByLocator(ast: DistilledNode[], locator: string): DistilledNode | undefined {
  const queue = [...ast];
  while (queue.length) {
    const node = queue.shift()!;
    if (node.locator === locator) return node;
    queue.push(...node.children);
  }
  return undefined;
}

export function findNodeByText(ast: DistilledNode[], text: string): DistilledNode | undefined {
  const queue = [...ast];
  while (queue.length) {
    const node = queue.shift()!;
    if (node.text.toLowerCase().includes(text.toLowerCase())) return node;
    queue.push(...node.children);
  }
  return undefined;
}

export function collectIds(ast: DistilledNode[]): Set<string> {
  const ids = new Set<string>();
  const walk = (nodes: DistilledNode[]) => {
    for (const n of nodes) {
      if (n.attributes.id) ids.add(n.attributes.id);
      walk(n.children);
    }
  };
  walk(ast);
  return ids;
}

export function countNodes(ast: DistilledNode[]): number {
  let count = 0;
  const walk = (nodes: DistilledNode[]) => {
    for (const n of nodes) {
      count++;
      walk(n.children);
    }
  };
  walk(ast);
  return count;
}

export interface TrapTest {
  n: string;
  assert: (ast: DistilledNode[], page: Page) => Promise<boolean> | boolean;
  desc?: string;
}

export async function runTrapSuite(
  name: string,
  html: string,
  traps: TrapTest[]
): Promise<{ passed: number; failed: number; failures: string[] }> {
  const { browser, page } = await launchBrowser();
  await page.setContent(html);

  const ast = await runDistiller(page);

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`🧪 ${name} (${traps.length} traps)`);
  console.log(`${'─'.repeat(70)}`);

  for (const t of traps) {
    try {
      const ok = await t.assert(ast, page);
      if (ok) {
        console.log(`   ✅ ${t.n}`);
        passed++;
      } else {
        console.log(`   ❌ ${t.n}`);
        failed++;
        failures.push(t.n);
      }
    } catch (err) {
      console.log(`   ❌ ${t.n} — EXCEPTION: ${(err as Error).message}`);
      failed++;
      failures.push(`${t.n}: ${(err as Error).message}`);
    }
  }

  await browser.close();
  return { passed, failed, failures };
}
