import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Simulation, Category } from "@/lib/types";
import type { SimulationResult } from "@/lib/engine";

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
    const parsed = parseInt(draft.replace(/[,，]/g, ""), 10);
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
    <div className="flex items-center gap-2 py-2">
      <div className={cn("h-3 w-1 rounded-full", color)} />
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

// -----------------------------------------------------------------------
// Main YearGrid component
// -----------------------------------------------------------------------

type Props = {
  sim: Simulation;
  result: SimulationResult;
  onSetAmount: (type: "income" | "costs", id: string, year: number, amount: number) => void;
  onSetLabel: (type: "income" | "costs", id: string, label: string) => void;
  onAddCategory: (type: "income" | "costs", label: string) => void;
  onRemoveCategory: (type: "income" | "costs", id: string) => void;
  onAddFamily: (name: string, birthYear: number) => void;
  onRemoveFamily: (id: string) => void;
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
}: Props) {
  const years = Array.from(
    { length: sim.endYear - sim.startYear + 1 },
    (_, i) => sim.startYear + i,
  );
  const currentYear = new Date().getFullYear();

  const renderCategoryRows = (
    type: "income" | "costs",
    categories: Category[],
  ) =>
    categories.map((cat, idx) => (
      <motion.tr
        key={cat.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.03 }}
        className="group"
      >
        {/* Label cell */}
        <td className="sticky left-0 z-10 bg-card border-r border-border min-w-[140px] px-2 py-1">
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={cat.label}
              onChange={(e) => onSetLabel(type, cat.id, e.target.value)}
              className="w-full bg-transparent text-sm font-medium outline-none focus:text-primary transition-colors"
            />
            <button
              onClick={() => onRemoveCategory(type, cat.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </td>
        {/* Year cells */}
        {years.map((year) => (
          <td key={year} className="border-r border-border/30 min-w-[90px]">
            <EditableCell
              value={cat.amounts[year] ?? 0}
              onChange={(v) => onSetAmount(type, cat.id, year, v)}
            />
          </td>
        ))}
      </motion.tr>
    ));

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full border-collapse text-sm">
        {/* Year header */}
        <thead>
          <tr className="border-b border-border">
            <th className="sticky left-0 z-20 bg-card border-r border-border min-w-[140px] px-2 py-2 text-left text-xs font-medium text-muted-foreground">
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
          {/* Initial balance row */}
          {sim.initialBalance !== 0 && (
            <tr className="border-b border-border bg-primary/5">
              <td className="sticky left-0 z-10 bg-card border-r border-border px-2 py-1.5 text-sm font-medium text-primary">
                Initial Balance
              </td>
              <td className="px-1 py-1.5 text-right font-mono text-sm tabular-nums text-primary">
                {sim.initialBalance.toLocaleString("ja-JP")}
              </td>
              {years.slice(1).map((year) => (
                <td key={year} className="border-r border-border/30" />
              ))}
            </tr>
          )}

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
                  <td className="sticky left-0 z-10 bg-card border-r border-border min-w-[140px] px-2 py-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{member.name}</span>
                      <button
                        onClick={() => onRemoveFamily(member.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
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
          {/* Income totals */}
          <tr className="border-t border-border font-semibold">
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
          <tr>
            <td className="sticky left-0 z-10 bg-card px-2 py-1">
              <AddRowButton
                label="Add income"
                onClick={() => onAddCategory("income", "New income")}
              />
            </td>
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
          {/* Costs totals */}
          <tr className="border-t border-border font-semibold">
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
          <tr>
            <td className="sticky left-0 z-10 bg-card px-2 py-1">
              <AddRowButton
                label="Add cost"
                onClick={() => onAddCategory("costs", "New cost")}
              />
            </td>
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
