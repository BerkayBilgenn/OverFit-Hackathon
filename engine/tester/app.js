/**
 * Test harness arayüzü. Paketin genel API'sinden başka hiçbir şeye dokunmaz —
 * arkadaşının UI'ı da tam olarak bu yüzeyi kullanacak.
 */
import { createOverfit, DIMENSIONS, FAMILY_BY_ID, toRanks } from "../index.js";

const STORAGE_KEY = "overfit.session.v1";
const $ = (id) => document.getElementById(id);
const fmt = new Intl.NumberFormat("tr-TR");

const el = {
  screens: { start: $("screen-start"), academic: $("screen-academic"), question: $("screen-question"), results: $("screen-results") },
  startKnown: $("start-score-known"), startUnknown: $("start-score-unknown"),
  scoreType: $("score-type"), successRank: $("success-rank"),
  academicContinue: $("academic-continue"), academicSkip: $("academic-skip"),
  progress: $("progress"), questionText: $("question-text"),
  optionA: $("option-a"), optionB: $("option-b"),
  back: $("back"), reset: $("reset"), live: $("live"), restoreNote: $("restore-note"),
  testerToggle: $("tester-toggle"), testerPanel: $("tester-panel"), testerBody: $("tester-body"),
  resultSummary: $("result-summary"), resultSignals: $("result-signals"),
  resultFamilies: $("result-families"), resultGroups: $("result-groups"),
  resultAccessNote: $("result-access-note"), resultMismatch: $("result-mismatch"),
  resultBack: $("result-back"), resultReset: $("result-reset"), dataFooter: $("data-footer"),
};

let overfit = null;
let state = null;
let pendingAudience = null;

async function boot() {
  overfit = await createOverfit({ dataUrl: "../data" });

  const summary = overfit.catalogSummary;
  el.dataFooter.textContent =
    `Veri: ${fmt.format(summary.program_count)} program · ${fmt.format(summary.group_count)} bölüm grubu · ` +
    `${fmt.format(summary.programs_without_rank)} programın 2026 taban sırası yayımlanmamış. ` +
    `Kaynak: ${overfit.source.binding_source}. ${overfit.source.notice}`;

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
    start(pendingAudience, Number.isFinite(rank) && rank > 0 ? { ranks: { [el.scoreType.value]: rank } } : null);
  });
  el.academicSkip.addEventListener("click", () => start(pendingAudience, null));

  el.optionA.addEventListener("click", () => choose("a"));
  el.optionB.addEventListener("click", () => choose("b"));
  el.back.addEventListener("click", goBack);
  el.resultBack.addEventListener("click", goBack);
  el.reset.addEventListener("click", reset);
  el.resultReset.addEventListener("click", reset);

  el.testerToggle.addEventListener("click", () => {
    const open = el.testerPanel.hidden;
    el.testerPanel.hidden = !open;
    el.testerToggle.setAttribute("aria-expanded", String(open));
    if (open) renderTester();
  });

  document.addEventListener("keydown", (event) => {
    if (el.screens.question.hidden || event.target.matches("input, select, textarea")) return;
    if (event.key === "1") choose("a");
    if (event.key === "2") choose("b");
  });
}

const start = (audience, academic) => commit(overfit.start({ audience, academic }));
const choose = (optionId) => state && !overfit.isFinished(state) && commit(overfit.answer(state, optionId));
const goBack = () => state?.answers.length && commit(overfit.back(state));

function commit(next) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* depolama kapalıysa oturum yalnızca bellekte sürer */
  }
  render();
}

function reset() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* yok sayılır */
  }
  state = null;
  pendingAudience = null;
  el.successRank.value = "";
  el.restoreNote.hidden = true;
  show("start");
  el.startKnown.focus();
  renderTester();
}

function restore() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
  } catch {
    saved = null;
  }
  const restored = overfit.restore(saved);
  if (!restored) {
    if (saved) {
      el.restoreNote.textContent = "Önceki oturum bu sürümle uyumsuz olduğu için temiz başlatıldı.";
      el.restoreNote.hidden = false;
    }
    return show("start");
  }
  state = restored;
  el.restoreNote.textContent = `Yarım kalan oturum sürdürüldü (${state.answers.length}/${overfit.sessionLength}).`;
  el.restoreNote.hidden = false;
  render();
}

const show = (name) => {
  for (const [key, node] of Object.entries(el.screens)) node.hidden = key !== name;
};

function render() {
  if (!state) return show("start");
  if (overfit.isFinished(state)) {
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
  const question = overfit.question(state);
  el.optionA.hidden = false;
  el.optionB.hidden = false;
  el.progress.textContent = `${question.step} / ${question.total}`;
  el.questionText.textContent = question.text;
  el.optionA.querySelector("span").textContent = question.options[0].text;
  el.optionB.querySelector("span").textContent = question.options[1].text;
  el.back.disabled = !question.canGoBack;
  el.live.textContent = `Soru ${question.step} / ${question.total}. ${question.text}`;
  el.questionText.setAttribute("tabindex", "-1");
  el.questionText.focus({ preventScroll: true });
}

const li = (nodes) => {
  const item = document.createElement("li");
  item.append(...nodes);
  return item;
};
const span = (className, text) => {
  const node = document.createElement("span");
  node.className = className;
  node.textContent = text;
  return node;
};

function renderResults() {
  const result = overfit.results(state);

  el.resultSummary.textContent = result.summaryText;
  el.resultSignals.replaceChildren(
    ...result.signals.map((signal) => li([document.createTextNode(`${signal.label} (${signal.value > 0 ? "+" : ""}${signal.value})`)])),
  );

  el.resultFamilies.replaceChildren(
    ...result.families.map((family) => {
      const title = document.createElement("strong");
      title.textContent = family.label;
      return li([title, span("meta", `${family.summary} · uyum ${(family.score * 100).toFixed(0)}/100`)]);
    }),
  );

  const siralar = result.academic
    ? Object.entries(toRanks(result.academic)).map(([tur, sira]) => `${tur} ${fmt.format(sira)}.`).join(" · ")
    : "";
  el.resultAccessNote.textContent = result.academic
    ? `${siralar} sıraya göre erişim hesaplandı. ` +
      "Erişim yalnızca 2026 taban sıralarına bakar, gelecek yılı öngörmez."
    : "Başarı sırası girilmediği için erişim hesaplanmadı; aşağıdaki gruplar yalnızca cevaplarına göre sıralandı.";

  el.resultGroups.replaceChildren(
    ...result.groups.map((group) => {
      const title = document.createElement("strong");
      title.textContent = group.name;

      const bands = Object.entries(group.rankBand)
        .map(([scoreType, band]) => `${scoreType} ${fmt.format(band.best)}–${fmt.format(band.worst)}`)
        .join(" · ");
      const meta = span(
        "meta",
        `${fmt.format(group.programCount)} program · ${group.levels.join("/")}` +
          (bands ? ` · 2026 taban sırası ${bands}` : " · 2026 taban sırası yayımlanmamış"),
      );
      const why = span("why", `Neden gösterildi: "${FAMILY_BY_ID[group.family].label}" ailesiyle uyumun yüksek.`);
      const nodes = [title, meta, why];

      if (group.access) {
        const access = group.access;
        const text =
          access.reachable > 0
            ? `Sıranın yettiği program: ${fmt.format(access.reachable)} / ${fmt.format(access.withRank)}` +
              (access.closest ? ` · sıranın yettiği en seçici program: ${access.closest.university} (taban ${fmt.format(access.closest.rank)}.)` : "")
            : access.withRank > 0
              ? `Bu grupta sıranın yettiği program yok (${fmt.format(access.withRank)} programın taban sırası daha iyi).`
              : `Bu grup ${group.scoreTypes.join("/")} puanıyla tercih ediliyor; girdiğin ${access.scoreTypes.join("/")} sırası burada geçerli değil.`;
        nodes.push(span(access.reachable > 0 ? "why" : "why warn", text));
      }
      return li(nodes);
    }),
  );

  el.resultMismatch.replaceChildren(...result.warnings.map((text) => li([document.createTextNode(text)])));
  el.live.textContent = "Sonuç ekranı hazır.";
}

function renderTester() {
  if (el.testerPanel.hidden) return;
  if (!state) {
    el.testerBody.textContent = "Henüz oturum başlamadı.";
    return;
  }

  const view = overfit.explain(state);
  const parts = [];
  const push = (title, rows) =>
    parts.push(`<h3>${title}</h3><dl>${rows.map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`).join("")}</dl>`);

  const selection = view.selection;
  if (selection && !overfit.isFinished(state)) {
    const question = overfit.question(state);
    push("Soru", [
      ["kimlik", `<code>${question.id}</code>`],
      ["aile", question.questionFamily],
      ["aşama", `${selection.stage} (adım ${selection.step + 1})`],
      ["havuz", `${selection.poolSize} aday`],
      ["fallback", selection.fallback ?? "—"],
    ]);
    push("Neden bu soru?", [
      ["önceki cevabın odağı", view.focus.length ? view.focus.join(", ") : "— (ilk soru)"],
      ["odak uyumu", selection.parts.odak],
      ["ölçüm açığı", selection.parts.olcumAcigi],
      ["ayırt edicilik", selection.parts.ayirtEdicilik],
      ["öncelik", selection.parts.oncelik],
      ["toplam", selection.total.toFixed(3)],
      ["2. sıradaki", selection.runnerUp ? `${selection.runnerUp.id} (${selection.runnerUp.total.toFixed(3)})` : "—"],
    ]);
    push(
      "Seçeneklerin etkisi",
      view.options.map((option) => [
        option.id.toUpperCase(),
        `${Object.entries(option.scoreEffects).map(([dimension, value]) => `${dimension} ${value > 0 ? "+" : ""}${value}`).join(", ")} → odak: ${option.nextFocus.join(", ")}`,
      ]),
    );
  }

  const signals = Object.entries(view.profile)
    .filter(([, value]) => value !== 0)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 6);
  push("Baskın sinyaller", signals.length ? signals.map(([key, value]) => [DIMENSIONS[key], value]) : [["—", "henüz cevap yok"]]);
  push("Kariyer ailesi sıralaması", view.families.map((family) => [family.id, family.score.toFixed(3)]));
  push(
    "Bölüm grubu sıralaması",
    view.groups.length
      ? view.groups.map((group) => [group.name, group.access ? `${group.score.toFixed(3)} · erişim ${group.access.reachable}` : group.score.toFixed(3)])
      : [["—", "program tablosu yüklenmedi"]],
  );
  push("Yol", [
    ["cevaplar", view.answerPath.join(" → ") || "—"],
    ["akış", state.audience],
    ["akademik", state.academic ? Object.entries(toRanks(state.academic)).map(([tur, sira]) => `${tur} ${fmt.format(sira)}`).join(", ") : "girilmedi"],
  ]);

  el.testerBody.innerHTML = parts.join("");
}

boot().catch((error) => {
  console.error(error);
  document.getElementById("main").textContent =
    "Veri yüklenemedi. Depo kökünden yerel bir HTTP sunucusu çalıştırıp /tester/ adresini aç (python3 -m http.server 4173).";
});
