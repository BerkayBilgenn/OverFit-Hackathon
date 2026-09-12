import { useState } from "react";
import { AdaptiveQuiz, type AnalysisResult } from "./components/AdaptiveQuiz";
import { AnalyzingScreen } from "./components/AnalyzingScreen";
import { PreferenceForm } from "./components/PreferenceForm";
import { ResultDashboard } from "./components/ResultDashboard";
import { ScoreForm } from "./components/ScoreForm";
import type { AnalysisContext } from "./types";

type Stage = "score" | "preferences" | "quiz" | "analyzing" | "result";

export function YksKnownFlow({ onExit }: { onExit: () => void }) {
  const [stage, setStage] = useState<Stage>("score");
  const [context, setContext] = useState<AnalysisContext | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const restart = () => {
    setContext(null);
    setAnalysis(null);
    setStage("score");
  };

  if (stage === "score" || !context) {
    return <ScoreForm onExit={onExit} onComplete={(scoreContext) => { setContext(scoreContext); setStage("preferences"); }} />;
  }
  if (stage === "preferences") {
    return <PreferenceForm mode="known" step="2 / 3" onBack={() => setStage("score")} onComplete={(preferences) => { setContext((current) => current ? { ...current, preferences } : current); setStage("quiz"); }} />;
  }
  if (stage === "quiz") {
    return <AdaptiveQuiz mode="score_known" context={context} initialAnalysis={analysis} onBack={() => setStage("preferences")} onComplete={(result) => { setAnalysis(result); setStage("analyzing"); }} />;
  }
  if (stage === "analyzing") {
    return <AnalyzingScreen onDone={() => setStage("result")} />;
  }
  if (!analysis) return null;
  return <ResultDashboard mode="score_known" context={context} analysis={analysis} onRestart={restart} onReview={() => setStage("quiz")} />;
}
