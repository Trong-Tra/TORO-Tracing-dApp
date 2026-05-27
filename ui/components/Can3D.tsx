"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import QRCode from "qrcode";

const CAN_RADIUS = 1.1;
const CAN_HEIGHT = 0.9;
const RIM_TUBE = 0.04;
const LABEL_HEIGHT = 0.65;
const TEX_W = 4096;
const TEX_H = 384;

/* ─── Generate real QR code ─── */
async function generateQRCanvas(url: string): Promise<HTMLCanvasElement> {
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, url, {
    width: 384,
    margin: 0,
    color: {
      dark: "#000000",
      light: "#d0d0d0", // Match the metallic can color
    },
  });
  return qrCanvas;
}

/* ─── Compose repeating label ─── */
async function composeLabelTexture(
  tunaImg: HTMLImageElement,
  qrCanvas: HTMLCanvasElement
): Promise<THREE.CanvasTexture> {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, TEX_W, TEX_H);

  const tunaTargetH = TEX_H * 0.884;
  const tunaScale = tunaTargetH / tunaImg.height;
  const tunaW = tunaImg.width * tunaScale;
  const tunaH = tunaImg.height * tunaScale;
  const qrSize = TEX_H * 0.78;

  const centres = [512, 1536, 2560, 3584];
  centres.forEach((cx, i) => {
    if (i % 2 === 0) {
      ctx.drawImage(tunaImg, cx - tunaW / 2, TEX_H / 2 - tunaH / 2, tunaW, tunaH);
    } else {
      // Draw the real QR code
      ctx.drawImage(
        qrCanvas,
        cx - qrSize / 2,
        TEX_H / 2 - qrSize / 2,
        qrSize,
        qrSize
      );
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.offset.set(0.375, 0);
  return tex;
}

function createPlaceholderTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  canvas.getContext("2d")!.clearRect(0, 0, TEX_W, TEX_H);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.offset.set(0.375, 0);
  return tex;
}

/* ─── 3D Can ─── */
function CanModel({
  onHoverChange,
}: {
  onHoverChange?: (hovered: boolean) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [labelTex, setLabelTex] = useState<THREE.CanvasTexture>(() =>
    createPlaceholderTexture()
  );
  const [pinTex, setPinTex] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        // Generate QR code from URL
        const qrCanvas = await generateQRCanvas(
          "https://toro-dapp.vercel.app/trace"
        );

        // Load tuna image
        const tunaImg = new Image();
        tunaImg.crossOrigin = "anonymous";
        tunaImg.src = "/tuna_on_can.png";
        
        tunaImg.onload = async () => {
          const tex = await composeLabelTexture(tunaImg, qrCanvas);
          setLabelTex(tex);
        };
        tunaImg.onerror = () => console.error("Failed to load /tuna_on_can.png");
      } catch (err) {
        console.error("Failed to generate QR code:", err);
      }
    };

    const pinImg = new Image();
    pinImg.crossOrigin = "anonymous";
    pinImg.src = "/pin_on_tuna_can.png";
    pinImg.onload = () => {
      const tex = new THREE.Texture(pinImg);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setPinTex(tex);
    };
    pinImg.onerror = () => console.error("Failed to load /pin_on_tuna_can.png");

    loadAssets();
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Only spin when not hovered
    if (!hovered) {
      groupRef.current.rotation.y += 0.003;
    }

    // Gentle float animation (kept regardless of hover)
    const floatY = Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
    groupRef.current.position.y = floatY;
  });

  const handlePointerOver = () => {
    setHovered(true);
    onHoverChange?.(true);
    document.body.style.cursor = "grab";
  };

  const handlePointerOut = () => {
    setHovered(false);
    onHoverChange?.(false);
    document.body.style.cursor = "auto";
  };

  const silverMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#c0c0c0",
        metalness: 0.95,
        roughness: 0.15,
      }),
    []
  );

  return (
    <group
      ref={groupRef}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[CAN_RADIUS, CAN_RADIUS, CAN_HEIGHT, 64]} />
        <meshStandardMaterial color="#d0d0d0" metalness={0.7} roughness={0.3} />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <cylinderGeometry
          args={[
            CAN_RADIUS + 0.002,
            CAN_RADIUS + 0.002,
            LABEL_HEIGHT,
            64,
            1,
            true,
          ]}
        />
        <meshStandardMaterial
          map={labelTex}
          metalness={0.7}
          roughness={0.3}
          transparent
          alphaTest={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh
        position={[0, CAN_HEIGHT / 2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[CAN_RADIUS, RIM_TUBE, 16, 64]} />
        <primitive object={silverMat} attach="material" />
      </mesh>

      <mesh
        position={[0, -CAN_HEIGHT / 2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[CAN_RADIUS, RIM_TUBE, 16, 64]} />
        <primitive object={silverMat} attach="material" />
      </mesh>

      <mesh
        position={[0, CAN_HEIGHT / 2 - 0.02, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[CAN_RADIUS - 0.02, 64]} />
        <meshStandardMaterial color="#b8b8b8" metalness={0.9} roughness={0.2} />
      </mesh>

      <mesh
        position={[0, -CAN_HEIGHT / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[CAN_RADIUS - 0.02, 64]} />
        <primitive object={silverMat} attach="material" />
      </mesh>

      {pinTex && (
        <mesh
          position={[0, CAN_HEIGHT / 2 + 0.015, 0.55]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.6, 0.8]} />
          <meshStandardMaterial
            map={pinTex}
            transparent
            alphaTest={0.1}
            side={THREE.DoubleSide}
            metalness={0.8}
            roughness={0.2}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

function Scene({ onHoverChange }: { onHoverChange?: (hovered: boolean) => void }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-3, -2, -3]} intensity={0.4} color="#3e96cc" />
      <pointLight position={[0, 3, 0]} intensity={0.6} color="#ffc354" />
      <CanModel onHoverChange={onHoverChange} />
      <Environment preset="city" />
    </>
  );
}

export default function Can3D({
  onHoverChange,
}: {
  onHoverChange?: (hovered: boolean) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ocean border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* fov lowered from 45 → 32: acts like zooming out, can fits without cropping */}
      <Canvas camera={{ position: [0, 0.4, 5.5], fov: 36 }}>
        <Scene onHoverChange={onHoverChange} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.5}
          autoRotate={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
}