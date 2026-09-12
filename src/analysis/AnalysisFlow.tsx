import type { IntroChoice } from "@/intro/IntroExperience";
import { YksKnownFlow } from "./YksKnownFlow";
import { YksUnknownFlow } from "./YksUnknownFlow";
import "./analysis.css";

type AnalysisFlowProps = {
  choice: IntroChoice;
  onExit: () => void;
};

export function AnalysisFlow({ choice, onExit }: AnalysisFlowProps) {
  return <main className="analysis-shell">
    <header className="analysis-topbar">
      <button type="button" className="analysis-brand" onClick={onExit} aria-label="Pusula yol ayrımına dön"><img src="/pusula-logo.svg" alt="Pusula" /></button>
      <div className="analysis-mode"><span>{choice === "withScore" ? "YKS puanım var" : "YKS puanım yok"}</span><small>Kişisel tercih analizi</small></div>
    </header>
    {choice === "withScore" ? <YksKnownFlow onExit={onExit} /> : <YksUnknownFlow onExit={onExit} />}
  </main>;
}
