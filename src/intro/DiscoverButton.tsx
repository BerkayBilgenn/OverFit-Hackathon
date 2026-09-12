import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Sparkles } from "@react-three/drei";
import * as THREE from "three";

const RED = "#e63946";

type DiscoverButtonProps = {
  /** Buton görünür mü (landing fazında true, zoom'da küçülerek kaybolur) */
  visible: boolean;
  onDiscover: () => void;
};

/**
 * 3D "Kendini Keşfet" butonu — parlayan kapsül, yörünge halkası ve nabız glow'u.
 * Hover'da büyür ve imlece eğilir, tıklanınca basılma animasyonu yapar.
 */
export function DiscoverButton({ visible, onDiscover }: DiscoverButtonProps) {
  const group = useRef<THREE.Group>(null!);
  const coreMat = useRef<THREE.MeshPhysicalMaterial>(null!);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const [hovered, setHovered] = useState(false);
  const pressed = useRef(false);
  const appear = useRef(0);

  // Hover'da imleci el yap
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const g = group.current;

    // Giriş / çıkış yumuşaklığı
    appear.current = THREE.MathUtils.damp(
      appear.current,
      visible ? 1 : 0,
      4,
      delta,
    );

    // Hover büyümesi + basılma + görünürlük
    const target =
      (hovered ? 1.1 : 1) * (pressed.current ? 0.9 : 1) * appear.current;
    g.scale.setScalar(
      THREE.MathUtils.damp(g.scale.x, Math.max(target, 0.001), 8, delta),
    );

    // Ekrana sabitlenmiş konum: her kamera mesafesinde ~%89 yükseklikte kal.
    // Buton pusuladan 1.5 birim önde (z=1.5) olduğu için asla arkasında kalmaz.
    const cam = state.camera as THREE.PerspectiveCamera;
    const halfH =
      Math.max(cam.position.z - 1.5, 0.5) *
      Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const anchorY = 0.45 - 0.78 * halfH;
    g.position.y =
      THREE.MathUtils.damp(g.position.y, anchorY, 6, delta) +
      Math.sin(t * 1.2) * 0.03;

    // Sakin nabız glow'u
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.8);
    glowMat.current.opacity = 0.16 + pulse * 0.1 + (hovered ? 0.18 : 0);
    light.current.intensity = 2 + pulse + (hovered ? 3 : 0);
    coreMat.current.emissiveIntensity =
      0.55 + pulse * 0.25 + (hovered ? 0.8 : 0);

    // Yavaş dönen yörünge halkası
    ring.current.rotation.z = t * 0.45;
    ring.current.rotation.x = Math.PI / 2.4;
  });

  const handleClick = () => {
    if (pressed.current) return;
    pressed.current = true;
    // Basılma animasyonu hissedilsin diye kısa gecikme
    setTimeout(onDiscover, 180);
  };

  return (
    <group ref={group} position={[0, -2.6, 1.5]} scale={0.001}>
      <group
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        {/* Ana kapsül gövde */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.36, 1.9, 8, 24]} />
          <meshPhysicalMaterial
            ref={coreMat}
            color={RED}
            emissive={RED}
            emissiveIntensity={0.7}
            metalness={0.2}
            roughness={0.25}
            clearcoat={1}
            clearcoatRoughness={0.2}
          />
        </mesh>

        {/* Glow kabuğu */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.46, 2.06, 8, 24]} />
          <meshBasicMaterial
            ref={glowMat}
            color="#ff6b5e"
            transparent
            opacity={0.25}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Yörünge halkası */}
        <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[1.5, 0.018, 8, 64]} />
          <meshBasicMaterial
            color="#ff8a7a"
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Kırmızı parlama ışığı */}
        <pointLight
          ref={light}
          position={[0, 0, 1.2]}
          intensity={3}
          distance={5}
          color="#ff5a4e"
        />

        <Sparkles
          count={20}
          scale={[3.8, 1.4, 1]}
          size={3}
          speed={0.25}
          color="#ff8a7a"
        />
      </group>

      {/* Net (crisp) yazı katmanı — tıklamayı 3D butona bırakır */}
      <Html center zIndexRange={[5, 0]} wrapperClass="pointer-events-none">
        <span className="font-display text-lg font-semibold tracking-wide whitespace-nowrap text-white select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          Kendini Keşfet
        </span>
      </Html>
    </group>
  );
}
