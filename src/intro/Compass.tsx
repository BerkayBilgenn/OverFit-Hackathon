import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

const NAVY = "#0e2247";
const RED = "#e63946";
const STEEL = "#c7d0de";
const TICK = "#8fa3c8";

type CompassProps = {
  /** true olduğunda ibre hızla döner ve pusula hafifçe büyür (içine girme animasyonu) */
  zooming: boolean;
};

/**
 * Pusula logosu — modern 3D pusula.
 * Fare hareketiyle eğilir (parallax), boştayken ibresi yavaşça salınır.
 */
export function Compass({ zooming }: CompassProps) {
  const group = useRef<THREE.Group>(null!);
  const needle = useRef<THREE.Group>(null!);
  const spinAngle = useRef(0);
  const spinSpeed = useRef(0);

  const ticks = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => {
        const angle = (i / 60) * Math.PI * 2;
        return {
          angle,
          cardinal: i % 15 === 0,
          major: i % 5 === 0,
        };
      }),
    [],
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const g = group.current;

    // Fare paralaksı: pusula imleci yumuşak şekilde takip eder
    g.rotation.y = THREE.MathUtils.damp(
      g.rotation.y,
      state.pointer.x * 0.5,
      4,
      delta,
    );
    g.rotation.x = THREE.MathUtils.damp(
      g.rotation.x,
      -state.pointer.y * 0.35,
      4,
      delta,
    );

    // Zoom sırasında hafif büyüme
    const targetScale = zooming ? 1.15 : 1;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, targetScale, 3, delta));

    // İbre: normalde salınır, zoom'da hızla döner
    spinSpeed.current = THREE.MathUtils.damp(
      spinSpeed.current,
      zooming ? 16 : 0,
      1.6,
      delta,
    );
    spinAngle.current += spinSpeed.current * delta;
    needle.current.rotation.z =
      spinAngle.current + Math.sin(t * 0.9) * 0.16 + Math.sin(t * 0.37) * 0.09;
  });

  return (
    <Float speed={1.6} rotationIntensity={0.15} floatIntensity={0.35}>
      <group ref={group}>
        {/* Dış çelik halka */}
        <mesh>
          <torusGeometry args={[2.15, 0.17, 32, 128]} />
          <meshStandardMaterial color={STEEL} metalness={1} roughness={0.22} />
        </mesh>

        {/* Üst taşıma halkası */}
        <mesh position={[0, 2.44, 0]}>
          <torusGeometry args={[0.22, 0.06, 16, 48]} />
          <meshStandardMaterial color={STEEL} metalness={1} roughness={0.25} />
        </mesh>

        {/* Kırmızı neon iç halka */}
        <mesh position={[0, 0, 0.02]}>
          <torusGeometry args={[1.92, 0.028, 16, 128]} />
          <meshStandardMaterial
            color={RED}
            emissive={RED}
            emissiveIntensity={2.2}
          />
        </mesh>

        {/* Kadran */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.9, 1.9, 0.1, 96]} />
          <meshStandardMaterial color={NAVY} metalness={0.35} roughness={0.55} />
        </mesh>

        {/* Dakika çizgileri */}
        {ticks.map(({ angle, cardinal, major }, i) => (
          <mesh
            key={i}
            position={[Math.cos(angle) * 1.62, Math.sin(angle) * 1.62, 0.06]}
            rotation={[0, 0, angle - Math.PI / 2]}
          >
            <boxGeometry
              args={[
                cardinal ? 0.07 : major ? 0.045 : 0.02,
                cardinal ? 0.34 : major ? 0.22 : 0.12,
                0.02,
              ]}
            />
            <meshStandardMaterial
              color={cardinal ? RED : TICK}
              emissive={cardinal ? RED : "#000000"}
              emissiveIntensity={cardinal ? 1.2 : 0}
            />
          </mesh>
        ))}

        {/* İbre */}
        <group ref={needle} position={[0, 0, 0.14]}>
          {/* Kuzey (kırmızı) yarım */}
          <mesh position={[0, 0.62, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.13, 1.25, 4]} />
            <meshStandardMaterial
              color={RED}
              emissive={RED}
              emissiveIntensity={0.9}
              metalness={0.3}
              roughness={0.3}
            />
          </mesh>
          {/* Güney (çelik) yarım */}
          <mesh
            position={[0, -0.62, 0]}
            rotation={[0, Math.PI / 4, Math.PI]}
          >
            <coneGeometry args={[0.13, 1.25, 4]} />
            <meshStandardMaterial color="#dfe6f2" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Merkez yuvası */}
          <mesh>
            <sphereGeometry args={[0.17, 32, 32]} />
            <meshStandardMaterial color={STEEL} metalness={1} roughness={0.25} />
          </mesh>
        </group>

        {/* Cam yüzey */}
        <mesh position={[0, 0, 0.22]}>
          <circleGeometry args={[1.88, 64]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transparent
            opacity={0.08}
            roughness={0.05}
            metalness={0}
          />
        </mesh>
      </group>
    </Float>
  );
}
