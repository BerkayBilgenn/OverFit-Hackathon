# OverFit Hackathon

OverFit, "YKS puanım var" ve "YKS puanım yok" girişleri için iki ayrı kullanıcı akışı sunar. İlgi alanları, çalışma tercihleri ve gelecek hedeflerinden kişiselleştirilmiş kariyer ve bölüm önerileri üretmeyi amaçlar.

## Ürün belgeleri

- [İki ayrı YKS persona ve bölüm öneri pipeline'ı](docs/yks-persona-questionnaire-pipeline.md)

## Pusula — Giriş deneyimi

Three.js ile geliştirilen 3D giriş akışı:

- Fare ile etkileşimli 3D pusula logosu (paralaks, salınan ibre)
- Animasyonlu 3D "Kendini Keşfet" butonu ve pusulanın içine uçuş geçişi
- Tercih robotu ROTA ve avuçlarındaki 3D "YKS PUANIM VAR / YOK" butonları
- Seçim sonrası animasyonlu çıkış geçişi

## Teknolojiler

- React 19 + Vite
- TypeScript
- Tailwind CSS 4
- Three.js + React Three Fiber + Drei
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

- 3D giriş deneyimi (pusula + ROTA robotu)
- Üst bar ve adım göstergesi
- Profil özet kartı
- Tahmin metrik kartları
- Dallanan hikaye zaman çizelgesi (tıklanabilir seçimler)
- Sosyal karşılaştırma
- "Ne olurdu?" karşılaştırması
