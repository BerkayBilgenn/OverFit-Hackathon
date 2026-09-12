import { useMemo, useState } from "react";
import {
  QUESTION_POOL,
  scoreAnswers,
  selectNextQuestion,
  type DimensionScores,
  type Question,
} from "../data/questionPool";
import type { AnalysisContext } from "../types";

export type AnalysisResult = {
  scores: DimensionScores;
  questions: Question[];
  answers: Array<number | undefined>;
};

type AdaptiveQuizProps = {
  mode: "score_known" | "score_unknown";
  context: AnalysisContext;
  initialAnalysis: AnalysisResult | null;
  onBack: () => void;
  onComplete: (result: AnalysisResult) => void;
};

export function AdaptiveQuiz({ mode, context, initialAnalysis, onBack, onComplete }: AdaptiveQuizProps) {
  const first = useMemo(() => QUESTION_POOL.find((item) => item.id === "focus")!, []);
  const [questions, setQuestions] = useState<Question[]>(() => initialAnalysis?.questions ?? [first]);
  const [answers, setAnswers] = useState<Array<number | undefined>>(() => initialAnalysis?.answers ?? []);
  const [index, setIndex] = useState(0);
  const current = questions[index] ?? first;

  const choose = (optionIndex: number) => {
    let nextAnswers = [...answers];
    let nextQuestions = [...questions];
    const changed = nextAnswers[index] !== undefined && nextAnswers[index] !== optionIndex;
    nextAnswers[index] = optionIndex;

    if (changed) {
      nextAnswers = nextAnswers.slice(0, index + 1);
      nextQuestions = nextQuestions.slice(0, index + 1);
    }
    if (index === 9) {
      onComplete({ scores: scoreAnswers(nextQuestions, nextAnswers), questions: nextQuestions, answers: nextAnswers });
      return;
    }
    if (!nextQuestions[index + 1]) {
      const nextQuestion = selectNextQuestion({ mode, questions: nextQuestions, answers: nextAnswers });
      if (!nextQuestion) return;
      nextQuestions.push(nextQuestion);
    }
    setAnswers(nextAnswers);
    setQuestions(nextQuestions);
    setIndex(index + 1);
  };

  const scoreLabel = context.scores ? Object.keys(context.scores).join(" + ") : "Puan gerekmiyor";

  return <section className="analysis-page compact-page">
    <div className="flow-head"><button type="button" onClick={() => index ? setIndex(index - 1) : onBack()}>← Geri</button><span>{index + 1} / 10</span></div>
    <article className="analysis-card quiz-card">
      <div className="progress"><i style={{ width: `${(index + 1) * 10}%` }} /></div>
      <div className="eyebrow">ADAPTİF YÖNELİM ANALİZİ</div>
      <h1>{current.text}</h1>
      <p className="quiz-help">Sana daha yakın olan seçeneği işaretle; doğru veya yanlış cevap yok.</p>
      <div className="answers">
        {current.options.map((option, optionIndex) => <button className={answers[index] === optionIndex ? "selected" : ""} type="button" key={option[0]} onClick={() => choose(optionIndex)}><i>✓</i>{option[0]}</button>)}
      </div>
      <div className="context"><span>{scoreLabel}</span><span>{context.preferences?.city}</span><span>Kişiselleştirilmiş yol</span></div>
    </article>
  </section>;
}
