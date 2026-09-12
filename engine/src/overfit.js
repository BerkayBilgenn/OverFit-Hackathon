/**
 * Paketin ana yüzü. UI tarafının bilmesi gereken tek modül budur;
 * dimensions / career-families / question-engine / program-match iç detaydır.
 *
 * Kullanım (tarayıcı):
 *   const overfit = await createOverfit({ dataUrl: "/overfit-data" });
 *
 * Kullanım (bundler ile import edilmiş JSON):
 *   const overfit = await createOverfit({ data: { questions, groups, programs } });
 */
import { createEngine, SESSION_LENGTH, STATE_VERSION, topSignals } from "./question-engine.js";
import { indexPrograms, rankProgramGroups, toRanks } from "./program-match.js";
import { FAMILY_BY_ID } from "./career-families.js";
import { DIMENSIONS } from "./dimensions.js";
import { fetchData } from "./data-loader.js";

export async function createOverfit({ data = null, dataUrl = null, withPrograms = true, fetchImpl } = {}) {
  const loaded = data ?? (await fetchData({ dataUrl, withPrograms, fetchImpl }));

  const usable = loaded.questions.filter((question) => {
    const ok = question?.id && Array.isArray(question.options) && question.options.length === 2;
    if (!ok) console.warn("Bozuk soru kaydı atlandı:", question?.id ?? question);
    return ok;
  });

  const engine = createEngine(usable);
  const catalog = loaded.groups;
  const programIndex = loaded.programs ? indexPrograms(loaded.programs) : null;

  /** UI'ın ekrana basması için gereken her şey; bankaya bakmasına gerek yok. */
  const currentQuestion = (state) => {
    if (state.finished || !state.currentQuestionId) return null;
    const question = engine.question(state.currentQuestionId);
    return {
      id: question.id,
      text: question.text,
      stage: question.stage,
      questionFamily: question.questionFamily,
      step: state.answers.length + 1,
      total: SESSION_LENGTH,
      canGoBack: state.answers.length > 0,
      options: question.options.map((option) => ({ id: option.id, text: option.text })),
    };
  };

  const rankGroups = (state, limit) =>
    programIndex
      ? rankProgramGroups({
          familyRanking: engine.rankFamilies(state.profile),
          groups: catalog.groups,
          index: programIndex,
          academic: state.academic,
          filters: state.filters ?? null,
          limit,
        })
      : [];

  /**
   * Profilin işaret ettiği alanlar hangi puan türüyle açılıyor da adayın
   * o türde sırası yok? Bunu söylemezsek kullanıcı, cevaplarıyla alakasız
   * görünen bir liste görüyor ve nedenini anlamıyor.
   */
  function missingScoreTypes(families, ranks) {
    if (!ranks || !programIndex) return [];
    const girilen = new Set(Object.keys(ranks));
    const ustAileler = new Set(families.slice(0, 3).map((family) => family.id));
    const sayim = new Map();
    for (const group of catalog.groups) {
      if (!ustAileler.has(group.family)) continue;
      for (const scoreType of group.scoreTypes) {
        if (girilen.has(scoreType) || scoreType === "?") continue;
        sayim.set(scoreType, (sayim.get(scoreType) ?? 0) + group.programCount);
      }
    }
    return [...sayim.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 2)
      .map(([scoreType, programCount]) => ({ scoreType, programCount }));
  }

  function results(state, { familyLimit = 3, groupLimit = 5 } = {}) {
    const families = engine.rankFamilies(state.profile);
    const groups = rankGroups(state, groupLimit);
    const eksikTurler = missingScoreTypes(families, toRanks(state.academic));
    const signals = topSignals(state.profile, 5).map((signal) => ({
      ...signal,
      label: DIMENSIONS[signal.dimension],
    }));

    const warnings = [];
    if (families[0].score - families[1].score < 0.03) {
      warnings.push(
        `"${families[0].label}" ile "${families[1].label}" neredeyse eşit çıktı; 10 soru bu ikisini ayırmaya yetmedi.`,
      );
    }
    const unmeasured = Object.entries(state.measured).filter(([, count]) => count === 0);
    if (unmeasured.length) {
      warnings.push(`Hiç ölçülmeyen boyutlar: ${unmeasured.map(([key]) => DIMENSIONS[key]).join(", ")}.`);
    }
    if (!state.academic) warnings.push("Başarı sırası girilmediği için bu liste erişilebilirliği dikkate almıyor.");
    for (const { scoreType, programCount } of eksikTurler) {
      warnings.push(
        `Profiline yakın alanlarda ${programCount.toLocaleString("tr-TR")} program ${scoreType} puanıyla tercih ediliyor. ` +
        `${scoreType} sıranı girmediğin için bunlar listede yok.`,
      );
    }
    if (!programIndex) warnings.push("Program tablosu yüklenmediği için bölüm grupları hesaplanmadı.");
    warnings.push("Sorular henüz editoryal incelemeden geçmedi (tümü draft).");

    return {
      summaryText:
        `Cevapların en çok "${families[0].label}" yönünde toplandı. ${FAMILY_BY_ID[families[0].id].summary} ` +
        `Bu bir tanı değil; ${SESSION_LENGTH} cevaptan çıkarılmış bir eğilim özeti.`,
      signals,
      families: families.slice(0, familyLimit),
      allFamilies: families,
      groups,
      academic: state.academic,
      filters: state.filters ?? null,
      missingScoreTypes: eksikTurler,
      warnings,
    };
  }

  /** Test paneli verisi. Ürün arayüzünde kullanıcıya gösterilmez. */
  const explain = (state) => ({
    selection: state.selection,
    profile: state.profile,
    measured: state.measured,
    focus: state.focus,
    families: engine.rankFamilies(state.profile).slice(0, 5),
    groups: rankGroups(state, 5),
    answerPath: state.answers.map((entry) => `${entry.questionId}:${entry.optionId}`),
    options: state.currentQuestionId ? engine.question(state.currentQuestionId).options : [],
  });

  return {
    sessionLength: SESSION_LENGTH,
    stateVersion: STATE_VERSION,
    catalogSummary: catalog.summary,
    source: catalog.source,
    hasPrograms: Boolean(programIndex),

    start: ({ audience, academic = null, filters = null }) => engine.createSession({ audience, academic, filters }),
    answer: (state, optionId) => engine.answer(state, optionId),
    back: (state) => engine.goBack(state),
    changeAnswer: (state, index, optionId) => engine.changeAnswer(state, index, optionId),
    isFinished: (state) => state.finished,

    question: currentQuestion,
    results,
    explain,

    /** Kayıtlı cevaplardan oturumu yeniden kurar (localStorage / sunucu oturumu). */
    restore(saved) {
      if (!saved || saved.version !== STATE_VERSION || !Array.isArray(saved.answers)) return null;
      return saved.answers.reduce(
        (state, entry) => (state.currentQuestionId === entry.questionId ? engine.answer(state, entry.optionId) : state),
        engine.createSession({ audience: saved.audience, academic: saved.academic ?? null, filters: saved.filters ?? null }),
      );
    },

    engine,
  };
}
