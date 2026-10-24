"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

interface SceneProps {
  theme?: "studio" | "wedding" | "birthday" | "community";
}

// Interactive Central Core Mesh depending on theme
function CoreGeometry({ theme }: { theme: "studio" | "wedding" | "birthday" | "community" }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const mouseX = state.pointer.x * 0.4;
    const mouseY = state.pointer.y * 0.4;

    if (meshRef.current) {
      meshRef.current.rotation.x = time * 0.15 + mouseY * 0.5;
      meshRef.current.rotation.y = time * 0.2 + mouseX * 0.5;
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = time * 0.25 - mouseY * 0.3;
      ringRef.current.rotation.z = time * 0.18 + mouseX * 0.3;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.y = -time * 0.22 + mouseX * 0.4;
      ringRef2.current.rotation.z = -time * 0.15 - mouseY * 0.2;
    }
  });

  if (theme === "wedding") {
    // Elegant Intertwined Luxury Gold Bands
    return (
      <group>
        <mesh ref={ringRef} position={[-0.4, 0, 0]} rotation={[0.4, 0.2, 0]}>
          <torusGeometry args={[1.5, 0.14, 32, 100]} />
          <meshStandardMaterial
            color="#f3e5ab"
            metalness={0.95}
            roughness={0.12}
            envMapIntensity={1.5}
          />
        </mesh>
        <mesh ref={ringRef2} position={[0.4, 0.1, 0.2]} rotation={[-0.5, 0.6, 0.3]}>
          <torusGeometry args={[1.4, 0.12, 32, 100]} />
          <meshStandardMaterial
            color="#e0a899"
            metalness={0.92}
            roughness={0.15}
            envMapIntensity={1.5}
          />
        </mesh>
        {/* Floating diamond crystal center */}
        <mesh ref={meshRef} position={[0, 0, 0]}>
          <octahedronGeometry args={[0.55, 0]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transmission={0.9}
            opacity={1}
            transparent
            roughness={0.05}
            ior={2.4}
            thickness={1.2}
          />
        </mesh>
      </group>
    );
  }

  if (theme === "birthday") {
    // Cyber Neon Floating Iridescent Geometries
    return (
      <group>
        <Float speed={2.5} rotationIntensity={1.8} floatIntensity={1.5}>
          <mesh ref={meshRef} position={[0, 0, 0]}>
            <icosahedronGeometry args={[1.2, 2]} />
            <MeshDistortMaterial
              color="#a855f7"
              distort={0.35}
              speed={2.2}
              roughness={0.15}
              metalness={0.9}
            />
          </mesh>
        </Float>
        <mesh ref={ringRef} rotation={[1, 0.5, 0]}>
          <torusGeometry args={[2.0, 0.05, 16, 80]} />
          <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.8} />
        </mesh>
        <mesh ref={ringRef2} rotation={[-0.8, -0.6, 0.4]}>
          <torusGeometry args={[2.3, 0.04, 16, 80]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.8} />
        </mesh>
      </group>
    );
  }

  if (theme === "community") {
    // Organic Geodesic Emerald Terra Sphere & Orbitals
    return (
      <group>
        <Float speed={1.8} rotationIntensity={1.2} floatIntensity={1.2}>
          <mesh ref={meshRef}>
            <dodecahedronGeometry args={[1.3, 1]} />
            <meshStandardMaterial
              color="#10b981"
              wireframe={true}
              emissive="#059669"
              emissiveIntensity={0.6}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.9, 32, 32]} />
            <meshStandardMaterial
              color="#047857"
              roughness={0.3}
              metalness={0.8}
            />
          </mesh>
        </Float>
        <mesh ref={ringRef} rotation={[0.8, 0.3, 0]}>
          <torusGeometry args={[2.2, 0.06, 16, 80]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    );
  }

  // Default Studio Master Stage: High-fashion Brushed Platinum & Gold Torus Knot
  return (
    <group>
      <Float speed={2} rotationIntensity={1.5} floatIntensity={1.2}>
        <mesh ref={meshRef}>
          <torusKnotGeometry args={[1.1, 0.32, 128, 32]} />
          <meshStandardMaterial
            color="#d4af37"
            metalness={0.92}
            roughness={0.18}
            envMapIntensity={1.8}
          />
        </mesh>
      </Float>
      <mesh ref={ringRef} rotation={[0.6, 0.4, 0]}>
        <torusGeometry args={[2.4, 0.04, 16, 100]} />
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
}

// Particle Constellation reacting to cursor
function ParticlesField({ theme }: { theme: "studio" | "wedding" | "birthday" | "community" }) {
  const count = 160;
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const baseColor =
      theme === "wedding"
        ? new THREE.Color("#f3e5ab")
        : theme === "birthday"
        ? new THREE.Color("#a855f7")
        : theme === "community"
        ? new THREE.Color("#10b981")
        : new THREE.Color("#d4af37");

    const secondaryColor =
      theme === "wedding"
        ? new THREE.Color("#e0a899")
        : theme === "birthday"
        ? new THREE.Color("#ec4899")
        : theme === "community"
        ? new THREE.Color("#d97706")
        : new THREE.Color("#ffffff");

    // A deterministic sequence keeps the canvas stable across React renders.
    const pseudoRandom = (seed: number) => {
      const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return value - Math.floor(value);
    };

    for (let i = 0; i < count; i++) {
      const radius = 3.5 + pseudoRandom(i * 4 + 1) * 5.0;
      const theta = pseudoRandom(i * 4 + 2) * Math.PI * 2;
      const phi = Math.acos(pseudoRandom(i * 4 + 3) * 2 - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);

      const mixed = baseColor.clone().lerp(secondaryColor, pseudoRandom(i * 4 + 4));
      col[i * 3] = mixed.r;
      col[i * 3 + 1] = mixed.g;
      col[i * 3 + 2] = mixed.b;
    }
    return [pos, col];
  }, [theme]);

  useFrame((state) => {
    if (pointsRef.current) {
      const t = state.clock.getElapsedTime();
      pointsRef.current.rotation.y = t * 0.05 + state.pointer.x * 0.2;
      pointsRef.current.rotation.x = t * 0.03 + state.pointer.y * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

export default function EventScene({ theme = "studio" }: SceneProps) {
  const primaryLightColor =
    theme === "wedding"
      ? "#fbf0d9"
      : theme === "birthday"
      ? "#d946ef"
      : theme === "community"
      ? "#34d399"
      : "#fef08a";

  const secondaryLightColor =
    theme === "wedding"
      ? "#e0a899"
      : theme === "birthday"
      ? "#06b6d4"
      : theme === "community"
      ? "#f59e0b"
      : "#ffffff";

  return (
    <div className="w-full h-full relative pointer-events-none select-none">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 5]} intensity={2.2} color={primaryLightColor} />
        <pointLight position={[-5, -3, 3]} intensity={1.8} color={secondaryLightColor} />
        <pointLight position={[0, 4, -3]} intensity={1.0} color="#ffffff" />

        <CoreGeometry theme={theme} />
        <ParticlesField theme={theme} />
      </Canvas>
    </div>
  );
}
