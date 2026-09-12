import { useState } from "react";
import type { Preferences } from "../types";

type PreferenceFormProps = {
  onBack: () => void;
  onComplete: (preferences: Preferences) => void;
  step: string;
  mode: "known" | "unknown";
};

export function PreferenceForm({ onBack, onComplete, step, mode }: PreferenceFormProps) {
  const [form, setForm] = useState<Preferences>({
    city: "İstanbul",
    move: "yes",
    targetCities: "Türkiye geneli",
    universityType: "Fark etmez",
    budget: "Sınır yok",
    language: "Fark etmez",
    scholarship: false,
    strict: false,
  });

  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = () => {
    if (!form.city.trim()) return;
    onComplete({ ...form, targetCities: form.move === "no" ? form.city : form.targetCities });
  };

  return <section className="analysis-page compact-page">
    <div className="flow-head"><button type="button" onClick={onBack}>← Geri</button><span>{step} · Tercih koşulları</span></div>
    <article className="analysis-card form-card">
      <div className="eyebrow">PROGRAM FİLTRELERİ</div>
      <h1>{mode === "unknown" ? "Hayalindeki eğitim ortamını tarif et." : "Nerede ve nasıl okumak istediğini belirle."}</h1>
      <p className="lead">Bu bilgiler önerileri senin için ulaşılabilir seçeneklere dönüştürür.</p>
      <div className="form-grid">
        <label>Yaşadığın şehir<input value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="Şehir ara…" /></label>
        <label>Şehir dışına taşınma<select value={form.move} onChange={(event) => update("move", event.target.value as Preferences["move"])}><option value="yes">Evet, düşünebilirim</option><option value="no">Hayır, bulunduğum şehirde kalacağım</option></select></label>
        <label>Değerlendirilecek şehirler<input disabled={form.move === "no"} value={form.move === "no" ? form.city : form.targetCities} onChange={(event) => update("targetCities", event.target.value)} /></label>
        <label>Üniversite türü<select value={form.universityType} onChange={(event) => update("universityType", event.target.value)}><option>Fark etmez</option><option>Devlet</option><option>Vakıf</option></select></label>
        <label>Yıllık eğitim bütçesi<select value={form.budget} onChange={(event) => update("budget", event.target.value)}><option>Sınır yok</option><option>₺100.000'a kadar</option><option>₺250.000'a kadar</option><option>₺500.000'a kadar</option></select></label>
        <label>Eğitim dili<select value={form.language} onChange={(event) => update("language", event.target.value)}><option>Fark etmez</option><option>Türkçe</option><option>İngilizce</option></select></label>
      </div>
      <div className="checks">
        <label><input type="checkbox" checked={form.scholarship} onChange={(event) => update("scholarship", event.target.checked)} /> Burs gerekli</label>
        <label><input type="checkbox" checked={form.strict} onChange={(event) => update("strict", event.target.checked)} /> Şehir ve bütçeyi kesin filtre yap</label>
      </div>
      <p className="info">Tercih koşulları yönelim puanını değiştirmez; yalnızca uygulanabilir programları filtreler.</p>
      <button className="analysis-primary" type="button" onClick={submit}>Kişisel analizi başlat <span>→</span></button>
    </article>
  </section>;
}
