import { DIMENSIONS, type DimensionKey } from "../data/questionPool";
import { CAREER_DETAILS, getRecommendations } from "../data/recommendations";
import type { AnalysisContext } from "../types";
import type { AnalysisResult } from "./AdaptiveQuiz";

type ResultDashboardProps = {
  mode: "score_known" | "score_unknown";
  context: AnalysisContext;
  analysis: AnalysisResult;
  onRestart: () => void;
  onReview: () => void;
};

export function ResultDashboard({ mode, context, analysis, onRestart, onReview }: ResultDashboardProps) {
  const sorted = (Object.entries(analysis.scores) as Array<[DimensionKey, number]>).sort((a, b) => b[1] - a[1]);
  const top = sorted[0]?.[0] ?? "analytic";
  const programs = getRecommendations(context.primaryField, top);
  const detail = CAREER_DETAILS[top];
  const scoreTypes = context.scores ? Object.keys(context.scores).join(" + ") : "Geniş kariyer havuzu";

  return <section className="analysis-page result-page">
    <header className="result-hero">
      <div className="eyebrow">KİŞİSEL PUSULA PROFİLİN</div>
      <h1>{DIMENSIONS[top]} odaklı profil</h1>
      <p>{scoreTypes} ve {context.preferences?.city} tercih koşulun birlikte değerlendirilerek araştırma rotaların oluşturuldu.</p>
    </header>
    <div className="result-layout">
      <div className="stack">
        <article className="analysis-card"><h2>{mode === "score_known" ? "Önerilen programlar" : "Kariyer ve bölüm rotaları"}</h2><p className="muted">Akademik uygunluk ve yönelim gerekçesi ayrı değerlendirilir.</p><div className="program-list">{programs.map((name, index) => <div key={name}><b>0{index + 1}</b><span><strong>{name}</strong><small>{index === 0 ? "Birincil araştırma rotası" : "Uygun alternatif rota"}</small></span><em>{index === 0 ? "Güçlü uyum" : "Yakın uyum"}</em></div>)}</div></article>
        <article className="analysis-card"><h2>Kariyer yönleri</h2><div className="career-grid">{detail.paths.map((path, index) => <div key={path}><i>0{index + 1}</i><b>{path}</b><span>Bu rota için ders, staj ve günlük çalışma koşullarını incele.</span></div>)}</div></article>
        <article className="analysis-card"><h2>Avantajlar ve dikkat noktaları</h2><div className="pros-cons"><div><h3>Avantajlar</h3>{detail.pros.map((item) => <p key={item}>✓ {item}</p>)}</div><div><h3>Dikkat</h3>{detail.cons.map((item) => <p key={item}>! {item}</p>)}</div></div></article>
        <article className="analysis-card"><h2>Kazanç senaryosu</h2><div className="salary">{["Başlangıç", "3–5 yıl", "Uzman / lider"].map((label, index) => <div key={label}><span>{label}</span><b>{detail.salary[index]}</b></div>)}</div><p className="disclaimer">Gösterilen aralıklar başlangıç verisidir; canlı üründe tarih ve kaynak gösteren verilerle güncellenmelidir.</p></article>
      </div>
      <aside className="stack">
        <article className="analysis-card"><h2>Ölçülen eğilimler</h2>{sorted.slice(0, 4).map(([key, value]) => <div className="trait" key={key}><span>{DIMENSIONS[key]}</span><div><i style={{ width: `${value}%` }} /></div></div>)}</article>
        <article className="analysis-card"><h2>İş görünümü</h2><strong>{detail.market}</strong><p className="disclaimer">Staj, portföy, şehir, dil ve bağlantılar iş bulma sonucunu değiştirir.</p></article>
        <article className="analysis-card"><h2>Eğitim seçenekleri</h2><div className="bands"><p><b>{mode === "score_known" ? "İddialı" : "Üniversite"}</b> Güncel program verisiyle doğrula</p><p><b>{mode === "score_known" ? "Hedef" : "Alternatif"}</b> Şehir ve bütçeyle karşılaştır</p><p><b>{mode === "score_known" ? "Güvenli" : "Özel kabul"}</b> Kabul koşullarını ayrı incele</p></div></article>
        <article className="analysis-card"><h2>Kararını doğrula</h2><ul><li>Bir öğrenci veya mezunla görüş</li><li>Mini proje ya da atölye dene</li><li>Ders planlarını karşılaştır</li></ul><p className="disclaimer">Sonuçlar 10 yanıttan çıkarılan eğilimlerdir; başarı veya iş garantisi değildir.</p></article>
        <div className="actions"><button className="analysis-primary" type="button" onClick={onRestart}>Yeni analiz</button><button type="button" onClick={onReview}>Yanıtları gözden geçir</button></div>
      </aside>
    </div>
  </section>;
}
