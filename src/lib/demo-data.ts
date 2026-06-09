// -----------------------------------------------------------------------
// Demo scenario — generic sample data (not based on any real household)
// Figures are rounded averages for illustration purposes only.
// -----------------------------------------------------------------------

import type { Simulation, FamilyMember, Category } from "./types";

function id(): string {
  return crypto.randomUUID().slice(0, 8);
}

/** Fill a range of years with the same value. */
function fill(start: number, end: number, value: number): Record<number, number> {
  const amounts: Record<number, number> = {};
  for (let y = start; y <= end; y++) amounts[y] = value;
  return amounts;
}

/** Fill years from a list of [startYear, endYear, value] tuples. */
function fillRanges(
  ranges: [number, number, number][],
): Record<number, number> {
  const amounts: Record<number, number> = {};
  for (const [start, end, value] of ranges) {
    for (let y = start; y <= end; y++) amounts[y] = value;
  }
  return amounts;
}

/** Fill specific years with individual values. */
function fillYears(entries: [number, number][]): Record<number, number> {
  const amounts: Record<number, number> = {};
  for (const [year, value] of entries) amounts[year] = value;
  return amounts;
}

export function createDemoSimulation(): Simulation {
  const now = Date.now();

  // Generic sample family
  const family: FamilyMember[] = [
    { id: id(), name: "Parent A", birthYear: 1990 },
    { id: id(), name: "Parent B", birthYear: 1992 },
    { id: id(), name: "Child 1", birthYear: 2020 },
    { id: id(), name: "Child 2", birthYear: 2023 },
  ];

  // Income — round figures loosely based on national averages
  const income: Category[] = [
    {
      id: id(),
      label: "Salary (primary)",
      amounts: fillRanges([
        [2025, 2030, 5_000_000],
        [2031, 2040, 6_000_000],
        [2041, 2050, 7_000_000],
        [2051, 2055, 5_000_000], // semi-retirement
      ]),
      growthRate: 1.5,
    },
    {
      id: id(),
      label: "Salary (secondary)",
      amounts: fillRanges([
        [2025, 2028, 0],          // childcare leave
        [2029, 2035, 1_500_000],  // part-time
        [2036, 2050, 3_000_000],  // full-time
        [2051, 2055, 1_500_000],
      ]),
    },
    {
      id: id(),
      label: "Side income",
      amounts: { 2025: 200_000 },
      growthRate: 5,
    },
  ];

  // Cost categories — average household figures
  const costs: Category[] = [
    {
      id: id(),
      label: "Living expenses",
      amounts: { 2025: 3_600_000 },
      growthRate: 2,
    },
    {
      id: id(),
      label: "Housing (rent/loan)",
      amounts: fill(2025, 2055, 1_200_000),
    },
    {
      id: id(),
      label: "Education",
      amounts: fillRanges([
        [2025, 2032, 300_000],     // nursery / kindergarten
        [2033, 2038, 500_000],     // elementary
        [2039, 2041, 800_000],     // middle school
        [2042, 2044, 1_000_000],   // high school
        [2045, 2048, 1_500_000],   // university
      ]),
    },
    {
      id: id(),
      label: "Insurance",
      amounts: { 2025: 360_000 },
      growthRate: 1,
    },
    {
      id: id(),
      label: "Car",
      amounts: {
        ...fill(2025, 2055, 300_000), // maintenance + fuel
        ...fillYears([
          [2025, 2_500_000], // purchase
          [2033, 2_500_000],
          [2041, 2_000_000],
        ]),
      },
    },
    {
      id: id(),
      label: "Travel / leisure",
      amounts: fillRanges([
        [2025, 2040, 200_000],
        [2041, 2055, 300_000],
      ]),
    },
  ];

  return {
    id: id(),
    name: "Sample",
    startYear: 2025,
    endYear: 2055,
    balanceInputs: [
      {
        id: id(),
        label: "Savings",
        amounts: { 2025: 5_000_000 },
        growthRate: 3,
      },
      {
        id: id(),
        label: "Investment (NISA etc.)",
        amounts: { 2025: 2_000_000 },
        growthRate: 5,
      },
    ],
    family,
    income,
    costs,
    createdAt: now,
    updatedAt: now,
  };
}
