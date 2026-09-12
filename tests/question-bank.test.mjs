import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { DIMENSION_IDS, AUDIENCES, STAGES, STAGE_PLAN } from "../src/dimensions.js";
import { CAREER_FAMILIES } from "../src/career-families.js";

const questions = JSON.parse(readFileSync(new URL("../data/questions.tr.json", import.meta.url), "utf8"));
const familyIds = new Set(CAREER_FAMILIES.map((family) => family.id));

const countBy = (items, key) =>
  items.reduce((acc, item) => ({ ...acc, [item[key]]: (acc[item[key]] ?? 0) + 1 }), {});

test("banka onaylanan dağılıma sahip", () => {
  assert.equal(questions.length, 80);
  assert.deepEqual(countBy(questions, "audience"), {
    both: 48,
    score_known: 16,
    score_unknown: 16,
  });
});

test("kimlikler benzersiz", () => {
  const ids = questions.map((question) => question.id);
  assert.equal(new Set(ids).size, 80);
});

test("her soru iki dolu seçenek ve ayrı bir sonraki odak taşır", () => {
  for (const question of questions) {
    assert.equal(question.options.length, 2, question.id);
    assert.notDeepEqual(question.options[0].nextFocus, question.options[1].nextFocus, question.id);
    for (const option of question.options) {
      assert.ok(option.text.trim().length > 0, question.id);
      assert.ok(option.text.length <= 95, `${question.id}: seçenek çok uzun`);
      assert.ok(Object.keys(option.scoreEffects).length >= 1, question.id);
      assert.ok(option.nextFocus.length >= 1, question.id);
    }
  }
});

test("boyut ve puan anahtarları izin verilen listede", () => {
  const allowed = new Set(DIMENSION_IDS);
  for (const question of questions) {
    for (const dimension of question.dimensions) assert.ok(allowed.has(dimension), `${question.id}: ${dimension}`);
    assert.ok(question.dimensions.length <= 3, `${question.id}: üçten fazla boyut`);
    for (const option of question.options) {
      for (const [dimension, value] of Object.entries(option.scoreEffects)) {
        assert.ok(allowed.has(dimension), `${question.id}: ${dimension}`);
        assert.ok(Number.isInteger(value) && value >= -2 && value <= 3, `${question.id}: ${dimension}=${value}`);
      }
      assert.ok(Object.values(option.scoreEffects).some((value) => value > 0), `${question.id}: yalnızca negatif etki`);
      for (const dimension of option.nextFocus) assert.ok(allowed.has(dimension), `${question.id}: ${dimension}`);
    }
  }
});

test("meta alanları şemaya uyar", () => {
  for (const question of questions) {
    assert.ok(AUDIENCES.includes(question.audience), question.id);
    assert.ok(STAGES.includes(question.stage), question.id);
    assert.equal(question.status, "draft", `${question.id}: editoryal inceleme bitmeden active olamaz`);
    assert.equal(question.version, 1);
    assert.ok(question.questionFamily.length > 0, question.id);
    assert.ok(Number.isInteger(question.priority), question.id);
    assert.ok(question.text.length <= 130, `${question.id}: soru metni çok uzun`);
    assert.equal(question.text, question.text.trim(), question.id);
    for (const family of question.programFamilies) {
      assert.ok(familyIds.has(family), `${question.id}: bilinmeyen aile ${family}`);
    }
  }
});

test("ters çift referansları geçerli", () => {
  const byId = new Map(questions.map((question) => [question.id, question]));
  for (const question of questions) {
    if (question.reversePairId === null) continue;
    const pair = byId.get(question.reversePairId);
    assert.ok(pair, `${question.id}: eksik ters çift ${question.reversePairId}`);
    assert.notEqual(pair.id, question.id, `${question.id}: kendine referans`);
  }
});

test("her akış her aşamada yeterli çeşitlilik bulur", () => {
  for (const audience of ["score_known", "score_unknown"]) {
    for (const stage of new Set(STAGE_PLAN)) {
      const pool = questions.filter(
        (question) => question.stage === stage && (question.audience === "both" || question.audience === audience),
      );
      const needed = STAGE_PLAN.filter((planned) => planned === stage).length;
      const families = new Set(pool.map((question) => question.questionFamily));
      assert.ok(pool.length >= needed + 3, `${audience}/${stage}: havuz çok küçük (${pool.length})`);
      assert.ok(families.size >= needed, `${audience}/${stage}: aile çeşitliliği yetersiz (${families.size})`);
    }
  }
});

test("metinlerde Türkçe dışı karakter yok", () => {
  // Kiril 'е' gibi görünmez karakterler yazım sırasında sızabiliyor.
  const allowed = /^[A-Za-zçÇğĞıİöÖşŞüÜâÂîÎûÛ0-9 .,;:?!'’"()\-/]+$/;
  for (const question of questions) {
    assert.match(question.text, allowed, question.id);
    for (const option of question.options) assert.match(option.text, allowed, `${question.id}/${option.id}`);
  }
});

test("seçenekler dengeli uzunlukta (biri açıkça 'doğru cevap' görünmesin)", () => {
  for (const question of questions) {
    const [a, b] = question.options.map((option) => option.text.length);
    assert.ok(Math.abs(a - b) <= 34, `${question.id}: seçenek uzunlukları çok farklı (${a} / ${b})`);
  }
});
