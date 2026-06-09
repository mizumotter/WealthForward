import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { formatMan } from "@/lib/utils";
import type { SimulationResult } from "@/lib/engine";

type Props = {
  result: SimulationResult;
};

export function SimChart({ result }: Props) {
  const data = result.years.map((yr) => ({
    year: yr.year,
    balance: yr.cumulativeBalance,
    income: yr.totalIncome,
    costs: yr.totalCosts,
    net: yr.annualNet,
  }));

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          className="rounded-xl border border-border bg-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-xs text-muted-foreground">Final Balance</p>
          <div className="mt-1 text-2xl font-bold">
            <AnimatedNumber
              value={result.finalBalance}
              format={formatMan}
            />
            <span className="text-sm text-muted-foreground ml-0.5">円</span>
          </div>
        </motion.div>
        <motion.div
          className="rounded-xl border border-border bg-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs text-muted-foreground">Peak</p>
          <div className="mt-1 text-2xl font-bold text-positive">
            <AnimatedNumber
              value={result.peakBalance}
              format={formatMan}
            />
            <span className="text-sm text-muted-foreground ml-0.5">円</span>
          </div>
        </motion.div>
        <motion.div
          className="rounded-xl border border-border bg-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-xs text-muted-foreground">Min</p>
          <div className="mt-1 text-2xl font-bold text-negative">
            <AnimatedNumber
              value={result.minBalance}
              format={formatMan}
            />
            <span className="text-sm text-muted-foreground ml-0.5">円</span>
          </div>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div
        className="rounded-xl border border-border bg-card p-4"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">
          Cumulative Balance
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.72 0.19 163)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.72 0.19 163)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.25 0.015 260)"
              vertical={false}
            />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: "oklch(0.6 0.01 260)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "oklch(0.6 0.01 260)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.15 0.012 260)",
                border: "1px solid oklch(0.25 0.015 260)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "oklch(0.93 0.005 260)" }}
              formatter={(value) => [
                `${Number(value).toLocaleString("ja-JP")}円`,
                "Balance",
              ]}
            />
            <ReferenceLine
              x={currentYear}
              stroke="oklch(0.72 0.19 163)"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
            <ReferenceLine
              y={0}
              stroke="oklch(0.6 0.01 260)"
              strokeOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="oklch(0.72 0.19 163)"
              strokeWidth={2}
              fill="url(#balanceGradient)"
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
