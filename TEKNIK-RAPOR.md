# Pusula — Teknik Rapor

**OverFit Hackathon · 12 Eylül 2026**

> Pusula, YKS tercih dönemindeki öğrencinin en kritik iki sorusunu —
> "puanımla nereye girebilirim?" ve "puanım olmadan neye yönelmeliyim?" —
> tek deneyimde birleştiren bir üniversite ve kariyer tercih simülatörüdür.

---

## 1. Problem

Tercih döneminde adaylar üç temel sorunla karşılaşır:

1. **Kararsızlık:** Puanı olmayan ya da alanını bilmeyen öğrenci, mevcut
   araçların "puan gir → liste al" kalıbına hiç giremez.
2. **Veri güveni:** Öneri sunan sitelerin çoğu kaynağını göstermez; eski yıl
   verisiyle ya da tahminle konuşur.
3. **Soğuk deneyim:** Tercih araçları form doldurma ekranıdır; stresli bir
   dönemdeki 18 yaşındaki kullanıcı için caydırıcıdır.

## 2. Çözüm

Pusula bu üç sorunu doğrudan hedefler:

| Problem | Çözümümüz |
|---|---|
| Kararsızlık | Puan gerektirmeyen **adaptif yönelim analizi**: 80 soruluk havuzdan oturum başına 10 soru, 14 boyutlu persona profili |
| Veri güveni | **Gerçek YÖK Atlas 2026 verisi**: 21.493 program, 634 bölüm grubu, 228 üniversite; eksik veri asla tahmin edilmez |
| Soğuk deneyim | **3D sinematik giriş** ve soruları soran sevimli robot karakteri **ROTA** |

Kullanıcı yolculuğu:

```
3D Pusula → "Kendini Keşfet" → pusulanın içine uçuş → ROTA ile tanışma
  ├─ YKS puanım var  → puan formu → tercih koşulları → 10 soru → analiz → sonuç
  └─ YKS puanım yok  → tercih koşulları → 10 soru → analiz → sonuç
```

## 3. Teknoloji Yığını

| Katman | Teknoloji | Neden |
|---|---|---|
| UI | **React 19 + TypeScript** | Bileşen modeli, tip güvenliği |
| Derleyici | **Vite 7** | Anında HMR, hızlı üretim derlemesi |
| Stil | **Tailwind CSS v4** + özel CSS | Token tabanlı tema, hızlı iterasyon |
| 3D | **Three.js + React Three Fiber + drei** | Bildirgesel sahne grafı, hazır ışık/geometri ilkelleri |
| Soru motoru | **Saf JS (ES modülleri), sıfır bağımlılık** | Bağımsız test edilebilir paket, UI'dan tamamen ayrık |
| Veri hattı | **Python 3 (standart kütüphane)** | YÖK Atlas ZIP'inden kompakt JSON katalog üretimi |
| E2E doğrulama | **Puppeteer (headless Edge)** | Her adımın ekran görüntüsüyle uçtan uca akış testi |
| CI | **GitHub Actions** | Motor testleri (Node) + katalog testleri (Python) + derleme |

## 4. Mimari

Üç katman, tek yönlü bağımlılık:

```
src/intro/       3D giriş deneyimi (pusula, ROTA robotu, arka plan)
src/analysis/    Akış UI'ı: puan formu → tercihler → quiz → analiz → sonuç
engine/          Adaptif soru motoru — bağımsız, bağımlılıksız paket
public/overfit-data/   Soru bankası + bölüm kataloğu (bundle'a girmez, fetch edilir)
```

Kritik tasarım kararları:

- **Motor bir pakettir, uygulamanın parçası değil.** UI motoru yalnızca
  `engine/index.js` üzerinden görür; dönüşümler tek noktadadır
  (`src/analysis/data/overfitBridge.ts`). Sözleşme `engine/CONTRACT.md`
  ile kilitlenmiştir ve sözleşme testleriyle korunur.
- **Veri bundle'a girmez.** 3,2 MB'lık katalog `public/` altından fetch
  edilir; ilk yükleme hızlı kalır.
- **Oturum düz JSON'dur.** Tüm quiz durumu serileştirilebilir; geri alma ve
  "yanıtları gözden geçir" bu sayede sıfır özel durum yönetimiyle çalışır.

## 5. Çözdüğümüz Teknik Problemler

### 5.1 Adaptif soru seçimi (motorun kalbi)

Her cevap 14 boyutlu persona profilini, 15 kariyer ailesinin sıralamasını ve
**bir sonraki soruyu** değiştirir. Soru seçimi dört bileşenle puanlanır:
önceki cevabın açtığı odakla örtüşme, henüz ölçülmemiş boyutlar, ilk iki
kariyer ailesini ayırma gücü ve sabit öncelik. Oturum aşama planına uyar:
1–3 geniş keşif, 4–6 derinleşme, 7–9 ayrıştırma, 10 tutarlılık kontrolü.

**Ölçtüğümüz sonuç:** aynı durumdan A ve B seçenekleri gerçek yollarda
**%94,4** oranında farklı sonraki soruya götürür — ayrışma zorlanmaz,
bilgi kazancından doğar.

### 5.2 Deterministik geri alma

Kullanıcı geri dönüp bir cevabı değiştirdiğinde o adımdan sonrası skordan
tamamen düşer ve yol yeniden kurulur. Profil her zaman saklanan cevaplardan
sıfırdan hesaplandığı için "kirli durum" imkânsızdır; aynı cevap dizisi her
zaman aynı yolu üretir (testle kilitli).

### 5.3 Gerçek veriyle dürüst eşleştirme

- Her program **yalnızca kendi puan türüyle** karşılaştırılır; SAY sırası bir
  TYT programı hakkında bir şey söylemez.
- 3.242 programın 2026 taban sırası yayımlanmamıştır — bu hücreler `null`
  kalır, sıfıra çevrilmez ve arayüzde nedeni açıkça yazar.
- Tercih koşulları (şehir, üniversite türü, dil, burs) sıralamayı daraltır
  ama **hiçbir bölümü listeden silmez**; uygun olmayan grup geriye itilir.

### 5.4 3D giriş deneyimi

- **Responsive kamera:** pusula ve robot, ekran oranından bağımsız olarak
  her zaman kadrajın aynı yüzdesini kaplar (mesafe, fov ve aspect'ten
  her karede hesaplanır).
- **Ekrana ankrajlı 3D buton:** "Kendini Keşfet" kapsülü dünya
  koordinatında değil, görünüm hacmine göre konumlanır; hiçbir ekranda
  pusulanın arkasına kaçmaz.
- **Faz durum makinesi:** landing → zooming → robot → exiting; geçişler
  beyaz perde arkasında kamera uçuşlarıyla (easeInOutCubic) yapılır.
- **Çevrimdışı ışıklandırma:** doku ve HDRI indirilmez; radyal gradyanlar
  `CanvasTexture` ile prosedürel üretilir, metalik yansımalar `Lightformer`
  tabanlı yerel environment ile sağlanır.

### 5.5 ROTA karakterinin yeniden kullanımı

ROTA yalnızca girişte değil, tüm deneyimde yaşar: quiz ekranında soruyu
"soran" bir eşlikçidir (konuşma balonu düzeni), analiz geçiş ekranında
dönen ışıklı halkanın merkezinde durur. Tek bileşen, `withButtons` gibi
prop'larla üç farklı bağlamda kullanılır; kafa imleci takip eder, göz
kırpar, göğüs ışığı nefes alır.

### 5.6 Tema bütünlüğü

Giriş deneyimi (Tailwind token'ları) ile analiz akışı (özel CSS) iki ayrı
zaman diliminde yazıldığı için cascade çakışması yaşandı; çözüm, temayı
`body` yerine `.analysis-shell` kapsayıcısında tanımlayarak yükleme
sırasından bağımsız hale getirmekti.

## 6. Test ve Doğrulama

| Katman | Kapsam | Sonuç |
|---|---|---|
| Motor (Node `--test`) | API sözleşmesi, adaptif seçim, geri alma, determinizm, eşleştirme | **59 test** |
| Katalog üretici (Python `unittest`) | Sütunlu tablo, sıra bantları, aile eşlemesi, deterministik çıktı | **12 test** |
| E2E (Puppeteer) | landing → zoom → robot → form → quiz → analiz → sonuç, her adımda ekran görüntüsü | `scripts/verify-intro.mjs` |
| CI (GitHub Actions) | PR'larda motor + katalog + derleme | `engine-ci.yml` |

## 7. Bilinçli Sınırlar

Bunlar eksiklik değil, kasıtlı ürün kararlarıdır:

- **Sorular `draft` durumda.** Editoryal inceleme bitmeden `active`
  sayılmazlar.
- **Kariyer ailesi ağırlıkları editoryal varsayımdır.** YÖK Atlas 2026'da
  Meslek Atlası kaldırıldığı için kamuya açık kaynak yok; tüm varsayımlar
  tek dosyada (`engine/src/career-families.js`).
- **Tavan puanı ve maaş verisi yok.** ÖSYM belge sunucusu programatik
  erişimi reddediyor; arayüz bu yüzden yalnızca "taban" dili kullanır.
- Sonuçlar yerleştirme olasılığı ya da psikolojik değerlendirme değildir;
  **bağlayıcı kaynak ÖSYM'nin güncel kılavuzudur.**

## 8. Takım Çalışması

- İki paralel iş kolu (3D giriş deneyimi / analiz akışı + motor) feature
  branch'leri ve PR'larla birleştirildi; motor, `git subtree` ile **commit
  geçmişi korunarak** depoya alındı.
- Çakışan dosyalarda rebase/merge stratejisi; her PR'da CI + headless
  tarayıcı doğrulaması.

---

*Veri YÖK ve ÖSYM'ye aittir. Depo private'tır; yeniden yayımdan önce ilgili
kurumların kullanım şartları kontrol edilmelidir.*
