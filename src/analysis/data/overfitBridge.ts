/**
 * UI ile soru motoru (engine/) arasındaki köprü.
 *
 * Motor 14 persona boyutu ve 21.493 gerçek YÖK Atlas programı ile çalışır;
 * arayüzün görselleri 6 boyut üzerinden kurulu. Dönüşüm burada, tek yerde.
 */
import { createOverfit } from "../../../engine/index.js";
import type { Academic, Filters, Overfit, Profile, ScoreType } from "../../../engine/index.js";
import type { AnalysisContext, Preferences } from "../types";
import type { DimensionKey, DimensionScores } from "./questionPool";

let pending: Promise<Overfit> | null = null;

/** Motoru bir kez yükler; veri public/overfit-data altından servis edilir. */
export function loadOverfit(): Promise<Overfit> {
  pending ??= createOverfit({ dataUrl: "/overfit-data" });
  return pending;
}

/** 14 motor boyutu -> arayüzün 6 göstergesi. Ölçek arayüzle aynı: 12-98. */
const DIMENSION_MAP: Record<DimensionKey, Array<keyof Profile>> = {
  analytic: ["veri", "sistem"],
  people: ["insan", "yardim"],
  creative: ["fikir"],
  active: ["hareket", "nesne"],
  leadership: ["liderlik", "sorumluluk"],
  stability: ["duzen", "guvence"],
};

export function toDimensionScores(profile: Profile): DimensionScores {
  const entries = (Object.keys(DIMENSION_MAP) as DimensionKey[]).map((key) => {
    const raw = DIMENSION_MAP[key].reduce((sum, dimension) => sum + (profile[dimension] ?? 0), 0);
    return [key, Math.max(12, Math.min(98, 50 + raw * 8))] as const;
  });
  return Object.fromEntries(entries) as DimensionScores;
}

/**
 * Formda girilen bütün puan türlerini motora aktarır.
 * Her program yalnızca kendi puan türüyle karşılaştırıldığı için
 * türlerden birini seçip diğerlerini atmak yanlış sonuç üretir.
 */
export function toAcademic(context: AnalysisContext): Academic | null {
  if (!context.scores) return null;
  const ranks: Partial<Record<ScoreType, number>> = {};
  for (const [type, entry] of Object.entries(context.scores) as Array<[ScoreType, { rank: number }]>) {
    if (entry && Number.isFinite(entry.rank) && entry.rank > 0) ranks[type] = entry.rank;
  }
  return Object.keys(ranks).length ? { ranks } : null;
}

const UNIVERSITY_TYPES: Record<string, Filters["universityType"]> = {
  Devlet: "DEVLET",
  Vakıf: "VAKIF",
};

/** Tercih formundaki koşulları motorun filtre biçimine çevirir. */
export function toFilters(preferences: Preferences | undefined): Filters | null {
  if (!preferences) return null;

  const rawCities = preferences.move === "no"
    ? [preferences.city]
    : [preferences.city, ...(preferences.targetCities ?? "").split(/[,;/]/)];
  const cities = rawCities
    .map((city) => city.trim().toLocaleUpperCase("tr-TR"))
    .filter((city) => city.length > 1);

  const filters: Filters = {};
  if (cities.length) filters.cities = [...new Set(cities)];
  if (UNIVERSITY_TYPES[preferences.universityType]) filters.universityType = UNIVERSITY_TYPES[preferences.universityType];
  if (preferences.language === "Türkçe" || preferences.language === "İngilizce") filters.language = preferences.language;
  if (preferences.scholarship) filters.scholarshipOnly = true;

  return Object.keys(filters).length ? filters : null;
}
