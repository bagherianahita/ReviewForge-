import { Bounds, Center, Environment, Html, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas, useLoader } from '@react-three/fiber';
import { Suspense } from 'react';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import type { Annotation, Issue, IssueSeverity } from '../api/client';

interface ModelViewerProps {
  meshUrl?: string | null;
  issues: Issue[];
  annotations: Annotation[];
  onCanvasClick?: (point: { x: number; y: number; z: number }) => void;
}

const severityColor: Record<IssueSeverity, string> = {
  info: '#22d3ee',
  warning: '#fb923c',
  critical: '#f43f5e',
};

function Markers({ issues, annotations }: { issues: Issue[]; annotations: Annotation[] }) {
  const markers = [
    ...issues
      .filter((issue) => issue.position)
      .map((issue) => ({
        x: issue.position!.x,
        y: issue.position!.y,
        z: issue.position!.z,
        label: issue.title,
        severity: issue.severity,
      })),
    ...annotations.map((annotation) => ({
      x: annotation.position_x,
      y: annotation.position_y,
      z: annotation.position_z,
      label: annotation.label,
      severity: annotation.severity,
    })),
  ];

  return (
    <>
      {markers.map((marker, index) => (
        <group key={`${marker.label}-${index}`} position={[marker.x, marker.y, marker.z]}>
          <mesh>
            <sphereGeometry args={[3, 20, 20]} />
            <meshStandardMaterial
              color={severityColor[marker.severity]}
              emissive={severityColor[marker.severity]}
              emissiveIntensity={0.7}
            />
          </mesh>
          <pointLight color={severityColor[marker.severity]} intensity={0.8} distance={40} />
          <Html distanceFactor={50} center>
            <div className={`marker-label marker-${marker.severity}`}>{marker.label}</div>
          </Html>
        </group>
      ))}
    </>
  );
}

function LoadedStl({
  url,
  issues,
  annotations,
}: {
  url: string;
  issues: Issue[];
  annotations: Annotation[];
}) {
  const geometry = useLoader(STLLoader, url);
  geometry.computeVertexNormals();

  return (
    <Center>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#c4b5fd"
          metalness={0.65}
          roughness={0.25}
          clearcoat={0.4}
          clearcoatRoughness={0.2}
          emissive="#4c1d95"
          emissiveIntensity={0.08}
        />
      </mesh>
      <Markers issues={issues} annotations={annotations} />
    </Center>
  );
}

function PlaceholderAssembly({ issues, annotations }: { issues: Issue[]; annotations: Annotation[] }) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[2.4, 0.8, 1.2]} />
        <meshPhysicalMaterial color="#06b6d4" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.6, 32]} />
        <meshPhysicalMaterial color="#a855f7" metalness={0.6} roughness={0.25} />
      </mesh>
      <Markers issues={issues} annotations={annotations} />
    </group>
  );
}

export function ModelViewer({ meshUrl, issues, annotations }: ModelViewerProps) {
  return (
    <div className="viewer-panel viewer-panel-enhanced">
      <Canvas shadows gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={['#0a0f1a']} />
        <PerspectiveCamera makeDefault position={[180, 120, 180]} fov={45} />
        <ambientLight intensity={0.4} />
        <directionalLight castShadow position={[200, 260, 140]} intensity={1.4} color="#e0f2fe" />
        <directionalLight position={[-120, 80, -100]} intensity={0.5} color="#c4b5fd" />
        <spotLight position={[0, 300, 0]} angle={0.4} penumbra={0.5} intensity={0.6} color="#22d3ee" />
        <Environment preset="city" />
        <Bounds fit clip observe margin={1.25}>
          <Suspense fallback={null}>
            {meshUrl ? (
              <LoadedStl url={meshUrl} issues={issues} annotations={annotations} />
            ) : (
              <PlaceholderAssembly issues={issues} annotations={annotations} />
            )}
          </Suspense>
        </Bounds>
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
        <gridHelper args={[300, 30, '#6366f1', '#1e1b4b']} />
      </Canvas>
      <p className="viewer-hint">
        {meshUrl ? 'STL mesh · drag orbit · scroll zoom · click to annotate' : 'Upload STL/OBJ via dropdown above'}
      </p>
    </div>
  );
}
