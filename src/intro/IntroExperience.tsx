import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, Stars } from "@react-three/drei";
import * as THREE from "three";
import { Compass } from "./Compass";
import { DiscoverButton } from "./DiscoverButton";
import { Robot } from "./Robot";

export type IntroChoice = "withScore" | "withoutScore";

type Phase = "landing" | "zooming" | "robot" | "exiting";

const ZOOM_DURATION = 2; // saniye
const EXIT_DURATION = 1.5; // saniye

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

const COMPASS_RADIUS = 2.75; // dış halka + taşıma halkası payı
const HALF_FOV_TAN = Math.tan(THREE.MathUtils.degToRad(45 / 2));

/** Pusulanın ekran yüksekliğinin ~%62'sini, genişliğin ~%85'ini geçmemesi için gereken kamera mesafesi */
function compassDistance(aspect: number) {
  return Math.max(
    COMPASS_RADIUS / (HALF_FOV_TAN * 0.62),
    COMPASS_RADIUS / (HALF_FOV_TAN * aspect * 0.85),
  );
}

/** Robot ve el butonlarının kadraja sığması için gereken kamera mesafesi */
function robotDistance(aspect: number) {
  return Math.max(8.2, 2.3 / (HALF_FOV_TAN * aspect * 0.8));
}

/** Kamera yönetimi: landing → pusulanın içine uçuş → robot → seçim butonuna uçuş */
function CameraRig({
  phase,
  exitSide,
  onZoomComplete,
  onExitComplete,
}: {
  phase: Phase;
  exitSide: 1 | -1;
  onZoomComplete: () => void;
  onExitComplete: () => void;
}) {
  const progress = useRef(0);
  const completed = useRef(false);
  const settled = useRef(false);
  const prevPhase = useRef<Phase>("landing");
  const zoomStart = useRef({ y: 0.45, z: 11 });
  const exitStart = useRef({ x: 0, y: 1.1, z: 8.2, fov: 45 });

  useFrame((state, delta) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const aspect = state.size.width / state.size.height;

    // Faz geçişlerinde bir kerelik işlemler
    if (phase !== prevPhase.current) {
      if (phase === "zooming") {
        progress.current = 0;
        completed.current = false;
        zoomStart.current = { y: cam.position.y, z: cam.position.z };
      } else if (phase === "robot") {
        // Beyaz perde arkasında robot görüşüne geç
        cam.position.set(0, 1.1, robotDistance(aspect));
        cam.fov = 45;
        cam.updateProjectionMatrix();
      } else if (phase === "exiting") {
        progress.current = 0;
        completed.current = false;
        exitStart.current = {
          x: cam.position.x,
          y: cam.position.y,
          z: cam.position.z,
          fov: cam.fov,
        };
      }
      prevPhase.current = phase;
    }

    if (phase === "landing") {
      // İlk karede doğrudan hedefe otur (eski kamera konumu kalıntısı olmasın)
      if (!settled.current) {
        settled.current = true;
        cam.position.set(0, 0.45, compassDistance(aspect));
        cam.fov = 45;
        cam.updateProjectionMatrix();
      }
      // Pusulayı optik olarak aşağı kaydır (başlık ve butona alan aç)
      cam.position.x = THREE.MathUtils.damp(cam.position.x, 0, 4, delta);
      cam.position.y = THREE.MathUtils.damp(cam.position.y, 0.45, 4, delta);
      cam.position.z = THREE.MathUtils.damp(
        cam.position.z,
        compassDistance(aspect),
        4,
        delta,
      );
      cam.fov = THREE.MathUtils.damp(cam.fov, 45, 4, delta);
      cam.updateProjectionMatrix();
      cam.lookAt(0, 0.45, 0);
    } else if (phase === "zooming") {
      progress.current = Math.min(1, progress.current + delta / ZOOM_DURATION);
      const e = easeInOutCubic(progress.current);
      cam.position.set(
        0,
        THREE.MathUtils.lerp(zoomStart.current.y, 0, e),
        THREE.MathUtils.lerp(zoomStart.current.z, 0.8, e),
      );
      cam.fov = THREE.MathUtils.lerp(45, 75, e);
      cam.updateProjectionMatrix();
      cam.lookAt(0, zoomStart.current.y * (1 - e), 0);

      if (progress.current >= 1 && !completed.current) {
        completed.current = true;
        onZoomComplete();
      }
    } else if (phase === "exiting") {
      // Seçilen butonun içine uçuş
      progress.current = Math.min(1, progress.current + delta / EXIT_DURATION);
      const e = easeInOutCubic(progress.current);
      const s = exitStart.current;
      cam.position.set(
        THREE.MathUtils.lerp(s.x, exitSide * 1.55, e),
        THREE.MathUtils.lerp(s.y, 1.8, e),
        THREE.MathUtils.lerp(s.z, 2.3, e),
      );
      cam.fov = THREE.MathUtils.lerp(s.fov, 70, e);
      cam.updateProjectionMatrix();
      cam.lookAt(exitSide * 1.9, 1.9, 0.35);

      if (progress.current >= 1 && !completed.current) {
        completed.current = true;
        onExitComplete();
      }
    } else {
      cam.position.z = THREE.MathUtils.damp(
        cam.position.z,
        robotDistance(aspect),
        4,
        delta,
      );
      cam.lookAt(0, 0.9, 0);
    }
  });

  return null;
}

type IntroExperienceProps = {
  onComplete: (choice: IntroChoice) => void;
};

/**
 * Giriş deneyimi: 3D pusula → içine uçuş → tercih robotu.
 * Seçim yapılınca onComplete ile ana uygulamaya geçer.
 */
export function IntroExperience({ onComplete }: IntroExperienceProps) {
  const [phase, setPhase] = useState<Phase>("landing");
  const [exitSide, setExitSide] = useState<1 | -1>(-1);
  const pendingChoice = useRef<IntroChoice>("withScore");

  const handleChoice = (choice: IntroChoice) => {
    pendingChoice.current = choice;
    setExitSide(choice === "withScore" ? -1 : 1);
    setPhase("exiting");
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#060d1f]">
      <Canvas
        camera={{ position: [0, 0.45, 11], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#060d1f"]} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 6, 6]} intensity={1.2} />
        <pointLight position={[0, 0, 3]} intensity={6} color="#ff5a4e" />

        <Stars radius={40} depth={25} count={1400} factor={2.2} fade />

        <Suspense fallback={null}>
          {phase !== "robot" && (
            <>
              <Compass zooming={phase === "zooming"} />
              <DiscoverButton
                visible={phase === "landing"}
                onDiscover={() => setPhase("zooming")}
              />
            </>
          )}
          {(phase === "robot" || phase === "exiting") && (
            <>
              {/* Robotu arka plandan ayıran kenar ışıkları */}
              <pointLight position={[-3.5, 3, -2]} intensity={9} color="#7ea0ff" />
              <pointLight position={[3.5, 2, -2]} intensity={7} color="#ff6b5e" />
              <Robot visible={phase === "robot"} onChoice={handleChoice} />
              <ContactShadows
                position={[0, -1.5, 0]}
                opacity={0.4}
                scale={12}
                blur={2.6}
                far={4}
              />
            </>
          )}

          {/* Metalik yansımalar için çevresel ışık (çevrimdışı çalışır) */}
          <Environment resolution={256}>
            <Lightformer
              intensity={2}
              position={[0, 5, 0]}
              rotation-x={Math.PI / 2}
              scale={[10, 10, 1]}
              color="#ffffff"
            />
            <Lightformer
              intensity={1.5}
              position={[-5, 1, 2]}
              scale={[4, 6, 1]}
              color="#7ea0ff"
            />
            <Lightformer
              intensity={1.5}
              position={[5, 1, 2]}
              scale={[4, 6, 1]}
              color="#ff6b5e"
            />
          </Environment>
        </Suspense>

        <CameraRig
          phase={phase}
          exitSide={exitSide}
          onZoomComplete={() => setPhase("robot")}
          onExitComplete={() => onComplete(pendingChoice.current)}
        />
      </Canvas>

      {/* Üst bilgi katmanı */}
      {phase !== "robot" && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-6 pt-8 sm:pt-12">
          <header
            className={`text-center transition-opacity duration-500 ${
              phase === "zooming" ? "opacity-0" : "opacity-100"
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-red-400/90">
              Üniversite ve Kariyer Tercih Simülatörü
            </p>
            <h1 className="font-display mt-3 bg-gradient-to-b from-white via-slate-100 to-slate-500 bg-clip-text text-5xl font-bold tracking-[0.14em] text-transparent sm:text-7xl">
              PUSULA
            </h1>
          </header>
        </div>
      )}

      {/* Robot sahnesi başlığı */}
      {(phase === "robot" || phase === "exiting") && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-6 pt-10 sm:pt-14">
          <div
            className={`text-center transition-opacity duration-500 ${
              phase === "exiting" ? "opacity-0" : "opacity-100"
            }`}
          >
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Merhaba! Ben ROTA
            </h2>
            <p className="mt-2 text-sm text-slate-300/80 sm:text-base">
              Pusula seni Rota&apos;yla yönlendirir
            </p>
          </div>
        </div>
      )}

      {/* Beyaz geçiş perdesi */}
      <div
        className="pointer-events-none absolute inset-0 z-20 bg-white"
        style={{
          opacity: phase === "zooming" || phase === "exiting" ? 1 : 0,
          transition:
            phase === "zooming"
              ? "opacity 0.7s ease-in 1.25s"
              : phase === "exiting"
                ? "opacity 0.6s ease-in 0.85s"
                : "opacity 0.9s ease-out",
        }}
      />
    </div>
  );
}
