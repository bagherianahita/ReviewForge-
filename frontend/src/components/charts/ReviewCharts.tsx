import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardSummary } from '../../api/dashboard';
import { Panel } from '../ui';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
};

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#111827',
    border: '1px solid #334155',
    borderRadius: 8,
    fontSize: 12,
  },
};

export function SeverityChart({ data }: { data: DashboardSummary['severity_distribution'] }) {
  return (
    <Panel title="Finding Severity Distribution" subtitle="AutoReview issues by severity level">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={SEVERITY_COLORS[entry.key] ?? '#64748b'} stroke="#111827" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </Panel>
  );
}

export function RuleChart({ data }: { data: DashboardSummary['rule_distribution'] }) {
  return (
    <Panel title="Rule Engine Output" subtitle="Findings per geometry rule ID (GEO-*)">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="rule_id" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Findings" />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

export function ReviewStatusChart({ data }: { data: DashboardSummary['review_status'] }) {
  return (
    <Panel title="Review Pipeline Status" subtitle="Virtual review sessions by state">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
          <YAxis type="category" dataKey="status" width={90} tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} name="Reviews" />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

export function LessonCategoryChart({ data }: { data: DashboardSummary['lesson_categories'] }) {
  return (
    <Panel title="Knowledge Base" subtitle="Lessons learned by category">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 9 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Lessons" />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}
