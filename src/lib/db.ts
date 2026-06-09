// -----------------------------------------------------------------------
// IndexedDB persistence via Dexie
// -----------------------------------------------------------------------

import Dexie, { type EntityTable } from "dexie";
import type { Simulation } from "./types";

const db = new Dexie("wealthforward") as Dexie & {
  simulations: EntityTable<Simulation, "id">;
};

db.version(1).stores({
  // Only indexed fields need to be listed; the full object is stored.
  simulations: "id, name, updatedAt",
});

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
  await db.simulations.bulkPut(data.simulations);
  return data.simulations.length;
}
