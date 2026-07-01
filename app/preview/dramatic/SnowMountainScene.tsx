"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles, Float } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { InstancedMesh, Object3D } from "three";

/** ローポリの山を円錐の集合で表現する */
function MountainRange() {
  const peaks = useMemo(
    () => [
      { x: -6, z: -6, h: 6.5, r: 3.2, color: "#e0e7ff" },
      { x: -2, z: -8, h: 8.5, r: 3.8, color: "#eef2ff" },
      { x: 3, z: -7, h: 7.2, r: 3.4, color: "#e0e7ff" },
      { x: 7, z: -9, h: 9.5, r: 4.2, color: "#f8fafc" },
      { x: 0, z: -11, h: 11, r: 5, color: "#f1f5f9" },
      { x: -9, z: -10, h: 7.8, r: 3.6, color: "#e0e7ff" },
    ],
    [],
  );

  return (
    <group>
      {peaks.map((p, i) => (
        <group key={i}>
          {/* 山本体 */}
          <mesh position={[p.x, p.h / 2 - 1.4, p.z]} castShadow receiveShadow>
            <coneGeometry args={[p.r, p.h, 6, 1]} />
            <meshStandardMaterial color={p.color} flatShading roughness={0.85} metalness={0} />
          </mesh>
          {/* 雪冠（頂上の白いキャップ） */}
          <mesh position={[p.x, p.h - 1.4 - p.h * 0.14, p.z]} castShadow>
            <coneGeometry args={[p.r * 0.4, p.h * 0.32, 6, 1]} />
            <meshStandardMaterial color="#ffffff" flatShading roughness={0.6} emissive="#c7d2fe" emissiveIntensity={0.15} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** シード付きの決定論的疑似乱数（Math.randomは描画中に呼べないため） */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** 舞い落ちる雪片（インスタンス描画で軽量に） */
function Snowfall({ count = 400 }: { count?: number }) {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const flakes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (seededRandom(i * 3.1 + 1) - 0.5) * 30,
        y: seededRandom(i * 3.1 + 2) * 16,
        z: (seededRandom(i * 3.1 + 3) - 0.5) * 20 - 2,
        speed: 0.6 + seededRandom(i * 3.1 + 4) * 1.2,
        drift: seededRandom(i * 3.1 + 5) * Math.PI * 2,
      })),
    [count],
  );

  useFrame((state, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    flakes.forEach((f, i) => {
      f.y -= f.speed * delta;
      f.drift += delta * 0.5;
      if (f.y < -2) f.y = 16;
      const obj: Object3D = dummy;
      obj.position.set(f.x + Math.sin(f.drift) * 0.6, f.y, f.z);
      obj.updateMatrix();
      mesh.setMatrixAt(i, obj.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.045, 6, 6]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
    </instancedMesh>
  );
}


export default function SnowMountainScene() {
  return (
    <Canvas
      camera={{ position: [0, 2.5, 11], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      shadows
    >
      <color attach="background" args={["#1e2a4a"]} />
      <fog attach="fog" args={["#334669", 8, 30]} />

      <ambientLight intensity={0.6} color="#dbeafe" />
      <directionalLight
        position={[6, 10, 4]}
        intensity={1.6}
        color="#e0f2fe"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-6, 3, 4]} intensity={0.8} color="#93c5fd" />

      <Suspense fallback={null}>
        <MountainRange />
        <Snowfall count={350} />
        <Sparkles count={60} scale={16} size={2.5} speed={0.3} color="#bfdbfe" />

        {/* 地面（雪原） */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.9} />
        </mesh>

        <Float speed={1.2} floatIntensity={0.6} rotationIntensity={0.1}>
          <mesh position={[0, -0.6, 2]} castShadow>
            <icosahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial color="#93c5fd" emissive="#60a5fa" emissiveIntensity={0.5} roughness={0.2} metalness={0.3} />
          </mesh>
        </Float>
      </Suspense>

      <EffectComposer multisampling={0}>
        <Bloom intensity={0.6} luminanceThreshold={0.5} luminanceSmoothing={0.9} mipmapBlur />
        <Vignette eskil={false} offset={0.2} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  );
}
