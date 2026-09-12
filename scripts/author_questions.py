#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""80 soruluk Türkçe adaptif soru bankasını data/questions.tr.json olarak üretir.

Soru metinleri burada, tek bir yerde, editoryal inceleme için düz okunur
biçimde durur. Türetilen alanlar (dimensions, nextFocus, programFamilies)
açık kurallarla hesaplanır; elle girilmez ki tutarsızlık birikmesin.

Kurallar:
  dimensions       -> iki seçeneğin etkilerinden en güçlü 3 boyut
  nextFocus        -> o seçeneğin POZİTİF etki verdiği boyutlar
                      (bir sonraki soru bu boyutları ölçmeye gider)
  programFamilies  -> sorunun boyutlarında ağırlığı en yüksek 3 kariyer ailesi
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "data" / "questions.tr.json"
FAMILIES_JS = Path(__file__).resolve().parents[1] / "src" / "career-families.js"

STAGE_PRIORITY = {"broad": 50, "deepen": 40, "distinguish": 30, "validate": 20}


def eff(spec: str) -> dict:
    """'insan:2 yardim:1' -> {'insan': 2, 'yardim': 1}"""
    out = {}
    for token in spec.split():
        name, _, value = token.partition(":")
        out[name] = int(value)
    return out


# (id, aile, aşama, soru, A metni, A etkileri, B metni, B etkileri, hedef kitle, ters çift)
Q = [
    # ---------------------------------------------------------------- ORTAK / ilgi
    ("ilgi_01", "ilgi", "broad", "Boş bir cumartesin var. Hangisi sana daha çekici geliyor?",
     "Bir aleti açıp nasıl çalıştığına bakmak", "sistem:2 nesne:2",
     "Tanımadığın insanların olduğu bir etkinliğe gitmek", "insan:2 belirsiz:1", "both", None),
    ("ilgi_02", "ilgi", "broad", "Okulda bir proje seçeceksin. Hangisini alırsın?",
     "Bir anketin sonuçlarını tablo ve grafiğe dökmek", "veri:2 duzen:1",
     "Aynı konuyu kısa bir videoyla anlatmak", "fikir:2 insan:1", "both", None),
    ("ilgi_03", "ilgi", "broad", "Bir belgesel açacaksın.",
     "Bir hastanenin nöbet gecesi", "yardim:2 insan:1 sorumluluk:1",
     "Bir köprünün sıfırdan inşası", "sistem:2 nesne:1", "both", None),
    ("ilgi_04", "ilgi", "broad", "Yeni bir konuyu öğrenmek istediğinde önce ne yaparsın?",
     "Konuyu bilen biriyle konuşurum", "insan:2 takim:1",
     "Kaynakları bulup tek başıma okurum", "fikir:2 takim:-1", "both", None),
    ("ilgi_05", "ilgi", "broad", "Gün sonunda hangisi daha tatmin edici olurdu?",
     "Elimle bitirdiğim somut bir iş", "nesne:3",
     "Kafamda netleşen yeni bir fikir", "fikir:3", "both", None),
    ("ilgi_06", "ilgi", "broad", "Haberlere baktığında hangi başlıkta duraklarsın?",
     "Rakamlarla anlatılan bir analiz", "veri:2 sistem:1",
     "Bir kişinin yaşadıklarını anlatan bir hikâye", "insan:2 yardim:1", "both", None),
    ("ilgi_07", "ilgi", "broad", "Bir tartışmanın ortasındasın.",
     "Karşı tarafı ikna etmeye çalışırım", "liderlik:2 insan:1",
     "Kendi çözümümü sessizce hazırlarım", "sistem:2 takim:-1", "both", None),
    ("ilgi_08", "ilgi", "broad", "Hiç gitmediğin bir şehirdesin.",
     "Önceden plan yapar, listeye göre gezerim", "duzen:2 belirsiz:-1",
     "Plansız yürür, ne çıkarsa bakarım", "belirsiz:2 hareket:1", "both", None),
    # --------------------------------------------------------------- ORTAK / ortam
    ("ortam_01", "ortam", "broad", "Çalışma günün nasıl geçsin?",
     "Aynı masada, uzun ve kesintisiz", "duzen:2 hareket:-1",
     "Gün içinde farklı yerlerde, hareketli", "hareket:3", "both", None),
    ("ortam_02", "ortam", "broad", "Etrafındaki ortam nasıl olsun?",
     "Sessiz, az kişili bir yer", "duzen:2 takim:-1",
     "Sürekli insan giriş çıkışı olan bir yer", "insan:2 takim:2", "both", None),
    ("ortam_03", "ortam", "broad", "Çalışma saatlerin nasıl olsun?",
     "Her gün aynı saatler", "guvence:2 belirsiz:-1",
     "Değişen saatler, gerekirse vardiya", "belirsiz:2 hareket:1", "both", None),
    ("ortam_04", "ortam", "deepen", "Bir ekipte hangisi sana daha uygun?",
     "Kendi parçamdan tek başıma sorumlu olmak", "sorumluluk:2 takim:-1",
     "Ortak bir işi birlikte yürütmek", "takim:3", "both", None),
    ("ortam_05", "ortam", "deepen", "İşinin büyük kısmı nerede geçsin?",
     "Kapalı alanda, ekran ve belge başında", "duzen:2 veri:1",
     "Açık havada veya sahada", "hareket:3 nesne:1", "both", None),
    ("ortam_06", "ortam", "deepen", "Aynı işi yıllarca yapmak sana nasıl geliyor?",
     "Ustalaşana kadar aynı işi yapmak iyidir", "duzen:2 guvence:2",
     "Birkaç yılda bir konu değiştirmek iyidir", "belirsiz:3", "both", None),
    ("ortam_07", "ortam", "deepen", "Nerede çalışmak daha çekici?",
     "Kuralları belli, büyük bir kurumda", "guvence:3 duzen:1",
     "Herkesin her işi yaptığı küçük bir ekipte", "belirsiz:2 takim:2", "both", None),
    ("ortam_08", "ortam", "deepen", "İşinin temposunu ne belirlesin?",
     "Net bir program ve teslim takvimi", "duzen:3",
     "Kendi kurduğum düzen", "belirsiz:2 sorumluluk:1", "both", None),
    # ------------------------------------------------------------- ORTAK / problem
    ("problem_01", "problem", "deepen", "Yeni bir işi nasıl öğrenmeyi tercih edersin?",
     "Adım adım anlatan bir yönergeyle", "duzen:3",
     "Deneyerek, gerekirse hata yaparak", "belirsiz:2 nesne:1", "both", None),
    ("problem_02", "problem", "deepen", "Hangi tür soru sana daha keyifli geliyor?",
     "Tek bir doğru cevabı olan", "veri:2 sistem:1",
     "Cevabı yoruma açık olan", "fikir:3", "both", None),
    ("problem_03", "problem", "deepen", "Bir şey bozulduğunda ilk refleksin ne olur?",
     "Sökülüp onarılabilir mi diye bakmak", "nesne:3 sistem:1",
     "Daha iyisi nasıl tasarlanır diye düşünmek", "fikir:3", "both", None),
    ("problem_04", "problem", "deepen", "Hangi karmaşa daha çok ilgini çeker?",
     "Dağınık bir veriyi anlamlı hâle getirmek", "veri:3 duzen:1",
     "Karışmış bir insan ilişkisini çözmek", "insan:3 yardim:1", "both", None),
    ("problem_05", "problem", "distinguish", "İşinde hata payı ne olsun?",
     "Neredeyse sıfır; kontrol çok olsun", "duzen:3 sorumluluk:2",
     "Hızlı denenip düzeltilebilsin", "belirsiz:3", "both", None),
    ("problem_06", "problem", "distinguish", "Günün nasıl bölünsün?",
     "Tek bir büyük işe uzun saatler", "duzen:2 fikir:1",
     "Gün içinde onlarca küçük iş", "hareket:2 belirsiz:2", "both", None),
    ("problem_07", "problem", "distinguish", "Bir kuralla karşılaştığında ne hissedersin?",
     "Kuralı doğru uygulamak beni rahatlatır", "duzen:3 guvence:1",
     "Kuralın neden var olduğunu merak ederim", "fikir:2 belirsiz:1", "both", None),
    ("problem_08", "problem", "distinguish", "Hangisi daha zorlayıcı ama çekici?",
     "Sonucu yıllar sonra belli olan bir çalışma", "uzunegitim:3 belirsiz:1",
     "Sonucu aynı gün görülen bir iş", "nesne:2 hareket:1", "both", None),
    # ------------------------------------------------------------ ORTAK / iletisim
    ("iletisim_01", "iletisim", "distinguish", "Bir işi anlatman gerekiyor.",
     "Kalabalığa sunum yaparım", "liderlik:3 insan:1",
     "Ayrıntılı bir rapor yazarım", "duzen:2 fikir:1", "both", None),
    ("iletisim_02", "iletisim", "distinguish", "Hangisi sana daha doğal geliyor?",
     "Bir kişiyi uzun uzun dinlemek", "yardim:3 insan:1",
     "Bir gruba yön vermek", "liderlik:3", "both", None),
    ("iletisim_03", "iletisim", "distinguish", "Ekipte anlaşmazlık çıktı.",
     "Ortak noktayı bulmaya çalışırım", "insan:2 takim:2",
     "Doğru bulduğum tarafı savunurum", "liderlik:2 sorumluluk:1", "both", None),
    ("iletisim_04", "iletisim", "distinguish", "Bir konuyu iyice öğrendin. Sonra?",
     "Başkasına öğretmek isterim", "yardim:2 insan:2",
     "Bir sonraki konuya geçmek isterim", "fikir:2 belirsiz:1", "both", None),
    ("iletisim_05", "iletisim", "distinguish", "Zor bir haberi iletmek gerekiyor.",
     "Ben söylerim, sorumluluğunu alırım", "sorumluluk:3 liderlik:1",
     "Söyleyecek kişinin yanında olurum", "yardim:2 takim:1", "both", None),
    ("iletisim_06", "iletisim", "validate", "Yeni tanıştığın bir grupta ilk yarım saatin nasıl geçer?",
     "Genelde konuşmayı ben başlatırım", "insan:2 liderlik:2",
     "Önce izler, sonra katılırım", "duzen:1 fikir:1", "both", "ortam_02"),
    # ------------------------------------------------------------- ORTAK / degerler
    ("deger_01", "degerler", "broad", "İki iş teklifi geldi.",
     "Maaşı sabit ve garantili olan", "guvence:3",
     "Maaşı değişken ama tavanı yüksek olan", "guvence:-2 belirsiz:2 liderlik:1", "both", None),
    ("deger_02", "degerler", "broad", "Bir işi senin için anlamlı yapan ne?",
     "Birilerinin hayatına dokunması", "yardim:3 insan:1",
     "Ortaya iyi bir iş çıkması", "fikir:2 nesne:1", "both", None),
    ("deger_03", "degerler", "deepen", "Uzun vadede hangisi daha önemli?",
     "İşimi kaybetme ihtimalinin düşük olması", "guvence:3",
     "Hızlı ilerleme ihtimalinin yüksek olması", "liderlik:2 belirsiz:2", "both", None),
    ("deger_04", "degerler", "deepen", "Çalışma hayatı ile özel hayat?",
     "Akşam iş biter, hayat başlar", "guvence:2 duzen:1",
     "İkisi iç içe geçebilir", "belirsiz:2 sorumluluk:1", "both", None),
    ("deger_05", "degerler", "deepen", "Nerede yaşamak istersin?",
     "Ailemin yakınında kalmak", "guvence:2 insan:1",
     "Fırsat için başka şehre taşınmak", "belirsiz:3", "both", None),
    ("deger_06", "degerler", "distinguish", "Hangisi seni daha çok rahatsız eder?",
     "Yaptığım işin kimsenin gözüne çarpmaması", "liderlik:2 insan:1",
     "Yaptığım işin aceleye gelmesi", "duzen:3", "both", None),
    ("deger_07", "degerler", "distinguish", "Çalışma hayatının ilk 15 yılı?",
     "Aynı kurumda derinleşmek", "guvence:3 duzen:1",
     "Birkaç farklı yerde denemek", "belirsiz:3", "both", None),
    ("deger_08", "degerler", "distinguish", "Sorumluluk sende olduğunda ne hissedersin?",
     "Kararın bende olması beni motive eder", "sorumluluk:3 liderlik:1",
     "Kararın paylaşılması beni rahatlatır", "takim:2 duzen:1", "both", None),
    # ------------------------------------------------------------- ORTAK / ogrenme
    ("ogrenme_01", "ogrenme", "broad", "Eğitim süresi konusunda ne düşünüyorsun?",
     "Uzun sürse de sonunda uzmanlaşmak", "uzunegitim:3",
     "Kısa sürede işe başlamak", "uzunegitim:-2 nesne:2 hareket:1", "both", None),
    ("ogrenme_02", "ogrenme", "deepen", "Nasıl daha iyi öğreniyorsun?",
     "Önce teoriyi anlayıp sonra uygulayarak", "fikir:2 duzen:1",
     "Doğrudan yaparak, yolda öğrenerek", "nesne:2 belirsiz:1", "both", None),
    ("ogrenme_03", "ogrenme", "deepen", "Mezun olduktan sonra nasıl ilerlemek istersin?",
     "Sınavlarla ilerleyen bir yol beni rahatsız etmez", "duzen:2 uzunegitim:2",
     "Yaptığım işi gösteren bir dosyayla ilerlemek isterim", "fikir:2 belirsiz:1", "both", None),
    ("ogrenme_04", "ogrenme", "distinguish", "Yoğun bilgi gerektiren bir alan?",
     "Çok şey öğrenmem gerekse de olur", "duzen:2 uzunegitim:2",
     "Az bilgi, çok uygulama olsun", "nesne:2 hareket:1", "both", None),
    ("ogrenme_05", "ogrenme", "distinguish", "Lisansüstü eğitim düşünür müsün?",
     "Gerekirse yüksek lisans ya da doktora yaparım", "uzunegitim:3 fikir:1",
     "Lisans yeter, sahaya çıkmak isterim", "hareket:2 nesne:1", "both", None),
    ("ogrenme_06", "ogrenme", "validate", "Bir yıl boyunca ek çaba isteyen bir şey seçsen?",
     "Bir yabancı dilde ustalaşmak", "fikir:2 insan:1",
     "Bir aleti ya da programı ustalıkla kullanmak", "sistem:2 nesne:1", "both", None),
    # ---------------------------------------------------------- ORTAK / tutarlilik
    ("tutar_01", "tutarlilik", "validate", "Yoğun bir günün sonunda enerjini ne toplar?",
     "Tek başıma geçirdiğim zaman", "takim:-2 duzen:1",
     "Sevdiğim insanlarla geçirdiğim zaman", "insan:2 takim:2", "both", "ortam_02"),
    ("tutar_02", "tutarlilik", "validate", "Bir arkadaşın iki iş arasında kararsız. Ne dersin?",
     "Garantili olanı seç derim", "guvence:3",
     "Büyüme ihtimali olanı seç derim", "belirsiz:2 liderlik:1", "both", "deger_01"),
    ("tutar_03", "tutarlilik", "validate", "Bir haftalık iznin var.",
     "Evde bir şeyler yapar, tamir eder, üretirim", "nesne:3",
     "Okur, izler, düşünürüm", "fikir:3", "both", "ilgi_05"),
    ("tutar_04", "tutarlilik", "validate", "Bir işi teslim etmeden önce ne yaparsın?",
     "Baştan sona bir kez daha kontrol ederim", "duzen:3",
     "Yeterliyse gönderir, gelen geri bildirimle düzeltirim", "belirsiz:2 hareket:1", "both", "problem_05"),

    # ================================================== YKS SONUCU OLAN (score_known)
    ("sk_01", "erisim", "broad", "Tercih listeni yaparken nereden başlarsın?",
     "Önce ulaşabileceğim bölümlere bakarım", "duzen:2 guvence:2",
     "Önce gerçekten istediğim bölümlere bakarım", "belirsiz:2 fikir:1", "score_known", None),
    ("sk_02", "gunluk", "broad", "Bir bölümü değerlendirirken neye bakarsın?",
     "Mezun olunca yapılacak işin günlük hâline", "nesne:1 hareket:1 sistem:1",
     "Bölümde okunacak derslerin içeriğine", "fikir:2 uzunegitim:1", "score_known", None),
    ("sk_03", "risk", "deepen", "Listendeki dengeyi nasıl kurarsın?",
     "Çoğunluğu kesin tutacak tercihler olsun", "guvence:3",
     "Birkaçı kesin, gerisi iddialı olsun", "belirsiz:2 sorumluluk:1", "score_known", None),
    ("sk_04", "erisim", "deepen", "Sıran hedeflediğin bölüme az farkla yetişmiyor.",
     "Aynı alandaki ulaşabildiğim bölüme giderim", "duzen:2 guvence:2",
     "Bir yıl daha hazırlanmayı düşünürüm", "uzunegitim:2 belirsiz:2", "score_known", None),
    ("sk_05", "gunluk", "deepen", "İki bölüm de sana uygun; biri uzun staj ve nöbet istiyor.",
     "Yoğun tempoyu göze alırım", "sorumluluk:3 hareket:1",
     "Daha dengeli olanı seçerim", "guvence:2 duzen:1", "score_known", None),
    ("sk_06", "sorumluluk", "deepen", "Hatanın başkasını doğrudan etkilediği bir iş?",
     "Bu sorumluluğu taşıyabilirim", "sorumluluk:3 yardim:1",
     "Böyle bir yükü tercih etmem", "duzen:2 guvence:2", "score_known", None),
    ("sk_07", "erisim", "deepen", "Aynı bölüm iki farklı şehirde açılıyor.",
     "Adı daha çok bilinen yeri seçerim", "guvence:2 liderlik:1",
     "Yaşamak isteyeceğim şehri seçerim", "belirsiz:2 insan:1", "score_known", None),
    ("sk_08", "gunluk", "distinguish", "Mezuniyetten sonraki ilk yıl nasıl geçsin?",
     "Bir kurumda düzenli işe başlamak", "guvence:3 duzen:1",
     "Kendi işimi ya da projemi denemek", "belirsiz:3 liderlik:1", "score_known", None),
    ("sk_09", "risk", "distinguish", "Sırası yüksek bir bölüm ile ilgini çeken bölüm arasında?",
     "Sırası yüksek olanı seçerim, alışırım", "guvence:2 duzen:1",
     "İlgimi çekeni seçerim", "fikir:2 belirsiz:1", "score_known", None),
    ("sk_10", "gunluk", "distinguish", "İşinin büyük kısmı hangisi olsun?",
     "İnsanlarla yüz yüze geçsin", "insan:3",
     "Ekran ve belge üzerinde geçsin", "veri:2 duzen:1", "score_known", None),
    ("sk_11", "sorumluluk", "distinguish", "Alanında ilerlemek ek sınavlar gerektiriyor.",
     "Yıllarca sınava hazırlanabilirim", "uzunegitim:3 duzen:1",
     "Sınavsız ilerleyen bir yol isterim", "nesne:2 hareket:1", "score_known", None),
    ("sk_12", "erisim", "distinguish", "Bölüm mü, koşullar mı?",
     "Bölüm neyse ona göre karar veririm", "duzen:2 fikir:1",
     "Şehir ve yaşam koşullarına göre karar veririm", "insan:1 guvence:2", "score_known", None),
    ("sk_13", "risk", "distinguish", "İlgini çeken alanda iş bulmak belirsiz görünüyor.",
     "Yine de ilgimi takip ederim", "fikir:2 belirsiz:2",
     "Daha kesin görünen bir alana yönelirim", "guvence:3", "score_known", None),
    ("sk_14", "risk", "validate", "Bir arkadaşın 'garanti olan' ile 'istediği' arasında kaldı.",
     "Garantili olanı öneririm", "guvence:3",
     "İstediğini öneririm", "belirsiz:2 fikir:1", "score_known", "sk_09"),
    ("sk_15", "gunluk", "validate", "İlk maaş gününü hayal et.",
     "Tahmin edilebilir, sabit bir gelir", "guvence:3",
     "Değişken ama yükselebilen bir gelir", "belirsiz:2 liderlik:1", "score_known", None),
    ("sk_16", "erisim", "validate", "Kayıt haftasındasın.",
     "Bölümün ders programını incelerim", "duzen:2 fikir:1",
     "Şehri ve kampüsü gezerim", "hareket:2 insan:1", "score_known", "sk_12"),

    # ============================================== YKS SONUCU OLMAYAN (score_unknown)
    ("su_01", "kesif", "broad", "Alanın henüz netleşmemişken hangisi daha doğru?",
     "Birkaç alanı deneyip görmek", "belirsiz:3",
     "Bir alana erkenden odaklanmak", "duzen:2 uzunegitim:1", "score_unknown", None),
    ("su_02", "kesif", "broad", "Bir alanı tanımak için ne yaparsın?",
     "O işi yapan biriyle konuşurum", "insan:3",
     "O işe benzer bir şeyi kendim denerim", "nesne:2 hareket:1", "score_unknown", None),
    ("su_03", "yatirim", "deepen", "Önümüzdeki bir yılı neye ayırırsın?",
     "Sınava hazırlanmaya", "uzunegitim:2 duzen:2",
     "Bir beceri öğrenip denemeye", "nesne:2 hareket:2", "score_unknown", None),
    ("su_04", "alternatif", "deepen", "Üniversite dışında bir yol?",
     "Olabilir; işi işin içinde öğrenmek de bir yol", "uzunegitim:-2 nesne:2 hareket:1",
     "Önce üniversiteyi denemek isterim", "uzunegitim:2 duzen:1", "score_unknown", None),
    ("su_05", "gelecek", "deepen", "Beş yıl sonra kendini nasıl görmek istersin?",
     "Bir alanda derinleşmiş", "uzunegitim:2 duzen:1",
     "Birkaç şeyi birden deniyor", "belirsiz:3", "score_unknown", None),
    ("su_06", "kesif", "deepen", "Merakın en çok nereye kayıyor?",
     "Bir şeyin nasıl çalıştığına", "sistem:3",
     "İnsanların neden öyle davrandığına", "insan:2 yardim:1", "score_unknown", None),
    ("su_07", "yatirim", "deepen", "Ücretsiz bir kursa yazılsan hangisini seçersin?",
     "Teknik bir beceri", "sistem:2 nesne:2",
     "İletişim ve sunum becerisi", "insan:2 liderlik:2", "score_unknown", None),
    ("su_08", "gelecek", "distinguish", "İşin nerede olsun?",
     "Sabit bir yerde", "duzen:2 guvence:1",
     "Değişen yerlerde", "hareket:3", "score_unknown", None),
    ("su_09", "kesif", "distinguish", "Bir alanı sevdiğini nasıl anlarsın?",
     "Uzun süre sıkılmadan çalışabiliyorsam", "duzen:2 fikir:1",
     "Sonucu insanlara dokunuyorsa", "yardim:3", "score_unknown", None),
    ("su_10", "alternatif", "distinguish", "Kısa eğitimle başlanabilen bir iş düşün.",
     "Erken başlar, yolda öğrenirim", "nesne:2 hareket:2",
     "Önce eğitimimi tamamlarım", "uzunegitim:3", "score_unknown", None),
    ("su_11", "gelecek", "distinguish", "Gelirin nasıl olsun?",
     "Düzenli ve tahmin edilebilir", "guvence:3",
     "Yaptığım işe göre değişen", "belirsiz:2 liderlik:1", "score_unknown", None),
    ("su_12", "yatirim", "distinguish", "Zor bir konuda tıkandın.",
     "Anlayana kadar üstüne giderim", "uzunegitim:2 duzen:2",
     "Başka bir yoldan denerim", "belirsiz:2 fikir:1", "score_unknown", None),
    ("su_13", "kesif", "distinguish", "Bir gün boyunca birinin yanında durabilsen?",
     "Atölyede ya da sahada çalışan biri", "nesne:2 hareket:2",
     "Ofiste plan yapan biri", "veri:2 duzen:1", "score_unknown", None),
    ("su_14", "kesif", "validate", "Hangisi sana daha çok 'bu bana göre' dedirtir?",
     "Bir şeyi çalışır hâle getirmek", "sistem:2 nesne:2",
     "Birinin işini kolaylaştırmak", "yardim:3", "score_unknown", "su_06"),
    ("su_15", "gelecek", "validate", "On yıl sonra ne anlatmak isterdin?",
     "'Şunu kurdum' demek", "liderlik:2 belirsiz:2",
     "'Şu kadar kişiye faydam oldu' demek", "yardim:3 insan:1", "score_unknown", None),
    ("su_16", "yatirim", "validate", "Bugün bir şey öğrenmeye başlasan?",
     "Hemen işe yarayacak bir şey", "nesne:2 hareket:1",
     "Uzun vadede işe yarayacak bir şey", "uzunegitim:3", "score_unknown", "su_03"),
]


def load_family_weights() -> dict:
    """career-families.js dosyasından ağırlıkları okur (tek kaynak orada kalsın)."""
    text = FAMILIES_JS.read_text(encoding="utf-8")
    families = {}
    for match in re.finditer(r'id:\s*"([a-z_]+)",.*?weights:\s*\{(.*?)\}', text, re.S):
        family_id, body = match.group(1), match.group(2)
        weights = {}
        for key, value in re.findall(r"(\w+):\s*(-?\d+)", body):
            weights[key] = int(value)
        families[family_id] = weights
    return families


def build() -> list:
    family_weights = load_family_weights()
    questions = []
    for index, (qid, question_family, stage, text, a_text, a_eff, b_text, b_eff, audience, reverse) in enumerate(Q):
        options = [
            {"id": "a", "text": a_text, "scoreEffects": eff(a_eff)},
            {"id": "b", "text": b_text, "scoreEffects": eff(b_eff)},
        ]
        for option in options:
            option["nextFocus"] = sorted(
                [dim for dim, value in option["scoreEffects"].items() if value > 0]
            )
        if options[0]["nextFocus"] == options[1]["nextFocus"]:
            raise SystemExit(f"{qid}: iki seçenek aynı odağa gidiyor, ayrışma yok")

        strength = {}
        for option in options:
            for dim, value in option["scoreEffects"].items():
                strength[dim] = strength.get(dim, 0) + abs(value)
        dimensions = [dim for dim, _ in sorted(strength.items(), key=lambda kv: (-kv[1], kv[0]))][:3]

        scored = []
        for family_id, weights in family_weights.items():
            scored.append((sum(weights.get(dim, 0) for dim in dimensions), family_id))
        scored.sort(key=lambda pair: (-pair[0], pair[1]))
        program_families = [family_id for _, family_id in scored[:3]]

        questions.append({
            "id": qid,
            "text": text,
            "options": options,
            "audience": audience,
            "dimensions": dimensions,
            "programFamilies": program_families,
            "questionFamily": question_family,
            "reversePairId": reverse,
            "priority": STAGE_PRIORITY[stage] + (index % 7),
            "stage": stage,
            "version": 1,
            "status": "draft",
        })
    return questions


def main() -> int:
    questions = build()
    OUT.write_text(json.dumps(questions, ensure_ascii=False, indent=1), encoding="utf-8")
    counts = {}
    for question in questions:
        counts[question["audience"]] = counts.get(question["audience"], 0) + 1
        key = (question["audience"], question["stage"])
        counts[key] = counts.get(key, 0) + 1
    print(f"{len(questions)} soru yazıldı -> {OUT.relative_to(OUT.parents[1])}")
    for audience in ("both", "score_known", "score_unknown"):
        stages = {stage: counts.get((audience, stage), 0) for stage in STAGE_PRIORITY}
        print(f"  {audience:14s} {counts.get(audience, 0):3d}  {stages}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
