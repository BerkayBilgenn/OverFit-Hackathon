/**
 * Veri yükleme. Tek bir göreli yol varsayımı yok: paketi kullanan uygulama
 * ya bir taban URL verir (tarayıcıda fetch), ya da JSON'ları kendisi import
 * edip doğrudan geçer (bundler ile).
 */
const FILES = {
  questions: "questions.tr.json",
  groups: "program-groups.json",
  programs: "programs.min.json",
};

/**
 * @param {object} options
 * @param {string} options.dataUrl  data/ klasörünün servis edildiği taban yol, ör. "/overfit-data"
 * @param {boolean} [options.withPrograms=true]  3,2 MB'lık program tablosu gerekli mi
 * @param {typeof fetch} [options.fetchImpl]
 */
export async function fetchData({ dataUrl, withPrograms = true, fetchImpl = globalThis.fetch }) {
  if (!dataUrl) throw new Error("dataUrl gerekli (ya da data'yı doğrudan geçin)");
  const base = dataUrl.endsWith("/") ? dataUrl : `${dataUrl}/`;
  const get = async (name) => {
    const response = await fetchImpl(base + name);
    if (!response.ok) throw new Error(`Veri yüklenemedi: ${base}${name} (${response.status})`);
    return response.json();
  };
  const [questions, groups, programs] = await Promise.all([
    get(FILES.questions),
    get(FILES.groups),
    withPrograms ? get(FILES.programs) : Promise.resolve(null),
  ]);
  return { questions, groups, programs };
}

export const DATA_FILES = FILES;
