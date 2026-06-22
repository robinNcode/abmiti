import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useYearlyTrend } from '@/hooks';
import { SHORT_MONTHS, formatBDT } from '@/utils';
import { Spinner } from '@/components/ui';

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-4 py-3 text-xs space-y-1.5 shadow-lift">
      <p className="font-semibold text-ink/60 mb-2">{SHORT_MONTHS[(label ?? 1) - 1]}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-6">
          <span style={{ color: p.color }} className="font-medium capitalize">{p.name}</span>
          <span className="font-bold">{formatBDT(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function YearlyTrendChart() {
  const { data = [], isLoading } = useYearlyTrend();

  if (isLoading) return (
    <div className="flex justify-center py-12"><Spinner className="text-terra" /></div>
  );

  const chartData = data.map((d) => ({
    ...d,
    name: SHORT_MONTHS[d.month - 1],
  }));

  return (
    <div className="w-full aspect-[4/3] md:aspect-[21/9] min-h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#4a7c59" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#4a7c59" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#c2552a" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#c2552a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#2a6dc2" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2a6dc2" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8dcc8" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5a4e3a', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#5a4e3a', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'DM Sans', paddingTop: '12px' }} />
          <Area type="monotone" dataKey="income"  name="Income"  stroke="#4a7c59" strokeWidth={2} fill="url(#incomeGrad)"  dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="expense" name="Expense" stroke="#c2552a" strokeWidth={2} fill="url(#expenseGrad)" dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="savings" name="Savings" stroke="#2a6dc2" strokeWidth={2} fill="url(#savingsGrad)" dot={false} activeDot={{ r: 4 }} strokeDasharray="5 3" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
