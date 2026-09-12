/**
 * Persona sonucunu gerçek YÖK Atlas bölüm gruplarına bağlar.
 *
 * İki skor AYRI tutulur ve arayüzde ayrı gösterilir:
 *   personaScore  — cevaplardan gelen uyum (editoryal ağırlıklara dayanır)
 *   erisim        — kullanıcının başarı sırasıyla ulaşabildiği program sayısı (veriden gelir)
 *
 * Başarı sırası verilmediyse erişim hesaplanmaz; uydurma değer üretilmez.
 */

/**
 * Adayın girdiği sıraları tek biçime indirir.
 * Aday birden çok puan türüne girmiş olabilir (TYT + SAY gibi) ve her program
 * yalnızca kendi puan türüyle tercih edilir — bu yüzden tek sıra yetmez.
 */
export function toRanks(academic) {
  if (!academic) return null;
  if (academic.ranks) return academic.ranks;
  if (academic.scoreType && Number.isFinite(academic.rank)) return { [academic.scoreType]: academic.rank };
  return null;
}

/** Küçük sıra = daha iyi. Programın taban sırası kullanıcınınkine eşit veya büyükse erişilebilir. */
export function isReachable(programRank, userRank) {
  if (programRank === null || programRank === undefined) return null; // yayımlanmamış
  return programRank >= userRank;
}

export function indexPrograms(programsTable) {
  const columns = Object.fromEntries(programsTable.columns.map((name, index) => [name, index]));
  const byGroup = new Map();
  for (const row of programsTable.rows) {
    const group = row[columns.group];
    if (!byGroup.has(group)) byGroup.set(group, []);
    byGroup.get(group).push(row);
  }
  return { columns, byGroup };
}

/**
 * Kullanıcının tercih koşulları. Hepsi isteğe bağlı; verilmeyen alan süzmez.
 * Koşullar bir grubu ASLA listeden atmaz, yalnızca sıralamada geriye iter —
 * tek bir tercih hiçbir bölümü kalıcı olarak elemez.
 */
function matchesFilters(row, columns, filters) {
  if (!filters) return true;
  if (filters.cities?.length && !filters.cities.includes(row[columns.city])) return false;
  if (filters.universityType && row[columns.uniType] !== filters.universityType) return false;
  if (filters.language) {
    const language = row[columns.lang] ?? "";
    // Türkçe programların bir kısmında dil alanı boş bırakılmış (kaynak eksiği).
    const ok = filters.language === "Türkçe"
      ? language === "Türkçe" || language === ""
      : language.startsWith(filters.language);
    if (!ok) return false;
  }
  if (filters.scholarshipOnly) {
    // Devlet programlarında öğrenim ücreti yok; tam burslu vakıf programları da sayılır.
    const free = row[columns.uniType] === "DEVLET" || row[columns.burs] === "Burslu";
    if (!free) return false;
  }
  return true;
}

export function rankProgramGroups({ familyRanking, groups, index, academic = null, filters = null, limit = 6, maxPerFamily = 2 }) {
  const ranks = toRanks(academic);
  const familyScore = Object.fromEntries(familyRanking.map((family) => [family.id, family.score]));
  const maxCount = Math.max(...groups.map((group) => group.programCount));

  const scored = groups.map((group) => {
    const persona = familyScore[group.family] ?? 0;
    // Çok az programı olan gruplar sonuç ekranında kullanıcıya yardımcı olmuyor;
    // yaygınlık küçük ve şeffaf bir ağırlık olarak eklenir, sıralamayı ele geçirmez.
    const availability = Math.log10(1 + group.programCount) / Math.log10(1 + maxCount);
    const access = ranks || filters ? accessFor(group, index, ranks, filters) : null;

    let score = persona + 0.12 * availability;
    // Kullanıcının girdiği puan türüyle hiç tercih edilemeyen grup, kişilik uyumu
    // ne olursa olsun öne çıkmamalı. Yine de listeden silinmez: TYT sırası ya da
    // gelecek yıl farklı bir puan türü her şeyi değiştirebilir.
    if (access && ranks && access.eligible === 0) score -= 0.5;
    if (access && access.reachable === 0 && access.withRank > 0) score -= 0.25;
    if (access && filters && access.matching === 0) score -= 0.4;

    return {
      id: group.id,
      name: group.name,
      family: group.family,
      programCount: group.programCount,
      levels: group.levels,
      scoreTypes: group.scoreTypes,
      rankBand: group.rankBand,
      samples: group.samples,
      personaScore: Number(persona.toFixed(4)),
      score: Number(score.toFixed(4)),
      access,
    };
  });

  scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  // Adayın puan türüyle tercih edilebilenler her zaman önce gelir; aile
  // çeşitliliği bunun önüne geçemez. Uygun olmayanlar listeden silinmez,
  // yalnızca sonrasına eklenir.
  const uygun = ranks ? scored.filter((group) => (group.access?.eligible ?? 1) > 0) : scored;
  const digerleri = ranks ? scored.filter((group) => (group.access?.eligible ?? 1) === 0) : [];

  const perFamily = new Map();
  const picked = [];
  const ekle = (group) => {
    if (picked.length >= limit || picked.includes(group)) return;
    picked.push(group);
  };

  // 1) Uygun gruplar, aile başına tavanla (çeşitlilik)
  for (const group of uygun) {
    if (picked.length >= limit) break;
    const used = perFamily.get(group.family) ?? 0;
    if (used >= maxPerFamily) continue;
    perFamily.set(group.family, used + 1);
    picked.push(group);
  }
  // 2) Yer kaldıysa kalan uygun gruplar, 3) en son uygun olmayanlar
  for (const group of uygun) ekle(group);
  for (const group of digerleri) ekle(group);
  return picked;
}

function accessFor(group, index, ranks, filters) {
  const rows = index.byGroup.get(group.id) ?? [];
  const { columns } = index;
  let reachable = 0;
  let withRank = 0;
  let withoutRank = 0;
  let matching = 0;
  let eligible = 0;
  let closest = null;

  for (const row of rows) {
    if (!matchesFilters(row, columns, filters)) continue;
    matching += 1;
    const rowScoreType = row[columns.scoreType];
    // Program yalnızca kendi puan türüyle tercih edilir; adayın o türde
    // sırası yoksa erişim hesaplanamaz — "giremez" demek değildir.
    const userRank = ranks ? ranks[rowScoreType] : undefined;
    if (userRank === undefined) continue;
    eligible += 1;

    const rank = row[columns.rank];
    if (rank === null || rank === undefined) {
      withoutRank += 1;
      continue;
    }
    withRank += 1;
    if (rank >= userRank) {
      reachable += 1;
      if (closest === null || rank < closest.rank) {
        closest = {
          rank, scoreType: rowScoreType,
          university: row[columns.uni], city: row[columns.city], code: row[columns.code],
        };
      }
    }
  }

  return {
    scoreTypes: ranks ? Object.keys(ranks) : [],
    userRanks: ranks,
    reachable,
    withRank,
    withoutRank,
    matching,
    eligible,
    sampled: rows.length,
    filters,
    closest,
  };
}
