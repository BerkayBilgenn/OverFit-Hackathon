/**
 * @overfit/soru-motoru — genel API.
 *
 * UI tarafı normalde yalnızca createOverfit'e ihtiyaç duyar.
 * Alt modüller, motoru parçalı kullanmak isteyenler için açık bırakıldı.
 */
export { createOverfit } from "./src/overfit.js";
export { fetchData, DATA_FILES } from "./src/data-loader.js";

export { createEngine, SESSION_LENGTH, STATE_VERSION, topSignals } from "./src/question-engine.js";
export { indexPrograms, rankProgramGroups, listGroupPrograms, isReachable, toRanks, RANK_YEARS } from "./src/program-match.js";
export { CAREER_FAMILIES, FAMILY_BY_ID } from "./src/career-families.js";
export { DIMENSIONS, DIMENSION_IDS, AUDIENCES, STAGES, STAGE_PLAN } from "./src/dimensions.js";
