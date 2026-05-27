import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = path.resolve('dist/generated');

function withJsExtension(specifier) {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
    return specifier;
  }

  if (/\.(js|mjs|cjs|json|node|wasm)$/i.test(specifier)) {
    return specifier;
  }

  return `${specifier}.js`;
}

function rewriteRelativeSpecifiers(code) {
  const fromRe = /(from\s+["'])(\.{1,2}\/[^"']+)(["'])/g;
  const dynamicImportRe = /(import\(\s*["'])(\.{1,2}\/[^"']+)(["']\s*\))/g;

  return code
    .replace(fromRe, (_, p1, spec, p3) => `${p1}${withJsExtension(spec)}${p3}`)
    .replace(dynamicImportRe, (_, p1, spec, p3) => `${p1}${withJsExtension(spec)}${p3}`);
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }

    if (!entry.isFile() || !fullPath.endsWith('.js')) {
      continue;
    }

    const source = await readFile(fullPath, 'utf8');
    const updated = rewriteRelativeSpecifiers(source);
    if (updated !== source) {
      await writeFile(fullPath, updated, 'utf8');
    }
  }
}

await walk(rootDir);
