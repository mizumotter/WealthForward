// -----------------------------------------------------------------------
// IndexedDB persistence via Dexie
// -----------------------------------------------------------------------

import Dexie, { type EntityTable } from "dexie";
import type { Simulation, Category, FamilyMember } from "./types";

const db = new Dexie("wealthforward") as Dexie & {
  simulations: EntityTable<Simulation, "id">;
};

db.version(1).stores({
  // Only indexed fields need to be listed; the full object is stored.
  simulations: "id, name, updatedAt",
});

// Migrate initialBalance → balanceInputs
db.version(2).stores({
  simulations: "id, name, updatedAt",
}).upgrade((tx) =>
  tx.table("simulations").toCollection().modify((sim) => {
    if (!sim.balanceInputs) {
      const old = (sim as Record<string, unknown>).initialBalance;
      const startYear = sim.startYear ?? new Date().getFullYear();
      sim.balanceInputs =
        typeof old === "number" && old !== 0 ? { [startYear]: old } : {};
      delete (sim as Record<string, unknown>).initialBalance;
    }
  }),
);

// Migrate balanceInputs Record → Category[]
db.version(3).stores({
  simulations: "id, name, updatedAt",
}).upgrade((tx) =>
  tx.table("simulations").toCollection().modify((sim) => {
    const bi = sim.balanceInputs;
    if (bi && !Array.isArray(bi)) {
      // Convert Record<number, number> → Category[]
      const record = bi as Record<string, number>;
      const amounts: Record<number, number> = {};
      for (const [y, v] of Object.entries(record)) {
        if (typeof v === "number" && v !== 0) amounts[Number(y)] = v;
      }
      sim.balanceInputs = Object.keys(amounts).length > 0
        ? [{ id: crypto.randomUUID().slice(0, 8), label: "Starting savings", amounts }]
        : [];
    }
  }),
);

export { db };

// -----------------------------------------------------------------------
// CRUD helpers
// -----------------------------------------------------------------------

export async function listSimulations(): Promise<Simulation[]> {
  return db.simulations.orderBy("updatedAt").reverse().toArray();
}

export async function getSimulation(id: string): Promise<Simulation | undefined> {
  return db.simulations.get(id);
}

export async function saveSimulation(sim: Simulation): Promise<void> {
  sim.updatedAt = Date.now();
  await db.simulations.put(sim);
}

export async function deleteSimulation(id: string): Promise<void> {
  await db.simulations.delete(id);
}

export async function clearAllData(): Promise<void> {
  await db.simulations.clear();
}

// -----------------------------------------------------------------------
// JSON export / import (backup)
// -----------------------------------------------------------------------

export async function exportAllAsJson(): Promise<string> {
  const all = await listSimulations();
  return JSON.stringify({ version: 1, simulations: all }, null, 2);
}

export async function importFromJson(json: string): Promise<number> {
  const data = JSON.parse(json) as { version: number; simulations: Simulation[] };
  if (!data.simulations || !Array.isArray(data.simulations)) {
    throw new Error("Invalid backup format");
  }
  if (data.simulations.length > 100) {
    throw new Error("Too many simulations (max 100)");
  }
  const validated = data.simulations.map(validateSimulation);
  await db.simulations.bulkPut(validated);
  return validated.length;
}

// -----------------------------------------------------------------------
// Import validation — prevent OOM, DoS, and data corruption
// -----------------------------------------------------------------------

const MAX_LABEL = 100;
const MAX_CATEGORIES = 50;
const MAX_FAMILY = 20;
const MIN_YEAR = 1900;
const MAX_YEAR = 2200;

function clampStr(s: unknown, maxLen: number, fallback: string): string {
  return typeof s === "string" ? s.slice(0, maxLen) : fallback;
}

function clampYear(y: unknown): number {
  const n = typeof y === "number" ? y : Number(y);
  if (!Number.isFinite(n)) return new Date().getFullYear();
  return Math.max(MIN_YEAR, Math.min(MAX_YEAR, Math.round(n)));
}

function validateCategory(raw: unknown): Category {
  const c = raw as Record<string, unknown>;
  const amounts: Record<number, number> = {};
  if (c.amounts && typeof c.amounts === "object" && !Array.isArray(c.amounts)) {
    for (const [k, v] of Object.entries(c.amounts as Record<string, unknown>)) {
      const year = Number(k);
      const val = Number(v);
      if (Number.isFinite(year) && Number.isFinite(val) && year >= MIN_YEAR && year <= MAX_YEAR) {
        amounts[year] = val;
      }
    }
  }
  const gr = typeof c.growthRate === "number" && Number.isFinite(c.growthRate) ? c.growthRate : undefined;
  return {
    id: clampStr(c.id, 36, crypto.randomUUID().slice(0, 8)),
    label: clampStr(c.label, MAX_LABEL, "Untitled"),
    amounts,
    ...(gr !== undefined ? { growthRate: Math.max(-50, Math.min(50, gr)) } : {}),
  };
}

function validateFamilyMember(raw: unknown): FamilyMember {
  const m = raw as Record<string, unknown>;
  return {
    id: clampStr(m.id, 36, crypto.randomUUID().slice(0, 8)),
    name: clampStr(m.name, MAX_LABEL, "Member"),
    birthYear: clampYear(m.birthYear),
  };
}

function validateSimulation(raw: unknown): Simulation {
  const s = raw as Record<string, unknown>;
  const startYear = clampYear(s.startYear);
  const endRaw = clampYear(s.endYear);
  // Cap range to 100 years
  const endYear = Math.min(endRaw, startYear + 100);

  const toCategories = (arr: unknown): Category[] => {
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, MAX_CATEGORIES).map(validateCategory);
  };
  const toFamily = (arr: unknown): FamilyMember[] => {
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, MAX_FAMILY).map(validateFamilyMember);
  };

  const now = Date.now();
  return {
    id: clampStr(s.id, 36, crypto.randomUUID().slice(0, 8)),
    name: clampStr(s.name, MAX_LABEL, "Imported"),
    startYear,
    endYear: endYear > startYear ? endYear : startYear + 25,
    balanceInputs: toCategories(s.balanceInputs),
    family: toFamily(s.family),
    income: toCategories(s.income),
    costs: toCategories(s.costs),
    createdAt: typeof s.createdAt === "number" ? s.createdAt : now,
    updatedAt: now,
  };
}
