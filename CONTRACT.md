# Entegrasyon Sözleşmesi

UI tarafının bilmesi gereken her şey burada. Bu yüzey `tests/api-contract.test.mjs`
ile kilitli; değişirse test kırılır. **`src/` içine elle dokunma** — aşağıdaki API
neye ihtiyacın varsa onu veriyor, eksik bir şey varsa issue aç.

## Kurulum

```bash
npm i github:KULLANICI/overfit-soru-motoru
```

## En kısa kullanım

```js
import { createOverfit } from "@overfit/soru-motoru";

// data/ klasörünü statik olarak servis et (Next: public/overfit-data)
const overfit = await createOverfit({ dataUrl: "/overfit-data" });

let state = overfit.start({ audience: "score_known", academic: { scoreType: "SAY", rank: 65000 } });

const q = overfit.question(state);
// { id, text, stage, questionFamily, step: 1, total: 10, canGoBack: false,
//   options: [{ id: "a", text: "..." }, { id: "b", text: "..." }] }

state = overfit.answer(state, "a");     // sonraki soru otomatik seçilir
state = overfit.back(state);            // bir adım geri
state = overfit.changeAnswer(state, 3, "b"); // 4. cevabı değiştir, sonrasını sil

if (overfit.isFinished(state)) {
  const result = overfit.results(state);
}
```

Bundler ile JSON'ları kendin import etmek istersen:

```js
import questions from "@overfit/soru-motoru/data/questions.tr.json";
import groups from "@overfit/soru-motoru/data/program-groups.json";
const overfit = await createOverfit({ data: { questions, groups, programs: null } });
```

## API

| Çağrı | Döner | Not |
|---|---|---|
| `createOverfit({ dataUrl })` | `overfit` | `{ data }` ile hazır JSON da verilebilir |
| `overfit.start({ audience, academic })` | `state` | `audience`: `"score_known"` \| `"score_unknown"` |
| `overfit.question(state)` | soru nesnesi \| `null` | Bitmişse `null` |
| `overfit.answer(state, "a"\|"b")` | yeni `state` | Girdi **değişmez**, yeni nesne döner |
| `overfit.back(state)` | yeni `state` | İlk adımda aynı state döner |
| `overfit.changeAnswer(state, index, optionId)` | yeni `state` | Sonraki cevaplar silinir, yol yeniden kurulur |
| `overfit.isFinished(state)` | `boolean` | 10 cevaptan sonra `true` |
| `overfit.results(state)` | sonuç nesnesi | Aşağıda |
| `overfit.restore(savedJson)` | `state` \| `null` | Sürüm uymazsa `null` — temiz başlat |
| `overfit.explain(state)` | test paneli verisi | **Kullanıcıya gösterilmez** |

`results(state)`:

```js
{
  summaryText,                                  // hazır Türkçe özet cümlesi
  signals:  [{ dimension, value, label }],      // en güçlü 5 sinyal
  families: [{ id, label, summary, score }],    // ilk 3 kariyer ailesi
  allFamilies,                                  // 15'inin tamamı
  groups:   [{ id, name, family, programCount, levels, scoreTypes,
               rankBand, samples, personaScore, score, access }],
  academic,                                     // girilen puan türü + sıra (yoksa null)
  warnings: [string]                            // ekranda gösterilmesi gereken uyarılar
}
```

`group.access` yalnızca başarı sırası girildiyse dolu:
`{ scoreType, userRank, reachable, withRank, withoutRank, sampled, closest }`.

## Uyulması gerekenler

- **`state` düz JSON'dur.** React state'ine, `localStorage`'a, sunucu oturumuna
  olduğu gibi konur. Mutasyona uğratma; her çağrı yeni nesne döndürür.
- **`warnings` dizisini ekrana bas.** İçinde "sorular henüz draft", "başarı sırası
  girilmedi", "şu boyutlar hiç ölçülmedi" gibi dürüstlük uyarıları var.
- **Yayımlanmamış veriyi sayıya çevirme.** `rankBand` boşsa "taban sırası
  yayımlanmamış" yaz; 0 yazma.
- **"Taban" dilini koru.** Elimizde tavan puan yok. "Kesin girersin",
  "%X ihtimalle" gibi ifadeler veriyle desteklenmiyor.
- **Kaynak bildirimi her ekranda.** `overfit.source.notice` bunu hazır veriyor:
  bağlayıcı kaynak ÖSYM'nin güncel kılavuzudur.
- **`programs.min.json` 3,2 MB.** Ana bundle'a koyma. Ya statik servis et
  (`dataUrl`), ya da sonuç ekranında lazy yükle. Bölüm grubu listesine ihtiyacın
  yoksa `programs: null` geç — motor yine çalışır, `groups` boş döner.

## Sürüm

`STATE_VERSION` değişirse kayıtlı oturumlar geçersizdir; `restore()` `null`
döner ve kullanıcıya temiz başlangıç göstermelisin. Soru bankası değişikliği
oturum biçimini bozmaz.
