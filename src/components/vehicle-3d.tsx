"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, RoundedBox } from "@react-three/drei";
import type { Group } from "three";

const BODY = "#1d1d22";
const GOLD = "#e6b92e";
const WHEEL_R = 0.29;
const ENTER_SECONDS = 1.8;
const START_X = -8;

function Wheel({ x, z = 0, r = WHEEL_R, wide = 1, spin }: { x: number; z?: number; r?: number; wide?: number; spin: { current: number } }) {
  const ref = useRef<Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.z = spin.current;
  });
  return (
    <group position={[x, r, z]} scale={r / WHEEL_R}>
      <group ref={ref}>
        <mesh>
          <torusGeometry args={[0.22, 0.07 * wide, 20, 40]} />
          <meshStandardMaterial color="#0c0c0e" roughness={0.9} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.08, 24]} />
          <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.25} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 5]}>
            <boxGeometry args={[0.3, 0.02, 0.09]} />
            <meshStandardMaterial color="#2a2a30" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function useEntrance(wheelR: number) {
  const root = useRef<Group>(null);
  const spin = useRef(0);
  const lastX = useRef(START_X);

  useFrame(({ clock }) => {
    const g = root.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    const p = Math.min(1, t / ENTER_SECONDS);
    const ease = 1 - Math.pow(1 - p, 3);
    const x = START_X * (1 - ease);
    g.position.x = x;
    g.rotation.y = -Math.PI * 0.9 * (1 - ease);
    g.position.y = p >= 1 ? Math.sin(t * 1.4) * 0.012 : 0;
    // roda berputar sesuai jarak tempuh saat masuk
    spin.current -= (x - lastX.current) / wheelR;
    lastX.current = x;
    // body sedikit miring (rem) di akhir kedatangan
    g.rotation.z = p < 1 ? 0.04 * Math.sin(p * Math.PI) : 0;
  });
  return { root, spin };
}

function Scooter() {
  const { root, spin } = useEntrance(WHEEL_R);

  return (
    <group ref={root} position={[START_X, 0, 0]}>
      <Wheel x={-0.72} spin={spin} />
      <Wheel x={0.78} spin={spin} />

      {/* lantai & body belakang */}
      <RoundedBox args={[0.78, 0.06, 0.36]} radius={0.03} position={[0.05, 0.4, 0]}>
        <meshStandardMaterial color={BODY} metalness={0.6} roughness={0.35} />
      </RoundedBox>
      <RoundedBox args={[0.9, 0.34, 0.4]} radius={0.12} position={[-0.58, 0.64, 0]}>
        <meshStandardMaterial color={BODY} metalness={0.6} roughness={0.3} />
      </RoundedBox>
      <RoundedBox args={[0.72, 0.1, 0.34]} radius={0.05} position={[-0.38, 0.86, 0]}>
        <meshStandardMaterial color="#0e0e10" roughness={0.8} />
      </RoundedBox>
      {/* aksen emas */}
      <RoundedBox args={[0.5, 0.025, 0.41]} radius={0.01} position={[-0.7, 0.64, 0]}>
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
      </RoundedBox>

      {/* leg shield, fork, setang */}
      <RoundedBox args={[0.12, 0.62, 0.4]} radius={0.05} position={[0.46, 0.72, 0]} rotation={[0, 0, -0.28]}>
        <meshStandardMaterial color={BODY} metalness={0.6} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0.74, 0.66, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.025, 0.025, 0.8, 12]} />
        <meshStandardMaterial color="#8a8a92" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.62, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.66, 12]} />
        <meshStandardMaterial color="#111" roughness={0.6} />
      </mesh>
      <RoundedBox args={[0.34, 0.16, 0.3]} radius={0.06} position={[0.66, 1.02, 0]}>
        <meshStandardMaterial color={BODY} metalness={0.6} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0.84, 1.02, 0]}>
        <boxGeometry args={[0.02, 0.07, 0.22]} />
        <meshStandardMaterial color="#fff6cc" emissive="#ffe58a" emissiveIntensity={2.2} />
      </mesh>
      {/* spatbor depan, lampu belakang, knalpot */}
      <RoundedBox args={[0.46, 0.035, 0.2]} radius={0.015} position={[0.78, 0.6, 0]} rotation={[0, 0, -0.12]}>
        <meshStandardMaterial color={BODY} metalness={0.6} roughness={0.3} />
      </RoundedBox>
      <mesh position={[-1.04, 0.72, 0]}>
        <boxGeometry args={[0.03, 0.06, 0.26]} />
        <meshStandardMaterial color="#ff2a2a" emissive="#ff2a2a" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-0.7, 0.32, 0.22]} rotation={[0, 0, Math.PI / 2 - 0.08]}>
        <cylinderGeometry args={[0.045, 0.05, 0.5, 16]} />
        <meshStandardMaterial color="#9a9aa3" metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}

function SportCar() {
  const R = 0.34;
  const { root, spin } = useEntrance(R);
  const paint = { color: GOLD, metalness: 0.85, roughness: 0.22 } as const;
  return (
    <group ref={root} position={[START_X, 0, 0]}>
      {([-0.78, 0.82] as const).flatMap((x) => ([-0.52, 0.52] as const).map((z) => <Wheel key={`${x}${z}`} x={x} z={z} r={R} wide={1.3} spin={spin} />))}

      {/* body bawah, kap mesin, kabin */}
      <RoundedBox args={[2.3, 0.34, 1.04]} radius={0.12} position={[0, 0.52, 0]}>
        <meshStandardMaterial {...paint} />
      </RoundedBox>
      <RoundedBox args={[0.9, 0.14, 0.96]} radius={0.07} position={[0.78, 0.7, 0]} rotation={[0, 0, -0.09]}>
        <meshStandardMaterial {...paint} />
      </RoundedBox>
      <RoundedBox args={[1.05, 0.34, 0.84]} radius={0.15} position={[-0.2, 0.82, 0]}>
        <meshStandardMaterial color="#0d0d10" metalness={0.9} roughness={0.08} />
      </RoundedBox>
      <RoundedBox args={[0.8, 0.04, 0.7]} radius={0.02} position={[-0.2, 1.0, 0]}>
        <meshStandardMaterial {...paint} />
      </RoundedBox>

      {/* spoiler */}
      {([-0.32, 0.32] as const).map((z) => (
        <mesh key={z} position={[-1.05, 0.82, z]}>
          <boxGeometry args={[0.05, 0.22, 0.04]} />
          <meshStandardMaterial color="#0d0d10" />
        </mesh>
      ))}
      <RoundedBox args={[0.2, 0.04, 1.0]} radius={0.015} position={[-1.08, 0.94, 0]}>
        <meshStandardMaterial color="#0d0d10" metalness={0.7} roughness={0.3} />
      </RoundedBox>

      {/* lampu & aksen */}
      {([-0.36, 0.36] as const).map((z) => (
        <group key={z}>
          <mesh position={[1.17, 0.6, z]}>
            <boxGeometry args={[0.03, 0.06, 0.22]} />
            <meshStandardMaterial color="#fff6cc" emissive="#ffe58a" emissiveIntensity={2.4} />
          </mesh>
          <mesh position={[-1.16, 0.6, z]}>
            <boxGeometry args={[0.03, 0.06, 0.24]} />
            <meshStandardMaterial color="#ff2a2a" emissive="#ff2a2a" emissiveIntensity={2} />
          </mesh>
        </group>
      ))}
      {([-0.525, 0.525] as const).map((z) => (
        <mesh key={z} position={[0, 0.5, z]}>
          <boxGeometry args={[1.7, 0.03, 0.01]} />
          <meshStandardMaterial color="#0d0d10" />
        </mesh>
      ))}
      <mesh position={[1.17, 0.4, 0]}>
        <boxGeometry args={[0.03, 0.08, 0.7]} />
        <meshStandardMaterial color="#0d0d10" />
      </mesh>
    </group>
  );
}

export type VehicleKind = "motor" | "mobil";

export default function Vehicle3D({ kind }: { kind: VehicleKind }) {
  const car = kind === "mobil";
  return (
    <Canvas dpr={[1, 2]} camera={{ position: car ? [3.6, 1.4, 4.8] : [2.8, 1.3, 4], fov: 34 }} className="!h-full !w-full">
      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#ffffff", "#222233", 0.7]} />
      <directionalLight position={[4, 5, 3]} intensity={2.2} />
      <directionalLight position={[-4, 2, -3]} intensity={1} color={GOLD} />
      {car ? <SportCar /> : <Scooter />}
      <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={10} blur={2.6} far={2} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.8}
        target={[0, car ? 0.5 : 0.55, 0]}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}
