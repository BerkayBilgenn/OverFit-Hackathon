/**
 * Arayüzün profil göstergeleri.
 *
 * NOT: Buradaki 19 soruluk mock havuz ve seçim algoritması, 80 soruluk
 * gerçek soru bankası ve adaptif motor devreye girdiği için kaldırıldı —
 * bkz. engine/ ve engine/CONTRACT.md. Motorun 14 boyutu bu 6 göstergeye
 * src/analysis/data/overfitBridge.ts içinde eşlenir. Eski sürüm git
 * geçmişinde duruyor.
 */
export const DIMENSIONS = {
  analytic: "Analitik düşünme",
  people: "İnsan odaklılık",
  creative: "Yaratıcı üretim",
  active: "Hareketli çalışma",
  leadership: "Liderlik",
  stability: "Düzen ve güvence",
} as const;

export type DimensionKey = keyof typeof DIMENSIONS;
export type DimensionScores = Record<DimensionKey, number>;
