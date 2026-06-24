import type { ReactNode } from 'react';

export function KpiTile({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string | number;
  unit?: string;
  accent?: 'nominal' | 'degraded' | 'alert' | 'neutral';
}) {
  const border =
    accent === 'alert'
      ? 'kpi-alert'
      : accent === 'degraded'
        ? 'kpi-degraded'
        : accent === 'nominal'
          ? 'kpi-nominal'
          : '';

  return (
    <div className={`kpi-tile ${border}`}>
      <p className="kpi-label">{label}</p>
      <div className="kpi-value-row">
        <span className="kpi-value">{value}</span>
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="mes-panel">
      <header className="mes-panel-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="mes-panel-body">{children}</div>
    </section>
  );
}

export function StatusPill({
  status,
  label,
  pulse,
}: {
  status: string;
  label?: string;
  pulse?: boolean;
}) {
  const s = status.toLowerCase();
  const cls =
    s.includes('critical') || s === 'alert'
      ? 'pill-critical'
      : s.includes('warn') || s === 'degraded'
        ? 'pill-warning'
        : 'pill-nominal';

  return (
    <span className={`status-pill ${cls}`}>
      {pulse && <span className="pulse-dot" />}
      {label ?? status}
    </span>
  );
}
