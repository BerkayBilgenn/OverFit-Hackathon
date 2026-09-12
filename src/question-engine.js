/**
 * Adaptif soru seçim motoru — bağımlılıksız, saf fonksiyonlar.
 *
 * Oturum durumu (state) düz JSON'dur; localStorage'a olduğu gibi yazılabilir.
 * Soru bankası state'in içinde taşınmaz, motora bir kez verilir.
 */
import { DIMENSION_IDS, STAGE_PLAN } from "./dimensions.js";
import { CAREER_FAMILIES, FAMILY_BY_ID } from "./career-families.js";

export const SESSION_LENGTH = STAGE_PLAN.length;
export const STATE_VERSION = 1;

const zeroProfile = () => Object.fromEntries(DIMENSION_IDS.map((dimension) => [dimension, 0]));

function cosine(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const dimension of DIMENSION_IDS) {
    const left = a[dimension] ?? 0;
    const right = b[dimension] ?? 0;
    dot += left * right;
    normA += left * left;
    normB += right * right;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Deterministik, cevap yoluna duyarlı tie-break tuzu. */
function salt(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

export function createEngine(bank) {
  const byId = new Map(bank.map((question) => [question.id, question]));

  const question = (id) => {
    const found = byId.get(id);
    if (!found) throw new Error(`Bilinmeyen soru: ${id}`);
    return found;
  };

  /** Saklanan cevaplardan profili sıfırdan kurar (geri dönüşte tek doğru yol). */
  function recomputeProfile(answers) {
    const profile = zeroProfile();
    const measured = zeroProfile();
    for (const entry of answers) {
      const option = question(entry.questionId).options.find((candidate) => candidate.id === entry.optionId);
      for (const [dimension, value] of Object.entries(option.scoreEffects)) {
        profile[dimension] += value;
        measured[dimension] += 1;
      }
    }
    return { profile, measured };
  }

  function rankFamilies(profile) {
    return CAREER_FAMILIES.map((family) => ({
      id: family.id,
      label: family.label,
      summary: family.summary,
      score: Number(cosine(profile, family.weights).toFixed(4)),
    })).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  }

  /**
   * Adaya puan verir. Bileşenler ayrı ayrı döner ki test panelinde
   * "bu soru neden seçildi" dürüstçe gösterilebilsin.
   */
  function scoreCandidate(candidate, context) {
    const { focus, measured, families, answerPath } = context;

    const focusOverlap = candidate.dimensions.filter((dimension) => focus.includes(dimension)).length;
    const focusScore = focus.length === 0 ? 0 : focusOverlap / candidate.dimensions.length;

    const gapScore =
      candidate.dimensions.reduce((total, dimension) => total + 1 / (1 + (measured[dimension] ?? 0)), 0) /
      candidate.dimensions.length;

    const [first, second] = families;
    const topA = FAMILY_BY_ID[first.id].weights;
    const topB = FAMILY_BY_ID[second.id].weights;
    const separation =
      candidate.dimensions.reduce(
        (total, dimension) => total + Math.abs((topA[dimension] ?? 0) - (topB[dimension] ?? 0)),
        0,
      ) /
      (candidate.dimensions.length * 3);

    const priorityScore = candidate.priority / 1000;
    const tieBreak = salt(`${candidate.id}|${answerPath}`) / 100;

    const total = 3 * focusScore + 2 * gapScore + 1.5 * separation + priorityScore + tieBreak;
    return {
      total: Number(total.toFixed(6)),
      parts: {
        odak: Number((3 * focusScore).toFixed(3)),
        olcumAcigi: Number((2 * gapScore).toFixed(3)),
        ayirtEdicilik: Number((1.5 * separation).toFixed(3)),
        oncelik: Number(priorityScore.toFixed(3)),
      },
    };
  }

  function selectNextQuestion(state) {
    const step = state.answers.length;
    if (step >= SESSION_LENGTH) return null;

    const stage = STAGE_PLAN[step];
    const seen = new Set(state.questionPath);
    const lastFamily = state.answers.length
      ? question(state.answers[state.answers.length - 1].questionId).questionFamily
      : null;

    const audienceOk = (item) => item.audience === "both" || item.audience === state.audience;
    const unseen = bank.filter((item) => audienceOk(item) && !seen.has(item.id));

    let pool = unseen.filter((item) => item.stage === stage && item.questionFamily !== lastFamily);
    let fallback = null;
    if (pool.length === 0) {
      pool = unseen.filter((item) => item.stage === stage);
      fallback = "ayni_aile_zorunlu";
    }
    if (pool.length === 0) {
      pool = unseen.filter((item) => item.questionFamily !== lastFamily);
      fallback = "asama_disi";
    }
    if (pool.length === 0) {
      pool = unseen;
      fallback = "kalan_tum_sorular";
    }
    if (pool.length === 0) {
      return { questionId: null, error: "soru_kapsama_hatasi", stage, step };
    }

    const families = rankFamilies(state.profile);
    const answerPath = state.answers.map((entry) => `${entry.questionId}:${entry.optionId}`).join(">");
    const context = { focus: state.focus, measured: state.measured, families, answerPath };

    const scored = pool
      .map((candidate) => ({ candidate, ...scoreCandidate(candidate, context) }))
      .sort((a, b) => b.total - a.total || a.candidate.id.localeCompare(b.candidate.id));

    const winner = scored[0];
    return {
      questionId: winner.candidate.id,
      stage,
      step,
      fallback,
      poolSize: pool.length,
      parts: winner.parts,
      focus: state.focus,
      runnerUp: scored[1] ? { id: scored[1].candidate.id, total: scored[1].total } : null,
      total: winner.total,
    };
  }

  /** Cevaplardan tüm türetilmiş alanları yeniden kurar. */
  function rebuild(base, answers) {
    const { profile, measured } = recomputeProfile(answers);
    const focus = answers.length
      ? question(answers[answers.length - 1].questionId).options.find(
          (option) => option.id === answers[answers.length - 1].optionId,
        ).nextFocus
      : [];

    const state = {
      ...base,
      version: STATE_VERSION,
      answers,
      profile,
      measured,
      focus,
      questionPath: answers.map((entry) => entry.questionId),
      finished: answers.length >= SESSION_LENGTH,
      currentQuestionId: null,
      selection: null,
    };

    if (!state.finished) {
      const selection = selectNextQuestion(state);
      state.selection = selection;
      state.currentQuestionId = selection.questionId;
      state.questionPath = [...state.questionPath, ...(selection.questionId ? [selection.questionId] : [])];
    }
    return state;
  }

  function createSession({ audience, academic = null, filters = null }) {
    if (audience !== "score_known" && audience !== "score_unknown") {
      throw new Error(`Bilinmeyen akış: ${audience}`);
    }
    return rebuild({ audience, academic, filters }, []);
  }

  function answer(state, optionId) {
    if (state.finished) return state;
    if (!state.currentQuestionId) return state;
    const current = question(state.currentQuestionId);
    if (!current.options.some((option) => option.id === optionId)) {
      throw new Error(`Bilinmeyen seçenek: ${optionId}`);
    }
    return rebuild(state, [...state.answers, { questionId: state.currentQuestionId, optionId }]);
  }

  function goBack(state) {
    if (state.answers.length === 0) return state;
    return rebuild(state, state.answers.slice(0, -1));
  }

  /** Eski yolun cevapları skordan tamamen düşer; devam yolu yeniden kurulur. */
  function changeAnswer(state, index, optionId) {
    if (index < 0 || index >= state.answers.length) throw new Error("Geçersiz cevap sırası");
    const kept = state.answers.slice(0, index);
    const target = state.answers[index].questionId;
    return rebuild(state, [...kept, { questionId: target, optionId }]);
  }

  return {
    bank,
    question,
    createSession,
    answer,
    goBack,
    changeAnswer,
    recomputeProfile,
    rankFamilies,
    selectNextQuestion,
  };
}

/** Profildeki en güçlü sinyaller (test panelinde ve sonuç ekranında kullanılır). */
export function topSignals(profile, limit = 5) {
  return Object.entries(profile)
    .filter(([, value]) => value !== 0)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]) || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([dimension, value]) => ({ dimension, value }));
}
