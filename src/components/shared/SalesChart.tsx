'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useThemeStore } from '@/store/useThemeStore';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

export interface SalesChartPoint {
  day: string;
  sales: number;
  orders: number;
}

interface SalesChartProps {
  /** Dinamik ma'lumot. */
  data?: SalesChartPoint[];
}

export default function SalesChart({ data }: SalesChartProps) {
  const resolved = useThemeStore((s) => s.resolved);
  const isDark = resolved === 'dark';

  const chartData = data ?? [];
  // Theme-aware chart palette. Light mode uses lighter grid/axis tones,
  // dark mode uses the spec's slate palette.
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const gridOpacity = isDark ? 0.4 : 0.8;

  const highestDay =
    chartData.length > 0
      ? chartData.reduce((max, curr) => (curr.sales > max.sales ? curr : max), chartData[0])
      : null;

  const totalSales = chartData.reduce((sum, p) => sum + p.sales, 0);
  const totalOrders = chartData.reduce((sum, p) => sum + p.orders, 0);
  const avgCheck = totalOrders > 0 ? totalSales / totalOrders : 0;

  return (
    <div className="space-y-6">
            {/* Statistics Header (Stripe / Datadog Analytics Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Umumiy Savdo
          </span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {(totalSales / 1000000).toFixed(1)} mln
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <ArrowUpRight className="w-3.5 h-3.5" /> so'm
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Eng Yuqori Kun (Peak Day)
          </span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {highestDay?.day ?? '—'}
            </span>
            {highestDay && (
              <span className="text-xs font-semibold text-slate-500">
                ({(highestDay.sales / 1000000).toFixed(1)} mln so'm)
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            O'rtacha Chek
          </span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {Math.round(avgCheck).toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500">so'm</span>
          </div>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-72 w-full">
                {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="enterpriseSalesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="lineStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={gridOpacity} />
              <XAxis
                dataKey="day"
                stroke={axisColor}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                stroke={axisColor}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val / 1000000}M`}
                dx={-8}
              />
                            <Tooltip
                cursor={{ stroke: isDark ? '#475569' : '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xl text-slate-900 dark:text-white space-y-1.5 min-w-[160px]">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 pb-1.5">
                          <span>Hafta kuni</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">{label}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-600 dark:text-slate-300">Savdo Hajmi:</span>
                          <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{Number(data.sales).toLocaleString()} so'm</strong>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300">Buyurtmalar:</span>
                          <strong className="text-indigo-600 dark:text-indigo-300">{data.orders} ta</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="url(#lineStrokeGradient)"
                strokeWidth={3.5}
                fillOpacity={1}
                fill="url(#enterpriseSalesGradient)"
                isAnimationActive={true}
                animationDuration={700}
                activeDot={{ r: 7, stroke: isDark ? '#0f172a' : '#ffffff', strokeWidth: 2, fill: '#6366F1' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <TrendingUp className="w-8 h-8 opacity-40 animate-pulse" />
            <p className="text-xs font-semibold">Hozircha tahliliy ma'lumotlar mavjud emas</p>
          </div>
        )}
      </div>
    </div>
  );
}
