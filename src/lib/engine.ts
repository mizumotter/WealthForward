// -----------------------------------------------------------------------
// Simulation engine — pure functions, no side effects
//
// Balance Input = absolute level of savings/investments (carries forward);
//   used only to SEED the starting balance.
// Income / Costs = annual flow (no carry-forward, 0 if missing).
// Both support per-category growthRate (% per year).
//
// Annual Net = income − costs
// Balance    = running total:
//   start year → TotalBalanceInput + Annual Net
//   thereafter → previous Balance + Annual Net
// -----------------------------------------------------------------------

import type { Simulation, SimulationResult, YearResult, Category } from "./types";

// Re-export for consumers that import from engine
export type { SimulationResult, YearResult } from "./types";

// -----------------------------------------------------------------------
// Resolve per-category amounts with growth rate
// -----------------------------------------------------------------------

/**
 * Resolve effective amounts for a category across years.
 *
 * @param carry  true → carry forward last value (for balance-input levels);
 *               false → missing year = 0 (for income/cost flows).
 */
export function resolveAmounts(
  cat: Category,
  startYear: number,
  endYear: number,
  carry: boolean,
): Record<number, number> {
  const out: Record<number, number> = {};
  const rate = cat.growthRate ?? 0;

  for (let year = startYear; year <= endYear; year++) {
    if (year in cat.amounts) {
      // Explicit entry — always wins
      out[year] = cat.amounts[year];
    } else {
      const prev = out[year - 1] ?? 0;
      if (rate !== 0 && prev !== 0) {
        // Grow from previous year
        out[year] = Math.round(prev * (1 + rate / 100));
      } else if (carry) {
        // Balance-input mode: carry forward even without growth
        out[year] = prev;
      } else {
        out[year] = 0;
      }
    }
  }
  return out;
}

// -----------------------------------------------------------------------
// Simulation
// -----------------------------------------------------------------------

/** Sum resolved amounts across all categories for a given year. */
function sumResolved(
  resolvedList: Record<number, number>[],
  year: number,
): number {
  let total = 0;
  for (const r of resolvedList) {
    total += r[year] ?? 0;
  }
  return total;
}

/** Run the simulation and produce year-by-year results. */
export function simulate(sim: Simulation): SimulationResult {
  // Pre-resolve all categories with growth rates
  const incomeResolved = sim.income.map((c) =>
    resolveAmounts(c, sim.startYear, sim.endYear, false),
  );
  const costsResolved = sim.costs.map((c) =>
    resolveAmounts(c, sim.startYear, sim.endYear, false),
  );
  const biCats = sim.balanceInputs ?? [];
  const biResolved = biCats.map((c) =>
    resolveAmounts(c, sim.startYear, sim.endYear, true),
  );

  const years: YearResult[] = [];
  let runningBalance = 0;
  let peak = -Infinity;
  let min = Infinity;

  for (let year = sim.startYear; year <= sim.endYear; year++) {
    const totalIncome = sumResolved(incomeResolved, year);
    const totalCosts = sumResolved(costsResolved, year);
    const balanceInput = sumResolved(biResolved, year);

    const annualNet = totalIncome - totalCosts;
    // Running total: seed from the starting balance input, then accumulate net.
    runningBalance =
      year === sim.startYear ? balanceInput + annualNet : runningBalance + annualNet;
    const cumulativeBalance = runningBalance;

    if (cumulativeBalance > peak) peak = cumulativeBalance;
    if (cumulativeBalance < min) min = cumulativeBalance;

    const ages = sim.family.map((m) => ({
      memberId: m.id,
      age: year - m.birthYear,
    }));

    years.push({
      year,
      ages,
      totalIncome,
      totalCosts,
      balanceInput,
      annualNet,
      cumulativeBalance,
    });
  }

  return {
    years,
    peakBalance: peak === -Infinity ? 0 : peak,
    minBalance: min === Infinity ? 0 : min,
    finalBalance:
      years.length > 0 ? years[years.length - 1].cumulativeBalance : 0,
  };
}
