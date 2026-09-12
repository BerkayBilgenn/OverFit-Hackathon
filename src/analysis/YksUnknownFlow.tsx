import { useState } from "react";
import { AdaptiveQuiz, type AnalysisResult } from "./components/AdaptiveQuiz";
import { PreferenceForm } from "./components/PreferenceForm";
import { ResultDashboard } from "./components/ResultDashboard";
import type { AnalysisContext } from "./types";

type Stage = "preferences" | "quiz" | "result";

export function YksUnknownFlow({ onExit }: { onExit: () => void }) {
  const [stage, setStage] = useState<Stage>("preferences");
  const [context, setContext] = useState<AnalysisContext>({ primaryField: "GENERAL" });
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const restart = () => {
    setContext({ primaryField: "GENERAL" });
    setAnalysis(null);
    setStage("preferences");
  };

  if (stage === "preferences") {
    return <PreferenceForm mode="unknown" step="1 / 2" onBack={onExit} onComplete={(preferences) => { setContext({ primaryField: "GENERAL", preferences }); setStage("quiz"); }} />;
  }
  if (stage === "quiz") {
    return <AdaptiveQuiz mode="score_unknown" context={context} initialAnalysis={analysis} onBack={() => setStage("preferences")} onComplete={(result) => { setAnalysis(result); setStage("result"); }} />;
  }
  if (!analysis) return null;
  return <ResultDashboard mode="score_unknown" context={context} analysis={analysis} onRestart={restart} onReview={() => setStage("quiz")} />;
}
