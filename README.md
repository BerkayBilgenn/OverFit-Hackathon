# Pusula — OverFit Hackathon

"YKS puanım var" ve "YKS puanım yok" olmak üzere iki akış. Kullanıcı 3D bir
giriş deneyiminden geçer, 10 adaptif soru cevaplar ve cevaplarına göre
**gerçek YÖK Atlas 2026 verisinden** bölüm grubu önerileri alır.

## Çalıştırma

Gereken: **Node 20+** ve (yalnızca veriyi yeniden üretmek için) Python 3.

```bash
npm install && npm run dev
```

Tarayıcıda <http://localhost:5173> açılır. Başka bir şey kurmaya gerek yok —
soru bankası ve bölüm kataloğu depoda hazır, motorun sıfır bağımlılığı var.

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu (Vite) |
| `npm run build` | `tsc --noEmit` + üretim derlemesi |
| `npm test` | Soru motoru, banka ve API sözleşmesi testleri (59 test) |
| `npm run test:catalog` | Katalog üreticisinin Python testleri (12 test) |
| `npm run tester` | Motorun bağımsız test arayüzü → <http://localhost:4173/tester/> |

## Yapı

```
src/intro/       3D giriş deneyimi (Three.js): pusula, ROTA robotu, arka plan
src/analysis/    Akış: puan formu → tercih koşulları → 10 soru → sonuç
  data/overfitBridge.ts   UI ile motor arasındaki tek dönüşüm noktası
src/components/  Sonuç panosu bileşenleri
engine/          Adaptif soru motoru — bağımsız, bağımlılıksız, test edilmiş
public/overfit-data/    Soru bankası + bölüm kataloğu (bundle'a girmez, fetch edilir)
```

`engine/` kendi başına ayakta duran bir pakettir; arayüz onu yalnızca
`engine/index.js` üzerinden kullanır. Entegrasyon kuralları:
**[engine/CONTRACT.md](engine/CONTRACT.md)**.

## Nasıl çalışıyor

Her cevap persona profilini (14 boyut), kariyer ailesi sıralamasını (15 aile)
ve **bir sonraki soruyu** değiştirir. 80 soruluk havuzdan oturum başına 10
soru seçilir:

1–3 geniş keşif · 4–6 derinleşme · 7–9 ayrıştırma · 10 tutarlılık kontrolü

Geri dönüp bir cevabı değiştirdiğinde o adımdan sonrası skordan tamamen düşer
ve yol yeniden kurulur. Aynı durumdan A ve B farklı yollara gider (gerçek
yollarda %94,4 ayrışma).

Sonuçta persona uyumu ile veriden gelen erişilebilirlik **ayrı** gösterilir.
Tercih formundaki şehir, üniversite türü, eğitim dili ve burs koşulu bölüm
sıralamasına girer ama hiçbir bölümü listeden silmez.

## Veri

| | |
|---|---|
| Kaynak | YÖK Atlas 2026 kılavuzu, 12.09.2026'da çekildi |
| Kapsam | 21.493 program · 634 bölüm grubu · 228 üniversite |
| Puan/sıra | 2026 + önceki 3 yılın taban puanı ve başarı sırası |

Veriyi yeniden üretmek için (kaynak ZIP depoda değildir, dışarıda durur):

```bash
cd engine && python3 scripts/build_program_catalog.py /yol/yokatlas-2026-csv.zip ../public/overfit-data
```

Soru metinlerini değiştirdikten sonra:

```bash
cd engine && python3 scripts/author_questions.py && cp data/questions.tr.json ../public/overfit-data/
```

## Bilinçli sınırlar

Bunlar eksiklik değil, kasıtlı kararlardır; demo ve sunumda da böyle
anlatılmalıdır.

- **Sorular `draft`.** Editoryal inceleme (seçenek dengesi, yönlendirici dil,
  yaşa uygunluk, kültürel önyargı) tamamlanmadan `active` sayılmamalı.
- **Kariyer ailesi ağırlıkları veriden gelmiyor.** YÖK Atlas 2026'da Meslek
  Atlası ve Mezun Başarı Atlası kaldırıldı; "bu bölümü okuyan ne iş yapar"
  sorusunun kamuya açık bir kaynağı yok. Bütün varsayımlar tek dosyada:
  `engine/src/career-families.js`.
- **Eksik değer tahmin edilmez.** 3.242 programın 2026 taban sırası
  yayımlanmamış; bu alanlar `null` kalır, sıfıra çevrilmez ve arayüzde nedeni
  yazar.
- **Tavan puan yok.** ÖSYM Tablo-3/4 belge sunucusu programatik indirmeyi
  reddediyor, elde yalnızca taban var. Arayüz bu yüzden "taban" dili kullanır.
- **Netler bir dağılım değil.** Yayımlanan tek şey "yerleşen son kişi"nin
  netleri; bu yüzden net tabanlı şans tahmini yapılmaz.
- **Her program yalnızca kendi puan türüyle karşılaştırılır.** SAY sırası bir
  TYT programı hakkında bir şey söylemez. Aday girmediği bir puan türünde
  bölüm göremez; sonuç ekranı bunu açıkça söyler.
- **Maaş aralıkları kaynaksızdır.** YÖK Atlas mezun gelir verisi yayımlamıyor.
- Sonuçlar yerleştirme olasılığı ya da psikolojik değerlendirme değildir.
  **Bağlayıcı kaynak ÖSYM'nin güncel kılavuzudur.**

## Veri sahipliği

Veri YÖK ve ÖSYM'ye aittir. Depo private'tır; herhangi bir yeniden yayım
öncesinde ilgili kurumların kullanım şartları kontrol edilmelidir.
