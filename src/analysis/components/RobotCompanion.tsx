import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Robot } from "../../intro/Robot";

/**
 * Quiz ekranında sorunun yanında duran ROTA robotu.
 * Butonsuz mini sahne; kafa imleci takip eder, göz kırpar —
 * sanki soruyu robot soruyormuş hissi verir.
 */
export function RobotCompanion() {
  return (
    <div className="robot-companion" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0.45, 6.4], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 4]} intensity={1.4} />
        <pointLight position={[-2.5, 2, 2]} intensity={4} color="#7ea0ff" />
        <pointLight position={[2.5, 1, 2]} intensity={3} color="#ff6b5e" />
        <Suspense fallback={null}>
          {/* Platform dahil tam kadraj için hafif küçültülmüş */}
          <group scale={0.85}>
            <Robot visible withButtons={false} />
          </group>
          {/* Metalik/inci yansımalar için çevresel ışık (çevrimdışı çalışır) */}
          <Environment resolution={64}>
            <Lightformer
              intensity={2}
              position={[0, 5, 0]}
              rotation-x={Math.PI / 2}
              scale={[10, 10, 1]}
              color="#ffffff"
            />
            <Lightformer
              intensity={1.2}
              position={[-4, 1, 2]}
              scale={[3, 5, 1]}
              color="#7ea0ff"
            />
            <Lightformer
              intensity={1.2}
              position={[4, 1, 2]}
              scale={[3, 5, 1]}
              color="#ff6b5e"
            />
          </Environment>
        </Suspense>
      </Canvas>
      <span className="robot-name">ROTA</span>
    </div>
  );
}
