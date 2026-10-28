import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { loadClientModule } from './client-loader.mjs';

const root = new URL('../', import.meta.url);
const json = async (file) => JSON.parse(await readFile(new URL(file, root), 'utf8'));

test('current catalog has complete translations and the client registers them', async () => {
  const upstream = await json('locale/upstream.json');
  const status = await json('locale/translation-status.json');
  const metadata = await json('locale/package-meta.json');
  const manifest = await json('package.json');
  assert.equal(metadata.clientLocalePeer, '0.2.1-rc.2 || 0.2.1-rc.3');
  assert.equal(manifest.peerDependencies['@deepseek-ai/dsh-client-locale'], metadata.clientLocalePeer);
  assert.equal(upstream.dsh.version, '0.2.1-rc.3');
  assert.deepEqual([status.totals.namespaces, status.totals.keys, status.totals.translated, status.totals.fallback], [65, 2915, 2915, 0]);
  const client = loadClientModule(await readFile(new URL('client.js', root), 'utf8'));
  const placeholders = text => [...text.matchAll(/\{([A-Za-z][A-Za-z0-9_.-]*)\}/g)].map(m => m[1]).sort();
  for (const [namespace, entry] of Object.entries(upstream.namespaces)) {
    const en = await json('locale/namespaces/en/' + entry.fileName);
    const ja = await json('locale/namespaces/ja/' + entry.fileName);
    assert.deepEqual(Object.keys(ja).sort(), Object.keys(en).sort(), namespace);
    assert.deepEqual(client.dictionaries[namespace], ja, namespace);
    for (const key of Object.keys(en)) assert.deepEqual(placeholders(ja[key]), placeholders(en[key]), namespace + '.' + key);
  }
  assert.equal(client.dictionaries.sidebarRight['tab.guide.more'], 'その他のツール');
  assert.equal(client.dictionaries.sidebar['panels.more'], 'その他');
  const registered = new Map(), disposers = [];
  client.apply({ effect(fn) { disposers.push(fn()); }, locale: {
    addLanguage(value) { registered.set('language', value); return () => registered.delete('language'); },
    register(name, locale, value) { assert.equal(locale, 'ja'); registered.set(name, value); return () => registered.delete(name); }
  }});
  assert.equal(registered.size, 66);
  for (const dispose of disposers) dispose();
  assert.equal(registered.size, 0);
});
