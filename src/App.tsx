import { useState } from "react";
import { AnalysisFlow } from "@/analysis/AnalysisFlow";
import { IntroExperience, type IntroChoice } from "@/intro/IntroExperience";

export default function App() {
  // Giriş akışı: null → intro gösterilir; seçim yapılınca ilgili akışa geçilir.
  const [choice, setChoice] = useState<IntroChoice | null>(null);

  if (choice === null) {
    return <IntroExperience onComplete={setChoice} />;
  }

  return <AnalysisFlow choice={choice} onExit={() => setChoice(null)} />;
}
