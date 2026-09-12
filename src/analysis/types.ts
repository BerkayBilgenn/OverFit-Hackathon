export type ScoreType = "TYT" | "SAY" | "EA" | "SÖZ" | "DİL";

export type ScoreEntry = {
  score: number;
  rank: number;
};

export type Preferences = {
  city: string;
  move: "yes" | "no";
  targetCities: string;
  universityType: string;
  budget: string;
  language: string;
  scholarship: boolean;
  strict: boolean;
};

export type AnalysisContext = {
  examYear?: number;
  scores?: Partial<Record<ScoreType, ScoreEntry>>;
  primaryField: ScoreType | "GENERAL";
  preferences?: Preferences;
};
