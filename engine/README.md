# OverFit — Adaptif Soru Bankası ve Canlı Test Prototipi

80 Türkçe sorudan oluşan bir havuz, oturum başına 10 soru, her cevaptan sonra
yeniden hesaplanan persona profili ve gerçek YÖK Atlas 2026 verisine bağlı
bölüm grubu sonuçları. Bağımlılık yok: Python 3 standart kütüphanesi, ES
modülleri ve Node'un yerleşik test koşucusu.

Bu depo bir **paket**tir, bitmiş bir uygulama değil. UI ayrı bir depoda yaşar ve
bu paketi kurar; entegrasyon kuralları [CONTRACT.md](CONTRACT.md) içinde.

## Çalıştırma

```bash
python3 -m http.server 4173
```

Sonra `http://localhost:4173/tester/` adresini aç. Sağ üstteki **Test modu** düğmesi
soru seçiminin gerekçesini, boyut puanlarını ve anlık sıralamayı gösterir;
bu panel yalnızca ürün ekibi içindir.

Testler:

```bash
npm test
```

```bash
python3 -m unittest tests.test_build_program_catalog -v
```

## Neyin nerede olduğu

| Yol | İçerik |
|---|---|
| `index.js` | Paketin genel API'si — UI tarafının gördüğü tek yüzey |
| `CONTRACT.md` | Entegrasyon sözleşmesi |
| `src/overfit.js` | `createOverfit()` — motoru, kataloğu ve sonuçları birleştiren cephe |
| `tester/` | Bu depodaki test harness'ı (ürün UI'ı değil) |
| `data/questions.tr.json` | 80 soru (48 ortak / 16 puanı olan / 16 puanı olmayan), tümü `draft` |
| `data/program-groups.json` | 634 bölüm grubu: kariyer ailesi, program sayısı, taban sırası bandı, örnek programlar |
| `data/programs.min.json` | 21.493 program, sütunlu kompakt tablo |
| `src/dimensions.js` | 14 persona boyutu |
| `tests/api-contract.test.mjs` | Genel API'yi kilitleyen sözleşme testleri |
| `src/career-families.js` | 15 kariyer ailesi ve boyut ağırlıkları — **editoryal varsayım** |
| `src/question-engine.js` | Oturum durumu, adaptif seçim, geri alma, cevap değiştirme |
| `src/program-match.js` | Persona sonucunu bölüm gruplarına ve erişilebilirliğe bağlar |
| `src/data-loader.js` | Göreli yol varsaymayan veri yükleyici |
| `scripts/author_questions.py` | Soru metinlerinin kaynağı; JSON'u üretir |
| `scripts/build_program_catalog.py` | ZIP'ten kataloğu üretir |
| `scripts/career_families.py` | 634 grubun aileye eşlenmesi (kural + elle istisna) |

## Veriyi tazeleme

Kaynak ZIP depoya girmez, değiştirilmez ve dışarıda durur:

```bash
python3 scripts/build_program_catalog.py \
  '/Users/kberkaybilgenn/Local-Scraper/data/yokatlas/export/yokatlas-2026-csv.zip' \
  data
```

Beklenen çıktı: 21.493 program, 634 grup, 0 yinelenen program kodu,
0 eşleşmeyen kariyer ailesi, 3.242 programın taban sırası yayımlanmamış.

Soru metnini değiştirdikten sonra:

```bash
python3 scripts/author_questions.py
```

## Nasıl çalışıyor

**Persona profili.** Her seçenek 14 boyuttan birkaçına küçük puanlar ekler.
Profil her zaman saklanan cevaplardan sıfırdan kurulur; geri dönüp bir cevabı
değiştirdiğinde o adımdan sonrası tamamen düşer.

**Soru seçimi.** Aday havuzu hedef kitle, oturum aşaması (1-3 geniş, 4-6
derinleşme, 7-9 ayrıştırma, 10 tutarlılık), daha önce görülmemiş olma ve
art arda aynı soru ailesinin gelmemesi kurallarıyla süzülür. Kalanlar dört
bileşenle puanlanır: önceki cevabın açtığı odakla örtüşme, henüz ölçülmemiş
boyutlar, ilk iki kariyer ailesini ayırma gücü ve sabit öncelik. Bileşenlerin
hepsi test panelinde tek tek görünür.

**Sonuç.** Persona uyumu ile veriden gelen erişim ayrı ayrı gösterilir.
Başarı sırası girilmediyse erişim hiç hesaplanmaz.

## Bilinçli sınırlar

- **Sorular `draft`.** Editoryal inceleme (seçenek dengesi, yönlendirici dil,
  yaşa uygunluk, kültürel önyargı) bitmeden `active` yapılmamalı.
- **Kariyer ailesi ağırlıkları veriden gelmiyor.** YÖK Atlas 2026'da Meslek
  Atlası ve Mezun Başarı Atlası kaldırıldı; "bu bölümü okuyan ne iş yapar"
  sorusunun kamuya açık karşılığı yok. `src/career-families.js` ve
  `scripts/career_families.py` bu varsayımların tamamını tek yerde tutar.
- **Eksik değer tahmin edilmez.** 3.242 programın 2026 taban sırası yok; bu
  hücreler `null` kalır, sıfıra veya ortalamaya çevrilmez.
- **Tavan puan yok.** ÖSYM Tablo-3/4 belge sunucusu programatik indirmeyi
  reddediyor; elde yalnızca taban var. Arayüz "taban" dilini kullanır.
- **Netler bir dağılım değil.** Yayımlanan tek şey "yerleşen son kişi"nin
  netleri. Bu yüzden net tabanlı şans tahmini yapılmaz.
- **A/B ayrışması ölçülür, zorlanmaz.** Aynı durumdan A ve B çoğunlukla farklı
  bir sonraki soruya götürür (örneklenen durumlarda %85,4; gerçek yollarda
  %94,4). Yollar bazen birleşir; bunun nedeni o sorunun iki profil için de en
  yüksek bilgi değerine sahip olmasıdır.
- **Bağlayıcı kaynak ÖSYM'nin güncel kılavuzudur.** Veri YÖK ve ÖSYM'ye ait;
  yeniden yayımlamadan önce kullanım şartları kontrol edilmelidir.

## Tasarım belgesinden sapmalar

| Belge | Uygulanan | Neden |
|---|---|---|
| 29 persona boyutu | 14 | 10 cevapla 29 boyutta boyut başına 0,3 gözlem düşüyordu |
| "Her durumda A ve B farklı soru vermeli" | Gerçek bilgi kazancı + ölçülen ayrışma oranı | Zorlama, soru seçimini bilgi değerine göre değil dallanma uğruna yapıyordu |
| Anahtar kelimeyle aile eşlemesi | Kural + 62 elle istisna | Uzun kuyrukta sessiz yanlış eşleşme oluyordu (ör. "Gastronomi" → "Astronomi") |

## Üç parçayı birleştirme

Şu an üç depo paralel ilerliyor: landing page, ürün UI'ı ve bu motor. Motor
kurulabilir bir paket olduğu için UI bugün çalışmaya başlayabilir:

```bash
npm i github:KULLANICI/overfit-soru-motoru
```

Birleştirme zamanı geldiğinde tek bir monorepo açılır ve üç depo **geçmişleriyle
birlikte** içeri alınır:

```bash
mkdir overfit && cd overfit && git init
git subtree add --prefix packages/soru-motoru <motor-repo-url> main
git subtree add --prefix apps/web            <ui-repo-url>    main
git subtree add --prefix apps/landing        <landing-url>    main
```

`git subtree` kopyalama değildir: her deponun commit geçmişi korunur, kimse
çalışmasını kaybetmez. Sonrasında npm workspaces ile `apps/web` doğrudan
`packages/soru-motoru`'yu kullanır, ayrı sürümleme derdi kalmaz.
