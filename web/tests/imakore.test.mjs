import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("ships the focused two-tab Japanese experience", async () => {
  const app = await readFile(new URL("app/ImakoreApp.tsx", root), "utf8");

  assert.match(app, /今、何が頭にある？/);
  assert.match(app, />残す</);
  assert.match(app, />振り返る</);
  assert.match(app, /localStorage/);
  assert.match(app, /createdAt/);
  assert.match(app, /updatedAt/);
  assert.match(app, /Intl\.Segmenter/);
  assert.match(app, /最近、何度も現れていること/);
  assert.match(app, /theme\.entryIds\.length/);
  assert.match(app, /サンプルで体験する/);
  assert.match(app, /思考を検索/);
  assert.match(app, /exportEntries/);
  assert.match(app, /importEntries/);
  assert.match(app, /この端末内だけで分析しています/);
  assert.match(app, /思考のこだま/);
  assert.match(app, /前にも、似た思考がありました/);
  assert.match(app, /この思考につながる記録/);
  assert.match(app, /findRelatedThoughts/);
  assert.match(app, /MAX_IMPORT_BYTES/);
  assert.doesNotMatch(app, /締切|優先度|タグ|カレンダー/);
});

test("includes installable offline app metadata", async () => {
  const [manifestText, serviceWorker] = await Promise.all([
    readFile(new URL("public/manifest.webmanifest", root), "utf8"),
    readFile(new URL("public/sw.js", root), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);

  assert.equal(manifest.name, "imakore");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.lang, "ja");
  assert.match(serviceWorker, /caches\.open/);
  assert.match(serviceWorker, /event\.request\.mode === "navigate"/);
  assert.match(serviceWorker, /imakore-v4/);
  assert.match(serviceWorker, /url\.origin !== self\.location\.origin/);
});
