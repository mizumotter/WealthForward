// -----------------------------------------------------------------------
// WealthForward — core data types
//
// Mirrors the spreadsheet structure:
//   Family ages | Income rows | Cost rows → per-year net → running balance
// -----------------------------------------------------------------------

/** A single simulation scenario (e.g. "base", "optimistic"). */
export type Simulation = {
  id: string;
  name: string;
  startYear: number;
  endYear: number;

  /**
   * Balance adjustment categories (e.g. starting savings, inheritance, lump-sum).
   * Each category has per-year amounts, summed and added to cumulative balance.
   */
  balanceInputs: Category[];

  family: FamilyMember[];
  income: Category[];
  costs: Category[];

  createdAt: number; // epoch ms
  updatedAt: number;
};

/** Family member whose age is tracked across years. */
export type FamilyMember = {
  id: string;
  name: string;
  birthYear: number;
};

/** A labelled row of yearly amounts (income source or cost category). */
export type Category = {
  id: string;
  label: string;
  /** year → amount in JPY (annual). Missing year = 0 (or computed via growthRate). */
  amounts: Record<number, number>;
  /** Annual growth rate in percent (e.g. 3 = +3%/year). Applied to fill missing years. */
  growthRate?: number;
};

// -----------------------------------------------------------------------
// Computed results (output of the simulation engine)
// -----------------------------------------------------------------------

/** One year's computed result. */
export type YearResult = {
  year: number;
  ages: { memberId: string; age: number }[];
  totalIncome: number;
  totalCosts: number;
  balanceInput: number; // per-year adjustment (savings, inheritance, etc.)
  annualNet: number; // income - costs + balanceInput
  cumulativeBalance: number; // running sum of annualNet
};

/** Full simulation output. */
export type SimulationResult = {
  years: YearResult[];
  peakBalance: number;
  minBalance: number;
  finalBalance: number;
};

// -----------------------------------------------------------------------
// Factory helpers
// -----------------------------------------------------------------------

let _counter = 0;
function _id(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function createSimulation(
  partial?: Partial<Pick<Simulation, "name" | "startYear" | "endYear">>,
): Simulation {
  const now = Date.now();
  return {
    id: _id(),
    name: partial?.name ?? `Scenario ${++_counter}`,
    startYear: partial?.startYear ?? new Date().getFullYear(),
    endYear: partial?.endYear ?? new Date().getFullYear() + 24,
    balanceInputs: [] as Category[],
    family: [],
    income: [],
    costs: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createFamilyMember(name: string, birthYear: number): FamilyMember {
  return { id: _id(), name, birthYear };
}

export function createCategory(label: string): Category {
  return { id: _id(), label, amounts: {} };
}
