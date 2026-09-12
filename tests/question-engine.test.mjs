import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { createEngine, SESSION_LENGTH } from "../src/question-engine.js";
import { STAGE_PLAN } from "../src/dimensions.js";

const bank = JSON.parse(readFileSync(new URL("../data/questions.tr.json", import.meta.url), "utf8"));
const engine = createEngine(bank);
const AUDIENCES = ["score_known", "score_unknown"];

const run = (audience, pick) => {
  let state = engine.createSession({ audience });
  const path = [];
  while (!state.finished) {
    path.push(state.currentQuestionId);
    state = engine.answer(state, pick(path.length - 1, state));
  }
  return { state, path };
};

test("iki akış da 10 adımı tamamlar ve soru tekrar etmez", () => {
  const strategies = {
    hepsiA: () => "a",
    hepsiB: () => "b",
    donusumlu: (index) => (index % 2 === 0 ? "a" : "b"),
    ikiliDonusumlu: (index) => (Math.floor(index / 2) % 2 === 0 ? "a" : "b"),
  };
  for (const audience of AUDIENCES) {
    for (const [name, pick] of Object.entries(strategies)) {
      const { state, path } = run(audience, pick);
      assert.equal(path.length, SESSION_LENGTH, `${audience}/${name}`);
      assert.equal(new Set(path).size, SESSION_LENGTH, `${audience}/${name}: soru tekrarı`);
      assert.equal(state.answers.length, SESSION_LENGTH);
      assert.ok(state.finished);
    }
  }
});

test("sorular oturumun aşama planına uyar", () => {
  for (const audience of AUDIENCES) {
    const { path } = run(audience, () => "a");
    path.forEach((id, index) => {
      assert.equal(engine.question(id).stage, STAGE_PLAN[index], `${audience} adım ${index + 1}`);
    });
  }
});

test("kullanıcının akışına ait olmayan soru asla gösterilmez", () => {
  for (const audience of AUDIENCES) {
    for (const pick of [() => "a", () => "b"]) {
      const { path } = run(audience, pick);
      for (const id of path) {
        const question = engine.question(id);
        assert.ok(
          question.audience === "both" || question.audience === audience,
          `${audience}: ${id} (${question.audience})`,
        );
      }
    }
  }
});

test("aynı soru ailesi art arda gösterilmez", () => {
  for (const audience of AUDIENCES) {
    for (const pick of [() => "a", () => "b", (index) => (index % 2 ? "a" : "b")]) {
      const { path } = run(audience, pick);
      for (let index = 1; index < path.length; index += 1) {
        assert.notEqual(
          engine.question(path[index]).questionFamily,
          engine.question(path[index - 1]).questionFamily,
          `${audience}: ${path[index - 1]} -> ${path[index]}`,
        );
      }
    }
  }
});

/** Genişlik öncelikli, her derinlikte örneklenmiş erişilebilir durumlar. */
function* reachableStates({ samplePerDepth = 24 } = {}) {
  for (const audience of AUDIENCES) {
    let frontier = [engine.createSession({ audience })];
    for (let depth = 0; depth < SESSION_LENGTH - 1; depth += 1) {
      const next = [];
      for (const state of frontier) {
        yield state;
        next.push(engine.answer(state, "a"), engine.answer(state, "b"));
      }
      frontier = next.slice(0, samplePerDepth);
    }
  }
}

test("A ve B aynı durumdan farklı sonraki soruya götürür", () => {
  let total = 0;
  let diverged = 0;
  const collisions = [];
  for (const state of reachableStates()) {
    const a = engine.answer(state, "a");
    const b = engine.answer(state, "b");
    if (a.finished || b.finished) continue;
    total += 1;
    if (a.currentQuestionId !== b.currentQuestionId) diverged += 1;
    else collisions.push(`${state.currentQuestionId} -> ${a.currentQuestionId}`);
  }
  const rate = diverged / total;
  console.log(`    A/B ayrışma oranı: ${diverged}/${total} = ${(rate * 100).toFixed(1)}%`);
  if (collisions.length) console.log(`    birleşen yollar (ilk 5): ${collisions.slice(0, 5).join(", ")}`);
  assert.ok(total > 200, `örneklem çok küçük (${total})`);
  assert.ok(rate >= 0.85, `ayrışma oranı çok düşük: ${(rate * 100).toFixed(1)}%`);
});

test("her cevap profili ve aile sıralamasını değiştirir", () => {
  for (const state of reachableStates({ samplePerDepth: 8 })) {
    const before = JSON.stringify(state.profile);
    const after = engine.answer(state, "a");
    assert.notEqual(JSON.stringify(after.profile), before, `${state.currentQuestionId} profili değiştirmedi`);
  }
});

test("aynı cevap dizisi her zaman aynı yolu üretir", () => {
  for (const audience of AUDIENCES) {
    const first = run(audience, (index) => (index % 3 === 0 ? "b" : "a")).path;
    const second = run(audience, (index) => (index % 3 === 0 ? "b" : "a")).path;
    assert.deepEqual(first, second);
  }
});

test("geri dönmek durumu bir önceki hâline tam olarak döndürür", () => {
  let state = engine.createSession({ audience: "score_known" });
  const snapshots = [];
  while (!state.finished) {
    snapshots.push(JSON.stringify(state));
    state = engine.answer(state, "a");
  }
  for (let index = snapshots.length - 1; index >= 0; index -= 1) {
    state = engine.goBack(state);
    assert.equal(JSON.stringify(state), snapshots[index], `adım ${index + 1} geri dönüşte aynı değil`);
  }
});

test("bir cevabı değiştirmek sonraki yolu ve skoru geçersiz kılar", () => {
  const { state: completed } = run("score_unknown", () => "a");
  const changed = engine.changeAnswer(completed, 3, "b");

  assert.equal(changed.answers.length, 4, "değiştirilen adımdan sonrası silinmeli");
  assert.equal(changed.answers[3].optionId, "b");
  assert.ok(!changed.finished);
  assert.notEqual(changed.currentQuestionId, completed.questionPath[4], "devam yolu yeniden kurulmalı");

  const expected = engine.recomputeProfile(changed.answers);
  assert.deepEqual(changed.profile, expected.profile, "profil yalnızca korunan cevaplardan gelmeli");
  assert.deepEqual(changed.measured, expected.measured);

  const eskiYol = completed.questionPath.slice(4);
  const yeniYol = [changed.currentQuestionId];
  assert.notDeepEqual(yeniYol, eskiYol.slice(0, 1));
});

test("aile sıralaması 15 aileyi skorla birlikte döndürür", () => {
  const { state } = run("score_known", (index) => (index % 2 ? "a" : "b"));
  const families = engine.rankFamilies(state.profile);
  assert.equal(families.length, 15);
  for (let index = 1; index < families.length; index += 1) {
    assert.ok(families[index - 1].score >= families[index].score, "sıralama azalan olmalı");
  }
  assert.ok(families[0].score > 0);
});

test("farklı cevap yolları farklı sonuçlar üretir", () => {
  const results = new Set();
  const strategies = [
    () => "a",
    () => "b",
    (index) => (index % 2 ? "a" : "b"),
    (index) => (index % 3 ? "a" : "b"),
    (index) => (index < 5 ? "a" : "b"),
  ];
  for (const audience of AUDIENCES) {
    for (const pick of strategies) {
      const { state } = run(audience, pick);
      results.add(engine.rankFamilies(state.profile)[0].id);
    }
  }
  console.log(`    farklı ilk sıra sonucu: ${[...results].join(", ")}`);
  assert.ok(results.size >= 3, `yalnızca ${results.size} farklı sonuç çıktı`);
});
