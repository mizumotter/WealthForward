// -----------------------------------------------------------------------
// Demo scenario — inspired by a typical Japanese household simulation
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

  // Family
  const family: FamilyMember[] = [
    { id: id(), name: "Taro", birthYear: 1979 },
    { id: id(), name: "Hanako", birthYear: 1981 },
    { id: id(), name: "Yuki", birthYear: 2013 },
    { id: id(), name: "Sora", birthYear: 2017 },
  ];

  // Income sources
  const income: Category[] = [
    {
      id: id(),
      label: "Taro hand income",
      amounts: fillRanges([
        [2020, 2025, 5_200_000],
        [2026, 2030, 5_500_000],
        [2031, 2035, 5_800_000],
        [2036, 2040, 6_000_000],
        [2041, 2044, 4_000_000], // semi-retirement
      ]),
    },
    {
      id: id(),
      label: "Hanako hand income",
      amounts: fillRanges([
        [2020, 2023, 600_000],
        [2024, 2030, 1_200_000], // part-time expanded
        [2031, 2040, 2_000_000], // full-time after kids grow
        [2041, 2044, 1_000_000],
      ]),
    },
    {
      id: id(),
      label: "Investment return",
      amounts: fillRanges([
        [2020, 2025, 200_000],
        [2026, 2030, 350_000],
        [2031, 2035, 500_000],
        [2036, 2044, 600_000],
      ]),
    },
  ];

  // Cost categories
  const costs: Category[] = [
    {
      id: id(),
      label: "Living expenses",
      amounts: fillRanges([
        [2020, 2025, 4_800_000],
        [2026, 2030, 5_000_000],
        [2031, 2035, 4_600_000],
        [2036, 2040, 4_200_000],
        [2041, 2044, 3_800_000],
      ]),
    },
    {
      id: id(),
      label: "Fixed / telecom",
      amounts: fill(2020, 2044, 360_000),
    },
    {
      id: id(),
      label: "Education",
      amounts: fillRanges([
        [2020, 2024, 400_000],   // nursery + elementary
        [2025, 2028, 600_000],   // middle school
        [2029, 2031, 1_200_000], // high school x2
        [2032, 2035, 2_000_000], // university x2
        [2036, 2036, 1_000_000], // last university year
      ]),
    },
    {
      id: id(),
      label: "Insurance",
      amounts: fillRanges([
        [2020, 2035, 420_000],
        [2036, 2044, 300_000],
      ]),
    },
    {
      id: id(),
      label: "Car",
      amounts: {
        ...fill(2020, 2044, 300_000), // maintenance / gas
        ...fillYears([
          [2024, 2_500_000], // car purchase
          [2032, 2_500_000],
          [2040, 2_000_000],
        ]),
      },
    },
    {
      id: id(),
      label: "Travel",
      amounts: fillRanges([
        [2020, 2030, 250_000],
        [2031, 2044, 400_000],
      ]),
    },
    {
      id: id(),
      label: "Home renovation",
      amounts: fillYears([
        [2030, 1_500_000],
        [2038, 1_200_000],
      ]),
    },
  ];

  return {
    id: id(),
    name: "Base",
    startYear: 2020,
    endYear: 2044,
    initialBalance: 8_500_000, // starting net worth (savings + investments)
    family,
    income,
    costs,
    createdAt: now,
    updatedAt: now,
  };
}
