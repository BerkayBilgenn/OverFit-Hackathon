"""YÖK Atlas ZIP'inden derlenen kompakt katalog için testler."""
import csv
import io
import json
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.build_program_catalog import build_catalog, slugify


PROGRAMS_HEADER = [
    "osym_program_code", "university_name", "faculty_name", "name",
    "program_group_name", "level", "duration_years", "score_type", "language",
    "education_type", "scholarship_rate", "university_type", "city_name",
]
WIDE_HEADER = [
    "osym_program_code", "kontenjan", "yerlesen", "doluluk_orani",
    "taban_puan", "basari_sirasi", "basari_sirasi_gecen_yil",
    "basari_sirasi_2_yil_once", "ogrenim_ucreti",
]

PROGRAM_ROWS = [
    ["100100001", "A ÜNİVERSİTESİ", "MÜH. FAK.", "Bilgisayar Mühendisliği",
     "Bilgisayar Mühendisliği", "LISANS", "4", "SAY", "Türkçe",
     "Örgün Öğretim", "", "DEVLET", "ANKARA"],
    ["100100002", "B ÜNİVERSİTESİ", "MÜH. FAK.", "Bilgisayar Mühendisliği (İngilizce)",
     "Bilgisayar Mühendisliği", "LISANS", "4", "SAY", "İngilizce",
     "Örgün Öğretim", "%50", "VAKIF", "İSTANBUL"],
    ["200100003", "C ÜNİVERSİTESİ", "MYO", "Çocuk Gelişimi",
     "Çocuk Gelişimi", "ONLISANS", "2", "TYT", "Türkçe",
     "Örgün Öğretim", "", "DEVLET", "İZMİR"],
]
WIDE_ROWS = [
    ["100100001", "80", "80", "1.0", "480.5", "12000.0", "13500.0", "14100.0", ""],
    ["100100002", "40", "40", "1.0", "455.1", "38000.0", "", "", "250000"],
    # yerleşen yok: 2026 sırası yayımlanmamış
    ["200100003", "50", "0", "0.0", "", "", "", "", ""],
]


def make_fixture_zip(directory: Path) -> Path:
    archive = directory / "fixture.zip"
    with zipfile.ZipFile(archive, "w") as zf:
        for name, header, rows in (
            ("csv/programs.csv", PROGRAMS_HEADER, PROGRAM_ROWS),
            ("csv/programs_wide.csv", WIDE_HEADER, WIDE_ROWS),
        ):
            buffer = io.StringIO()
            writer = csv.writer(buffer)
            writer.writerow(header)
            writer.writerows(rows)
            zf.writestr(name, buffer.getvalue())
    return archive


class SlugifyTests(unittest.TestCase):
    def test_turkish_characters_are_transliterated(self):
        self.assertEqual(slugify("Bilgisayar Mühendisliği"), "bilgisayar-muhendisligi")
        self.assertEqual(slugify("İlk ve Acil Yardım"), "ilk-ve-acil-yardim")
        self.assertEqual(slugify("Çocuk Gelişimi"), "cocuk-gelisimi")

    def test_slugs_stay_unique_for_distinct_names(self):
        self.assertNotEqual(slugify("Fizyoterapi"), slugify("Fizyoterapi ve Rehabilitasyon"))


class BuildCatalogTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.result = build_catalog(make_fixture_zip(Path(self._tmp.name)))

    def tearDown(self):
        self._tmp.cleanup()

    def test_summary_counts_match_source_rows(self):
        summary = self.result["summary"]
        self.assertEqual(summary["program_count"], 3)
        self.assertEqual(summary["group_count"], 2)
        self.assertEqual(summary["duplicate_program_codes"], 0)

    def test_groups_are_ordered_by_program_count_then_name(self):
        ids = [group["id"] for group in self.result["groups"]]
        self.assertEqual(ids, ["bilgisayar-muhendisligi", "cocuk-gelisimi"])

    def test_group_aggregates_programs(self):
        group = self.result["groups"][0]
        self.assertEqual(group["name"], "Bilgisayar Mühendisliği")
        self.assertEqual(group["programCount"], 2)
        self.assertEqual(group["scoreTypes"], ["SAY"])
        self.assertEqual(group["levels"], ["LISANS"])
        self.assertEqual(sorted(group["cities"]), ["ANKARA", "İSTANBUL"])

    def test_group_rank_band_uses_published_ranks_only(self):
        group = self.result["groups"][0]
        self.assertEqual(group["rankBand"]["SAY"]["best"], 12000)
        self.assertEqual(group["rankBand"]["SAY"]["worst"], 38000)
        self.assertEqual(group["rankBand"]["SAY"]["withRank"], 2)

    def test_missing_rank_is_null_not_zero(self):
        group = self.result["groups"][1]
        self.assertEqual(group["rankBand"], {})
        self.assertEqual(group["programsWithoutRank"], 1)

    def test_every_group_carries_a_career_family(self):
        families = {group["id"]: group["family"] for group in self.result["groups"]}
        self.assertEqual(families["bilgisayar-muhendisligi"], "yazilim_veri")
        self.assertEqual(families["cocuk-gelisimi"], "egitim_ogretmenlik")

    def test_programs_table_is_columnar_and_rank_typed(self):
        table = self.result["programs"]
        self.assertEqual(table["columns"][0], "code")
        self.assertEqual(len(table["rows"]), 3)
        by_code = {row[0]: row for row in table["rows"]}
        rank_index = table["columns"].index("rank")
        self.assertEqual(by_code["100100001"][rank_index], 12000)
        self.assertIsNone(by_code["200100003"][rank_index], "yayımlanmamış sıra None kalmalı")

    def test_output_is_json_serialisable_and_deterministic(self):
        first = json.dumps(self.result, ensure_ascii=False, sort_keys=True)
        with tempfile.TemporaryDirectory() as directory:
            second_result = build_catalog(make_fixture_zip(Path(directory)))
        second = json.dumps(second_result, ensure_ascii=False, sort_keys=True)
        self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()


class ClassifyTests(unittest.TestCase):
    def test_keywords_match_on_word_boundaries(self):
        from scripts.career_families import classify, normalize
        # "astronomi" anahtarı "gastronomi" içinde eşleşmemeli
        self.assertEqual(classify(normalize("Gastronomi ve Mutfak Sanatları")), "turizm_hizmet")
        self.assertEqual(classify(normalize("Astronomi ve Uzay Bilimleri")), "temel_bilim_arastirma")

    def test_more_specific_family_wins_over_generic_one(self):
        from scripts.career_families import classify, normalize
        self.assertEqual(classify(normalize("Turizm ve Otel İşletmeciliği")), "turizm_hizmet")
        self.assertEqual(classify(normalize("Bilgisayar Mühendisliği")), "yazilim_veri")
        self.assertEqual(classify(normalize("Çevre Mühendisliği")), "tarim_gida_cevre")
