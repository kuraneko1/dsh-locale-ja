import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('the bundle declares its own locale plugin and ships its patch', async () => {
  const root = new URL('../', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml');
  assert.ok(manifest.files.includes('cordis.patch.yml'));
  assert.equal(manifest.peerDependencies['@deepseek-ai/dsh-client-locale'], '0.2.1-rc.2 || 0.2.1-rc.3');
  assert.equal(manifest.repository.url, 'git+https://github.com/kuraneko1/dsh-locale-ja.git');
  const patch = await readFile(new URL(manifest.dsh.bundle.patch, root), 'utf8');
  assert.equal(patch, ["- insert:", "    - id: dsh-locale-ja", "      name: dsh-locale-ja", "      config: {}", ""].join("\n"));
});
