import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { createEngine } from "../src/question-engine.js";
import { indexPrograms, rankProgramGroups, isReachable } from "../src/program-match.js";

const read = (name) => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), "utf8"));
const bank = read("questions.tr.json");
const catalog = read("program-groups.json");
const programs = read("programs.min.json");
const engine = createEngine(bank);
const index = indexPrograms(programs);

test("katalog beklenen ölçekte", () => {
  assert.equal(catalog.summary.program_count, 21493);
  assert.equal(catalog.summary.group_count, 634);
  assert.equal(catalog.summary.duplicate_program_codes, 0);
  assert.equal(catalog.summary.unmatched_family_count, 0);
  assert.equal(programs.rows.length, 21493);
});

test("yayımlanmamış sıra erişilebilirlik iddiasına dönüşmez", () => {
  assert.equal(isReachable(null, 50000), null);
  assert.equal(isReachable(120000, 50000), true, "sıran daha iyiyse erişilebilir");
  assert.equal(isReachable(9000, 50000), false);
});

const runSession = (audience, pick, academic = null) => {
  let state = engine.createSession({ audience, academic });
  while (!state.finished) state = engine.answer(state, pick(state.answers.length));
  return state;
};

test("başarı sırası verilmeden erişim hesaplanmaz", () => {
  const state = runSession("score_unknown", () => "a");
  const ranked = rankProgramGroups({
    familyRanking: engine.rankFamilies(state.profile),
    groups: catalog.groups,
    index,
  });
  assert.equal(ranked.length, 6);
  for (const group of ranked) assert.equal(group.access, null);
});

test("başarı sırası verilince erişim veriden hesaplanır", () => {
  const academic = { scoreType: "SAY", rank: 60000 };
  const state = runSession("score_known", () => "a", academic);
  const ranked = rankProgramGroups({
    familyRanking: engine.rankFamilies(state.profile),
    groups: catalog.groups,
    index,
    academic,
  });
  for (const group of ranked) {
    assert.ok(group.access, group.id);
    assert.equal(group.access.scoreType, "SAY");
    assert.ok(group.access.reachable <= group.access.withRank);
    if (group.access.closest) {
      assert.ok(group.access.closest.rank >= academic.rank, `${group.id}: erişilemez program erişilebilir sayıldı`);
    }
  }
});

test("daha iyi bir başarı sırası daha çok programa erişir", () => {
  // Küçük sıra = daha iyi derece. 5.000'inci kişi, 200.000'inci kişiden fazla programa girebilir.
  const familyRanking = engine.rankFamilies(runSession("score_known", () => "a").profile);
  const total = (rank) =>
    rankProgramGroups({ familyRanking, groups: catalog.groups, index, academic: { scoreType: "SAY", rank }, limit: 25 })
      .reduce((sum, group) => sum + group.access.reachable, 0);
  const iyiSira = total(5000);
  const zayifSira = total(200000);
  console.log(`    SAY 5.000 -> ${iyiSira} program · SAY 200.000 -> ${zayifSira} program`);
  assert.ok(iyiSira > zayifSira, `sıra iyileştikçe erişim artmalı (${iyiSira} vs ${zayifSira})`);
  assert.ok(zayifSira > 0, "kötü sırada bile erişilebilir program kalmalı");
});

test("farklı personalar farklı bölüm grupları getirir", () => {
  const a = runSession("score_unknown", () => "a");
  const b = runSession("score_unknown", () => "b");
  const idsOf = (state) =>
    rankProgramGroups({ familyRanking: engine.rankFamilies(state.profile), groups: catalog.groups, index })
      .map((group) => group.id);
  const first = idsOf(a);
  const second = idsOf(b);
  console.log(`    A yolu: ${first.slice(0, 3).join(", ")}`);
  console.log(`    B yolu: ${second.slice(0, 3).join(", ")}`);
  assert.notDeepEqual(first, second);
});

test("sonuç listesi tek aileye kilitlenmez", () => {
  const state = runSession("score_known", () => "a", { scoreType: "SAY", rank: 65000 });
  const ranked = rankProgramGroups({
    familyRanking: engine.rankFamilies(state.profile),
    groups: catalog.groups,
    index,
    academic: { scoreType: "SAY", rank: 65000 },
    limit: 5,
  });
  const families = ranked.map((group) => group.family);
  const counts = families.reduce((acc, family) => ({ ...acc, [family]: (acc[family] ?? 0) + 1 }), {});
  console.log(`    gruplar: ${ranked.map((g) => `${g.name} [${g.family}]`).join(", ")}`);
  for (const [family, count] of Object.entries(counts)) {
    assert.ok(count <= 2, `${family} ${count} kez çıktı, tavan 2`);
  }
  assert.ok(new Set(families).size >= 3, "en az üç farklı aile görünmeli");
  assert.equal(ranked.length, 5);
});
