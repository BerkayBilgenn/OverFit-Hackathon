/**
 * Veri iki yerde duruyor: engine/data (motorun ve testlerin okuduğu) ile
 * public/overfit-data (tarayıcının fetch ettiği). Biri güncellenip diğeri
 * unutulursa testler eski veriyi doğrular, uygulama yenisini gösterir ve
 * hiçbir yerde hata çıkmaz. Bu test o sessiz ayrışmayı yakalar.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const FILES = ["questions.tr.json", "program-groups.json", "programs.min.json"];
const hash = (url) => createHash("sha256").update(readFileSync(url)).digest("hex");

test("engine/data ile public/overfit-data birebir aynı", () => {
  for (const name of FILES) {
    const motor = hash(new URL(`../data/${name}`, import.meta.url));
    const tarayici = hash(new URL(`../../public/overfit-data/${name}`, import.meta.url));
    assert.equal(motor, tarayici,
      `${name} ayrışmış. Düzeltmek için: cd engine && cp data/${name} ../public/overfit-data/`);
  }
});
