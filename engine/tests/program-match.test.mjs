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
    assert.deepEqual(group.access.scoreTypes, ["SAY"]);
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

test("tercih koşulları erişimi daraltır ama grubu elemez", () => {
  const state = runSession("score_known", () => "a", { scoreType: "SAY", rank: 65000 });
  const familyRanking = engine.rankFamilies(state.profile);
  const academic = { scoreType: "SAY", rank: 65000 };

  const hepsi = rankProgramGroups({ familyRanking, groups: catalog.groups, index, academic, limit: 8 });
  const ankara = rankProgramGroups({
    familyRanking, groups: catalog.groups, index, academic, limit: 8,
    filters: { cities: ["ANKARA"], universityType: "DEVLET" },
  });

  assert.equal(ankara.length, 8, "koşul grupları listeden silmez");
  const toplam = (list) => list.reduce((sum, group) => sum + group.access.reachable, 0);
  assert.ok(toplam(ankara) < toplam(hepsi), "koşullu erişim daha dar olmalı");
  for (const group of ankara) assert.ok(group.access.matching <= group.access.sampled);
});

test("dil filtresi boş bırakılmış Türkçe kayıtları kaybetmez", () => {
  const familyRanking = engine.rankFamilies(runSession("score_unknown", () => "b").profile);
  const turkce = rankProgramGroups({
    familyRanking, groups: catalog.groups, index, limit: 10, filters: { language: "Türkçe" },
  });
  const ingilizce = rankProgramGroups({
    familyRanking, groups: catalog.groups, index, limit: 10, filters: { language: "İngilizce" },
  });
  const say = (list) => list.reduce((sum, group) => sum + group.access.matching, 0);
  console.log(`    Türkçe eşleşen: ${say(turkce)} · İngilizce eşleşen: ${say(ingilizce)}`);
  assert.ok(say(turkce) > say(ingilizce), "Türkçe program sayısı daha yüksek olmalı");
  assert.ok(say(ingilizce) > 0);
});

test("burs koşulu devlet programlarını dışarıda bırakmaz", () => {
  const familyRanking = engine.rankFamilies(runSession("score_unknown", () => "a").profile);
  const burslu = rankProgramGroups({
    familyRanking, groups: catalog.groups, index, limit: 10, filters: { scholarshipOnly: true },
  });
  assert.ok(burslu.reduce((sum, group) => sum + group.access.matching, 0) > 0);
});

test("girilen puan türüyle tercih edilemeyen grup öne çıkmaz", () => {
  const familyRanking = engine.rankFamilies(runSession("score_known", () => "a").profile);
  for (const scoreType of ["SAY", "EA", "SÖZ"]) {
    const academic = { scoreType, rank: 60000 };
    const ranked = rankProgramGroups({ familyRanking, groups: catalog.groups, index, academic, limit: 5 });
    for (const group of ranked) {
      assert.ok(group.access.eligible > 0,
        `${scoreType}: "${group.name}" bu puan türüyle tercih edilemiyor ama ilk 5'te`);
      assert.deepEqual(group.access.scoreTypes, [scoreType]);
    }
  }
});

test("uygun olmayan grup listeden silinmez, sadece geriye iter", () => {
  const familyRanking = engine.rankFamilies(runSession("score_known", () => "b").profile);
  const academic = { scoreType: "DİL", rank: 20000 };
  const hepsi = rankProgramGroups({ familyRanking, groups: catalog.groups, index, academic, limit: 634 });

  assert.equal(hepsi.length, 634, "tüm gruplar sıralanabilir kalmalı");
  const uygunOlmayan = hepsi.filter((group) => group.access.eligible === 0);
  assert.ok(uygunOlmayan.length > 0, "DİL için uygun olmayan gruplar var");
  console.log(`    DİL: ${634 - uygunOlmayan.length} uygun / ${uygunOlmayan.length} uygun değil`);

  // Uygun olanların tamamı, uygun olmayanların tamamından önce gelir.
  const ilkUygunsuz = hepsi.findIndex((group) => group.access.eligible === 0);
  const sonUygun = hepsi.map((group) => group.access.eligible > 0).lastIndexOf(true);
  assert.ok(ilkUygunsuz > sonUygun, "uygun olmayan bir grup uygun olanların arasına giremez");
  assert.equal(ilkUygunsuz, 634 - uygunOlmayan.length);
});

test("birden çok puan türü girilebilir, her program kendi türüyle karşılaştırılır", () => {
  const familyRanking = engine.rankFamilies(runSession("score_known", () => "a").profile);
  const tekli = rankProgramGroups({
    familyRanking, groups: catalog.groups, index, limit: 20,
    academic: { ranks: { SAY: 65000 } },
  });
  const ikili = rankProgramGroups({
    familyRanking, groups: catalog.groups, index, limit: 20,
    academic: { ranks: { SAY: 65000, TYT: 40000 } },
  });
  const say = (list) => list.reduce((sum, group) => sum + group.access.eligible, 0);
  console.log(`    yalnız SAY: ${say(tekli)} uygun program · SAY+TYT: ${say(ikili)} uygun program`);
  assert.ok(say(ikili) > say(tekli), "ikinci puan türü havuzu genişletmeli");
  for (const group of ikili) {
    for (const type of group.access.scoreTypes) assert.ok(["SAY", "TYT"].includes(type));
  }
});

test("eski tek puan türü biçimi çalışmaya devam eder", () => {
  const familyRanking = engine.rankFamilies(runSession("score_known", () => "a").profile);
  const eski = rankProgramGroups({ familyRanking, groups: catalog.groups, index, limit: 5, academic: { scoreType: "EA", rank: 50000 } });
  const yeni = rankProgramGroups({ familyRanking, groups: catalog.groups, index, limit: 5, academic: { ranks: { EA: 50000 } } });
  assert.deepEqual(eski.map((group) => group.id), yeni.map((group) => group.id));
});

test("her önerilen grup gerçek üniversiteleri isim isim taşır", () => {
  const academic = { ranks: { SAY: 28000 } };
  const state = runSession("score_known", () => "a", academic);
  const ranked = rankProgramGroups({
    familyRanking: engine.rankFamilies(state.profile),
    groups: catalog.groups, index, academic, limit: 5,
  });

  for (const group of ranked) {
    assert.ok(Array.isArray(group.programs), group.id);
    assert.ok(group.programs.length <= 6);
    const adlar = group.programs.map((program) => program.university);
    assert.equal(new Set(adlar).size, adlar.length, `${group.name}: aynı üniversite iki kez`);

    for (const program of group.programs) {
      assert.ok(program.university.length > 0);
      assert.equal(program.scoreType, "SAY", "sırası girilmeyen puan türü listelenmemeli");
      assert.ok(!program.university.endsWith(`(${program.city})`), "şehir adı tekrar etmemeli");
      // Erişilebilir işaretlenen her yıl gerçekten tutuyor olmalı.
      for (const yil of program.reachedYears) {
        const kayit = program.years.find((item) => item.year === yil);
        assert.ok(kayit.rank !== null && kayit.rank >= academic.ranks.SAY,
          `${program.university}: ${yil} yılı yanlış işaretlenmiş`);
      }
      assert.equal(program.reachable, program.reachedYears.length > 0);
    }
  }
  const ilk = ranked[0].programs[0];
  console.log(`    örnek: ${ranked[0].name} → ${ilk.university} (${ilk.city}) · tutan yıllar: ${ilk.reachedYears.join(", ") || "yok"}`);
});

test("sıra girilmediyse okullar listelenir ama erişim iddiası üretilmez", () => {
  const state = runSession("score_unknown", () => "b");
  const ranked = rankProgramGroups({
    familyRanking: engine.rankFamilies(state.profile),
    groups: catalog.groups, index, limit: 5,
  });
  let toplam = 0;
  for (const group of ranked) {
    toplam += group.programs.length;
    for (const program of group.programs) {
      assert.deepEqual(program.reachedYears, [], "sıra yokken tutan yıl iddiası olamaz");
      assert.equal(program.reachable, false);
      assert.ok(program.university.length > 0);
    }
  }
  assert.ok(toplam > 0, "puansız akışta da okullar görünmeli");
  console.log(`    puansız akışta listelenen okul: ${toplam}`);
});

test("en seçici program önce gelir ve üç yıl tutanlar öne çıkar", () => {
  const academic = { ranks: { EA: 90000 } };
  const state = runSession("score_known", () => "a", academic);
  const ranked = rankProgramGroups({
    familyRanking: engine.rankFamilies(state.profile),
    groups: catalog.groups, index, academic, limit: 4,
  });
  for (const group of ranked) {
    const erisilir = group.programs.filter((program) => program.reachable);
    const digerleri = group.programs.filter((program) => !program.reachable);
    if (erisilir.length && digerleri.length) {
      assert.ok(group.programs.indexOf(erisilir.at(-1)) < group.programs.indexOf(digerleri[0]),
        "erişilebilirler listenin başında olmalı");
    }
  }
});
