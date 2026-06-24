import { Panel } from './ui';

const STEPS = [
  { id: 1, label: 'STL Upload', sub: 'CAD mesh ingest', color: '#06b6d4' },
  { id: 2, label: 'Trimesh Analysis', sub: 'volume · bounds · faces', color: '#8b5cf6' },
  { id: 3, label: 'Rule Engine', sub: 'GEO-001 · GEO-002', color: '#f59e0b' },
  { id: 4, label: '3D Markers', sub: 'severity-coded R3F', color: '#10b981' },
  { id: 5, label: 'SME Review', sub: 'comments · annotations', color: '#3b82f6' },
  { id: 6, label: 'pgvector Search', sub: 'lessons · similarity', color: '#ec4899' },
];

export function ReviewPipelineDiagram() {
  return (
    <Panel title="AutoReview Pipeline" subtitle="Hybrid AI geometry workflow — deterministic rules + optional LLM">
      <svg viewBox="0 0 720 100" className="pipeline-svg">
        {STEPS.map((step, i) => {
          const x = 20 + i * 118;
          return (
            <g key={step.id}>
              {i > 0 && (
                <line
                  x1={x - 28}
                  y1={40}
                  x2={x - 8}
                  y2={40}
                  stroke="#334155"
                  strokeWidth={2}
                  markerEnd="url(#arrow)"
                />
              )}
              <rect
                x={x}
                y={18}
                width={100}
                height={44}
                rx={8}
                fill="#111827"
                stroke={step.color}
                strokeWidth={1.5}
              />
              <text x={x + 50} y={36} textAnchor="middle" fill="#e2e8f0" fontSize={9} fontWeight={600}>
                {step.label}
              </text>
              <text x={x + 50} y={50} textAnchor="middle" fill="#64748b" fontSize={7} fontFamily="monospace">
                {step.sub}
              </text>
            </g>
          );
        })}
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#475569" />
          </marker>
        </defs>
      </svg>
    </Panel>
  );
}
