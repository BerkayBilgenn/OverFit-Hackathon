/**
 * Persona boyutları — 14 adet.
 *
 * Oturum başına 10 cevap alındığı için boyut sayısı bilinçli olarak düşük
 * tutuldu: 29 boyutla boyut başına ortalama 0,3 gözlem düşüyordu ve çıkan
 * profil gürültüden ibaret oluyordu.
 */
export const DIMENSIONS = Object.freeze({
  insan: "İnsanlarla doğrudan temas",
  sistem: "Teknik sistemler ve nasıl çalıştıkları",
  veri: "Sayı, ölçüm ve analiz",
  fikir: "Kavram üretme ve yaratıcılık",
  nesne: "Elle iş, fiziksel üretim",
  yardim: "Birine iyi gelme, bakım",
  liderlik: "Yönlendirme ve ikna",
  duzen: "Kural, prosedür, ayrıntı",
  takim: "Ekiple çalışma (düşük = tek başına)",
  hareket: "Sahada/hareketli çalışma (düşük = masa başı)",
  belirsiz: "Değişkenlik toleransı (düşük = öngörülebilirlik)",
  guvence: "İş güvencesi önceliği (düşük = risk/getiri)",
  uzunegitim: "Uzun eğitime yatkınlık",
  sorumluluk: "Yüksek sorumluluk taşıma isteği",
});

export const DIMENSION_IDS = Object.freeze(Object.keys(DIMENSIONS));

export const AUDIENCES = Object.freeze(["both", "score_known", "score_unknown"]);
export const STAGES = Object.freeze(["broad", "deepen", "distinguish", "validate"]);

/** Oturumun 10 adımı hangi aşamadan soru çeker. */
export const STAGE_PLAN = Object.freeze([
  "broad", "broad", "broad",
  "deepen", "deepen", "deepen",
  "distinguish", "distinguish", "distinguish",
  "validate",
]);
