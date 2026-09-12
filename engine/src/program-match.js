/**
 * Persona sonucunu gerçek YÖK Atlas bölüm gruplarına bağlar.
 *
 * İki skor AYRI tutulur ve arayüzde ayrı gösterilir:
 *   personaScore  — cevaplardan gelen uyum (editoryal ağırlıklara dayanır)
 *   erisim        — kullanıcının başarı sırasıyla ulaşabildiği program sayısı (veriden gelir)
 *
 * Başarı sırası verilmediyse erişim hesaplanmaz; uydurma değer üretilmez.
 */

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
  const familyScore = Object.fromEntries(familyRanking.map((family) => [family.id, family.score]));
  const maxCount = Math.max(...groups.map((group) => group.programCount));

  const scored = groups.map((group) => {
    const persona = familyScore[group.family] ?? 0;
    // Çok az programı olan gruplar sonuç ekranında kullanıcıya yardımcı olmuyor;
    // yaygınlık küçük ve şeffaf bir ağırlık olarak eklenir, sıralamayı ele geçirmez.
    const availability = Math.log10(1 + group.programCount) / Math.log10(1 + maxCount);
    const access = academic || filters ? accessFor(group, index, academic, filters) : null;

    let score = persona + 0.12 * availability;
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

  // Aynı aileden beş grup göstermek kullanıcıya seçenek sunmuyor; aile başına
  // tavan koyup kalan yerleri sıradan doldururuz.
  const perFamily = new Map();
  const picked = [];
  for (const group of scored) {
    if (picked.length >= limit) break;
    const used = perFamily.get(group.family) ?? 0;
    if (used >= maxPerFamily) continue;
    perFamily.set(group.family, used + 1);
    picked.push(group);
  }
  for (const group of scored) {
    if (picked.length >= limit) break;
    if (!picked.includes(group)) picked.push(group);
  }
  return picked;
}

function accessFor(group, index, academic, filters) {
  const rows = index.byGroup.get(group.id) ?? [];
  const { columns } = index;
  let reachable = 0;
  let withRank = 0;
  let withoutRank = 0;
  let matching = 0;
  let closest = null;

  for (const row of rows) {
    if (!matchesFilters(row, columns, filters)) continue;
    matching += 1;
    if (!academic || row[columns.scoreType] !== academic.scoreType) continue;
    const rank = row[columns.rank];
    if (rank === null || rank === undefined) {
      withoutRank += 1;
      continue;
    }
    withRank += 1;
    if (rank >= academic.rank) {
      reachable += 1;
      if (closest === null || rank < closest.rank) {
        closest = { rank, university: row[columns.uni], city: row[columns.city], code: row[columns.code] };
      }
    }
  }

  return {
    scoreType: academic?.scoreType ?? null,
    userRank: academic?.rank ?? null,
    reachable,
    withRank,
    withoutRank,
    matching,
    sampled: rows.length,
    filters,
    closest,
  };
}
