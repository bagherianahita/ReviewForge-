import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import type { Annotation, Issue, IssueSeverity } from '../api/client';

interface ModelViewerProps {
  issues: Issue[];
  annotations: Annotation[];
  onCanvasClick?: (point: { x: number; y: number; z: number }) => void;
}

const severityColor: Record<IssueSeverity, string> = {
  info: '#3b82f6',
  warning: '#f59e0b',
  critical: '#ef4444',
};

function DemoAssembly({ issues, annotations }: { issues: Issue[]; annotations: Annotation[] }) {
  const markers = [
    ...issues.filter((i) => i.position).map((i) => ({
      x: i.position!.x,
      y: i.position!.y,
      z: i.position!.z,
      label: i.title,
      severity: i.severity,
    })),
    ...annotations.map((a) => ({
      x: a.position_x,
      y: a.position_y,
      z: a.position_z,
      label: a.label,
      severity: a.severity,
    })),
  ];

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
      <mesh castShadow position={[-1.1, 0.15, 0.4]}>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh castShadow position={[1.1, 0.15, -0.4]}>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {markers.map((marker, idx) => (
        <mesh key={idx} position={[marker.x, marker.y, marker.z]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={severityColor[marker.severity]} emissive={severityColor[marker.severity]} emissiveIntensity={0.4} />
          <Html distanceFactor={8} center>
            <div className="marker-label">{marker.label}</div>
          </Html>
        </mesh>
      ))}
    </group>
  );
}

export function ModelViewer({ issues, annotations, onCanvasClick }: ModelViewerProps) {
  return (
    <div className="viewer-panel">
      <Canvas
        shadows
        onPointerMissed={(event) => {
          if (event.type === 'click' && onCanvasClick) {
            onCanvasClick({ x: (Math.random() - 0.5) * 2, y: Math.random(), z: (Math.random() - 0.5) * 2 });
          }
        }}
      >
        <PerspectiveCamera makeDefault position={[4, 3, 4]} />
        <ambientLight intensity={0.5} />
        <directionalLight castShadow position={[5, 8, 3]} intensity={1.2} />
        <DemoAssembly issues={issues} annotations={annotations} />
        <OrbitControls makeDefault enableDamping />
        <gridHelper args={[10, 10, '#334155', '#1e293b']} />
      </Canvas>
      <p className="viewer-hint">Drag to orbit · Scroll to zoom · Click to add annotation</p>
    </div>
  );
}
