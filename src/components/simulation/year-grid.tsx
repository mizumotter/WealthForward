import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Simulation, Category } from "@/lib/types";
import { resolveAmounts, type SimulationResult } from "@/lib/engine";

// -----------------------------------------------------------------------
// Editable cell — click to edit, blur/Enter to commit
// -----------------------------------------------------------------------

function EditableCell({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(value === 0 ? "" : String(value));
    setEditing(true);
  };

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const stripped = draft.replace(/[,，\s]/g, "");
    const parsed = stripped === "" ? 0 : parseInt(stripped, 10);
    if (!isNaN(parsed) && parsed !== value) {
      onChange(parsed);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className={cn(
          "w-full bg-primary/10 px-1 py-0.5 text-right font-mono text-sm outline-none ring-1 ring-primary/40 rounded",
          className,
        )}
      />
    );
  }

  return (
    <div
      onClick={startEdit}
      className={cn(
        "cursor-pointer px-1 py-0.5 text-right font-mono text-sm tabular-nums",
        "hover:bg-accent/50 rounded transition-colors",
        value === 0 && "text-muted-foreground/40",
        className,
      )}
    >
      {value === 0 ? "-" : value.toLocaleString("ja-JP")}
    </div>
  );
}

// -----------------------------------------------------------------------
// Add row button
// -----------------------------------------------------------------------

function AddRowButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
    >
      <Plus className="h-3 w-3" />
      {label}
    </button>
  );
}

// -----------------------------------------------------------------------
// Section header
// -----------------------------------------------------------------------

function SectionHeader({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 pt-4 pb-2">
      <div className={cn("h-3 w-1 rounded-full", color)} />
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

// -----------------------------------------------------------------------
// Growth rate inline input
// -----------------------------------------------------------------------

function GrowthRateInput({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (rate: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(value ? String(value) : "");
    setEditing(true);
  };

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const parsed = parseFloat(draft);
    const newVal = isNaN(parsed) ? 0 : parsed;
    if (newVal !== (value ?? 0)) onChange(newVal);
  };

  if (editing) {
    return (
      <span className="inline-flex items-center shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-10 bg-primary/10 px-0.5 text-center text-xs outline-none ring-1 ring-primary/40 rounded"
        />
        <span className="text-[10px] text-muted-foreground ml-0.5">%</span>
      </span>
    );
  }

  if (!value) {
    return (
      <button
        onClick={startEdit}
        className="shrink-0 opacity-0 group-hover:opacity-60 text-[10px] text-muted-foreground hover:text-primary transition-all"
        title="Set growth rate"
      >
        +%
      </button>
    );
  }

  return (
    <button
      onClick={startEdit}
      className="shrink-0 inline-flex items-center text-[10px] text-primary/70 hover:text-primary transition-colors"
      title="Growth rate"
    >
      {value > 0 ? "+" : ""}
      {value}%
    </button>
  );
}

// -----------------------------------------------------------------------
// Main YearGrid component
// -----------------------------------------------------------------------

type CategoryType = "income" | "costs" | "balanceInputs";

type Props = {
  sim: Simulation;
  result: SimulationResult;
  onSetAmount: (type: CategoryType, id: string, year: number, amount: number) => void;
  onSetLabel: (type: CategoryType, id: string, label: string) => void;
  onAddCategory: (type: CategoryType, label: string) => void;
  onRemoveCategory: (type: CategoryType, id: string) => void;
  onAddFamily: (name: string, birthYear: number) => void;
  onRemoveFamily: (id: string) => void;
  onUpdateFamily: (id: string, patch: Partial<{ name: string; birthYear: number }>) => void;
  onSetGrowthRate: (type: CategoryType, id: string, rate: number) => void;
};

export function YearGrid({
  sim,
  result,
  onSetAmount,
  onSetLabel,
  onAddCategory,
  onRemoveCategory,
  onAddFamily,
  onRemoveFamily,
  onUpdateFamily,
  onSetGrowthRate,
}: Props) {
  const years = Array.from(
    { length: sim.endYear - sim.startYear + 1 },
    (_, i) => sim.startYear + i,
  );
  const currentYear = new Date().getFullYear();

  // Pre-resolve all categories with growth rates
  const resolved = useMemo(() => {
    const map = new Map<string, Record<number, number>>();
    const resolve = (cats: Category[], carry: boolean) => {
      for (const cat of cats) {
        map.set(cat.id, resolveAmounts(cat, sim.startYear, sim.endYear, carry));
      }
    };
    resolve(sim.income, false);
    resolve(sim.costs, false);
    resolve(sim.balanceInputs, true);
    return map;
  }, [sim]);

  const renderCategoryRows = (
    type: CategoryType,
    categories: Category[],
  ) =>
    categories.map((cat, idx) => {
      const res = resolved.get(cat.id) ?? {};
      return (
        <motion.tr
          key={cat.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.03 }}
          className="group"
        >
          {/* Label cell */}
          <td className="sticky left-0 z-10 bg-card border-r border-border min-w-[120px] max-w-[280px] whitespace-nowrap px-2 py-1">
            <div className="flex items-center gap-1">
              <input
                type="text"
                maxLength={100}
                value={cat.label}
                onChange={(e) => onSetLabel(type, cat.id, e.target.value)}
                className="w-full bg-transparent text-sm font-medium outline-none focus:text-primary transition-colors truncate"
              />
              <GrowthRateInput
                value={cat.growthRate}
                onChange={(rate) => onSetGrowthRate(type, cat.id, rate)}
              />
              <button
                onClick={() => onRemoveCategory(type, cat.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </td>
          {/* Year cells — show resolved values, computed ones in dimmer style */}
          {years.map((year) => {
            const isExplicit = year in cat.amounts;
            const value = res[year] ?? 0;
            return (
              <td key={year} className="border-r border-border/30 min-w-[90px]">
                <EditableCell
                  value={value}
                  onChange={(v) => onSetAmount(type, cat.id, year, v)}
                  className={!isExplicit && value !== 0 ? "italic text-muted-foreground/60" : undefined}
                />
              </td>
            );
          })}
        </motion.tr>
      );
    });

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-max min-w-full border-collapse text-sm">
        {/* Year header */}
        <thead>
          <tr className="border-b border-border">
            <th className="sticky left-0 z-20 bg-card border-r border-border min-w-[120px] max-w-[280px] whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-muted-foreground">
              Year
            </th>
            {years.map((year) => (
              <th
                key={year}
                className={cn(
                  "min-w-[90px] border-r border-border/30 px-1 py-2 text-center text-xs font-medium",
                  year === currentYear
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground",
                )}
              >
                {year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Family ages */}
          {sim.family.length > 0 && (
            <>
              <tr>
                <td
                  colSpan={years.length + 1}
                  className="sticky left-0 z-10 bg-card px-2"
                >
                  <SectionHeader label="Family" color="bg-chart-2" />
                </td>
              </tr>
              {sim.family.map((member) => (
                <tr key={member.id} className="group">
                  <td className="sticky left-0 z-10 bg-card border-r border-border min-w-[120px] max-w-[280px] whitespace-nowrap px-2 py-1">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        maxLength={100}
                        value={member.name}
                        onChange={(e) =>
                          onUpdateFamily(member.id, { name: e.target.value })
                        }
                        className="w-full bg-transparent text-sm font-medium outline-none focus:text-primary transition-colors truncate"
                      />
                      <span className="shrink-0">
                        <input
                          type="number"
                          value={member.birthYear}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v)) onUpdateFamily(member.id, { birthYear: v });
                          }}
                          className="w-14 bg-transparent text-center text-xs text-muted-foreground outline-none focus:text-primary transition-colors"
                        />
                      </span>
                      <button
                        onClick={() => onRemoveFamily(member.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                  {years.map((year) => (
                    <td
                      key={year}
                      className="border-r border-border/30 px-1 py-0.5 text-center text-xs text-muted-foreground tabular-nums"
                    >
                      {year - member.birthYear}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="sticky left-0 z-10 bg-card px-2 py-1">
                  <AddRowButton
                    label="Add member"
                    onClick={() => onAddFamily("New", 1990)}
                  />
                </td>
              </tr>
            </>
          )}

          {/* Balance Inputs */}
          <tr>
            <td
              colSpan={years.length + 1}
              className="sticky left-0 z-10 bg-card px-2"
            >
              <SectionHeader label="Balance Input" color="bg-primary" />
            </td>
          </tr>
          {renderCategoryRows("balanceInputs", sim.balanceInputs)}
          <tr>
            <td className="sticky left-0 z-10 bg-card px-2 py-1">
              <AddRowButton
                label="Add balance input"
                onClick={() => onAddCategory("balanceInputs", "New input")}
              />
            </td>
          </tr>
          {/* Balance Input totals */}
          <tr className="border-t border-border border-b-2 border-b-border/50 font-semibold">
            <td className="sticky left-0 z-10 bg-card border-r border-border px-2 py-1 text-sm text-primary">
              Total Balance Input
            </td>
            {result.years.map((yr) => (
              <td
                key={yr.year}
                className="border-r border-border/30 px-1 py-1 text-right font-mono text-sm tabular-nums text-primary"
              >
                {yr.balanceInput === 0 ? "-" : yr.balanceInput.toLocaleString("ja-JP")}
              </td>
            ))}
          </tr>

          {/* Income */}
          <tr>
            <td
              colSpan={years.length + 1}
              className="sticky left-0 z-10 bg-card px-2"
            >
              <SectionHeader label="Income" color="bg-positive" />
            </td>
          </tr>
          {renderCategoryRows("income", sim.income)}
          <tr>
            <td className="sticky left-0 z-10 bg-card px-2 py-1">
              <AddRowButton
                label="Add income"
                onClick={() => onAddCategory("income", "New income")}
              />
            </td>
          </tr>
          {/* Income totals */}
          <tr className="border-t border-border border-b-2 border-b-border/50 font-semibold">
            <td className="sticky left-0 z-10 bg-card border-r border-border px-2 py-1 text-sm text-positive">
              Total Income
            </td>
            {result.years.map((yr) => (
              <td
                key={yr.year}
                className="border-r border-border/30 px-1 py-1 text-right font-mono text-sm tabular-nums text-positive"
              >
                {yr.totalIncome === 0 ? "-" : yr.totalIncome.toLocaleString("ja-JP")}
              </td>
            ))}
          </tr>

          {/* Costs */}
          <tr>
            <td
              colSpan={years.length + 1}
              className="sticky left-0 z-10 bg-card px-2"
            >
              <SectionHeader label="Costs" color="bg-negative" />
            </td>
          </tr>
          {renderCategoryRows("costs", sim.costs)}
          <tr>
            <td className="sticky left-0 z-10 bg-card px-2 py-1">
              <AddRowButton
                label="Add cost"
                onClick={() => onAddCategory("costs", "New cost")}
              />
            </td>
          </tr>
          {/* Costs totals */}
          <tr className="border-t border-border border-b-2 border-b-border/50 font-semibold">
            <td className="sticky left-0 z-10 bg-card border-r border-border px-2 py-1 text-sm text-negative">
              Total Costs
            </td>
            {result.years.map((yr) => (
              <td
                key={yr.year}
                className="border-r border-border/30 px-1 py-1 text-right font-mono text-sm tabular-nums text-negative"
              >
                {yr.totalCosts === 0 ? "-" : yr.totalCosts.toLocaleString("ja-JP")}
              </td>
            ))}
          </tr>

          {/* Net / Balance */}
          <tr>
            <td
              colSpan={years.length + 1}
              className="sticky left-0 z-10 bg-card px-2"
            >
              <SectionHeader label="Summary" color="bg-primary" />
            </td>
          </tr>
          <tr className="font-semibold">
            <td className="sticky left-0 z-10 bg-card border-r border-border px-2 py-1 text-sm">
              Annual Net
            </td>
            {result.years.map((yr) => (
              <td
                key={yr.year}
                className={cn(
                  "border-r border-border/30 px-1 py-1 text-right font-mono text-sm tabular-nums",
                  yr.annualNet > 0 && "text-positive",
                  yr.annualNet < 0 && "text-negative",
                )}
              >
                {yr.annualNet === 0
                  ? "-"
                  : yr.annualNet.toLocaleString("ja-JP")}
              </td>
            ))}
          </tr>
          <tr className="border-t-2 border-primary/30 font-bold text-primary">
            <td className="sticky left-0 z-10 bg-card border-r border-border px-2 py-2 text-sm">
              Balance
            </td>
            {result.years.map((yr) => (
              <td
                key={yr.year}
                className={cn(
                  "border-r border-border/30 px-1 py-2 text-right font-mono text-sm tabular-nums",
                  yr.cumulativeBalance >= 0 ? "text-positive" : "text-negative",
                )}
              >
                {yr.cumulativeBalance.toLocaleString("ja-JP")}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
