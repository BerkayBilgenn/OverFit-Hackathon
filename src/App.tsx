import { useState } from "react";
import { FlowPlaceholder } from "@/components/FlowPlaceholder";
import { IntroExperience, type IntroChoice } from "@/intro/IntroExperience";

export default function App() {
  // Giriş akışı: null → intro gösterilir; seçim yapılınca ilgili akışa geçilir.
  const [choice, setChoice] = useState<IntroChoice | null>(null);

  if (choice === null) {
    return <IntroExperience onComplete={setChoice} />;
  }

  // TODO: Arkadaşının yaptığı tercih formu / sonuç paneli buraya entegre
  // edilecek. choice değeri ("withScore" | "withoutScore") forma parametre
  // olarak geçilecek. Mevcut dashboard bileşenleri src/components altında hazır.
  return <FlowPlaceholder choice={choice} onBack={() => setChoice(null)} />;
}
