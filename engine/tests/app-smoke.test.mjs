import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../tester/index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../tester/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../tester/styles.css", import.meta.url), "utf8");

const has = (pattern, message) => assert.match(html, pattern, message);

test("sayfa iskeleti beklenen bölgeleri taşır", () => {
  has(/<main[\s>]/, "tek bir main landmark olmalı");
  assert.equal(html.match(/<main[\s>]/g).length, 1);
  has(/lang="tr"/, "dil tr olmalı");
  has(/<h1[\s>]/, "sayfa başlığı");
});

test("başlangıç ekranında iki eşit akış düğmesi var", () => {
  has(/id="start-score-known"/);
  has(/id="start-score-unknown"/);
});

test("akademik giriş alanları var", () => {
  has(/id="score-type"/);
  has(/id="success-rank"/);
  has(/id="academic-continue"/);
});

test("soru ekranı gerekli kontrolleri taşır", () => {
  has(/id="progress"/);
  has(/id="question-text"/);
  has(/id="option-a"/);
  has(/id="option-b"/);
  has(/id="back"/);
  has(/id="reset"/);
});

test("test paneli ve canlı bölge var", () => {
  has(/id="tester-toggle"/);
  has(/id="tester-panel"/);
  has(/aria-live="polite"/, "yeni soru ekran okuyucuya duyurulmalı");
});

test("prototip uyarısı ve kaynak bildirimi görünür", () => {
  assert.match(html, /prototip/i, "sonuçların prototip olduğu yazmalı");
  assert.match(html, /ÖSYM/, "bağlayıcı kaynak bildirimi olmalı");
});

test("uygulama kodu motoru ve gerçek veriyi kullanır", () => {
  assert.match(app, /dataUrl/, "veri yolu dışarıdan verilmeli");
  assert.match(app, /createOverfit/);
  assert.match(app, /localStorage/);
  assert.match(app, /overfit\.restore/, "eski oturum biçimi temiz başlamalı");
});

test("erişilebilirlik temelleri stilde karşılanır", () => {
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /min-height:\s*44px/, "dokunma hedefi en az 44px");
});
