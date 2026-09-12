import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ChoiceButton } from "./ChoiceButton";
import type { IntroChoice } from "./IntroExperience";

const PEARL = "#f2f5fa";
const PEARL_DARK = "#d5deeb";
const RED = "#e63946";
const DARK = "#0a0f1c";

type RobotProps = {
  /** false olduğunda seçim butonları küçülerek kaybolur (çıkış animasyonu) */
  visible: boolean;
  onChoice?: (choice: IntroChoice) => void;
  /** Avuçlardaki seçim butonları gösterilsin mi (quiz eşlikçisinde kapalı) */
  withButtons?: boolean;
};

/**
 * ROTA — parlak beyaz, yumurta gövdeli, büyük siyah gözlü sevimli robot.
 * İki eli açık durur; avuçların üzerinde 3D seçim butonları süzülür.
 * Kafa imleci takip eder, gözler ara sıra kırpar.
 */
export function Robot({ visible, onChoice, withButtons = true }: RobotProps) {
  const root = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const eyeL = useRef<THREE.Mesh>(null!);
  const eyeR = useRef<THREE.Mesh>(null!);
  const core = useRef<THREE.MeshStandardMaterial>(null!);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const g = root.current;

    // Giriş animasyonu: yukarıdan in + büyü, sonra durağan
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

    // Göz kırpma
    const blink = Math.pow(Math.max(Math.sin(t * 1.1), 0), 30);
    const eyeScale = 1 - 0.9 * blink;
    eyeL.current.scale.set(0.16, 0.22 * eyeScale, 0.1);
    eyeR.current.scale.set(0.16, 0.22 * eyeScale, 0.1);

    // Göğüs noktasının ışığı yavaşça nefes alır
    core.current.emissiveIntensity = 1.6 + Math.sin(t * 1.8) * 0.4;
  });

  const pearlMat = (
    <meshPhysicalMaterial
      color={PEARL}
      metalness={0.05}
      roughness={0.18}
      clearcoat={1}
      clearcoatRoughness={0.15}
    />
  );

  return (
    <group ref={root} scale={0.01} position={[0, 2.6, 0]}>
      {/* Gövde — yumurta formu */}
      <mesh position={[0, -0.15, 0]} scale={[0.62, 0.75, 0.55]}>
        <sphereGeometry args={[1, 48, 48]} />
        {pearlMat}
      </mesh>

      {/* Kırmızı göğüs noktası */}
      <mesh position={[0, 0.05, 0.53]}>
        <sphereGeometry args={[0.09, 24, 24]} />
        <meshStandardMaterial
          ref={core}
          color={RED}
          emissive={RED}
          emissiveIntensity={1.8}
        />
      </mesh>

      {/* Kafa */}
      <group ref={head} position={[0, 1.05, 0]}>
        <mesh scale={[1, 0.92, 0.95]}>
          <sphereGeometry args={[0.85, 48, 48]} />
          {pearlMat}
        </mesh>

        {/* Anten nubu (kırmızı detay) */}
        <mesh position={[0, 0.84, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial
            color={RED}
            emissive={RED}
            emissiveIntensity={1.5}
          />
        </mesh>

        {/* Büyük siyah gözler */}
        <mesh ref={eyeL} position={[-0.32, 0.08, 0.72]} scale={[0.16, 0.22, 0.1]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial
            color={DARK}
            roughness={0.05}
            clearcoat={1}
            clearcoatRoughness={0.05}
          />
        </mesh>
        <mesh ref={eyeR} position={[0.32, 0.08, 0.72]} scale={[0.16, 0.22, 0.1]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial
            color={DARK}
            roughness={0.05}
            clearcoat={1}
            clearcoatRoughness={0.05}
          />
        </mesh>

        {/* Göz parlama noktaları */}
        <mesh position={[-0.26, 0.18, 0.79]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1.2}
          />
        </mesh>
        <mesh position={[0.38, 0.18, 0.79]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1.2}
          />
        </mesh>
      </group>

      {/* Sol kol + avuç (YKS PUANIM VAR) */}
      <group position={[-0.55, 0.25, 0]} rotation={[0, 0, 0.9]}>
        <mesh position={[0, 0.4, 0]}>
          <capsuleGeometry args={[0.13, 0.55, 8, 16]} />
          <meshPhysicalMaterial
            color={PEARL_DARK}
            metalness={0.1}
            roughness={0.3}
            clearcoat={0.6}
          />
        </mesh>
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.17, 24, 24]} />
          {pearlMat}
        </mesh>
        <mesh position={[0, 0.94, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.06, 24]} />
          {pearlMat}
        </mesh>
      </group>

      {/* Sağ kol + avuç (YKS PUANIM YOK) */}
      <group position={[0.55, 0.25, 0]} rotation={[0, 0, -0.9]}>
        <mesh position={[0, 0.4, 0]}>
          <capsuleGeometry args={[0.13, 0.55, 8, 16]} />
          <meshPhysicalMaterial
            color={PEARL_DARK}
            metalness={0.1}
            roughness={0.3}
            clearcoat={0.6}
          />
        </mesh>
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.17, 24, 24]} />
          {pearlMat}
        </mesh>
        <mesh position={[0, 0.94, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.06, 24]} />
          {pearlMat}
        </mesh>
      </group>

      {/* Platform — referanstaki beyaz kaide */}
      <mesh position={[0, -1.05, 0]}>
        <cylinderGeometry args={[1.35, 1.5, 0.18, 64]} />
        {pearlMat}
      </mesh>
      {/* Platform kenarında kırmızı neon halka */}
      <mesh position={[0, -0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.36, 0.02, 8, 96]} />
        <meshStandardMaterial
          color={RED}
          emissive={RED}
          emissiveIntensity={2}
        />
      </mesh>

      {/* Seçim butonları — avuçların tam üzerinde süzülen 3D kapsüller */}
      {withButtons && (
        <>
          <ChoiceButton
            position={[-1.35, 1.32, 0.3]}
            label="YKS PUANIM VAR"
            variant="primary"
            visible={visible}
            onSelect={() => onChoice?.("withScore")}
          />
          <ChoiceButton
            position={[1.35, 1.32, 0.3]}
            label="YKS PUANIM YOK"
            variant="ghost"
            visible={visible}
            onSelect={() => onChoice?.("withoutScore")}
          />
        </>
      )}
    </group>
  );
}
