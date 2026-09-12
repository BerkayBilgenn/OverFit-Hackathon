/**
 * UI ekibiyle aramızdaki sözleşme. Bu testler kırılırsa arkadaşının
 * uygulaması da kırılıyor demektir — CONTRACT.md ile birlikte güncelle.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import * as api from "../index.js";

const read = (name) => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), "utf8"));
const data = {
  questions: read("questions.tr.json"),
  groups: read("program-groups.json"),
  programs: read("programs.min.json"),
};

test("paket beklenen dışa aktarımları sunar", () => {
  for (const name of [
    "createOverfit", "fetchData", "DATA_FILES",
    "createEngine", "SESSION_LENGTH", "STATE_VERSION", "topSignals",
    "indexPrograms", "rankProgramGroups", "isReachable",
    "CAREER_FAMILIES", "FAMILY_BY_ID",
    "DIMENSIONS", "DIMENSION_IDS", "AUDIENCES", "STAGES", "STAGE_PLAN",
  ]) {
    assert.ok(name in api, `eksik dışa aktarım: ${name}`);
  }
});

test("createOverfit hazır veriyle çalışır", async () => {
  const overfit = await api.createOverfit({ data });
  assert.equal(overfit.sessionLength, 10);
  assert.equal(overfit.hasPrograms, true);
  assert.equal(overfit.catalogSummary.program_count, 21493);
  assert.ok(overfit.source.binding_source.includes("ÖSYM"));
});

test("question() UI'ın ihtiyaç duyduğu her alanı verir", async () => {
  const overfit = await api.createOverfit({ data });
  const state = overfit.start({ audience: "score_unknown" });
  const question = overfit.question(state);
  assert.deepEqual(Object.keys(question).sort(), [
    "canGoBack", "id", "options", "questionFamily", "stage", "step", "text", "total",
  ]);
  assert.equal(question.step, 1);
  assert.equal(question.total, 10);
  assert.equal(question.canGoBack, false);
  assert.equal(question.options.length, 2);
  for (const option of question.options) {
    assert.deepEqual(Object.keys(option).sort(), ["id", "text"]);
  }
  assert.equal(overfit.question(overfit.answer(state, "a")).canGoBack, true);
});

test("results() yapılandırılmış sonuç ve uyarılar döner", async () => {
  const overfit = await api.createOverfit({ data });
  let state = overfit.start({ audience: "score_known", academic: { scoreType: "SAY", rank: 65000 } });
  while (!overfit.isFinished(state)) state = overfit.answer(state, "a");

  const result = overfit.results(state);
  assert.deepEqual(Object.keys(result).sort(), [
    "academic", "allFamilies", "families", "filters", "groups", "signals", "summaryText", "warnings",
  ]);
  assert.equal(result.families.length, 3);
  assert.equal(result.groups.length, 5);
  assert.equal(result.allFamilies.length, 15);
  assert.ok(result.signals[0].label.length > 0, "boyutun Türkçe etiketi gelmeli");
  assert.ok(result.warnings.some((text) => text.includes("draft")), "draft uyarısı her zaman görünmeli");
  assert.deepEqual(result.academic, { scoreType: "SAY", rank: 65000 });
});

test("program tablosu olmadan da çalışır (3,2 MB'ı yüklememe seçeneği)", async () => {
  const overfit = await api.createOverfit({ data: { ...data, programs: null } });
  assert.equal(overfit.hasPrograms, false);
  let state = overfit.start({ audience: "score_unknown" });
  while (!overfit.isFinished(state)) state = overfit.answer(state, "b");
  const result = overfit.results(state);
  assert.equal(result.groups.length, 0);
  assert.equal(result.families.length, 3, "kariyer aileleri yine de hesaplanır");
  assert.ok(result.warnings.some((text) => text.includes("Program tablosu")));
});

test("oturum düz JSON'dur ve geri yüklenebilir", async () => {
  const overfit = await api.createOverfit({ data });
  let state = overfit.start({ audience: "score_known", academic: { scoreType: "EA", rank: 90000 } });
  for (let step = 0; step < 4; step += 1) state = overfit.answer(state, step % 2 ? "b" : "a");

  const serialized = JSON.stringify(state);
  const restored = overfit.restore(JSON.parse(serialized));
  assert.equal(JSON.stringify(restored), serialized, "geri yükleme birebir aynı durumu vermeli");

  assert.equal(overfit.restore(null), null);
  assert.equal(overfit.restore({ version: 999, answers: [] }), null, "eski sürüm temiz başlamalı");
});

test("explain() test paneli için ayrı bir yüzey", async () => {
  const overfit = await api.createOverfit({ data });
  const state = overfit.answer(overfit.start({ audience: "score_unknown" }), "a");
  const view = overfit.explain(state);
  assert.ok(view.selection.parts.odak !== undefined);
  assert.ok(Array.isArray(view.families) && view.families.length === 5);
  assert.ok(Array.isArray(view.answerPath) && view.answerPath.length === 1);
});

test("bozuk soru kaydı uygulamayı durdurmaz", async () => {
  const bozuk = [...data.questions, { id: "bozuk", options: [] }, null];
  const overfit = await api.createOverfit({ data: { ...data, questions: bozuk } });
  let state = overfit.start({ audience: "score_unknown" });
  while (!overfit.isFinished(state)) state = overfit.answer(state, "a");
  assert.equal(state.answers.length, 10);
});

test("tercih koşulları oturumda taşınır ve sonuca yansır", async () => {
  const overfit = await api.createOverfit({ data });
  const filters = { cities: ["İSTANBUL"], universityType: "VAKIF", language: "İngilizce", scholarshipOnly: true };
  let state = overfit.start({ audience: "score_known", academic: { scoreType: "SAY", rank: 40000 }, filters });
  assert.deepEqual(state.filters, filters);

  while (!overfit.isFinished(state)) state = overfit.answer(state, "a");
  assert.deepEqual(state.filters, filters, "koşullar 10 adım boyunca korunmalı");

  const result = overfit.results(state);
  assert.deepEqual(result.filters, filters);
  for (const group of result.groups) assert.ok(group.access, "koşul varsa erişim bloğu hesaplanır");

  const restored = overfit.restore(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored.filters, filters, "geri yüklemede koşullar kaybolmamalı");
});
