import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { ChoiceButton } from "./ChoiceButton";
import type { IntroChoice } from "./IntroExperience";

const PEARL = "#e9eef6";
const PEARL_DARK = "#c9d4e4";
const STEEL = "#c7d0de";
const RED = "#e63946";
const VISOR = "#0a1428";
const EYE = "#eaf2ff";

type RobotProps = {
  /** false olduğunda seçim butonları küçülerek kaybolur (çıkış animasyonu) */
  visible: boolean;
  onChoice: (choice: IntroChoice) => void;
};

/**
 * Tercih robotu — iki eli açık, sevimli robot.
 * Sol elinde "Puanım Var", sağ elinde "Puanım Yok" butonu taşır.
 * Sahneye yukarıdan yumuşak bir inişle girer, kafası imleci takip eder.
 */
export function Robot({ visible, onChoice }: RobotProps) {
  const root = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const eyeL = useRef<THREE.Mesh>(null!);
  const eyeR = useRef<THREE.Mesh>(null!);
  const core = useRef<THREE.MeshStandardMaterial>(null!);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const g = root.current;

    // Giriş animasyonu: yukarıdan in + büyü, sonra tamamen durağan
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, 1, 3.2, delta));
    g.position.y = THREE.MathUtils.damp(g.position.y, 0, 3.2, delta);

    // Kafa imleci yumuşakça takip eder (gövde durağan)
    head.current.rotation.y = THREE.MathUtils.damp(
      head.current.rotation.y,
      state.pointer.x * 0.35,
      5,
      delta,
    );
    head.current.rotation.x = THREE.MathUtils.damp(
      head.current.rotation.x,
      -state.pointer.y * 0.18,
      5,
      delta,
    );

    // Göz kırpma (tek hareket)
    const blink = Math.pow(Math.max(Math.sin(t * 1.1), 0), 30);
    const eyeScale = 1 - 0.85 * blink;
    eyeL.current.scale.y = eyeScale;
    eyeR.current.scale.y = eyeScale;

    // Göğüs çekirdeğinin ışığı yavaşça nefes alır
    core.current.emissiveIntensity = 1.6 + Math.sin(t * 1.8) * 0.4;
  });

  return (
    <group ref={root} scale={0.01} position={[0, 2.6, 0]}>
      {/* Gövde */}
      <RoundedBox args={[1.7, 1.7, 1.15]} radius={0.32} smoothness={8}>
        <meshStandardMaterial color={PEARL} metalness={0.15} roughness={0.35} />
      </RoundedBox>

      {/* Göğüs çekirdeği */}
      <mesh position={[0, 0.15, 0.58]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial
          ref={core}
          color={RED}
          emissive={RED}
          emissiveIntensity={2}
        />
      </mesh>

      {/* Kafa */}
      <group ref={head} position={[0, 1.5, 0]}>
        <RoundedBox args={[1.55, 1.05, 1.1]} radius={0.4} smoothness={8}>
          <meshStandardMaterial color={PEARL} metalness={0.15} roughness={0.3} />
        </RoundedBox>

        {/* Kulak diskleri (kırmızı detay) */}
        <mesh position={[-0.82, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.1, 24]} />
          <meshStandardMaterial
            color={RED}
            emissive={RED}
            emissiveIntensity={0.6}
            metalness={0.3}
            roughness={0.35}
          />
        </mesh>
        <mesh position={[0.82, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.1, 24]} />
          <meshStandardMaterial
            color={RED}
            emissive={RED}
            emissiveIntensity={0.6}
            metalness={0.3}
            roughness={0.35}
          />
        </mesh>

        {/* Vizör */}
        <RoundedBox
          args={[1.15, 0.62, 0.2]}
          radius={0.09}
          smoothness={8}
          position={[0, 0.05, 0.5]}
        >
          <meshStandardMaterial color={VISOR} metalness={0.6} roughness={0.15} />
        </RoundedBox>

        {/* Gözler */}
        <mesh ref={eyeL} position={[-0.28, 0.08, 0.6]}>
          <sphereGeometry args={[0.13, 24, 24]} />
          <meshStandardMaterial
            color={EYE}
            emissive={EYE}
            emissiveIntensity={2.4}
          />
        </mesh>
        <mesh ref={eyeR} position={[0.28, 0.08, 0.6]}>
          <sphereGeometry args={[0.13, 24, 24]} />
          <meshStandardMaterial
            color={EYE}
            emissive={EYE}
            emissiveIntensity={2.4}
          />
        </mesh>

        {/* Gülümseme */}
        <mesh position={[0, -0.14, 0.6]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.15, 0.028, 8, 32, Math.PI]} />
          <meshStandardMaterial
            color={EYE}
            emissive={EYE}
            emissiveIntensity={1.6}
          />
        </mesh>

        {/* Anten */}
        <mesh position={[0, 0.68, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.35, 12]} />
          <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color={RED}
            emissive={RED}
            emissiveIntensity={2}
          />
        </mesh>
      </group>

      {/* Sol kol + el (Puanım Var) */}
      <group ref={armL} position={[-0.95, 0.55, 0]} rotation={[0, 0, 0.8]}>
        <mesh position={[0, 0.55, 0]}>
          <capsuleGeometry args={[0.16, 0.8, 8, 16]} />
          <meshStandardMaterial
            color={PEARL_DARK}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[0, 1.12, 0]}>
          <sphereGeometry args={[0.24, 24, 24]} />
          <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.3} />
        </mesh>
        {/* Avuç */}
        <mesh position={[0, 1.32, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.08, 24]} />
          <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.3} />
        </mesh>
      </group>

      {/* Sağ kol + el (Puanım Yok) */}
      <group ref={armR} position={[0.95, 0.55, 0]} rotation={[0, 0, -0.8]}>
        <mesh position={[0, 0.55, 0]}>
          <capsuleGeometry args={[0.16, 0.8, 8, 16]} />
          <meshStandardMaterial
            color={PEARL_DARK}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[0, 1.12, 0]}>
          <sphereGeometry args={[0.24, 24, 24]} />
          <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.32, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.08, 24]} />
          <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.3} />
        </mesh>
      </group>

      {/* Seçim butonları — avuçların tam üzerinde süzülen 3D kapsüller */}
      <ChoiceButton
        position={[-1.9, 1.92, 0.35]}
        label="YKS PUANIM VAR"
        variant="primary"
        visible={visible}
        onSelect={() => onChoice("withScore")}
      />
      <ChoiceButton
        position={[1.9, 1.92, 0.35]}
        label="YKS PUANIM YOK"
        variant="ghost"
        visible={visible}
        onSelect={() => onChoice("withoutScore")}
      />
    </group>
  );
}
