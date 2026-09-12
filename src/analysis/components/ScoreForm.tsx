import { useMemo, useState, type FormEvent } from "react";
import type { AnalysisContext, ScoreType } from "../types";

const SCORE_TYPES: ScoreType[] = ["TYT", "SAY", "EA", "SÖZ", "DİL"];
type ScoreRow = { active: boolean; score: string; rank: string };

const createRows = () => Object.fromEntries(SCORE_TYPES.map((type) => [type, {
  active: type === "SAY",
  score: "",
  rank: "",
}])) as Record<ScoreType, ScoreRow>;

type ScoreFormProps = {
  onExit: () => void;
  onComplete: (context: AnalysisContext) => void;
};

export function ScoreForm({ onExit, onComplete }: ScoreFormProps) {
  const [year, setYear] = useState("2026");
  const [rows, setRows] = useState(createRows);
  const [error, setError] = useState("");
  const activeCount = useMemo(() => Object.values(rows).filter((row) => row.active).length, [rows]);

  const update = <K extends keyof ScoreRow>(type: ScoreType, key: K, value: ScoreRow[K]) => {
    setRows((current) => ({ ...current, [type]: { ...current[type], [key]: value } }));
    setError("");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const selected = SCORE_TYPES.filter((type) => rows[type].active);
    if (!selected.length) return setError("En az bir puan türü seçmelisin.");
    if (selected.some((type) => !rows[type].score || !rows[type].rank)) return setError("Seçtiğin her puan türü için puan ve sıralama girmelisin.");
    if (selected.some((type) => Number(rows[type].score) <= 0 || Number(rows[type].rank) <= 0)) return setError("Puan ve sıralama sıfırdan büyük olmalı.");
    if (selected.some((type) => Number(rows[type].score) > 500)) return setError("Puan 500'den büyük olamaz.");

    const scores = Object.fromEntries(selected.map((type) => [type, {
      score: Number(rows[type].score),
      rank: Number(rows[type].rank),
    }])) as AnalysisContext["scores"];
    const primaryField = selected.find((type) => type !== "TYT") ?? "GENERAL";
    onComplete({ examYear: Number(year), scores, primaryField });
  };

  return <section className="analysis-page score-entry">
    <div className="flow-head"><button type="button" onClick={onExit}>← Yol ayrımına dön</button><span>1 / 3 · Akademik profil</span></div>
    <div className="entry-grid">
      <aside className="entry-copy">
        <div className="eyebrow">YKS PUANIM VAR</div>
        <h1>Sıralamanı, istediğin hayatla birlikte değerlendirelim.</h1>
        <p>Pusula puanını tek başına karar olarak kullanmaz. Akademik erişimini; çalışma biçimin, yaşam beklentin ve tercih koşullarınla birlikte ele alır.</p>
        <div className="step-list">
          <div className="active"><b>01</b><span><strong>Puan ve sıralama</strong><small>Elindeki sonuçları ekle</small></span></div>
          <div><b>02</b><span><strong>Tercih koşulları</strong><small>Şehir, bütçe ve dil</small></span></div>
          <div><b>03</b><span><strong>Yönelim analizi</strong><small>10 adaptif soru</small></span></div>
        </div>
      </aside>

      <form className="analysis-card form-card score-card" onSubmit={submit}>
        <div className="form-title"><div><span>Akademik veriler</span><h2>YKS sonucunu ekle</h2></div><em>{activeCount} puan türü seçili</em></div>
        <label className="year-field">Sınav yılı
          <select value={year} onChange={(event) => setYear(event.target.value)}>
            <option>2026</option><option>2025</option><option>2024</option><option>2023</option>
          </select>
        </label>
        <div className="score-table">
          <div className="score-row score-labels"><span>Puan türü</span><span>Puan</span><span>Başarı sırası</span></div>
          {SCORE_TYPES.map((type) => <div className={`score-row ${rows[type].active ? "selected" : ""}`} key={type}>
            <label className="score-toggle"><input type="checkbox" checked={rows[type].active} onChange={(event) => update(type, "active", event.target.checked)} /><i /><strong>{type}</strong></label>
            <input aria-label={`${type} puanı`} type="number" min="1" max="500" step="0.001" disabled={!rows[type].active} value={rows[type].score} onChange={(event) => update(type, "score", event.target.value)} placeholder="örn. 412,5" />
            <input aria-label={`${type} sıralaması`} type="number" min="1" disabled={!rows[type].active} value={rows[type].rank} onChange={(event) => update(type, "rank", event.target.value)} placeholder="örn. 32.500" />
          </div>)}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <p className="info">Veriler yalnızca bu analiz oturumundaki erişilebilir program havuzunu oluşturmak için kullanılır.</p>
        <button className="analysis-primary wide" type="submit">Tercih koşullarına geç <span>→</span></button>
      </form>
    </div>
  </section>;
}
