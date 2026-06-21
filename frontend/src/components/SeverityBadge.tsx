import type { IssueSeverity } from '../api/client';

const styles: Record<IssueSeverity, string> = {
  info: 'badge info',
  warning: 'badge warning',
  critical: 'badge critical',
};

export function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  return <span className={styles[severity]}>{severity}</span>;
}
