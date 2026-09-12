import { useMemo, useRef, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Line } from "@react-three/drei";
import * as THREE from "three";

/**
 * Robot sahnesinin arka planı: kariyer/üniversite temalı süzülen objeler
 * (kep, kitap, diploma, konum pini, kalem, yıldız), kesik çizgili rota
 * yolları ve uzakta dönen silik pusula gülü. Farklı z derinlikleri + sis
 * ile sahneye derinlik katar. Objeler hafif emissive — karanlık sahnede
 * silüetleri okunur kalır.
 */

const NAVY = "#33507e";
const NAVY_DARK = "#263d63";
const RED = "#e63946";
const STEEL = "#c9d4e8";

function GraduationCap() {
  return (
    <group>
      <mesh position={[0, 0.07, 0]}>
        <boxGeometry args={[0.52, 0.045, 0.52]} />
        <meshStandardMaterial
          color={NAVY}
          emissive="#16294d"
          emissiveIntensity={0.5}
          roughness={0.45}
          metalness={0.25}
        />
      </mesh>
      <mesh position={[0, -0.03, 0]}>
        <cylinderGeometry args={[0.15, 0.19, 0.15, 16]} />
        <meshStandardMaterial
          color={NAVY_DARK}
          emissive="#101f3a"
          emissiveIntensity={0.5}
          roughness={0.6}
        />
      </mesh>
      <mesh position={[0, 0.105, 0]}>
        <sphereGeometry args={[0.024, 8, 8]} />
        <meshStandardMaterial
          color={RED}
          emissive={RED}
          emissiveIntensity={0.4}
          roughness={0.4}
        />
      </mesh>
      {/* Püskül */}
      <mesh position={[0.26, -0.04, 0]} rotation={[0, 0, 0.12]}>
        <cylinderGeometry args={[0.008, 0.008, 0.24, 6]} />
        <meshStandardMaterial
          color={RED}
          emissive={RED}
          emissiveIntensity={0.4}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0.28, -0.17, 0]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial
          color={RED}
          emissive={RED}
          emissiveIntensity={0.4}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}

function Book() {
  return (
    <group rotation={[0.1, 0.4, 0.08]}>
      {/* Sayfalar */}
      <mesh position={[0.02, 0, 0]}>
        <boxGeometry args={[0.3, 0.42, 0.1]} />
        <meshStandardMaterial
          color="#e8ecf4"
          emissive="#8a93a8"
          emissiveIntensity={0.3}
          roughness={0.85}
        />
      </mesh>
      {/* Kapak */}
      <mesh>
        <boxGeometry args={[0.34, 0.47, 0.075]} />
        <meshStandardMaterial
          color={RED}
          emissive="#7a1f28"
          emissiveIntensity={0.45}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

function Diploma() {
  return (
    <group rotation={[0, 0, Math.PI / 2.3]}>
      <mesh>
        <cylinderGeometry args={[0.055, 0.055, 0.5, 14]} />
        <meshStandardMaterial
          color="#eef1f7"
          emissive="#9aa4b8"
          emissiveIntensity={0.35}
          roughness={0.7}
        />
      </mesh>
      {/* Kırmızı kurdele */}
      <mesh>
        <torusGeometry args={[0.058, 0.014, 8, 20]} />
        <meshStandardMaterial
          color={RED}
          emissive={RED}
          emissiveIntensity={0.4}
          roughness={0.45}
        />
      </mesh>
    </group>
  );
}

function LocationPin() {
  return (
    <group>
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial
          color={RED}
          emissive="#8f2230"
          emissiveIntensity={0.55}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
      <mesh position={[0, -0.04, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.075, 0.2, 16]} />
        <meshStandardMaterial
          color={RED}
          emissive="#8f2230"
          emissiveIntensity={0.55}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
      <mesh position={[0, 0.1, 0.075]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.2}
          emissive="#ffffff"
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  );
}

function Pencil() {
  return (
    <group rotation={[0, 0, 0.9]}>
      <mesh>
        <cylinderGeometry args={[0.022, 0.022, 0.5, 8]} />
        <meshStandardMaterial
          color={RED}
          emissive="#7a1f28"
          emissiveIntensity={0.45}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, 0.29, 0]}>
        <coneGeometry args={[0.022, 0.09, 8]} />
        <meshStandardMaterial color="#d9c9a3" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.325, 0]}>
        <coneGeometry args={[0.009, 0.03, 8]} />
        <meshStandardMaterial color="#2b2f38" roughness={0.6} />
      </mesh>
      {/* Silgi */}
      <mesh position={[0, -0.27, 0]}>
        <cylinderGeometry args={[0.023, 0.023, 0.05, 8]} />
        <meshStandardMaterial color={STEEL} roughness={0.35} metalness={0.7} />
      </mesh>
    </group>
  );
}

function Star() {
  return (
    <mesh scale={[1, 1, 0.45]}>
      <octahedronGeometry args={[0.09, 0]} />
      <meshStandardMaterial
        color="#bcd0ff"
        emissive="#7ea0ff"
        emissiveIntensity={1.3}
        roughness={0.3}
      />
    </mesh>
  );
}

/** Uzakta yavaşça dönen silik pusula gülü */
function CompassRoseGhost() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.05;
  });
  const ticks = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const cardinal = i % 3 === 0;
        return { a, cardinal };
      }),
    [],
  );
  return (
    <group ref={ref} position={[0, 1.7, -10]}>
      <mesh>
        <torusGeometry args={[4, 0.02, 8, 96]} />
        <meshBasicMaterial color="#3d5f9e" transparent opacity={0.7} />
      </mesh>
      <mesh>
        <torusGeometry args={[3.2, 0.012, 8, 96]} />
        <meshBasicMaterial color="#3d5f9e" transparent opacity={0.5} />
      </mesh>
      {ticks.map(({ a, cardinal }) => (
        <mesh
          key={a}
          position={[Math.cos(a) * 3.6, Math.sin(a) * 3.6, 0]}
          rotation={[0, 0, a + Math.PI / 2]}
        >
          <boxGeometry args={[0.03, cardinal ? 0.5 : 0.24, 0.01]} />
          <meshBasicMaterial
            color={cardinal ? RED : "#3d5f9e"}
            transparent
            opacity={cardinal ? 0.75 : 0.55}
          />
        </mesh>
      ))}
    </group>
  );
}

type ItemKind = "cap" | "book" | "diploma" | "pin" | "pencil" | "star";

const ITEMS: {
  kind: ItemKind;
  position: [number, number, number];
  scale: number;
  speed: number;
  rotationIntensity: number;
  floatIntensity: number;
}[] = [
  { kind: "cap", position: [-4.4, 2.5, -4.5], scale: 1.7, speed: 1.4, rotationIntensity: 0.8, floatIntensity: 1.4 },
  { kind: "book", position: [4.5, 2, -4], scale: 1.6, speed: 1.1, rotationIntensity: 1, floatIntensity: 1.2 },
  { kind: "diploma", position: [-5.2, 0.3, -5.5], scale: 1.8, speed: 1.6, rotationIntensity: 0.7, floatIntensity: 1.5 },
  { kind: "pin", position: [5.1, 3.3, -6.5], scale: 1.9, speed: 1.2, rotationIntensity: 0.5, floatIntensity: 1.6 },
  { kind: "pencil", position: [-3.3, 3.8, -7.5], scale: 1.8, speed: 1.5, rotationIntensity: 1.1, floatIntensity: 1.3 },
  { kind: "star", position: [3.1, 4, -6], scale: 1.4, speed: 2, rotationIntensity: 1.4, floatIntensity: 1.2 },
  { kind: "star", position: [-5.6, 1.7, -7], scale: 1.1, speed: 1.8, rotationIntensity: 1.2, floatIntensity: 1.5 },
  { kind: "book", position: [-2.9, 0, -3.8], scale: 1.3, speed: 1.3, rotationIntensity: 0.9, floatIntensity: 1.1 },
  { kind: "cap", position: [3.6, 0.1, -8], scale: 1.5, speed: 1, rotationIntensity: 0.8, floatIntensity: 1.6 },
  { kind: "pencil", position: [5, 4.4, -8.5], scale: 1.5, speed: 1.7, rotationIntensity: 1, floatIntensity: 1.4 },
  { kind: "pin", position: [-4.8, 4.5, -9], scale: 1.5, speed: 1.4, rotationIntensity: 0.6, floatIntensity: 1.7 },
  { kind: "diploma", position: [1.9, 4.6, -7.5], scale: 1.4, speed: 1.5, rotationIntensity: 0.9, floatIntensity: 1.3 },
];

const KIND_MAP: Record<ItemKind, () => JSX.Element> = {
  cap: GraduationCap,
  book: Book,
  diploma: Diploma,
  pin: LocationPin,
  pencil: Pencil,
  star: Star,
};

/** Kesik çizgili "rota" eğrileri — tercih yolculuğunu simgeler */
function RouteLines() {
  const routes = useMemo(() => {
    const make = (pts: [number, number, number][]) =>
      new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))).getPoints(60);
    return [
      {
        points: make([
          [-9, 3.4, -5.5],
          [-3.5, 4.6, -6.5],
          [2, 3.1, -6],
          [9, 4.3, -6.5],
        ]),
        color: "#4a6db3",
        opacity: 0.65,
      },
      {
        points: make([
          [-9, 0.9, -7.5],
          [-2.5, -0.1, -6.5],
          [3, 1.1, -7.5],
          [9, 0.3, -7],
        ]),
        color: RED,
        opacity: 0.4,
      },
    ] as const;
  }, []);

  return (
    <>
      {routes.map((r, i) => (
        <Line
          key={i}
          points={r.points}
          color={r.color}
          transparent
          opacity={r.opacity}
          lineWidth={1.6}
          dashed
          dashSize={0.3}
          gapSize={0.18}
        />
      ))}
    </>
  );
}

export function BackdropField() {
  const group = useRef<THREE.Group>(null);
  // Çok hafif salınım — sahneye canlılık katar
  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(clock.elapsedTime * 0.06) * 0.03;
    }
  });

  return (
    <group ref={group}>
      <CompassRoseGhost />
      <RouteLines />
      {/* Objeleri öne doğru aydınlatan yumuşak ışık */}
      <pointLight position={[0, 3, -3]} intensity={14} color="#a8bfff" />
      {ITEMS.map((item, i) => {
        const Icon = KIND_MAP[item.kind];
        return (
          <Float
            key={i}
            speed={item.speed}
            rotationIntensity={item.rotationIntensity}
            floatIntensity={item.floatIntensity}
          >
            <group position={item.position} scale={item.scale}>
              <Icon />
            </group>
          </Float>
        );
      })}
    </group>
  );
}
