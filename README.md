# Patika

Lise ve üniversite öğrencilerinin bölüm ve kariyer seçimlerini simüle eden web uygulaması — sonuç ekranı arayüzü.

Logo: yukarı doğru yükselen kariyer yolu ve dallanan seçim noktaları.

## Teknolojiler

- React 19 + Vite
- TypeScript
- Tailwind CSS 4
- Radix UI (Dialog)

## Geliştirme

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini açın.

## Veri modeli

Mock veri: `src/data/mockResultData.ts`  
TypeScript tipleri: `src/data/types.ts`  
JSON Schema: `src/data/schema/simulation-result.schema.json`

İleride YÖK/TÜİK API yanıtları bu şemaya map edilerek kullanılabilir.

## Bölümler

- Üst bar ve adım göstergesi
- Profil özet kartı
- Tahmin metrik kartları
- Dallanan hikaye zaman çizelgesi (tıklanabilir seçimler)
- Sosyal karşılaştırma
- "Ne olurdu?" karşılaştırması
