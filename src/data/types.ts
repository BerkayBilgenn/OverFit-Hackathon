/** Kişilik/değer testinden çıkan profil */
export interface UserProfile {
  id: string;
  name: string;
  description: string;
  initials: string;
  traits?: string[];
}

/** Kullanıcının seçtiği bölüm/üniversite/şehir */
export interface UserSelection {
  department: string;
  university: string;
  city: string;
}

/** Tek bir tahmin metriği — YÖK/TÜİK entegrasyonunda kaynak alanları eklenebilir */
export interface PredictionMetric {
  id: string;
  label: string;
  value: string;
  unit?: string;
  disclaimer: string;
  dataSource?: "mock" | "yok" | "tuik" | "merged";
}

export interface CareerPrediction {
  metrics: PredictionMetric[];
}

/** Timeline seçeneği */
export interface TimelineChoice {
  id: string;
  label: string;
  description: string;
}

export type TimelineNodeStatus = "past" | "current" | "future";

/** Zaman çizelgesi noktası */
export interface TimelineNode {
  id: string;
  phase: string;
  title: string;
  description: string;
  status: TimelineNodeStatus;
  interactive: boolean;
  choices?: TimelineChoice[];
}

/** Seçime göre timeline dallanması */
export interface TimelineBranch {
  fromNodeId: string;
  choiceId: string;
  nextNodeIds: string[];
}

export interface TimelineData {
  initialNodeIds: string[];
  nodes: Record<string, TimelineNode>;
  branches: TimelineBranch[];
}

/** Sosyal karşılaştırma istatistiği */
export interface SocialComparisonStat {
  id: string;
  text: string;
  percentage: number;
}

export interface SocialComparison {
  stats: SocialComparisonStat[];
  sampleSize: number;
  profileMatchDescription: string;
}

/** "Ne olurdu?" senaryo kartı */
export interface WhatIfScenario {
  id: string;
  department: string;
  university: string;
  city: string;
  salaryRange: string;
  employmentProbability: number;
  jobSearchMonths: string;
  summary: string;
}

export interface WhatIfComparison {
  current: WhatIfScenario;
  alternative: WhatIfScenario;
}

/** Sonuç ekranının tam veri modeli — API yanıtı olarak genişletilebilir */
export interface SimulationResult {
  profile: UserProfile;
  selection: UserSelection;
  prediction: CareerPrediction;
  timeline: TimelineData;
  socialComparison: SocialComparison;
  whatIf: WhatIfComparison;
  meta?: {
    version: string;
    generatedAt: string;
  };
}
