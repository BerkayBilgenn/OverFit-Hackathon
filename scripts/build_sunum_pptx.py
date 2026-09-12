"""Pusula sunum destesini PPTX olarak üretir.

Kullanım: python scripts/build_sunum_pptx.py
Çıktı:   sunum/Pusula-Sunum.pptx  (16:9, 10 slayt)
Görseller sunum/gorseller/ altından alınır.
"""

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Emu, Inches, Pt

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "sunum" / "gorseller"
OUT = ROOT / "sunum" / "Pusula-Sunum.pptx"

# Tema (proje paleti)
BG = RGBColor(0x06, 0x0D, 0x1F)
CARD = RGBColor(0x0E, 0x1F, 0x3A)
RED = RGBColor(0xE6, 0x39, 0x46)
WHITE = RGBColor(0xF2, 0xF5, 0xFA)
MUTED = RGBColor(0x9E, 0xAC, 0xC0)
LINE = RGBColor(0x2C, 0x4A, 0x80)

FONT = "Segoe UI"
SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

prs = Presentation()
prs.slide_width = SLIDE_W
prs.slide_height = SLIDE_H
BLANK = prs.slide_layouts[6]


def new_slide():
    slide = prs.slides.add_slide(BLANK)
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = BG
    return slide


def textbox(slide, x, y, w, h, lines, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.TOP):
    """lines: [(metin, punto, renk, kalın, harf_aralığı), ...]"""
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    for i, (text, size, color, bold) in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        run = p.add_run()
        run.text = text
        run.font.name = FONT
        run.font.size = Pt(size)
        run.font.color.rgb = color
        run.font.bold = bold
    return tb


def eyebrow(slide, text, y=Inches(0.55)):
    textbox(slide, Inches(0.5), y, Inches(12.333), Inches(0.4),
            [(text.upper(), 13, RED, True)])


def title(slide, text, y=Inches(0.95), size=40):
    textbox(slide, Inches(0.5), y, Inches(12.333), Inches(1.0),
            [(text, size, WHITE, True)])


def sub(slide, text, y=Inches(1.85), size=15, h=Inches(1.1)):
    textbox(slide, Inches(1.6), y, Inches(10.13), h,
            [(text, size, MUTED, False)])


def picture(slide, name, y, w_in, x=None):
    path = IMG / name
    if x is None:
        x = Emu(int((SLIDE_W - Inches(w_in)) / 2))
    pic = slide.shapes.add_picture(str(path), x, y, width=Inches(w_in))
    pic.line.color.rgb = LINE
    pic.line.width = Pt(1)
    return pic


def card(slide, x, y, w, h, head, body):
    box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    box.fill.solid()
    box.fill.fore_color.rgb = CARD
    box.line.color.rgb = LINE
    box.line.width = Pt(1)
    box.shadow.inherit = False
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.18)
    tf.margin_right = Inches(0.18)
    tf.margin_top = Inches(0.14)
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    r = p.add_run(); r.text = head
    r.font.name = FONT; r.font.size = Pt(15); r.font.bold = True; r.font.color.rgb = WHITE
    p2 = tf.add_paragraph(); p2.alignment = PP_ALIGN.LEFT
    r2 = p2.add_run(); r2.text = body
    r2.font.name = FONT; r2.font.size = Pt(12); r2.font.color.rgb = MUTED
    return box


def stat(slide, x, y, number, label):
    textbox(slide, x, y, Inches(2.2), Inches(1.0),
            [(number, 34, RED, True)], align=PP_ALIGN.CENTER)
    textbox(slide, x, y + Inches(0.62), Inches(2.2), Inches(0.4),
            [(label.upper(), 10, MUTED, False)], align=PP_ALIGN.CENTER)


def bullets(slide, items, y=Inches(2.1), size=14, x=Inches(1.3), w=Inches(10.7)):
    tb = slide.shapes.add_textbox(x, y, w, Inches(4.2))
    tf = tb.text_frame
    tf.word_wrap = True
    for i, (head, body) in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_after = Pt(12)
        r = p.add_run(); r.text = "▸ "
        r.font.name = FONT; r.font.size = Pt(size); r.font.color.rgb = RED; r.font.bold = True
        r2 = p.add_run(); r2.text = head + " "
        r2.font.name = FONT; r2.font.size = Pt(size); r2.font.color.rgb = WHITE; r2.font.bold = True
        r3 = p.add_run(); r3.text = body
        r3.font.name = FONT; r3.font.size = Pt(size); r3.font.color.rgb = MUTED
    return tb


# ── 1 · KAPAK ─────────────────────────────────────────────────────────
s = new_slide()
textbox(s, Inches(0.5), Inches(0.6), Inches(12.333), Inches(0.4),
        [("OVERFIT HACKATHON · 2026", 13, RED, True)])
textbox(s, Inches(0.5), Inches(1.0), Inches(12.333), Inches(1.3),
        [("PUSULA", 66, WHITE, True)])
textbox(s, Inches(1.6), Inches(2.15), Inches(10.13), Inches(0.9),
        [("Üniversite ve kariyer tercih simülatörü — 3D giriş deneyimi, "
          "adaptif yönelim analizi ve gerçek YÖK Atlas 2026 verisi.", 15, MUTED, False)])
picture(s, "1-landing.png", Inches(3.1), 8.6)

# ── 2 · PROBLEM ───────────────────────────────────────────────────────
s = new_slide()
eyebrow(s, "Problem")
title(s, "Tercih dönemi üç duvara çarpıyor")
card(s, Inches(0.9), Inches(2.6), Inches(3.7), Inches(2.6), "01 · Kararsızlık",
     "Puanı olmayan ya da alanını bilmeyen öğrenci, “puan gir → liste al” kalıbına hiç giremiyor.")
card(s, Inches(4.82), Inches(2.6), Inches(3.7), Inches(2.6), "02 · Veri güveni",
     "Öneri siteleri kaynağını göstermiyor; eski yıl verisiyle ya da tahminle konuşuyor.")
card(s, Inches(8.74), Inches(2.6), Inches(3.7), Inches(2.6), "03 · Soğuk deneyim",
     "Tercih araçları form ekranı; stresli dönemdeki 18 yaşındaki kullanıcı için caydırıcı.")

# ── 3 · ÇÖZÜM ─────────────────────────────────────────────────────────
s = new_slide()
eyebrow(s, "Çözüm")
title(s, "Tek deneyim, iki akış")
sub(s, "Puanı olan da olmayan da aynı sinematik girişten geçer; ROTA robotu karşılar, "
       "10 adaptif soruyla yönelimi çıkarır, sonuç gerçek veriye dayanır.")
steps = ["3D Pusula", "ROTA ile tanışma", "Puanım var / yok", "10 adaptif soru", "Analiz", "Bölüm önerileri"]
x = Inches(0.7)
for i, step in enumerate(steps):
    hot = i in (2, 5)
    box = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, Inches(3.6), Inches(1.78), Inches(0.62))
    box.fill.solid()
    box.fill.fore_color.rgb = RED if hot else CARD
    box.line.color.rgb = RED if hot else LINE
    box.line.width = Pt(1)
    box.shadow.inherit = False
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run(); r.text = step
    r.font.name = FONT; r.font.size = Pt(11.5); r.font.bold = True; r.font.color.rgb = WHITE
    x += Inches(1.78)
    if i < len(steps) - 1:
        textbox(s, x, Inches(3.66), Inches(0.3), Inches(0.5), [("→", 16, RED, True)])
        x += Inches(0.3)

# ── 4 · 3D GİRİŞ ──────────────────────────────────────────────────────
s = new_slide()
eyebrow(s, "Deneyim · 1")
title(s, "Pusulanın içine uçuş")
sub(s, "Three.js ile modellenen metal pusula fareyi takip eder; “Kendini Keşfet” butonu cam yüzeyin "
       "üzerinde süzülür. Tıklayınca kamera pusulanın içine uçar ve beyaz perdenin arkasında sahne değişir.")
picture(s, "1-landing.png", Inches(3.0), 5.4, x=Inches(0.9))
picture(s, "3-zoom-mid.png", Inches(3.0), 5.4, x=Inches(7.03))

# ── 5 · ROTA ──────────────────────────────────────────────────────────
s = new_slide()
eyebrow(s, "Deneyim · 2")
title(s, "ROTA ile tanışma")
sub(s, "Sevimli robot ROTA, iki avucunda “YKS Puanım Var / Yok” seçimini sunar. Kafası imleci takip eder, "
       "göz kırpar; arkada kariyer temalı süzülen objeler ve dönen pusula gülü derinlik katar.")
picture(s, "4-robot.png", Inches(2.9), 8.6)

# ── 6 · QUIZ ──────────────────────────────────────────────────────────
s = new_slide()
eyebrow(s, "Deneyim · 3")
title(s, "Soruyu ROTA sorar")
sub(s, "Tercih koşullarının ardından 10 adaptif soru başlar. Soru kartı, ROTA'ya dönük kuyruğuyla bir "
       "konuşma balonudur — robot quiz boyunca kullanıcıya eşlik eder.")
picture(s, "6-preferences.png", Inches(3.0), 5.4, x=Inches(0.9))
picture(s, "7-quiz-robot.png", Inches(3.0), 5.4, x=Inches(7.03))

# ── 7 · ANALİZ GEÇİŞİ ─────────────────────────────────────────────────
s = new_slide()
eyebrow(s, "Deneyim · 4")
title(s, "Analiz anı hissettirir")
sub(s, "Son sorudan sonra dönen ışıklı halkanın merkezinde ROTA belirir; alttaki bar dolarken "
       "“Rota cevaplarını analiz ediyor…” mesajları akar. Bar dolunca sonuç sayfası açılır.")
picture(s, "8-analyzing.png", Inches(2.9), 8.6)

# ── 8 · SONUÇ + VERİ ──────────────────────────────────────────────────
s = new_slide()
eyebrow(s, "Sonuç")
title(s, "Öneri değil, veriye dayalı eşleştirme", size=36)
sub(s, "Persona uyumu ile veriden gelen erişilebilirlik ayrı gösterilir. Her program yalnızca kendi puan "
       "türüyle karşılaştırılır; yayımlanmamış sıra asla tahmin edilmez, nedeni açıkça yazılır.", h=Inches(0.9))
picture(s, "9-result.png", Inches(2.75), 7.4)
for i, (num, label) in enumerate([("21.493", "program"), ("634", "bölüm grubu"),
                                  ("228", "üniversite"), ("2026", "YÖK Atlas")]):
    stat(s, Inches(1.5 + i * 2.6), Inches(6.15), num, label)

# ── 9 · TEKNİK ────────────────────────────────────────────────────────
s = new_slide()
eyebrow(s, "Teknik")
title(s, "Motor, arayüzden bağımsız bir paket", size=36)
bullets(s, [
    ("Adaptif soru motoru:", "80 soruluk havuz, 14 persona boyutu, 15 kariyer ailesi; her cevap bir "
     "sonraki soruyu bilgi kazancına göre değiştirir — gerçek yollarda %94,4 ayrışma."),
    ("Deterministik geri alma:", "cevap değişince sonrası skordan tamamen düşer, yol yeniden kurulur; "
     "aynı cevap dizisi her zaman aynı sonucu üretir."),
    ("Sıfır bağımlılık:", "motor saf JS; UI onu tek sözleşme noktasından (CONTRACT.md) kullanır, "
     "3,2 MB katalog bundle dışından fetch edilir."),
    ("3D katman:", "responsive kamera her ekranda aynı kadrajı korur; ışıklar prosedürel — hiçbir doku "
     "indirilmez, tamamen çevrimdışı çalışır."),
], y=Inches(2.0))
for i, (num, label) in enumerate([("59", "motor testi"), ("12", "katalog testi"),
                                  ("E2E", "puppeteer"), ("CI", "GitHub Actions")]):
    stat(s, Inches(1.5 + i * 2.6), Inches(6.0), num, label)

# ── 10 · KAPANIŞ ──────────────────────────────────────────────────────
s = new_slide()
eyebrow(s, "Kapanış")
title(s, "PUSULA ile herkes yolunu bulur", size=38)
sub(s, "Puanı olan da olmayan da. Dürüst veri, sevimli bir yol arkadaşı ve gerçekten adaptif bir analiz.")
bullets(s, [
    ("Bilinçli sınırlar:", "sorular editoryal incelemede (draft), kariyer ailesi ağırlıkları tek dosyada "
     "şeffaf varsayım, bağlayıcı kaynak her zaman ÖSYM kılavuzu."),
    ("Sonraki adım:", "soruların pedagojik validasyonu, sonuç ekranında şehir karşılaştırması, "
     "PWA ile offline tercih listesi."),
], y=Inches(2.6))
textbox(s, Inches(0.5), Inches(6.6), Inches(12.333), Inches(0.4),
        [("github.com/BerkayBilgenn/OverFit-Hackathon · Veri YÖK ve ÖSYM'ye aittir", 11, MUTED, False)])

prs.save(OUT)
print(f"OK - {len(prs.slides._sldIdLst)} slayt -> {OUT}")
