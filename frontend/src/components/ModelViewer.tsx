import { Bounds, Center, Html, OrbitControls, PerspectiveCamera } from '@react-three/drei';
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
  info: '#3b82f6',
  warning: '#f59e0b',
  critical: '#ef4444',
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
        <mesh key={`${marker.label}-${index}`} position={[marker.x, marker.y, marker.z]}>
          <sphereGeometry args={[2.5, 16, 16]} />
          <meshStandardMaterial
            color={severityColor[marker.severity]}
            emissive={severityColor[marker.severity]}
            emissiveIntensity={0.45}
          />
          <Html distanceFactor={40} center>
            <div className="marker-label">{marker.label}</div>
          </Html>
        </mesh>
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
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.38} />
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
        <meshStandardMaterial color="#64748b" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.6, 32]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.35} />
      </mesh>
      <Markers issues={issues} annotations={annotations} />
    </group>
  );
}

export function ModelViewer({ meshUrl, issues, annotations, onCanvasClick }: ModelViewerProps) {
  return (
    <div className="viewer-panel">
      <Canvas
        shadows
        onPointerMissed={(event) => {
          if (event.type === 'click' && onCanvasClick) {
            onCanvasClick({ x: 0, y: 0, z: 0 });
          }
        }}
      >
        <PerspectiveCamera makeDefault position={[180, 120, 180]} />
        <ambientLight intensity={0.55} />
        <directionalLight castShadow position={[200, 260, 140]} intensity={1.15} />
        <Bounds fit clip observe margin={1.25}>
          <Suspense fallback={null}>
            {meshUrl ? (
              <LoadedStl url={meshUrl} issues={issues} annotations={annotations} />
            ) : (
              <PlaceholderAssembly issues={issues} annotations={annotations} />
            )}
          </Suspense>
        </Bounds>
        <OrbitControls makeDefault enableDamping />
        <gridHelper args={[300, 30, '#334155', '#1e293b']} />
      </Canvas>
      <p className="viewer-hint">
        {meshUrl ? 'Sample STL loaded · drag to orbit · scroll to zoom' : 'Upload a mesh to view geometry'}
      </p>
    </div>
  );
}
