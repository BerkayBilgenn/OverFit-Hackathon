/**
 * Tarayıcı arayüzü. Motor saf kalsın diye tüm DOM işi burada.
 */
import { createEngine, SESSION_LENGTH, STATE_VERSION, topSignals } from "./question-engine.js";
import { DIMENSIONS } from "./dimensions.js";
import { FAMILY_BY_ID } from "./career-families.js";
import { indexPrograms, rankProgramGroups } from "./program-match.js";

const STORAGE_KEY = "overfit.session.v1";
const $ = (id) => document.getElementById(id);

const el = {
  screens: {
    start: $("screen-start"),
    academic: $("screen-academic"),
    question: $("screen-question"),
    results: $("screen-results"),
  },
  startKnown: $("start-score-known"),
  startUnknown: $("start-score-unknown"),
  scoreType: $("score-type"),
  successRank: $("success-rank"),
  academicContinue: $("academic-continue"),
  academicSkip: $("academic-skip"),
  progress: $("progress"),
  questionText: $("question-text"),
  optionA: $("option-a"),
  optionB: $("option-b"),
  back: $("back"),
  reset: $("reset"),
  live: $("live"),
  restoreNote: $("restore-note"),
  testerToggle: $("tester-toggle"),
  testerPanel: $("tester-panel"),
  testerBody: $("tester-body"),
  resultSummary: $("result-summary"),
  resultSignals: $("result-signals"),
  resultFamilies: $("result-families"),
  resultGroups: $("result-groups"),
  resultAccessNote: $("result-access-note"),
  resultMismatch: $("result-mismatch"),
  resultBack: $("result-back"),
  resultReset: $("result-reset"),
  dataFooter: $("data-footer"),
};

let engine = null;
let catalog = null;
let programIndex = null;
let state = null;
let pendingAudience = null;

const fmt = new Intl.NumberFormat("tr-TR");

async function boot() {
  const [bank, groups, programs] = await Promise.all([
    fetch("data/questions.tr.json").then((response) => response.json()),
    fetch("data/program-groups.json").then((response) => response.json()),
    fetch("data/programs.min.json").then((response) => response.json()),
  ]);

  const usable = bank.filter((question) => {
    const ok = question?.id && question.options?.length === 2;
    if (!ok) console.warn("Bozuk soru kaydı atlandı:", question?.id ?? question);
    return ok;
  });

  engine = createEngine(usable);
  catalog = groups;
  programIndex = indexPrograms(programs);

  el.dataFooter.textContent =
    `Veri: ${fmt.format(groups.summary.program_count)} program · ` +
    `${fmt.format(groups.summary.group_count)} bölüm grubu · ` +
    `${fmt.format(groups.summary.programs_without_rank)} programın 2026 taban sırası yayımlanmamış. ` +
    `Kaynak: ${groups.source.binding_source}. ${groups.source.notice}`;

  wire();
  restore();
}

function wire() {
  el.startKnown.addEventListener("click", () => {
    pendingAudience = "score_known";
    show("academic");
    el.scoreType.focus();
  });
  el.startUnknown.addEventListener("click", () => start("score_unknown", null));
  el.academicContinue.addEventListener("click", () => {
    const rank = Number.parseInt(el.successRank.value, 10);
    const academic = Number.isFinite(rank) && rank > 0 ? { scoreType: el.scoreType.value, rank } : null;
    start(pendingAudience, academic);
  });
  el.academicSkip.addEventListener("click", () => start(pendingAudience, null));

  el.optionA.addEventListener("click", () => choose("a"));
  el.optionB.addEventListener("click", () => choose("b"));
  el.back.addEventListener("click", () => {
    if (state.answers.length === 0) return;
    state = engine.goBack(state);
    persist();
    render();
  });
  el.reset.addEventListener("click", reset);
  el.resultReset.addEventListener("click", reset);
  el.resultBack.addEventListener("click", () => {
    state = engine.goBack(state);
    persist();
    render();
  });

  el.testerToggle.addEventListener("click", () => {
    const open = el.testerPanel.hidden;
    el.testerPanel.hidden = !open;
    el.testerToggle.setAttribute("aria-expanded", String(open));
    if (open) renderTester();
  });

  document.addEventListener("keydown", (event) => {
    if (el.screens.question.hidden) return;
    if (event.target.matches("input, select, textarea")) return;
    if (event.key === "1") choose("a");
    if (event.key === "2") choose("b");
  });
}

function start(audience, academic) {
  state = engine.createSession({ audience, academic });
  persist();
  render();
}

function choose(optionId) {
  if (!state || state.finished || !state.currentQuestionId) return;
  state = engine.answer(state, optionId);
  persist();
  render();
}

function reset() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* özel sekme: yok sayılır */
  }
  state = null;
  pendingAudience = null;
  el.successRank.value = "";
  el.restoreNote.hidden = true;
  show("start");
  el.startKnown.focus();
  renderTester();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* depolama kapalıysa oturum yalnızca bellekte sürer */
  }
}

function restore() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
  } catch {
    saved = null;
  }
  if (!saved || saved.version !== STATE_VERSION || !Array.isArray(saved.answers)) {
    if (saved) {
      el.restoreNote.textContent = "Önceki oturum bu sürümle uyumsuz olduğu için temiz başlatıldı.";
      el.restoreNote.hidden = false;
    }
    show("start");
    return;
  }
  try {
    // Kayıtlı cevaplardan yeniden kurulur; kaydedilmiş türetilmiş alanlara güvenilmez.
    state = saved.answers.reduce(
      (acc, entry) => (acc.currentQuestionId === entry.questionId ? engine.answer(acc, entry.optionId) : acc),
      engine.createSession({ audience: saved.audience, academic: saved.academic ?? null }),
    );
    el.restoreNote.textContent = `Yarım kalan oturum sürdürüldü (${state.answers.length}/${SESSION_LENGTH}).`;
    el.restoreNote.hidden = false;
    render();
  } catch (error) {
    console.warn("Oturum geri yüklenemedi:", error);
    show("start");
  }
}

function show(name) {
  for (const [key, node] of Object.entries(el.screens)) node.hidden = key !== name;
}

function render() {
  if (!state) return show("start");
  if (state.finished) {
    renderResults();
    show("results");
  } else if (state.selection?.error) {
    el.questionText.textContent = "Soru kapsama hatası: uygun soru kalmadı.";
    el.optionA.hidden = true;
    el.optionB.hidden = true;
    show("question");
  } else {
    renderQuestion();
    show("question");
  }
  renderTester();
}

function renderQuestion() {
  const question = engine.question(state.currentQuestionId);
  const step = state.answers.length + 1;
  el.optionA.hidden = false;
  el.optionB.hidden = false;
  el.progress.textContent = `${step} / ${SESSION_LENGTH}`;
  el.questionText.textContent = question.text;
  el.optionA.querySelector("span").textContent = question.options[0].text;
  el.optionB.querySelector("span").textContent = question.options[1].text;
  el.back.disabled = state.answers.length === 0;
  el.live.textContent = `Soru ${step} / ${SESSION_LENGTH}. ${question.text}`;
  el.questionText.setAttribute("tabindex", "-1");
  el.questionText.focus({ preventScroll: true });
}

function results() {
  const families = engine.rankFamilies(state.profile);
  const groups = rankProgramGroups({
    familyRanking: families,
    groups: catalog.groups,
    index: programIndex,
    academic: state.academic,
    limit: 5,
  });
  return { families, groups, signals: topSignals(state.profile, 5) };
}

function renderResults() {
  const { families, groups, signals } = results();

  const top = families[0];
  el.resultSummary.textContent =
    `Cevapların en çok "${top.label}" yönünde toplandı. ${FAMILY_BY_ID[top.id].summary} ` +
    `Bu bir tanı değil; 10 cevaptan çıkarılmış bir eğilim özeti.`;

  el.resultSignals.replaceChildren(
    ...signals.map((signal) => {
      const item = document.createElement("li");
      item.textContent = `${DIMENSIONS[signal.dimension]} (${signal.value > 0 ? "+" : ""}${signal.value})`;
      return item;
    }),
  );

  el.resultFamilies.replaceChildren(
    ...families.slice(0, 3).map((family) => {
      const item = document.createElement("li");
      const title = document.createElement("strong");
      title.textContent = family.label;
      const why = document.createElement("span");
      why.className = "meta";
      why.textContent = `${family.summary} · uyum ${(family.score * 100).toFixed(0)}/100`;
      item.append(title, why);
      return item;
    }),
  );

  el.resultAccessNote.textContent = state.academic
    ? `${state.academic.scoreType} · ${fmt.format(state.academic.rank)}. sıraya göre erişim hesaplandı. ` +
      `Erişim yalnızca 2026 taban sıralarına bakar, gelecek yılı öngörmez.`
    : "Başarı sırası girilmediği için erişim hesaplanmadı; aşağıdaki gruplar yalnızca cevaplarına göre sıralandı.";

  el.resultGroups.replaceChildren(
    ...groups.map((group) => {
      const item = document.createElement("li");
      const title = document.createElement("strong");
      title.textContent = group.name;

      const meta = document.createElement("span");
      meta.className = "meta";
      const bands = Object.entries(group.rankBand)
        .map(([scoreType, band]) => `${scoreType} ${fmt.format(band.best)}–${fmt.format(band.worst)}`)
        .join(" · ");
      meta.textContent =
        `${fmt.format(group.programCount)} program · ${group.levels.join("/")}` +
        (bands ? ` · 2026 taban sırası ${bands}` : " · 2026 taban sırası yayımlanmamış");

      const why = document.createElement("span");
      why.className = "why";
      why.textContent = `Neden gösterildi: "${FAMILY_BY_ID[group.family].label}" ailesiyle uyumun yüksek.`;
      item.append(title, meta, why);

      if (group.access) {
        const access = document.createElement("span");
        access.className = group.access.reachable > 0 ? "why" : "why warn";
        access.textContent =
          group.access.reachable > 0
            ? `Sıranla erişilebilen ${group.access.scoreType} programı: ${fmt.format(group.access.reachable)} / ${fmt.format(group.access.withRank)}` +
              (group.access.closest ? ` · sıranın yettiği en seçici program: ${group.access.closest.university} (taban ${fmt.format(group.access.closest.rank)}.)` : "")
            : group.access.withRank > 0
              ? `Bu grupta ${group.access.scoreType} türünde sıranın yettiği program yok (${fmt.format(group.access.withRank)} programın taban sırası daha iyi).`
              : `Bu grup ${group.scoreTypes.join("/")} puanıyla tercih ediliyor; ${group.access.scoreType} sıranla karşılaştırılamadı.`;
        item.append(access);
      }
      return item;
    }),
  );

  const mismatches = [];
  const runnerUp = families[1];
  if (top.score - runnerUp.score < 0.03) {
    mismatches.push(`"${top.label}" ile "${runnerUp.label}" neredeyse eşit çıktı; 10 soru bu ikisini ayırmaya yetmedi.`);
  }
  const unmeasured = Object.entries(state.measured).filter(([, count]) => count === 0);
  if (unmeasured.length) {
    mismatches.push(
      `Hiç ölçülmeyen boyutlar: ${unmeasured.map(([dimension]) => DIMENSIONS[dimension]).join(", ")}.`,
    );
  }
  if (!state.academic) mismatches.push("Başarı sırası girilmediği için bu liste erişilebilirliği dikkate almıyor.");
  mismatches.push("Sorular henüz editoryal incelemeden geçmedi (tümü draft).");
  el.resultMismatch.replaceChildren(
    ...mismatches.map((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      return item;
    }),
  );

  el.live.textContent = "Sonuç ekranı hazır.";
}

function renderTester() {
  if (el.testerPanel.hidden) return;
  if (!state) {
    el.testerBody.textContent = "Henüz oturum başlamadı.";
    return;
  }

  const parts = [];
  const push = (title, rows) => {
    parts.push(`<h3>${title}</h3><dl>${rows.map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`).join("")}</dl>`);
  };

  const selection = state.selection;
  if (selection && !state.finished) {
    const question = engine.question(state.currentQuestionId);
    push("Soru", [
      ["kimlik", `<code>${question.id}</code>`],
      ["aile", question.questionFamily],
      ["aşama", `${selection.stage} (adım ${selection.step + 1})`],
      ["boyutlar", question.dimensions.join(", ")],
      ["havuz", `${selection.poolSize} aday`],
      ["fallback", selection.fallback ?? "—"],
    ]);
    push("Neden bu soru?", [
      ["önceki cevabın odağı", selection.focus.length ? selection.focus.join(", ") : "— (ilk soru)"],
      ["odak uyumu", selection.parts.odak],
      ["ölçüm açığı", selection.parts.olcumAcigi],
      ["ayırt edicilik", selection.parts.ayirtEdicilik],
      ["öncelik", selection.parts.oncelik],
      ["toplam", selection.total.toFixed(3)],
      ["2. sıradaki", selection.runnerUp ? `${selection.runnerUp.id} (${selection.runnerUp.total.toFixed(3)})` : "—"],
    ]);
    push(
      "Seçeneklerin etkisi",
      question.options.map((option) => [
        option.id.toUpperCase(),
        Object.entries(option.scoreEffects)
          .map(([dimension, value]) => `${dimension} ${value > 0 ? "+" : ""}${value}`)
          .join(", ") + ` → odak: ${option.nextFocus.join(", ")}`,
      ]),
    );
  }

  const signals = topSignals(state.profile, 6);
  push(
    "Baskın sinyaller",
    signals.length ? signals.map((signal) => [signal.dimension, signal.value]) : [["—", "henüz cevap yok"]],
  );

  const families = engine.rankFamilies(state.profile);
  push(
    "Kariyer ailesi sıralaması",
    families.slice(0, 5).map((family) => [family.id, family.score.toFixed(3)]),
  );

  const groups = rankProgramGroups({
    familyRanking: families,
    groups: catalog.groups,
    index: programIndex,
    academic: state.academic,
    limit: 5,
  });
  push(
    "Bölüm grubu sıralaması",
    groups.map((group) => [
      group.name,
      group.access ? `${group.score.toFixed(3)} · erişim ${group.access.reachable}` : group.score.toFixed(3),
    ]),
  );

  push("Yol", [
    ["cevaplar", state.answers.map((entry) => `${entry.questionId}:${entry.optionId}`).join(" → ") || "—"],
    ["akış", state.audience],
    ["akademik", state.academic ? `${state.academic.scoreType} / ${fmt.format(state.academic.rank)}` : "girilmedi"],
  ]);

  el.testerBody.innerHTML = parts.join("");
}

boot().catch((error) => {
  console.error(error);
  document.getElementById("main").textContent =
    "Veri yüklenemedi. Sayfayı yerel bir HTTP sunucusundan açtığından emin ol (python3 -m http.server 4173).";
});
