// -----------------------------------------------------------------------
// Simulation engine — pure functions, no side effects
//
// Takes a Simulation and returns yearly results.
// This is the heart of the app: income − costs = net, accumulated.
// -----------------------------------------------------------------------

import type { Simulation, SimulationResult, YearResult, Category } from "./types";

// Re-export for consumers that import from engine
export type { SimulationResult, YearResult } from "./types";

/** Sum all categories for a given year. Missing entries = 0. */
function sumForYear(categories: Category[], year: number): number {
  let total = 0;
  for (const cat of categories) {
    total += cat.amounts[year] ?? 0;
  }
  return total;
}

/** Run the simulation and produce year-by-year results. */
export function simulate(sim: Simulation): SimulationResult {
  const years: YearResult[] = [];
  let cumulative = sim.initialBalance;
  let peak = cumulative;
  let min = cumulative;

  for (let year = sim.startYear; year <= sim.endYear; year++) {
    const totalIncome = sumForYear(sim.income, year);
    const totalCosts = sumForYear(sim.costs, year);
    const annualNet = totalIncome - totalCosts;
    cumulative += annualNet;

    if (cumulative > peak) peak = cumulative;
    if (cumulative < min) min = cumulative;

    const ages = sim.family.map((m) => ({
      memberId: m.id,
      age: year - m.birthYear,
    }));

    years.push({
      year,
      ages,
      totalIncome,
      totalCosts,
      annualNet,
      cumulativeBalance: cumulative,
    });
  }

  return {
    years,
    peakBalance: peak === -Infinity ? 0 : peak,
    minBalance: min === Infinity ? 0 : min,
    finalBalance: cumulative,
  };
}
