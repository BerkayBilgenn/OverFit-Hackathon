import { useEffect, useRef, useState } from "react";
import type { OptionId, Overfit, SessionState } from "../../../engine/index.js";
import { loadOverfit, toAcademic, toDimensionScores, toFilters } from "../data/overfitBridge";
import type { DimensionScores } from "../data/questionPool";
import type { AnalysisContext } from "../types";

export type AnalysisResult = {
  /** Motorun oturum durumu — düz JSON, sonuç ekranı bunun üstünden çalışır. */
  session: SessionState;
  /** Arayüzün 6 göstergesine indirgenmiş profil. */
  scores: DimensionScores;
};

type AdaptiveQuizProps = {
  mode: "score_known" | "score_unknown";
  context: AnalysisContext;
  initialAnalysis: AnalysisResult | null;
  onBack: () => void;
  onComplete: (result: AnalysisResult) => void;
};

const OPTION_IDS: OptionId[] = ["a", "b"];

export function AdaptiveQuiz({ mode, context, initialAnalysis, onBack, onComplete }: AdaptiveQuizProps) {
  const [overfit, setOverfit] = useState<Overfit | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Geri dönüldüğünde hangi seçeneğin işaretli olduğunu göstermek için.
  const previousAnswers = useRef<Record<string, OptionId>>({});

  useEffect(() => {
    let cancelled = false;
    loadOverfit()
      .then((engine) => {
        if (cancelled) return;
        setOverfit(engine);
        if (initialAnalysis) {
          // "Yanıtları gözden geçir": son soruya dönülür, cevap değiştirilebilir.
          for (const answer of initialAnalysis.session.answers) {
            previousAnswers.current[answer.questionId] = answer.optionId;
          }
          setSession(engine.back(initialAnalysis.session));
          return;
        }
        setSession(engine.start({
          audience: mode,
          academic: toAcademic(context),
          filters: toFilters(context.preferences),
        }));
      })
      .catch((cause: unknown) => {
        console.error(cause);
        if (!cancelled) setError("Soru verisi yüklenemedi. Sayfayı yenilemeyi dene.");
      });
    return () => { cancelled = true; };
    // Oturum yalnızca bileşen ilk kurulduğunda başlatılır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <section className="analysis-page compact-page">
      <article className="analysis-card quiz-card"><h1>{error}</h1></article>
    </section>;
  }

  if (!overfit || !session) {
    return <section className="analysis-page compact-page">
      <article className="analysis-card quiz-card">
        <div className="eyebrow">ADAPTİF YÖNELİM ANALİZİ</div>
        <h1>Sorular hazırlanıyor…</h1>
        <p className="quiz-help">80 soruluk havuz ve 21.493 programlık bölüm kataloğu yükleniyor.</p>
      </article>
    </section>;
  }

  const question = overfit.question(session);
  if (!question) return null;

  const choose = (optionIndex: number) => {
    const optionId = OPTION_IDS[optionIndex];
    previousAnswers.current[question.id] = optionId;
    const next = overfit.answer(session, optionId);
    if (overfit.isFinished(next)) {
      onComplete({ session: next, scores: toDimensionScores(next.profile) });
      return;
    }
    setSession(next);
  };

  const goBack = () => {
    if (!question.canGoBack) return onBack();
    setSession(overfit.back(session));
  };

  const scoreLabel = context.scores ? Object.keys(context.scores).join(" + ") : "Puan gerekmiyor";
  const selected = previousAnswers.current[question.id];

  return <section className="analysis-page compact-page">
    <div className="flow-head">
      <button type="button" onClick={goBack}>← Geri</button>
      <span>{question.step} / {question.total}</span>
    </div>
    <article className="analysis-card quiz-card">
      <div className="progress"><i style={{ width: `${(question.step / question.total) * 100}%` }} /></div>
      <div className="eyebrow">ADAPTİF YÖNELİM ANALİZİ</div>
      <h1>{question.text}</h1>
      <p className="quiz-help">Sana daha yakın olan seçeneği işaretle; doğru veya yanlış cevap yok.</p>
      <div className="answers">
        {question.options.map((option, optionIndex) => <button
          className={selected === option.id ? "selected" : ""}
          type="button"
          key={option.id}
          onClick={() => choose(optionIndex)}
        ><i>✓</i>{option.text}</button>)}
      </div>
      <div className="context"><span>{scoreLabel}</span><span>{context.preferences?.city}</span><span>Kişiselleştirilmiş yol</span></div>
    </article>
  </section>;
}
