"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles, Float } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { InstancedMesh, Object3D } from "three";

/** シード付きの決定論的疑似乱数（Math.randomは描画中に呼べないため） */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** リッジ状の地形を生成する疑似ノイズ（複数の正弦波を重ねる、なだらかな稜線用に低振幅） */
function ridgeNoise(x: number, z: number, seedOffset: number): number {
  const n1 = Math.sin(x * 0.14 + seedOffset) * Math.cos(z * 0.11 + seedOffset * 1.7);
  const n2 = Math.sin(x * 0.32 + seedOffset * 2.3) * Math.cos(z * 0.26 - seedOffset);
  const n3 = Math.sin((x + z) * 0.08 + seedOffset * 0.5);
  const ridge = 1 - Math.abs(n1);
  return ridge * ridge * 1.6 + n2 * 0.25 + n3 * 0.3;
}

const ROCK_LOW = new THREE.Color("#5b5490");
const ROCK_HIGH = new THREE.Color("#9089c2");
const SNOW = new THREE.Color("#ffffff");
const SNOW_SHADE = new THREE.Color("#dbe4ff");

/**
 * 頂点変位 + 頂点カラーによる本格的なローポリ地形（雪山の稜線）。
 * 単純な円錐の集合ではなく、平面を波状に変形させ稜線らしいシルエットを作る。
 */
function LowPolyRidge({
  z,
  scale,
  seedOffset,
  snowLine,
  fade = 1,
}: {
  z: number;
  scale: number;
  seedOffset: number;
  snowLine: number;
  fade?: number;
}) {
  const geometry = useMemo(() => {
    const segments = 48;
    const size = 46;
    const geo = new THREE.PlaneGeometry(size, size * 0.55, segments, Math.floor(segments * 0.55));
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const zLocal = pos.getZ(i);
      const edgeFalloff = Math.max(0, 1 - Math.abs(x) / (size / 2));
      const h = Math.max(0, ridgeNoise(x, zLocal, seedOffset)) * edgeFalloff * scale;
      pos.setY(i, h);

      const t = THREE.MathUtils.clamp((h / scale - snowLine) / 0.18, 0, 1);
      const rockBlend = THREE.MathUtils.clamp(h / (scale * 0.55), 0, 1);
      const rock = ROCK_LOW.clone().lerp(ROCK_HIGH, rockBlend);
      const snowShade = seededRandom(i * 7.13 + seedOffset) > 0.5 ? SNOW : SNOW_SHADE;
      const c = rock.clone().lerp(snowShade, t).multiplyScalar(fade);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [scale, seedOffset, snowLine, fade]);

  return (
    <mesh geometry={geometry} position={[0, -1.4, z]} receiveShadow castShadow>
      <meshStandardMaterial
        vertexColors
        flatShading
        roughness={0.7}
        metalness={0}
        emissive="#232049"
        emissiveIntensity={0.35}
      />
    </mesh>
  );
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
      camera={{ position: [0, 4.2, 27], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      shadows
    >
      <color attach="background" args={["#171b32"]} />
      <fog attach="fog" args={["#2b3358", 30, 92]} />

      <ambientLight intensity={0.9} color="#c7d2fe" />
      <directionalLight
        position={[10, 16, 16]}
        intensity={4.5}
        color="#fde9c8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-10, 6, -10]} intensity={1.2} color="#818cf8" />
      <pointLight position={[0, 3, 6]} intensity={0.6} color="#93c5fd" />

      <Suspense fallback={null}>
        {/* 奥にいくほど霧に沈む多層の稜線で奥行きを演出（遠景ほど遠くへ・淡く） */}
        <LowPolyRidge z={-62} scale={11} seedOffset={4.1} snowLine={0.55} fade={0.45} />
        <LowPolyRidge z={-45} scale={9} seedOffset={1.7} snowLine={0.5} fade={0.7} />
        <LowPolyRidge z={-30} scale={7} seedOffset={9.3} snowLine={0.42} fade={1} />

        <Snowfall count={350} />
        <Sparkles count={60} scale={16} size={2.5} speed={0.3} color="#bfdbfe" />

        {/* 地面（雪原） */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 10]} receiveShadow>
          <planeGeometry args={[90, 70]} />
          <meshStandardMaterial color="#c7cff0" roughness={0.95} />
        </mesh>

        <Float speed={1.2} floatIntensity={0.6} rotationIntensity={0.1}>
          <mesh position={[0, -0.6, 8]} castShadow>
            <icosahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial color="#93c5fd" emissive="#60a5fa" emissiveIntensity={0.5} roughness={0.2} metalness={0.3} />
          </mesh>
        </Float>
      </Suspense>

      <EffectComposer multisampling={0}>
        <Bloom intensity={0.4} luminanceThreshold={0.75} luminanceSmoothing={0.9} mipmapBlur />
        <Vignette eskil={false} offset={0.2} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  );
}
