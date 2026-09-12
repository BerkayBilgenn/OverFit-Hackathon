/**
 * @overfit/soru-motoru — TypeScript bildirimleri.
 * Motor düz JavaScript'tir; bu dosya onu strict TS projelerinden
 * (Vite + React) tip güvenli kullanabilmek için vardır.
 * Değiştirirsen CONTRACT.md ve tests/api-contract.test.mjs ile hizala.
 */

export type Audience = "score_known" | "score_unknown";
export type OptionId = "a" | "b";
export type Stage = "broad" | "deepen" | "distinguish" | "validate";
export type ScoreType = "TYT" | "SAY" | "EA" | "SÖZ" | "DİL";

export type DimensionId =
  | "insan" | "sistem" | "veri" | "fikir" | "nesne" | "yardim" | "liderlik"
  | "duzen" | "takim" | "hareket" | "belirsiz" | "guvence" | "uzunegitim" | "sorumluluk";

export type Profile = Record<DimensionId, number>;

/**
 * Adayın başarı sıraları. Aday birden çok puan türüne girmiş olabilir ve her
 * program yalnızca kendi puan türüyle tercih edilir.
 * Küçük sayı = daha iyi derece.
 */
export interface Academic {
  ranks?: Partial<Record<ScoreType, number>>;
  /** Tek puan türü için kısa biçim; `ranks` ile aynı anlama gelir. */
  scoreType?: ScoreType;
  rank?: number;
}

export const RANK_YEARS: ReadonlyArray<{ year: number; column: string }>;

export function listGroupPrograms(options: {
  group: ProgramGroup;
  index: unknown;
  academic?: Academic | null;
  filters?: Filters | null;
  limit?: number;
}): GroupProgram[];

export function toRanks(academic: Academic | null): Partial<Record<ScoreType, number>> | null;

/** Tercih koşulları. Hiçbiri zorunlu değil; verilmeyen alan süzmez. */
export interface Filters {
  /** Büyük harfli şehir adları, ör. ["İSTANBUL", "ANKARA"]. */
  cities?: string[];
  universityType?: "DEVLET" | "VAKIF" | "KKTC" | "YURTDIŞI";
  /** "Türkçe" | "İngilizce" | "Almanca" … Eşleşme ön ekle yapılır. */
  language?: string;
  /** Devlet programları ve tam burslu vakıf programları. */
  scholarshipOnly?: boolean;
}

/** Düz JSON. localStorage'a, React state'ine, sunucu oturumuna konabilir. */
export interface SessionState {
  version: number;
  audience: Audience;
  academic: Academic | null;
  filters: Filters | null;
  answers: Array<{ questionId: string; optionId: OptionId }>;
  questionPath: string[];
  currentQuestionId: string | null;
  profile: Profile;
  measured: Profile;
  focus: DimensionId[];
  selection: Selection | null;
  finished: boolean;
}

export interface Selection {
  questionId: string | null;
  stage: Stage;
  step: number;
  fallback: string | null;
  poolSize: number;
  parts: { odak: number; olcumAcigi: number; ayirtEdicilik: number; oncelik: number };
  focus: DimensionId[];
  runnerUp: { id: string; total: number } | null;
  total: number;
  error?: string;
}

export interface CurrentQuestion {
  id: string;
  text: string;
  stage: Stage;
  questionFamily: string;
  /** 1'den başlar. */
  step: number;
  total: number;
  canGoBack: boolean;
  options: Array<{ id: OptionId; text: string }>;
}

export interface Family {
  id: string;
  label: string;
  summary: string;
  /** 0-1 arası kosinüs benzerliği. */
  score: number;
}

export interface Access {
  /** Adayın sırasının bilindiği puan türleri. */
  scoreTypes: ScoreType[];
  userRanks: Partial<Record<ScoreType, number>> | null;
  /** Sıranın yettiği program sayısı. */
  reachable: number;
  /** Taban sırası yayımlanmış program sayısı. */
  withRank: number;
  /** Taban sırası yayımlanmamış program sayısı — 0 değil, bilinmiyor. */
  withoutRank: number;
  /** Tercih koşullarını geçen program sayısı. */
  matching: number;
  /** Adayın puan türüyle (veya TYT ile) tercih edebileceği program sayısı. */
  eligible: number;
  sampled: number;
  filters: Filters | null;
  closest: { rank: number; scoreType: ScoreType; university: string; city: string; code: string } | null;
}

/** Bir bölüm grubundaki gerçek program (üniversite + kontenjan satırı). */
export interface GroupProgram {
  /** ÖSYM program kodu. */
  code: string;
  /** Şehir tekrarı temizlenmiş üniversite adı. */
  university: string;
  city: string;
  level: "LISANS" | "ONLISANS";
  scoreType: ScoreType;
  language: string;
  universityType: string;
  /** "Burslu", "%50 İndirimli"… Devlet programlarında null. */
  scholarship: string | null;
  /** Son üç yılın taban başarı sırası; yayımlanmamışsa null. */
  years: Array<{ year: number; rank: number | null }>;
  currentRank: number | null;
  yearsWithData: number;
  /** Adayın sırasının yettiği yıllar. Sıra girilmediyse boş. */
  reachedYears: number[];
  reachable: boolean;
}

export interface ProgramGroup {
  id: string;
  name: string;
  family: string;
  programCount: number;
  levels: string[];
  scoreTypes: string[];
  rankBand: Record<string, { best: number; median: number; worst: number; withRank: number }>;
  samples: Array<{ rank: number; code: string; university: string; city: string; scoreType: string }>;
  personaScore: number;
  score: number;
  access: Access | null;
  /** Gösterilecek üniversiteler (üniversite başına en seçici program, en fazla 6). */
  programs: GroupProgram[];
}

export interface Results {
  summaryText: string;
  signals: Array<{ dimension: DimensionId; value: number; label: string }>;
  families: Family[];
  allFamilies: Family[];
  groups: ProgramGroup[];
  academic: Academic | null;
  filters: Filters | null;
  /**
   * Profilin işaret ettiği alanların açıldığı ama adayın sırasını girmediği
   * puan türleri. Boş değilse arayüz bunu kullanıcıya söylemeli.
   */
  missingScoreTypes: Array<{ scoreType: ScoreType; programCount: number }>;
  /** Ekranda gösterilmesi gereken dürüstlük uyarıları. */
  warnings: string[];
}

export interface CatalogSummary {
  program_count: number;
  group_count: number;
  duplicate_program_codes: number;
  programs_without_rank: number;
  family_counts: Record<string, number>;
  unmatched_family_count: number;
}

export interface Overfit {
  sessionLength: number;
  stateVersion: number;
  catalogSummary: CatalogSummary;
  source: { archive: string; tables: string[]; binding_source: string; notice: string };
  hasPrograms: boolean;

  start(input: { audience: Audience; academic?: Academic | null; filters?: Filters | null }): SessionState;
  answer(state: SessionState, optionId: OptionId): SessionState;
  back(state: SessionState): SessionState;
  changeAnswer(state: SessionState, index: number, optionId: OptionId): SessionState;
  isFinished(state: SessionState): boolean;

  question(state: SessionState): CurrentQuestion | null;
  results(state: SessionState, options?: { familyLimit?: number; groupLimit?: number }): Results;
  /** Test paneli için. Ürün arayüzünde kullanıcıya gösterilmez. */
  explain(state: SessionState): {
    selection: Selection | null;
    profile: Profile;
    measured: Profile;
    focus: DimensionId[];
    families: Family[];
    groups: ProgramGroup[];
    answerPath: string[];
    options: Array<{ id: OptionId; text: string; scoreEffects: Partial<Profile>; nextFocus: DimensionId[] }>;
  };
  /** Sürüm uymazsa null döner — temiz başlat. */
  restore(saved: unknown): SessionState | null;
}

export function createOverfit(options: {
  data?: { questions: unknown[]; groups: unknown; programs: unknown } | null;
  dataUrl?: string | null;
  withPrograms?: boolean;
  fetchImpl?: typeof fetch;
}): Promise<Overfit>;

export const DIMENSIONS: Record<DimensionId, string>;
export const DIMENSION_IDS: readonly DimensionId[];
export const AUDIENCES: readonly string[];
export const STAGES: readonly Stage[];
export const STAGE_PLAN: readonly Stage[];
export const CAREER_FAMILIES: ReadonlyArray<{
  id: string;
  label: string;
  summary: string;
  weights: Record<DimensionId, number>;
}>;
export const FAMILY_BY_ID: Record<string, (typeof CAREER_FAMILIES)[number]>;
export const SESSION_LENGTH: number;
export const STATE_VERSION: number;
