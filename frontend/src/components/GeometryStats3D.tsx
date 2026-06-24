import { useMemo } from 'react';
import type { AutoReviewResult } from '../api/client';

/** 3D-style bar visualization of geometry summary from AutoReview */
export function GeometryStats3D({ summary }: { summary: Record<string, unknown> | null }) {
  const bars = useMemo(() => {
    if (!summary) return [];
    const extents = (summary.extents_mm as number[]) ?? [100, 80, 40];
    const labels = ['X extent', 'Y extent', 'Z extent'];
    const max = Math.max(...extents, 1);
    return labels.map((label, i) => ({
      label,
      value: extents[i] ?? 0,
      pct: ((extents[i] ?? 0) / max) * 100,
      color: ['#06b6d4', '#a855f7', '#f97316'][i],
    }));
  }, [summary]);

  if (!summary) {
    return (
      <div className="geo-3d-chart empty">
        <p>Run AutoReview to generate 3D geometry metrics</p>
      </div>
    );
  }

  const watertight = summary.is_watertight as boolean;
  const volume = summary.volume_mm3 as number;
  const faces = summary.face_count as number;

  return (
    <div className="geo-3d-chart">
      <div className="geo-3d-header">
        <span className="geo-title">Geometry Analysis</span>
        <span className={`geo-badge ${watertight ? 'ok' : 'warn'}`}>
          {watertight ? 'Watertight ✓' : 'Open mesh'}
        </span>
      </div>

      <div className="geo-3d-bars">
        {bars.map((bar) => (
          <div key={bar.label} className="geo-bar-row">
            <span className="geo-bar-label">{bar.label}</span>
            <div className="geo-bar-track">
              <div
                className="geo-bar-fill"
                style={{
                  width: `${bar.pct}%`,
                  background: `linear-gradient(90deg, ${bar.color}88, ${bar.color})`,
                  boxShadow: `0 0 12px ${bar.color}55`,
                }}
              />
            </div>
            <span className="geo-bar-value mono">{bar.value.toFixed(1)} mm</span>
          </div>
        ))}
      </div>

      <div className="geo-metrics-row">
        <div className="geo-metric">
          <span className="geo-metric-label">Volume</span>
          <span className="geo-metric-value mono">
            {volume > 1e6 ? `${(volume / 1e6).toFixed(2)}M` : volume.toFixed(0)} mm³
          </span>
        </div>
        <div className="geo-metric">
          <span className="geo-metric-label">Faces</span>
          <span className="geo-metric-value mono">{faces?.toLocaleString() ?? '—'}</span>
        </div>
        <div className="geo-metric">
          <span className="geo-metric-label">Vertices</span>
          <span className="geo-metric-value mono">
            {(summary.vertex_count as number)?.toLocaleString() ?? '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

export function GeometryStatsFromReview({ autoReview }: { autoReview: AutoReviewResult | null }) {
  return <GeometryStats3D summary={autoReview?.geometry_summary ?? null} />;
}
