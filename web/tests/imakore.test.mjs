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
  assert.match(app, /function readDraft\(\)/);
  assert.match(app, /Safariの設定を確認してください/);
  assert.doesNotMatch(app, /imakoreを読み込み中/);
  assert.match(app, /createdAt/);
  assert.match(app, /updatedAt/);
  assert.match(app, /Intl\.Segmenter/);
  assert.match(app, /最近、何度も現れていること/);
  assert.match(app, /theme\.entryIds\.length/);
  assert.match(app, /サンプルで体験する/);
  assert.match(app, /思考を検索/);
  assert.match(app, /exportEntries/);
  assert.match(app, /importEntries/);
  assert.match(app, /一般的な言葉を除いて端末内で分析しています/);
  assert.match(app, /THEME_ANALYSIS_WINDOW/);
  assert.match(app, /THEME_STOP_WORDS/);
  assert.match(app, /HAS_TOPIC_CHARACTER/);
  assert.match(app, /ENTRIES_FOR_CURRENT_CENTER = 10/);
  assert.match(app, /analyzeCurrentCenter/);
  assert.match(app, /今の気持ちの中心/);
  assert.match(app, /楽しかった/);
  assert.match(app, /entry\.source !== "sample"/);
  assert.match(app, /あと\{ENTRIES_FOR_CURRENT_CENTER - personalEntries\.length\}件/);
  assert.match(app, /思考のこだま/);
  assert.match(app, /前にも、似た思考がありました/);
  assert.match(app, /この思考につながる記録/);
  assert.match(app, /findRelatedThoughts/);
  assert.match(app, /new Set\(themeWords\(target\.body\)\)/);
  assert.match(app, /candidateWords = themeWords\(entry\.body\)/);
  assert.match(app, /MAX_IMPORT_BYTES/);
  assert.match(app, /未来の自分に渡す/);
  assert.match(app, /Appleカレンダーに渡す/);
  assert.match(app, /BEGIN:VCALENDAR/);
  assert.match(app, /BEGIN:VALARM/);
  assert.match(app, /TRIGGER:-PT10M/);
  assert.match(app, /navigator\.share/);
  assert.doesNotMatch(app, /締切|優先度|タグ/);
});

test("includes installable offline app metadata", async () => {
  const [manifestText, serviceWorker, worker] = await Promise.all([
    readFile(new URL("public/manifest.webmanifest", root), "utf8"),
    readFile(new URL("public/sw.js", root), "utf8"),
    readFile(new URL("worker/index.ts", root), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);

  assert.equal(manifest.name, "imakore");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.lang, "ja");
  assert.match(serviceWorker, /caches\.open/);
  assert.match(serviceWorker, /event\.request\.mode === "navigate"/);
  assert.match(serviceWorker, /imakore-v6/);
  assert.match(serviceWorker, /url\.origin !== self\.location\.origin/);
  assert.match(worker, /Content-Security-Policy/);
  assert.match(worker, /X-Content-Type-Options/);
});
