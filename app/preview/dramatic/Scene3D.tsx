"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Stars, MeshDistortMaterial, MeshWobbleMaterial } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import type { Mesh } from "three";

function SpinningKnot({
  position,
  color,
  speed = 1,
  scale = 1,
}: {
  position: [number, number, number];
  color: string;
  speed?: number;
  scale?: number;
}) {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * 0.3 * speed;
    ref.current.rotation.y += delta * 0.4 * speed;
  });
  return (
    <Float speed={2 * speed} rotationIntensity={1.2} floatIntensity={2}>
      <mesh ref={ref} position={position} scale={scale}>
        <torusKnotGeometry args={[1, 0.32, 128, 32]} />
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.35}
          distort={0.35}
          speed={2}
          roughness={0.15}
          metalness={0.6}
        />
      </mesh>
    </Float>
  );
}

function WobblyIcosahedron({
  position,
  color,
  scale = 1,
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
}) {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.25;
  });
  return (
    <Float speed={1.6} rotationIntensity={0.8} floatIntensity={3}>
      <mesh ref={ref} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshWobbleMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          factor={0.6}
          speed={1.5}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>
    </Float>
  );
}

export default function Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#0b0620"]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[6, 6, 6]} intensity={2} color="#818cf8" />
      <pointLight position={[-6, -4, 4]} intensity={2} color="#f472b6" />
      <pointLight position={[0, 6, -4]} intensity={1.2} color="#38bdf8" />

      <Suspense fallback={null}>
        <Stars radius={60} depth={40} count={2500} factor={3} saturation={0} fade speed={1} />
        <Sparkles count={80} scale={12} size={4} speed={0.6} color="#c4b5fd" />

        <SpinningKnot position={[-3.4, 1.2, -1]} color="#6366f1" speed={1.1} scale={1.15} />
        <SpinningKnot position={[3.6, -0.8, -2]} color="#f43f5e" speed={0.8} scale={1.35} />
        <WobblyIcosahedron position={[2.6, 2.1, -3]} color="#22d3ee" scale={1.1} />
        <WobblyIcosahedron position={[-2.8, -2, -2]} color="#a855f7" scale={1.4} />
        <WobblyIcosahedron position={[0, -0.3, -5]} color="#fbbf24" scale={0.9} />
      </Suspense>

      <EffectComposer multisampling={0}>
        <Bloom intensity={0.8} luminanceThreshold={0.35} luminanceSmoothing={0.9} mipmapBlur />
        <Noise opacity={0.03} />
        <Vignette eskil={false} offset={0.15} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  );
}
