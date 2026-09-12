import type { DimensionKey } from "./questionPool";

const GENERAL: Record<DimensionKey, string[]> = {
  analytic: ["Bilgisayar Mühendisliği", "Yönetim Bilişim Sistemleri", "Endüstri Mühendisliği"],
  people: ["Psikoloji", "Sağlık Alanları", "PDR"],
  creative: ["Görsel İletişim Tasarımı", "Mimarlık", "Yeni Medya"],
  active: ["Fizyoterapi", "İnşaat Mühendisliği", "Turizm Rehberliği"],
  leadership: ["Hukuk", "İşletme", "Endüstri Mühendisliği"],
  stability: ["Eczacılık", "Öğretmenlik", "İstatistik"],
};

const RECOMMENDATIONS: Record<string, Partial<Record<DimensionKey, string[]>>> = {
  SAY: { analytic: ["Bilgisayar Mühendisliği", "Endüstri Mühendisliği", "Elektrik-Elektronik Müh."], people: ["Tıp", "Diş Hekimliği", "Hemşirelik"], creative: ["Mimarlık", "Endüstriyel Tasarım", "Yazılım Mühendisliği"] },
  EA: { analytic: ["Ekonomi", "Yönetim Bilişim Sistemleri", "İşletme"], people: ["Psikoloji", "PDR", "Sosyal Hizmet"], leadership: ["Hukuk", "İşletme", "Siyaset Bilimi"] },
  SÖZ: { creative: ["Görsel İletişim Tasarımı", "Radyo, TV ve Sinema", "Yeni Medya"], people: ["Öğretmenlik", "Sosyal Hizmet", "Özel Eğitim"], analytic: ["Tarih", "Coğrafya", "Bilgi ve Belge Yönetimi"] },
  DİL: { creative: ["Çeviribilim", "Karşılaştırmalı Edebiyat", "Kültür ve İletişim"], people: ["İngilizce Öğretmenliği", "Turizm Rehberliği", "Dilbilim"], analytic: ["Mütercim-Tercümanlık", "Dilbilim", "Karşılaştırmalı Edebiyat"] },
  GENERAL,
};

type CareerDetail = {
  market: string;
  salary: [string, string, string];
  paths: string[];
  pros: string[];
  cons: string[];
};

export const CAREER_DETAILS: Record<DimensionKey, CareerDetail> = {
  analytic: { market: "Yüksek · rekabetçi", salary: ["₺35–55 bin", "₺60–100 bin", "₺110 bin+"], paths: ["Teknik uzmanlık", "Veri ve yapay zekâ", "Ürün yönetimi", "Girişimcilik"], pros: ["Sektör çeşitliliği", "Küresel çalışma ihtimali"], cons: ["Sürekli öğrenme", "Portföy beklentisi"] },
  people: { market: "Orta–yüksek", salary: ["₺30–48 bin", "₺48–80 bin", "₺90 bin+"], paths: ["Uzmanlık", "Danışmanlık", "Eğitim", "Yönetim"], pros: ["Doğrudan insan etkisi", "Çeşitli uzmanlıklar"], cons: ["Duygusal yük", "Ek eğitim ihtimali"] },
  creative: { market: "Orta · portföye bağlı", salary: ["₺28–45 bin", "₺45–78 bin", "₺90 bin+"], paths: ["UX/UI", "Marka tasarımı", "İçerik ve medya", "Bağımsız üretim"], pros: ["Yaratıcı ifade", "Freelance imkânı"], cons: ["Gelir dalgalanması", "Portföy rekabeti"] },
  active: { market: "Orta–yüksek", salary: ["₺30–48 bin", "₺48–78 bin", "₺85 bin+"], paths: ["Saha uzmanlığı", "Operasyon", "Proje yönetimi", "Teknik danışmanlık"], pros: ["Somut sonuç", "Dinamik çalışma"], cons: ["Fiziksel tempo", "Seyahat ihtimali"] },
  leadership: { market: "Orta–yüksek", salary: ["₺32–50 bin", "₺55–90 bin", "₺100 bin+"], paths: ["Yönetim", "Strateji", "Satış", "Girişimcilik"], pros: ["Geniş sektör seçimi", "İlerleme potansiyeli"], cons: ["Yüksek rekabet", "Sonuç baskısı"] },
  stability: { market: "İstikrarlı", salary: ["₺30–45 bin", "₺45–70 bin", "₺80 bin+"], paths: ["Alan uzmanlığı", "Kalite ve süreç", "Kamu", "Akademi"], pros: ["Öngörülebilir rota", "Derinleşme"], cons: ["Değişim hızı düşük olabilir", "Sınav/uzmanlık koşulları"] },
};

export function getRecommendations(field: string, topDimension: DimensionKey) {
  return RECOMMENDATIONS[field]?.[topDimension] ?? GENERAL[topDimension];
}
