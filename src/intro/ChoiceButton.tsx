import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

type ChoiceButtonProps = {
  position: [number, number, number];
  label: string;
  variant: "primary" | "ghost";
  /** false olduğunda küçülerek kaybolur (çıkış animasyonu) */
  visible: boolean;
  onSelect: () => void;
};

const STYLES = {
  primary: {
    core: "#e63946",
    emissive: "#e63946",
    glow: "#ff6b5e",
    glowBase: 0.18,
    emissiveBase: 0.6,
    text: "text-white",
  },
  ghost: {
    core: "#16294d",
    emissive: "#2c4a80",
    glow: "#7ea0ff",
    glowBase: 0.1,
    emissiveBase: 0.25,
    text: "text-slate-100",
  },
} as const;

/**
 * 3D seçim butonu — robotun avuçlarının üzerinde süzülen parlayan kapsül.
 * Hover'da büyür, tıklanınca basılma animasyonu yapar.
 */
export function ChoiceButton({
  position,
  label,
  variant,
  visible,
  onSelect,
}: ChoiceButtonProps) {
  const group = useRef<THREE.Group>(null!);
  const coreMat = useRef<THREE.MeshPhysicalMaterial>(null!);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null!);
  const [hovered, setHovered] = useState(false);
  const pressed = useRef(false);
  const appear = useRef(0);
  const s = STYLES[variant];

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const g = group.current;

    // Giriş / çıkış
    appear.current = THREE.MathUtils.damp(
      appear.current,
      visible ? 1 : 0,
      4,
      delta,
    );

    // Hover büyümesi + basılma
    const target =
      (hovered ? 1.12 : 1) * (pressed.current ? 0.88 : 1) * appear.current;
    g.scale.setScalar(
      THREE.MathUtils.damp(g.scale.x, Math.max(target, 0.001), 8, delta),
    );

    // Hafif süzülme (iki buton ters fazda)
    g.position.y = position[1] + Math.sin(t * 1.2 + position[0]) * 0.04;

    // Sakin nabız glow'u
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.8 + position[0]);
    glowMat.current.opacity =
      s.glowBase + pulse * 0.1 + (hovered ? 0.16 : 0);
    coreMat.current.emissiveIntensity =
      s.emissiveBase + pulse * 0.25 + (hovered ? 0.7 : 0);
  });

  const handleClick = () => {
    if (pressed.current) return;
    pressed.current = true;
    // Basılma animasyonu hissedilsin diye kısa gecikme
    setTimeout(onSelect, 160);
  };

  return (
    <group ref={group} position={position} scale={0.001}>
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
          <capsuleGeometry args={[0.26, 1.35, 8, 24]} />
          <meshPhysicalMaterial
            ref={coreMat}
            color={s.core}
            emissive={s.emissive}
            emissiveIntensity={0.5}
            metalness={0.2}
            roughness={0.3}
            clearcoat={1}
            clearcoatRoughness={0.25}
          />
        </mesh>

        {/* Glow kabuğu */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.33, 1.47, 8, 24]} />
          <meshBasicMaterial
            ref={glowMat}
            color={s.glow}
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Net (crisp) yazı katmanı — tıklamayı 3D butona bırakır */}
      <Html center zIndexRange={[5, 0]} wrapperClass="pointer-events-none">
        <span
          className={`font-display text-[13px] font-semibold tracking-wider whitespace-nowrap select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] ${s.text}`}
        >
          {label}
        </span>
      </Html>
    </group>
  );
}
