"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const FISH_COUNT = 80;

function FishSchool() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const fishData = useMemo(() => {
    return Array.from({ length: FISH_COUNT }, () => ({
      offset: Math.random() * 100,
      speed: 0.3 + Math.random() * 0.4,
      yAmp: 0.3 + Math.random() * 0.5,
      zAmp: 0.2 + Math.random() * 0.3,
      scale: 0.6 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    fishData.forEach((fish, i) => {
      const t = time * fish.speed + fish.offset;
      const x = ((t * 2) % 20) - 10;
      const y = Math.sin(t * 0.7 + fish.phase) * fish.yAmp;
      const z = Math.cos(t * 0.5 + fish.phase) * fish.zAmp;

      dummy.position.set(x, y, z);
      dummy.rotation.set(
        Math.sin(t * 2) * 0.1,
        -Math.PI / 2 + Math.sin(t * 0.3) * 0.05,
        Math.sin(t * 1.5) * 0.05
      );
      dummy.scale.setScalar(fish.scale * (1 + Math.sin(t * 3) * 0.05));
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, FISH_COUNT]}>
      <coneGeometry args={[0.15, 0.5, 8]} />
      <meshStandardMaterial
        color="#ffc354"
        metalness={0.4}
        roughness={0.5}
        emissive="#ff914d"
        emissiveIntensity={0.2}
      />
    </instancedMesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#3e96cc" />
      <directionalLight position={[-3, -2, -3]} intensity={0.3} color="#0c2c54" />
      <FishSchool />
    </>
  );
}

export default function TunaSchool() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[250px] md:h-[350px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ocean border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-[250px] md:h-[350px]">
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <Scene />
      </Canvas>
    </div>
  );
}
