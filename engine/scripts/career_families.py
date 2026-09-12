"""634 YÖK Atlas program grubunu 15 kariyer ailesine eşleyen sıralı kural tablosu.

Bu dosya VERİ DEĞİL, EDİTORYAL KARARDIR. YÖK Atlas 2026'da Meslek Atlası'nı
kaldırdığı için program grubu -> meslek alanı eşlemesinin kamuya açık bir
kaynağı yok. Kurallar sırayla denenir, ilk eşleşen kazanır; hiçbiri tutmazsa
grup "other" olarak işaretlenir ve kalite raporunda görünür.
"""

import re

_TR_MAP = str.maketrans({
    "ç": "c", "Ç": "c", "ğ": "g", "Ğ": "g", "ı": "i", "I": "i", "İ": "i",
    "ö": "o", "Ö": "o", "ş": "s", "Ş": "s", "ü": "u", "Ü": "u", "â": "a",
    "î": "i", "û": "u", "Â": "a", "Î": "i", "Û": "u",
})


def normalize(text: str) -> str:
    """Türkçe metni ASCII küçük harfe indirger (eşleme ve slug için)."""
    return " ".join(text.translate(_TR_MAP).lower().split())


FAMILY_IDS = (
    "saglik_klinik",
    "yazilim_veri",
    "muhendislik_teknoloji",
    "mimarlik_planlama",
    "temel_bilim_arastirma",
    "isletme_finans",
    "hukuk_kamu",
    "egitim_ogretmenlik",
    "sosyal_psikoloji",
    "medya_iletisim",
    "tasarim_sanat",
    "turizm_hizmet",
    "tarim_gida_cevre",
    "uygulamali_teknik",
    "dil_kulturel",
)

# Tek tek adlandırılmış istisnalar. Anahtar kelime kuralından ÖNCE denenir.
# Anahtarlar okunabilirlik için Türkçe yazılır, yüklenirken normalize edilir.
_OVERRIDES_TR = {
    "Çocuk Gelişimi": "egitim_ogretmenlik",
    "Sosyal Hizmet": "sosyal_psikoloji",
    "İstatistik": "yazilim_veri",
    "Aktüerya Bilimleri": "isletme_finans",
    "Halkla İlişkiler ve Tanıtım": "medya_iletisim",
    "Spor Yöneticiliği": "isletme_finans",
    "Rekreasyon": "turizm_hizmet",
    "İş Sağlığı ve Güvenliği": "uygulamali_teknik",
    "Acil Durum ve Afet Yönetimi": "saglik_klinik",
    "Veterinerlik": "tarim_gida_cevre",
    "Peyzaj Mimarlığı": "tarim_gida_cevre",
    # 2026-09-12 denetiminde "other" kalan 51 grubun elle etiketlenmesi.
    "Eczane Hizmetleri": "saglik_klinik",
    "Odyometri": "saglik_klinik",
    "Otopsi Yardımcılığı": "saglik_klinik",
    "İş ve Uğraşı Terapisi": "saglik_klinik",
    "Turist Rehberliği": "turizm_hizmet",
    "Pastacılık ve Ekmekçilik": "turizm_hizmet",
    "Yat Kaptanlığı": "turizm_hizmet",
    "Saç Bakımı ve Güzellik Hizmetleri": "turizm_hizmet",
    "Saç ve Güzellik Uygulamaları": "turizm_hizmet",
    "Çağrı Merkezi Hizmetleri": "isletme_finans",
    "Ekonometri": "isletme_finans",
    "Posta Hizmetleri": "isletme_finans",
    "Hava Lojistiği": "isletme_finans",
    "Uçuş Harekat Yöneticiliği": "isletme_finans",
    "Ulaştırma ve Trafik Hizmetleri": "isletme_finans",
    "Deniz Brokerliği": "isletme_finans",
    "Sermaye Piyasası": "isletme_finans",
    "Dijital Dönüşüm Elektroniği": "muhendislik_teknoloji",
    "Biyomühendislik": "muhendislik_teknoloji",
    "Pilotaj": "uygulamali_teknik",
    "Otobüs Kaptanlığı": "uygulamali_teknik",
    "Karayolu Yük Taşıtı Sürücülüğü": "uygulamali_teknik",
    "Döküm": "uygulamali_teknik",
    "İslami İlimler": "sosyal_psikoloji",
    "Çocuk Koruma ve Bakım Hizmetleri": "sosyal_psikoloji",
    "Atçılık ve Antrenörlüğü": "tarim_gida_cevre",
    "Avcılık ve Yaban Hayatı": "tarim_gida_cevre",
    "Fidan Yetiştiriciliği": "tarim_gida_cevre",
    "Mantarcılık": "tarim_gida_cevre",
    "Bağcılık": "tarim_gida_cevre",
    "Fındık Eksperliği": "tarim_gida_cevre",
    "Tütün Eksperliği": "tarim_gida_cevre",
    "Coğrafi Bilgi Sistemleri": "yazilim_veri",
    "Uzaktan Algılama ve Coğrafi Bilgi Sistemleri": "yazilim_veri",
    "Sanal ve Artırılmış Gerçeklik": "yazilim_veri",
    "Kültür Varlıklarını Koruma ve Onarım": "tasarim_sanat",
    "Eser Koruma": "tasarim_sanat",
    "Müzecilik": "tasarim_sanat",
    "Adli Bilimler": "hukuk_kamu",
    "Fotonik": "temel_bilim_arastirma",
    "Nanobilim ve Nanoteknoloji": "temel_bilim_arastirma",
    "Geoteknik": "mimarlik_planlama",
    "Basın ve Yayın": "medya_iletisim",
    "Engelliler İçin Gölge Öğreticilik": "egitim_ogretmenlik",
    "Türk Halkbilimi": "dil_kulturel",
    "Halkbilimi": "dil_kulturel",
    "Hititoloji": "dil_kulturel",
    "Sinoloji": "dil_kulturel",
    "Hindoloji": "dil_kulturel",
    "Hungaroloji": "dil_kulturel",
    "Sümeroloji": "dil_kulturel",
    "Biyokimya": "temel_bilim_arastirma",
    "Kooperatifçilik": "isletme_finans",
}

OVERRIDES = {normalize(name): family for name, family in _OVERRIDES_TR.items()}

# (aile, anahtar kelimeler). SIRA ÖNEMLİ: yukarıdaki kural önce dener.
RULES = (
    ("saglik_klinik", (
        "tip", "dis hekim", "agiz ve dis", "hemsire", "ebelik", "eczaci",
        "fizyoterapi", "beslenme ve diyetetik", "odyoloji", "anestezi",
        "ilk ve acil", "ameliyathane", "tibbi", "radyoterapi", "diyaliz",
        "optisyen", "podoloji", "ortopedik", "perfuzyon", "saglik",
        "patoloji", "elektronorofizyoloji", "hasta bakim", "yasli bakim",
        "engelli bakim", "gerontoloji", "ergoterapi", "dil ve konusma terapisi",
        "goruntuleme", "protez", "hemsirelik", "paramedik",
    )),
    ("egitim_ogretmenlik", (
        "ogretmenligi", "ogretmenlik", "egitimi", "rehberlik", "okul oncesi",
        "antrenorluk", "egitim yonetimi",
    )),
    ("yazilim_veri", (
        "bilgisayar", "yazilim", "bilisim", "veri", "yapay zeka",
        "siber guvenlik", "bilgi teknoloji", "web tasarim", "oyun",
        "internet", "programcilig",
    )),
    ("mimarlik_planlama", (
        "mimarlik", "mimari", "sehir ve bolge", "insaat", "harita",
        "geomatik", "yapi", "emlak", "restorasyon", "tapu", "kadastro",
        "ic mekan",
    )),
    ("tarim_gida_cevre", (
        "tarim", "ziraat", "gida", "bahce", "tarla", "bitki", "hayvan",
        "su urunleri", "orman", "cevre", "veteriner", "sut", "aricilik",
        "tohum", "organik", "balikcilik", "toprak", "zootekni", "peyzaj",
        "kanatli", "seracilik",
    )),
    ("muhendislik_teknoloji", (
        "muhendislig", "elektrik", "elektronik", "makine", "mekatronik",
        "otomotiv", "endustri", "metalurji", "ucak", "havacilik",
        "gemi", "enerji", "kontrol", "biyomedikal", "tekstil", "maden",
        "petrol", "imalat", "rayli", "robot", "otomasyon", "nukleer",
        "malzeme",
    )),
    ("temel_bilim_arastirma", (
        "matematik", "fizik", "kimya", "biyoloji", "biyoteknoloji",
        "astronomi", "genetik", "bilimleri", "molekuler",
    )),
    ("hukuk_kamu", (
        "hukuk", "adalet", "siyaset", "kamu yonetimi", "uluslararasi iliskiler",
        "guvenlik", "polis", "ceza infaz", "gumruk", "jandarma", "savunma",
        "itfaiye", "sivil savunma", "maliye",
    )),
    ("turizm_hizmet", (
        "turizm", "otel", "gastronomi", "mutfak", "ascilik", "seyahat",
        "konaklama", "ikram", "kabin", "eglence", "spor",
    )),
    ("isletme_finans", (
        "isletme", "iktisat", "ekonomi", "muhasebe", "finans", "bankacilik",
        "sigortacilik", "pazarlama", "lojistik", "dis ticaret",
        "insan kaynaklari", "yonetim", "ticaret", "satis", "perakende",
        "girisimcilik", "buro", "sekreter", "calisma ekonomisi",
    )),
    ("medya_iletisim", (
        "gazetecilik", "iletisim", "radyo", "televizyon", "sinema",
        "halkla iliskiler", "reklam", "medya", "yayincilik", "basim",
        "fotograf", "haber",
    )),
    ("tasarim_sanat", (
        "tasarim", "sanat", "resim", "heykel", "muzik", "sahne", "tiyatro",
        "seramik", "moda", "grafik", "animasyon", "taki", "konservatuvar",
        "dans", "opera", "bale", "cizgi", "dokuma", "halicilik", "mimarlik ic",
    )),
    ("sosyal_psikoloji", (
        "psikoloji", "sosyoloji", "antropoloji", "felsefe", "arkeoloji",
        "cografya", "ilahiyat", "din kulturu", "tarih", "sosyal",
        "medeniyet",
    )),
    ("dil_kulturel", (
        "dili ve edebiyati", "mutercim", "tercumanlik", "ceviri", "filoloji",
        "dilbilim", "turkoloji", "edebiyat", "kulturu", "dil ve",
        "isaret dili",
    )),
    ("uygulamali_teknik", (
        "teknikerlig", "teknolojisi", "teknikleri", "teknolojileri", "kaynak",
        "tesisat", "iklimlendirme", "mobilya", "ayakkabi", "kuyumculuk",
        "matbaa", "deri", "kagit", "dogalgaz", "sondaj", "tahribatsiz",
        "raylı", "operatorlugu", "bakim ve onarim",
    )),
)


def _matches(keyword: str, text: str) -> bool:
    """Kelime başından eşleşir. 'astronomi' anahtarı 'gastronomi'yi yakalamaz."""
    return re.search(r"(?<![a-z0-9])" + re.escape(keyword), text) is not None


def classify(normalized_group_name: str) -> str:
    """Normalize edilmiş (ASCII, küçük harf) grup adını bir aileye eşler."""
    if normalized_group_name in OVERRIDES:
        return OVERRIDES[normalized_group_name]
    for family, keywords in RULES:
        for keyword in keywords:
            if _matches(keyword, normalized_group_name):
                return family
    return "other"
