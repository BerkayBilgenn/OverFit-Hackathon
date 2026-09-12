/**
 * Uçtan uca yol testleri: banka + motor + katalog birlikte.
 * Tohumlu üretici kullanılır; başarısızlık her zaman aynı yolla tekrarlanabilir.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { createEngine, SESSION_LENGTH } from "../src/question-engine.js";
import { indexPrograms, rankProgramGroups } from "../src/program-match.js";

const read = (name) => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), "utf8"));
const engine = createEngine(read("questions.tr.json"));
const catalog = read("program-groups.json");
const index = indexPrograms(read("programs.min.json"));
const AUDIENCES = ["score_known", "score_unknown"];

/** mulberry32 — bağımlılıksız, tohumlu rastgelelik. */
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function strategies() {
  const list = [
    ["hepsiA", () => "a"],
    ["hepsiB", () => "b"],
    ["donusumlu", (index_) => (index_ % 2 ? "b" : "a")],
    ["ucteBir", (index_) => (index_ % 3 ? "a" : "b")],
    ["oncekiA", (index_) => (index_ < 5 ? "a" : "b")],
  ];
  for (const seed of [1, 7, 42, 1337, 90210]) {
    const next = rng(seed);
    const picks = Array.from({ length: SESSION_LENGTH }, () => (next() < 0.5 ? "a" : "b"));
    list.push([`tohum${seed}:${picks.join("")}`, (index_) => picks[index_]]);
  }
  return list;
}

function walk(audience, pick, academic = null) {
  let state = engine.createSession({ audience, academic });
  const steps = [];
  while (!state.finished) {
    const step = state.answers.length;
    const other = pick(step) === "a" ? "b" : "a";
    const alternative = engine.answer(state, other);
    steps.push({
      questionId: state.currentQuestionId,
      chosen: pick(step),
      alternativeNext: alternative.finished ? null : alternative.currentQuestionId,
    });
    state = engine.answer(state, pick(step));
    if (steps.length > 1) steps[steps.length - 2].actualNext = state.currentQuestionId;
  }
  return { state, steps };
}

test("her temsili yol iki akışta da 10 benzersiz soruyla tamamlanır", () => {
  for (const audience of AUDIENCES) {
    for (const [name, pick] of strategies()) {
      const { state, steps } = walk(audience, pick);
      assert.equal(steps.length, SESSION_LENGTH, `${audience}/${name}`);
      assert.equal(new Set(steps.map((step) => step.questionId)).size, SESSION_LENGTH, `${audience}/${name}`);
      assert.equal(state.answers.length, SESSION_LENGTH);
      for (const step of steps) {
        const question = engine.question(step.questionId);
        assert.ok(question.audience === "both" || question.audience === audience, `${audience}/${name}: ${question.id}`);
      }
    }
  }
});

test("son adım hariç her adımda diğer seçenek yolu değiştirebiliyor", () => {
  let branchable = 0;
  let total = 0;
  for (const audience of AUDIENCES) {
    for (const [, pick] of strategies()) {
      const { steps } = walk(audience, pick);
      for (let index_ = 0; index_ < steps.length - 1; index_ += 1) {
        const step = steps[index_];
        if (!step.actualNext || !step.alternativeNext) continue;
        total += 1;
        if (step.actualNext !== step.alternativeNext) branchable += 1;
      }
    }
  }
  const rate = branchable / total;
  console.log(`    yol üstünde ayrışma: ${branchable}/${total} = ${(rate * 100).toFixed(1)}%`);
  assert.ok(rate >= 0.8, `ayrışma oranı düşük: ${(rate * 100).toFixed(1)}%`);
});

test("farklı yollar farklı sonuç profilleri üretir", () => {
  const topFamilies = new Set();
  const topGroups = new Set();
  for (const audience of AUDIENCES) {
    for (const [, pick] of strategies()) {
      const { state } = walk(audience, pick);
      const families = engine.rankFamilies(state.profile);
      topFamilies.add(families[0].id);
      const groups = rankProgramGroups({ familyRanking: families, groups: catalog.groups, index, limit: 5 });
      assert.equal(groups.length, 5);
      topGroups.add(groups[0].id);
    }
  }
  console.log(`    farklı ilk aile: ${topFamilies.size} · farklı ilk bölüm grubu: ${topGroups.size}`);
  assert.ok(topFamilies.size >= 3, `yalnızca ${topFamilies.size} farklı aile`);
  assert.ok(topGroups.size >= 3, `yalnızca ${topGroups.size} farklı bölüm grubu`);
});

test("erişim sayıları yayımlanmamış veriden asla iddia üretmez", () => {
  const academic = { scoreType: "EA", rank: 120000 };
  const { state } = walk("score_known", () => "b", academic);
  const groups = rankProgramGroups({
    familyRanking: engine.rankFamilies(state.profile),
    groups: catalog.groups,
    index,
    academic,
    limit: 10,
  });
  for (const group of groups) {
    const { reachable, withRank, withoutRank, sampled } = group.access;
    assert.ok(reachable <= withRank, group.id);
    assert.ok(withRank + withoutRank <= sampled, group.id);
    assert.ok(Number.isInteger(withoutRank), group.id);
  }
});

test("geri dönüp cevabı değiştirmek yolu her adımda yeniden kurar", () => {
  for (const audience of AUDIENCES) {
    const { state } = walk(audience, () => "a");
    for (let index_ = 0; index_ < SESSION_LENGTH; index_ += 1) {
      const changed = engine.changeAnswer(state, index_, "b");
      assert.equal(changed.answers.length, index_ + 1, `${audience}: adım ${index_ + 1}`);
      assert.deepEqual(
        changed.answers.map((entry) => entry.questionId),
        state.answers.slice(0, index_ + 1).map((entry) => entry.questionId),
        "korunan cevaplar aynı soruları göstermeli",
      );
      assert.deepEqual(changed.profile, engine.recomputeProfile(changed.answers).profile);
    }
  }
});
