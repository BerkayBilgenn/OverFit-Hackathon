/**
 * 15 kariyer ailesi ve persona boyutu ağırlıkları.
 *
 * DİKKAT: Bu ağırlıklar VERİDEN GELMİYOR. YÖK Atlas 2026'da Meslek Atlası ve
 * Mezun Başarı Atlası kaldırıldığı için "bu bölümü okuyan ne iş yapar"
 * sorusunun kamuya açık bir veri karşılığı yok. Aşağıdakiler editoryal
 * varsayımdır ve ürün ekibi tarafından gözden geçirilmek üzere burada,
 * tek bir yerde, açıkça durur.
 *
 * Ölçek 0-3. Ağırlık, kullanıcının o boyuttaki normalize edilmiş puanıyla
 * çarpılır; toplam benzerlik skoru kosinüs benzerliğiyle hesaplanır.
 */
export const CAREER_FAMILIES = Object.freeze([
  {
    id: "saglik_klinik",
    label: "Sağlık ve Klinik Bakım",
    summary: "İnsanla doğrudan temas, yüksek sorumluluk, uzun ve kurallı eğitim.",
    weights: { insan: 3, yardim: 3, sorumluluk: 3, duzen: 2, uzunegitim: 2, hareket: 2, takim: 2, guvence: 2, sistem: 1, veri: 1, nesne: 1, belirsiz: 1, liderlik: 1, fikir: 0 },
  },
  {
    id: "yazilim_veri",
    label: "Yazılım ve Veri",
    summary: "Ekran başında sistem kurma, mantık ve veriyle problem çözme.",
    weights: { sistem: 3, veri: 3, fikir: 2, duzen: 2, belirsiz: 2, liderlik: 1, takim: 1, guvence: 1, uzunegitim: 1, sorumluluk: 1, nesne: 1, insan: 0, hareket: 0, yardim: 0 },
  },
  {
    id: "muhendislik_teknoloji",
    label: "Mühendislik ve Teknoloji",
    summary: "Fiziksel sistemleri tasarlama, kurma ve çalışır tutma.",
    weights: { sistem: 3, nesne: 3, veri: 2, duzen: 2, hareket: 2, takim: 2, sorumluluk: 2, fikir: 1, guvence: 1, uzunegitim: 1, insan: 1, belirsiz: 1, liderlik: 1, yardim: 0 },
  },
  {
    id: "mimarlik_planlama",
    label: "Mimarlık, Planlama ve Yapı",
    summary: "Mekân ve yapı tasarımı; hem çizim masası hem şantiye.",
    weights: { fikir: 3, nesne: 2, sistem: 2, hareket: 2, duzen: 2, takim: 2, sorumluluk: 2, veri: 1, insan: 1, uzunegitim: 1, belirsiz: 1, guvence: 1, liderlik: 1, yardim: 0 },
  },
  {
    id: "temel_bilim_arastirma",
    label: "Temel Bilimler ve Araştırma",
    summary: "Derin uzmanlık, uzun eğitim, sonucu belirsiz araştırma.",
    weights: { veri: 3, fikir: 3, uzunegitim: 3, sistem: 2, duzen: 2, belirsiz: 2, takim: 1, guvence: 1, sorumluluk: 1, nesne: 1, insan: 0, hareket: 0, liderlik: 0, yardim: 0 },
  },
  {
    id: "isletme_finans",
    label: "İşletme, Finans ve Muhasebe",
    summary: "Sayı, süreç ve insan yönetiminin kesiştiği kurumsal işler.",
    weights: { liderlik: 3, veri: 2, insan: 2, duzen: 2, takim: 2, guvence: 2, belirsiz: 2, sorumluluk: 2, sistem: 1, fikir: 1, hareket: 1, uzunegitim: 1, nesne: 0, yardim: 0 },
  },
  {
    id: "hukuk_kamu",
    label: "Hukuk, Kamu ve Güvenlik",
    summary: "Kural okuma ve uygulama, kamu güvencesi, ağır sorumluluk.",
    weights: { duzen: 3, sorumluluk: 3, guvence: 3, insan: 2, liderlik: 2, uzunegitim: 2, veri: 1, fikir: 1, takim: 1, hareket: 1, sistem: 1, yardim: 1, belirsiz: 0, nesne: 0 },
  },
  {
    id: "egitim_ogretmenlik",
    label: "Eğitim ve Öğretmenlik",
    summary: "Öğretme, gelişimi izleme, öngörülebilir düzen ve güvence.",
    weights: { insan: 3, yardim: 3, guvence: 3, takim: 2, duzen: 2, liderlik: 2, sorumluluk: 2, fikir: 1, hareket: 1, uzunegitim: 1, belirsiz: 1, veri: 0, sistem: 0, nesne: 0 },
  },
  {
    id: "sosyal_psikoloji",
    label: "Psikoloji ve Sosyal Bilimler",
    summary: "İnsan davranışını anlama; genellikle lisansüstü ile derinleşir.",
    weights: { insan: 3, yardim: 3, fikir: 2, uzunegitim: 2, sorumluluk: 2, veri: 1, duzen: 1, takim: 1, hareket: 1, liderlik: 1, guvence: 1, belirsiz: 1, sistem: 0, nesne: 0 },
  },
  {
    id: "medya_iletisim",
    label: "Medya, İletişim ve Reklam",
    summary: "Hızlı tempo, değişken içerik, sürekli insan ve fikir trafiği.",
    weights: { fikir: 3, insan: 3, belirsiz: 3, liderlik: 2, hareket: 2, takim: 2, veri: 1, duzen: 1, sorumluluk: 1, sistem: 1, nesne: 1, yardim: 1, guvence: 0, uzunegitim: 0 },
  },
  {
    id: "tasarim_sanat",
    label: "Tasarım ve Sanat",
    summary: "Üretimin kendisi çıktı; portfolyo ile ilerleyen, değişken gelirli yol.",
    weights: { fikir: 3, nesne: 3, belirsiz: 3, insan: 1, takim: 1, hareket: 1, duzen: 1, sistem: 1, liderlik: 1, sorumluluk: 1, uzunegitim: 1, veri: 0, guvence: 0, yardim: 0 },
  },
  {
    id: "turizm_hizmet",
    label: "Turizm, Gastronomi ve Hizmet",
    summary: "Ayakta, ekip içinde, doğrudan misafirle geçen yoğun tempo.",
    weights: { insan: 3, hareket: 3, takim: 3, nesne: 2, belirsiz: 2, yardim: 2, liderlik: 1, duzen: 1, guvence: 1, fikir: 1, sorumluluk: 1, veri: 0, sistem: 0, uzunegitim: 0 },
  },
  {
    id: "tarim_gida_cevre",
    label: "Tarım, Gıda ve Çevre",
    summary: "Arazi ve laboratuvar arasında, canlı sistemlerle uygulamalı iş.",
    weights: { nesne: 3, hareket: 3, sistem: 2, veri: 2, duzen: 2, yardim: 1, takim: 1, belirsiz: 1, guvence: 1, fikir: 1, insan: 1, sorumluluk: 1, uzunegitim: 1, liderlik: 0 },
  },
  {
    id: "uygulamali_teknik",
    label: "Uygulamalı Teknik Meslekler",
    summary: "Kısa eğitim, erken işe başlama, elle ve aletle somut iş.",
    weights: { nesne: 3, sistem: 3, hareket: 2, duzen: 2, guvence: 2, takim: 1, veri: 1, belirsiz: 1, sorumluluk: 1, insan: 0, fikir: 0, liderlik: 0, yardim: 0, uzunegitim: 0 },
  },
  {
    id: "dil_kulturel",
    label: "Dil, Çeviri ve Kültürel Alanlar",
    summary: "Metin, dil ve kültürle uzun soluklu, çoğu zaman tek başına çalışma.",
    weights: { fikir: 3, insan: 2, duzen: 2, uzunegitim: 2, takim: 1, belirsiz: 1, yardim: 1, hareket: 1, guvence: 1, liderlik: 1, sorumluluk: 1, veri: 0, sistem: 0, nesne: 0 },
  },
]);

export const FAMILY_BY_ID = Object.freeze(
  Object.fromEntries(CAREER_FAMILIES.map((family) => [family.id, family])),
);
