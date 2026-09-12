import { useEffect, useState } from "react";
import type { GroupProgram, Results } from "../../../engine/index.js";
import { loadOverfit } from "../data/overfitBridge";
import { DIMENSIONS, type DimensionKey } from "../data/questionPool";
import { CAREER_DETAILS } from "../data/recommendations";
import type { AnalysisContext } from "../types";
import type { AnalysisResult } from "./AdaptiveQuiz";

type ResultDashboardProps = {
  mode: "score_known" | "score_unknown";
  context: AnalysisContext;
  analysis: AnalysisResult;
  onRestart: () => void;
  onReview: () => void;
};

const sayi = new Intl.NumberFormat("tr-TR");

/**
 * Bir üniversite satırı. Adayın sırası varsa son üç yılda kaç yıl tuttuğunu
 * söyler — taban sırası oynayan bir programa "kesin girersin" demiyoruz.
 */
function ProgramRow({ program, siraVar }: { program: GroupProgram; siraVar: boolean }) {
  const nitelik = [program.scoreType, program.language, program.scholarship]
    .filter(Boolean)
    .join(" · ");
  const tutan = program.reachedYears.length;
  return <li className={siraVar && program.reachable ? "uni tuttu" : "uni"}>
    <span className="uni-ad">{program.university}</span>
    <span className="uni-meta">{program.city} · {nitelik}</span>
    <span className="uni-sira">
      {program.currentRank === null
        ? "2026 sırası yayımlanmadı"
        : `2026 taban ${sayi.format(program.currentRank)}.`}
      {siraVar && program.yearsWithData > 0 && <b>
        {tutan > 0 ? `${tutan}/${program.yearsWithData} yıl tuttu` : "sıran yetmiyor"}
      </b>}
    </span>
  </li>;
}


/**
 * Erişim satırı. Veri yoksa sessiz kalmaz, nedenini söyler —
 * yayımlanmamış sıra ile "giremezsin" birbirine karıştırılmamalı.
 */
function accessNote(group: Results["groups"][number]): string {
  const access = group.access;
  if (!access || !access.scoreTypes.length) return "";
  if (access.eligible === 0) return ` · ${group.scoreTypes.join("/")} puanıyla tercih ediliyor, girdiğin ${access.scoreTypes.join("/")} sırası burada geçerli değil`;
  if (access.reachable > 0) return ` · sıranın yettiği ${sayi.format(access.reachable)} program`;
  if (access.withRank > 0) return " · bu grupta sıranın yettiği program yok";
  return " · taban sırası yayımlanmamış, erişim hesaplanamadı";
}

export function ResultDashboard({ mode, context, analysis, onRestart, onReview }: ResultDashboardProps) {
  const [results, setResults] = useState<Results | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadOverfit()
      .then((overfit) => { if (!cancelled) setResults(overfit.results(analysis.session, { groupLimit: 5 })); })
      .catch((cause: unknown) => console.error(cause));
    return () => { cancelled = true; };
  }, [analysis.session]);

  const sorted = (Object.entries(analysis.scores) as Array<[DimensionKey, number]>).sort((a, b) => b[1] - a[1]);
  const top = sorted[0]?.[0] ?? "analytic";
  const detail = CAREER_DETAILS[top];
  const scoreTypes = context.scores ? Object.keys(context.scores).join(" + ") : "Geniş kariyer havuzu";
  const academic = results?.academic ?? null;

  return <section className="analysis-page result-page">
    <header className="result-hero">
      <div className="eyebrow">KİŞİSEL PUSULA PROFİLİN</div>
      <h1>{results ? results.families[0].label : DIMENSIONS[top]} odaklı profil</h1>
      <p>{results ? results.summaryText : `${scoreTypes} ve ${context.preferences?.city ?? "tercih"} koşulun değerlendiriliyor…`}</p>
    </header>
    <div className="result-layout">
      <div className="stack">
        <article className="analysis-card">
          <h2>{mode === "score_known" ? "Önerilen programlar" : "Kariyer ve bölüm rotaları"}</h2>
          <p className="muted">
            {academic?.ranks
              ? `${Object.entries(academic.ranks).map(([type, rank]) => `${type} ${sayi.format(rank as number)}.`).join(" · ")} başarı sırasına göre 2026 taban sıralarıyla karşılaştırıldı.`
              : "Yönelim gerekçesine göre sıralandı; başarı sırası girilmediği için erişim hesaplanmadı."}
          </p>
          {results && results.missingScoreTypes.length > 0 && <p className="muted access-hint">
            {results.missingScoreTypes
              .map((item) => `${item.scoreType} puanıyla açılan ${sayi.format(item.programCount)} program`)
              .join(" ve ")} profiline yakın duruyor.
            {" "}Bu türlerde sıranı girersen onları da karşılaştırabilirim.
          </p>}
          <div className="program-list">
            {(results?.groups ?? []).map((group, index) => <div key={group.id}>
              <b>0{index + 1}</b>
              <span>
                <strong>{group.name}</strong>
                <small>
                  {sayi.format(group.programCount)} program · {group.levels.join("/")}
                  {accessNote(group)}
                </small>
                {group.programs.length > 0 && <ul className="uni-list">
                  <li className="uni-baslik">
                    {academic?.ranks ? "Sıranın yettiği üniversiteler" : "Bu bölümün açıldığı üniversiteler"}
                  </li>
                  {group.programs.map((program) => <ProgramRow
                    key={program.code}
                    program={program}
                    siraVar={Boolean(academic?.ranks)}
                  />)}
                </ul>}
              </span>
              <em>{index === 0 ? "Güçlü uyum" : "Yakın uyum"}</em>
            </div>)}
            {!results && <div><b>—</b><span><strong>Bölüm verisi yükleniyor…</strong><small>21.493 program taranıyor</small></span><em></em></div>}
          </div>
        </article>
        <article className="analysis-card"><h2>Kariyer yönleri</h2><div className="career-grid">{detail.paths.map((path, index) => <div key={path}><i>0{index + 1}</i><b>{path}</b><span>Bu rota için ders, staj ve günlük çalışma koşullarını incele.</span></div>)}</div></article>
        <article className="analysis-card"><h2>Avantajlar ve dikkat noktaları</h2><div className="pros-cons"><div><h3>Avantajlar</h3>{detail.pros.map((item) => <p key={item}>✓ {item}</p>)}</div><div><h3>Dikkat</h3>{detail.cons.map((item) => <p key={item}>! {item}</p>)}</div></div></article>
        <article className="analysis-card"><h2>Kazanç senaryosu</h2><div className="salary">{["Başlangıç", "3–5 yıl", "Uzman / lider"].map((label, index) => <div key={label}><span>{label}</span><b>{detail.salary[index]}</b></div>)}</div><p className="disclaimer">Gösterilen aralıklar başlangıç verisidir; YÖK Atlas mezun istihdam ve gelir verisi yayımlamadığı için bu rakamlar kaynaklandırılmamıştır.</p></article>
      </div>
      <aside className="stack">
        <article className="analysis-card"><h2>Ölçülen eğilimler</h2>{sorted.slice(0, 4).map(([key, value]) => <div className="trait" key={key}><span>{DIMENSIONS[key]}</span><div><i style={{ width: `${value}%` }} /></div></div>)}</article>
        <article className="analysis-card"><h2>Yakın kariyer aileleri</h2>{(results?.families ?? []).map((family) => <div className="trait" key={family.id}><span>{family.label}</span><div><i style={{ width: `${Math.round(family.score * 100)}%` }} /></div></div>)}<p className="disclaimer">Aile ağırlıkları editoryal varsayımdır; YÖK Atlas 2026'da Meslek Atlası kaldırıldı.</p></article>
        <article className="analysis-card"><h2>İş görünümü</h2><strong>{detail.market}</strong><p className="disclaimer">Staj, portföy, şehir, dil ve bağlantılar iş bulma sonucunu değiştirir.</p></article>
        <article className="analysis-card"><h2>Kararını doğrula</h2><ul><li>Bir öğrenci veya mezunla görüş</li><li>Mini proje ya da atölye dene</li><li>Ders planlarını karşılaştır</li></ul>{(results?.warnings ?? []).map((warning) => <p className="disclaimer" key={warning}>{warning}</p>)}<p className="disclaimer">Bağlayıcı kaynak ÖSYM'nin güncel kılavuzudur.</p></article>
        <div className="actions"><button className="analysis-primary" type="button" onClick={onRestart}>Yeni analiz</button><button type="button" onClick={onReview}>Yanıtları gözden geçir</button></div>
      </aside>
    </div>
  </section>;
}
