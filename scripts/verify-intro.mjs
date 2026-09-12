// Giriş deneyimini headless tarayıcıda doğrular ve ekran görüntüleri alır.
// Kullanım: node scripts/verify-intro.mjs
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const OUT = "verify-shots";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath:
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
  args: ["--use-angle=default", "--enable-unsafe-swiftshader"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 640 });

const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(String(err)));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await page.goto("http://localhost:5199", { waitUntil: "networkidle0" });
await sleep(3500); // WebGL sahnelerinin oturması için
await page.screenshot({ path: `${OUT}/1-landing.png` });

// Fare paralaksı: imleci sağ üste taşı
await page.mouse.move(1200, 200);
await sleep(800);
await page.screenshot({ path: `${OUT}/2-parallax.png` });

// Zoom geçişi (3D buton: yazının koordinatına tıkla, tıklama canvas'a düşer)
await page.mouse.move(640, 320);
const kesfet = await page.waitForSelector(
  "xpath///span[contains(., 'Kendini Keşfet')]",
);
await kesfet.click();
await sleep(1000); // uçuş ortası
await page.screenshot({ path: `${OUT}/3-zoom-mid.png` });
await sleep(4000); // beyaz perde + robot girişi + daktilo animasyonu
await page.screenshot({ path: `${OUT}/4-robot.png` });

// Seçim → butonun içine uçuş → boş sayfa
const puanVar = await page.waitForSelector(
  "xpath///span[contains(., 'YKS PUANIM VAR')]",
);
await puanVar.click();
await sleep(800); // uçuş ortası
await page.screenshot({ path: `${OUT}/5-exit-mid.png` });
await sleep(2000); // beyaz perde + boş sayfa
await page.screenshot({ path: `${OUT}/6-placeholder.png` });

// Boş sayfa geldi mi?
await page.waitForSelector("xpath///h1[contains(., 'YKS Puanım Var')]", {
  timeout: 5000,
});

await browser.close();

if (errors.length) {
  console.log("KONSOL HATALARI:");
  for (const e of errors) console.log(" -", e);
  process.exit(1);
}
console.log("OK — hata yok, ekran görüntüleri verify-shots/ altında.");
process.exit(0);
