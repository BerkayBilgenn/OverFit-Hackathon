#!/usr/bin/env python3
"""YÖK Atlas 2026 CSV ZIP'ini tarayıcıya sığan kompakt kataloğa indirger.

Kullanım:
    python3 scripts/build_program_catalog.py <yokatlas-csv.zip> <cikti-dizini>

Üretilenler:
    data/program-groups.json   634 bölüm grubu + kariyer ailesi + sıra bandı
    data/programs.min.json     21.493 program, sütunlu (kolon adı + satır dizisi)

İlke: EKSİK DEĞER TAHMİN EDİLMEZ. Yayımlanmamış taban puan/başarı sırası
None kalır; asla 0 veya ortalama ile doldurulmaz.
"""
from __future__ import annotations

import csv
import json
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.career_families import classify, normalize

csv.field_size_limit(10_000_000)

PROGRAM_COLUMNS = [
    "code", "group", "uni", "city", "level", "scoreType", "lang",
    "uniType", "burs", "quota", "placed", "rank", "score", "rankPrev",
]


def slugify(text: str) -> str:
    ascii_text = normalize(text)
    kept = [ch if ch.isalnum() else "-" for ch in ascii_text]
    slug = "".join(kept)
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-")


def _read_csv(archive: zipfile.ZipFile, name: str) -> list[dict]:
    with archive.open(name) as handle:
        text = handle.read().decode("utf-8")
    return list(csv.DictReader(text.splitlines()))


def _number(raw: str):
    """Boş hücre -> None. 'Yayımlanmamış' ile 'sıfır' asla karıştırılmaz."""
    raw = (raw or "").strip()
    if not raw:
        return None
    try:
        value = float(raw)
    except ValueError:
        return None
    return int(value) if value.is_integer() else round(value, 3)


def _median(values: list[int]) -> int:
    ordered = sorted(values)
    middle = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[middle]
    return (ordered[middle - 1] + ordered[middle]) // 2


def build_catalog(zip_path: Path) -> dict:
    zip_path = Path(zip_path)
    with zipfile.ZipFile(zip_path) as archive:
        programs = _read_csv(archive, "csv/programs.csv")
        wide_rows = _read_csv(archive, "csv/programs_wide.csv")

    wide = {row["osym_program_code"]: row for row in wide_rows}

    seen_codes: set[str] = set()
    duplicates = 0
    rows: list[list] = []
    groups: dict[str, dict] = {}

    for program in programs:
        code = program["osym_program_code"]
        if code in seen_codes:
            duplicates += 1
            continue
        seen_codes.add(code)

        group_name = (program.get("program_group_name") or "").strip()
        if not group_name:
            group_name = (program.get("name") or "").strip()
        group_id = slugify(group_name)
        extra = wide.get(code, {})

        rank = _number(extra.get("basari_sirasi", ""))
        row = [
            code,
            group_id,
            program["university_name"],
            program.get("city_name", ""),
            program["level"],
            program.get("score_type", ""),
            program.get("language", ""),
            program.get("university_type", ""),
            program.get("scholarship_rate", ""),
            _number(extra.get("kontenjan", "")),
            _number(extra.get("yerlesen", "")),
            rank,
            _number(extra.get("taban_puan", "")),
            _number(extra.get("basari_sirasi_gecen_yil", "")),
        ]
        rows.append(row)

        group = groups.setdefault(group_id, {
            "id": group_id,
            "name": group_name,
            "normalized": normalize(group_name),
            "programCount": 0,
            "programsWithoutRank": 0,
            "levels": set(),
            "scoreTypes": set(),
            "cities": set(),
            "universityTypes": set(),
            "_ranks": {},
            "_samples": [],
        })
        group["programCount"] += 1
        group["levels"].add(program["level"])
        score_type = program.get("score_type", "") or "?"
        group["scoreTypes"].add(score_type)
        if program.get("city_name"):
            group["cities"].add(program["city_name"])
        group["universityTypes"].add(program.get("university_type", ""))
        if rank is None:
            group["programsWithoutRank"] += 1
        else:
            group["_ranks"].setdefault(score_type, []).append(rank)
            group["_samples"].append((rank, code, program["university_name"],
                                      program.get("city_name", ""), score_type))

    ordered = sorted(groups.values(), key=lambda g: (-g["programCount"], g["name"]))
    family_counts: dict[str, int] = {}
    output_groups = []
    for group in ordered:
        family = classify(group["normalized"])
        family_counts[family] = family_counts.get(family, 0) + 1

        rank_band = {}
        for score_type, ranks in sorted(group["_ranks"].items()):
            rank_band[score_type] = {
                "best": min(ranks),
                "median": _median(ranks),
                "worst": max(ranks),
                "withRank": len(ranks),
            }

        samples = sorted(group["_samples"])
        if len(samples) > 5:
            step = (len(samples) - 1) / 4
            samples = [samples[round(index * step)] for index in range(5)]
        output_groups.append({
            "id": group["id"],
            "name": group["name"],
            "family": family,
            "programCount": group["programCount"],
            "programsWithoutRank": group["programsWithoutRank"],
            "levels": sorted(group["levels"]),
            "scoreTypes": sorted(group["scoreTypes"]),
            "cities": sorted(group["cities"]),
            "universityTypes": sorted(t for t in group["universityTypes"] if t),
            "rankBand": rank_band,
            "samples": [
                {"rank": rank, "code": code, "university": uni,
                 "city": city, "scoreType": score_type}
                for rank, code, uni, city, score_type in samples
            ],
        })

    without_rank = sum(1 for row in rows if row[PROGRAM_COLUMNS.index("rank")] is None)
    return {
        "source": {
            "archive": zip_path.name,
            "tables": ["csv/programs.csv", "csv/programs_wide.csv"],
            "binding_source": "ÖSYM 2026 Yükseköğretim Programları ve Kontenjanları Kılavuzu",
            "notice": "Nihai kontrolünüzü ÖSYM'nin güncel kılavuzundan yapın.",
        },
        "summary": {
            "program_count": len(rows),
            "group_count": len(output_groups),
            "duplicate_program_codes": duplicates,
            "programs_without_rank": without_rank,
            "family_counts": dict(sorted(family_counts.items())),
            "unmatched_family_count": family_counts.get("other", 0),
        },
        "groups": output_groups,
        "programs": {"columns": PROGRAM_COLUMNS, "rows": rows},
    }


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print(__doc__)
        return 2
    catalog = build_catalog(Path(argv[1]))
    out_dir = Path(argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)

    programs = catalog.pop("programs")
    (out_dir / "program-groups.json").write_text(
        json.dumps(catalog, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (out_dir / "programs.min.json").write_text(
        json.dumps(programs, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    print(json.dumps(catalog["summary"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
