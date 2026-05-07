"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TunaPosition {
  id: number;
  x: number;
  y: number;
  scale: number;
  duration: number;
  delay: number;
  image: "tuna1" | "tuna2" | "tuna3";
}

const generateTunaSchool = (): TunaPosition[] => {
  const images: ("tuna1" | "tuna2" | "tuna3")[] = ["tuna1", "tuna2", "tuna3"];
  return Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100 - 150,
    y: (i % 4) * 20 + Math.random() * 10 - 5,
    scale: 0.9 + Math.random() * 0.6,
    duration: 3.5 + Math.random() * 2,
    delay: (i % 6) * 0.5,
    image: images[i % 3],
  }));
};

export default function TunaSchoolImages() {
  const [tunaSchool, setTunaSchool] = useState<TunaPosition[]>([]);
  const [particles, setParticles] = useState<Array<{ duration: number; delay: number }>>([]);

  useEffect(() => {
    setTunaSchool(generateTunaSchool());
    setParticles(
      Array.from({ length: 20 }, () => ({
        duration: 6 + Math.random() * 4,
        delay: Math.random() * 4,
      }))
    );
  }, []);

  return (
    <div className="relative w-full h-48 md:h-64 overflow-hidden bg-gradient-to-b from-[#1a3a4a] via-[#0f2a38] to-[#081520]">
      {/* Water effect background */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="water" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M0,50 Q25,40 50,50 T100,50" stroke="rgba(62,150,204,0.2)" fill="none" strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#water)" />
        </svg>
      </div>

      {/* Tuna School */}
      {tunaSchool.map((tuna) => (
        <motion.div
          key={tuna.id}
          className="absolute"
          initial={{ x: `${tuna.x}%`, opacity: 0 }}
          animate={{
            x: [`${tuna.x}%`, `${tuna.x + 800}%`],
            y: [
              `${tuna.y}%`,
              `${tuna.y + Math.sin(tuna.id) * 5}%`,
              `${tuna.y}%`,
            ],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: tuna.duration,
            delay: tuna.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <img
            src={`/${tuna.image}.png`}
            alt="Tuna"
            className="w-32 md:w-48 h-auto object-contain filter drop-shadow-lg"
            style={{
              transform: `scaleX(-1) scale(${tuna.scale})`,
              transformOrigin: "center",
            }}
          />
        </motion.div>
      ))}

      {/* Floating particles */}
      {particles.map((particle, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 rounded-full bg-white/20"
          animate={{
            y: [-50, 300],
            x: Math.sin(i) * 100,
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
          }}
          style={{
            left: `${(i / 20) * 100}%`,
          }}
        />
      ))}
    </div>
  );
}
