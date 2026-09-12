export const DIMENSIONS = {
  analytic: "Analitik düşünme",
  people: "İnsan odaklılık",
  creative: "Yaratıcı üretim",
  active: "Hareketli çalışma",
  leadership: "Liderlik",
  stability: "Düzen ve güvence",
} as const;

export type DimensionKey = keyof typeof DIMENSIONS;
export type Effects = Partial<Record<DimensionKey, number>>;
export type QuestionOption = readonly [label: string, effects: Effects];

export type Question = {
  id: string;
  phase: number;
  family: string;
  text: string;
  options: readonly [QuestionOption, QuestionOption];
  focus: readonly DimensionKey[];
  branch: DimensionKey | "all";
  audience: "both" | "score_known" | "score_unknown";
  priority: number;
};

const q = (
  id: string,
  phase: number,
  family: string,
  text: string,
  a: QuestionOption,
  b: QuestionOption,
  focus: readonly DimensionKey[],
  branch: DimensionKey | "all" = "all",
  audience: Question["audience"] = "both",
  priority = 50,
): Question => ({ id, phase, family, text, options: [a, b], focus, branch, audience, priority });

export const QUESTION_POOL: Question[] = [
  q("focus", 1, "focus", "Bir iş gününde hangisi seni daha çok canlı tutar?", ["İnsanlarla doğrudan çalışmak", { people: 2 }], ["Sistemler ve problemler üzerinde çalışmak", { analytic: 2 }], ["people", "analytic"], "all", "both", 100),
  q("create", 1, "creation", "Hangisini yapmak sana daha doğal gelir?", ["Yeni bir fikir veya tasarım üretmek", { creative: 2 }], ["Var olan bir sistemi iyileştirmek", { analytic: 1, stability: 1 }], ["creative", "stability"]),
  q("place", 1, "environment", "Hangi çalışma düzeni sana daha uygundur?", ["Sahada ve hareket içinde olmak", { active: 2 }], ["Sakin bir ortamda derin odaklanmak", { analytic: 1, stability: 1 }], ["active", "analytic"]),
  q("impact", 1, "values", "Hangisi seni daha çok tatmin eder?", ["Birinin hayatında doğrudan fark yaratmak", { people: 2 }], ["Ölçülebilir ve büyük bir sonuç üretmek", { leadership: 1, analytic: 1 }], ["people", "leadership"]),
  q("help", 2, "social", "İnsanlarla çalışırken hangisi sana daha yakın?", ["Destek olmak ve gelişimlerine eşlik etmek", { people: 2, stability: 1 }], ["Yön vermek, ikna etmek ve karar almak", { leadership: 2 }], ["people", "leadership"], "people"),
  q("systems", 2, "systems", "Hangi tür sistem daha çok ilgini çeker?", ["Dijital sistemler, yazılım ve veri", { analytic: 2, creative: 1 }], ["Fiziksel sistemler, makineler ve yapılar", { active: 1, analytic: 1 }], ["analytic", "active"], "analytic"),
  q("creative", 2, "creative", "Yaratıcı bir görevde hangisini seçerdin?", ["Görsel bir deneyim veya hikâye tasarlamak", { creative: 2 }], ["Yeni bir ürün veya çözüm geliştirmek", { creative: 1, analytic: 1 }], ["creative", "analytic"], "creative"),
  q("security", 2, "career_value", "Hangisi senin için daha önemli?", ["Düzenli gelir ve öngörülebilir ilerleme", { stability: 2 }], ["Daha yüksek potansiyel için risk alabilmek", { leadership: 1, creative: 1, stability: -1 }], ["stability", "leadership"]),
  q("learning", 2, "learning", "Yeni bir konuyu en iyi nasıl öğrenirsin?", ["Kuramı okuyup mantığını çözerek", { analytic: 2 }], ["Uygulayarak, deneyerek ve görerek", { active: 2 }], ["analytic", "active"]),
  q("team", 2, "team", "Bir projede hangi rol sana daha yakındır?", ["Kendi sorumluluk alanımda bağımsız ilerlemek", { analytic: 1, stability: 1 }], ["Ekibi bir araya getirip yön vermek", { leadership: 2, people: 1 }], ["stability", "leadership"]),
  q("known_reality", 3, "reality", "Yoğun bir günde hangisini tercih edersin?", ["İnsanlarla doğrudan ilgilenmek", { people: 2, active: 1 }], ["Teknik bir sistem üzerinde çalışmak", { analytic: 2 }], ["people", "analytic"], "all", "score_known", 65),
  q("unknown_discovery", 3, "discovery", "Bilmediğin bir alanı nasıl keşfetmek istersin?", ["Kısa bir proje veya atölye deneyerek", { active: 1, creative: 1 }], ["Meslekleri ve verileri karşılaştırarak", { analytic: 2 }], ["active", "analytic"], "all", "score_unknown", 65),
  q("pressure", 3, "responsibility", "Hangisine daha hazırsın?", ["Yüksek sorumluluk ve zaman baskısı", { leadership: 1, active: 1 }], ["Daha öngörülebilir sorumluluk ve tempo", { stability: 2 }], ["leadership", "stability"]),
  q("desk", 3, "rhythm", "Uzun vadede hangisi seni daha az yorar?", ["Masa başında uzun süre odaklanmak", { analytic: 2 }], ["Farklı yer ve kişilerle çalışmak", { active: 1, people: 1 }], ["analytic", "active"]),
  q("education", 3, "education", "İstediğin meslek için hangisini göze alırsın?", ["Uzun eğitim ve uzmanlaşma sürecini", { people: 1, analytic: 1, stability: 1 }], ["Daha erken deneyim kazanıp işe başlamayı", { active: 1, creative: 1 }], ["stability", "active"]),
  q("income", 3, "income", "İki seçenek arasında kalsan hangisini seçersin?", ["Daha yüksek gelir ve hızlı ilerleme", { leadership: 2 }], ["Daha anlamlı ve dengeli bir çalışma hayatı", { people: 1, stability: 1 }], ["leadership", "stability"]),
  q("future", 3, "future", "Beş yıl sonra hangisi seni daha gururlandırır?", ["Aranılan bir uzman olmak", { analytic: 1, stability: 1 }], ["Bir ekip veya girişime yön vermek", { leadership: 2 }], ["stability", "leadership"]),
  q("verify_a", 4, "consistency", "Son kararını verirken hangisi seni daha çok ikna eder?", ["Günlük çalışma hayatını deneyimlemek", { active: 1, people: 1 }], ["Veri, ders planı ve kariyer seçeneklerini incelemek", { analytic: 2 }], ["active", "analytic"], "all", "both", 100),
  q("verify_b", 4, "consistency", "Bir bölümden vazgeçmene hangisi daha çok neden olur?", ["Çalışma koşullarının hayatıma uymaması", { stability: 2 }], ["Gelişim ve üretim alanının dar olması", { creative: 1, leadership: 1 }], ["stability", "creative"], "all", "both", 90),
];

export type DimensionScores = Record<DimensionKey, number>;

export function scoreAnswers(questions: Question[], answers: Array<number | undefined>): DimensionScores {
  const scores = Object.fromEntries(Object.keys(DIMENSIONS).map((key) => [key, 50])) as DimensionScores;
  answers.forEach((answer, index) => {
    const question = questions[index];
    if (answer === undefined || !question) return;
    Object.entries(question.options[answer]?.[1] ?? {}).forEach(([key, value]) => {
      scores[key as DimensionKey] += (value ?? 0) * 8;
    });
  });
  (Object.keys(scores) as DimensionKey[]).forEach((key) => {
    scores[key] = Math.max(12, Math.min(98, scores[key]));
  });
  return scores;
}

export function selectNextQuestion({
  mode,
  questions,
  answers,
}: {
  mode: "score_known" | "score_unknown";
  questions: Question[];
  answers: Array<number | undefined>;
}) {
  const answered = answers.filter((value) => value !== undefined).length;
  const phase = answered < 3 ? 1 : answered < 6 ? 2 : answered < 9 ? 3 : 4;
  const scores = scoreAnswers(questions, answers);
  const top = (Object.entries(scores) as Array<[DimensionKey, number]>).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "analytic";
  const used = new Set(questions.map((item) => item.id));
  const lastFamily = questions.at(-1)?.family;
  const counts = Object.fromEntries(Object.keys(DIMENSIONS).map((key) => [key, 0])) as Record<DimensionKey, number>;
  questions.forEach((item, index) => {
    if (answers[index] !== undefined) item.focus.forEach((key) => { counts[key] += 1; });
  });
  const candidates = QUESTION_POOL.filter((item) => item.phase === phase && !used.has(item.id) && item.family !== lastFamily && (item.audience === "both" || item.audience === mode));
  const ranked = candidates.map((item) => ({
    item,
    score: item.priority + (item.branch === top ? 28 : 0) + item.focus.reduce((sum, key) => sum + (4 - counts[key]) * 6, 0),
  })).sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
  return ranked[0]?.item ?? QUESTION_POOL.find((item) => !used.has(item.id) && (item.audience === "both" || item.audience === mode));
}
