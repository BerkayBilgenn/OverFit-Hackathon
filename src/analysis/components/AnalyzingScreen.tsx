import { useEffect, useRef, useState } from "react";
import { RobotCompanion } from "./RobotCompanion";

/**
 * Son sorudan sonra sonuç ekranından önce gösterilen geçiş perdesi:
 * dönen ışıklı halka + ROTA robotu + dolan ilerleme çubuğu ve
 * aşamaya göre değişen durum mesajları. Bar dolunca onDone çağrılır.
 */

const MESSAGES: { until: number; text: string }[] = [
  { until: 30, text: "Rota cevaplarını analiz ediyor…" },
  { until: 55, text: "Rota kariyer ailelerini eşleştiriyor…" },
  { until: 80, text: "Rota sana uygun programları tarıyor…" },
  { until: 96, text: "Rota sonuçlarını hazırlıyor…" },
  { until: 101, text: "Analizin hazır!" },
];

const DURATION = 5200; // ms — barın dolma süresi

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function AnalyzingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      setProgress(Math.round(easeInOutCubic(t) * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Bar dolduktan kısa süre sonra sonuç sayfasına geç
  useEffect(() => {
    if (progress < 100 || done.current) return;
    done.current = true;
    const timeout = window.setTimeout(onDone, 750);
    return () => window.clearTimeout(timeout);
  }, [progress, onDone]);

  const message = MESSAGES.find((m) => progress < m.until)?.text ?? MESSAGES[0].text;

  return (
    <section className="analysis-page">
      <div className="analyzing-wrap">
        <div className="analyzing-stage">
          {/* Dönen ışıklı halka */}
          <svg className="analyzing-ring" viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              <linearGradient id="analyzing-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7ea0ff" />
                <stop offset="100%" stopColor="#e63946" />
              </linearGradient>
            </defs>
            <circle
              cx="100" cy="100" r="92" fill="none"
              stroke="rgba(126, 160, 255, 0.12)" strokeWidth="2.5"
            />
            <circle
              className="ring-arc"
              cx="100" cy="100" r="92" fill="none"
              stroke="url(#analyzing-ring-gradient)" strokeWidth="3"
              strokeLinecap="round" strokeDasharray="150 428"
            />
          </svg>
          <RobotCompanion />
        </div>

        {/* Mesaj değişiminde yumuşak geçiş için key */}
        <p key={message} className="analyzing-status">{message}</p>

        <div className="analyzing-bar">
          <i style={{ width: `${progress}%` }} />
        </div>
        <span className="analyzing-percent">%{progress}</span>
      </div>
    </section>
  );
}
