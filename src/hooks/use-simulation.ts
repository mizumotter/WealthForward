import { useCallback, useEffect, useState } from "react";
import type { Simulation, FamilyMember } from "@/lib/types";
import { createCategory, createFamilyMember } from "@/lib/types";
import { simulate, type SimulationResult } from "@/lib/engine";
import { getSimulation, listSimulations, saveSimulation } from "@/lib/db";
import { createDemoSimulation } from "@/lib/demo-data";

export function useSimulation() {
  const [sim, setSim] = useState<Simulation | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Load or create on mount
  useEffect(() => {
    (async () => {
      const all = await listSimulations();
      let active: Simulation;
      if (all.length > 0) {
        active = all[0]; // most recently updated
      } else {
        // First launch — seed with demo data
        active = createDemoSimulation();
        await saveSimulation(active);
      }
      setSim(active);
      setResult(simulate(active));
      setLoading(false);
    })();
  }, []);

  // Persist and recompute after every mutation
  const update = useCallback(async (next: Simulation) => {
    setSim(next);
    setResult(simulate(next));
    await saveSimulation(next);
  }, []);

  // --- Mutation helpers ---

  const setMeta = useCallback(
    (patch: Partial<Pick<Simulation, "startYear" | "endYear">>) => {
      if (!sim) return;
      update({ ...sim, ...patch });
    },
    [sim, update],
  );

  const addFamilyMember = useCallback(
    (name: string, birthYear: number) => {
      if (!sim) return;
      update({ ...sim, family: [...sim.family, createFamilyMember(name, birthYear)] });
    },
    [sim, update],
  );

  const removeFamilyMember = useCallback(
    (id: string) => {
      if (!sim) return;
      update({ ...sim, family: sim.family.filter((m) => m.id !== id) });
    },
    [sim, update],
  );

  const updateFamilyMember = useCallback(
    (id: string, patch: Partial<Omit<FamilyMember, "id">>) => {
      if (!sim) return;
      update({
        ...sim,
        family: sim.family.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      });
    },
    [sim, update],
  );

  const addCategory = useCallback(
    (type: "income" | "costs" | "balanceInputs", label: string) => {
      if (!sim) return;
      const cat = createCategory(label);
      update({ ...sim, [type]: [...sim[type], cat] });
    },
    [sim, update],
  );

  const removeCategory = useCallback(
    (type: "income" | "costs" | "balanceInputs", id: string) => {
      if (!sim) return;
      update({ ...sim, [type]: sim[type].filter((c) => c.id !== id) });
    },
    [sim, update],
  );

  const setCategoryLabel = useCallback(
    (type: "income" | "costs" | "balanceInputs", id: string, label: string) => {
      if (!sim) return;
      update({
        ...sim,
        [type]: sim[type].map((c) => (c.id === id ? { ...c, label } : c)),
      });
    },
    [sim, update],
  );

  const setCategoryAmount = useCallback(
    (type: "income" | "costs" | "balanceInputs", id: string, year: number, amount: number) => {
      if (!sim) return;
      update({
        ...sim,
        [type]: sim[type].map((c) => {
          if (c.id !== id) return c;
          const newAmounts = { ...c.amounts };
          if (amount === 0) {
            delete newAmounts[year]; // Remove explicit entry → fallback to growthRate
          } else {
            newAmounts[year] = amount;
          }
          return { ...c, amounts: newAmounts };
        }),
      });
    },
    [sim, update],
  );

  const setCategoryGrowthRate = useCallback(
    (type: "income" | "costs" | "balanceInputs", id: string, rate: number) => {
      if (!sim) return;
      update({
        ...sim,
        [type]: sim[type].map((c) =>
          c.id === id ? { ...c, growthRate: rate || undefined } : c,
        ),
      });
    },
    [sim, update],
  );

  // Clear all explicit amounts from a given year onwards
  const clearAmountsFromYear = useCallback(
    (type: "income" | "costs" | "balanceInputs", id: string, fromYear: number) => {
      if (!sim) return;
      update({
        ...sim,
        [type]: sim[type].map((c) => {
          if (c.id !== id) return c;
          const newAmounts: Record<number, number> = {};
          for (const [y, v] of Object.entries(c.amounts)) {
            if (Number(y) < fromYear) newAmounts[Number(y)] = v;
          }
          return { ...c, amounts: newAmounts };
        }),
      });
    },
    [sim, update],
  );

  // Fill a value from a given year to the end
  const fillAmountsFromYear = useCallback(
    (type: "income" | "costs" | "balanceInputs", id: string, fromYear: number, value: number) => {
      if (!sim) return;
      update({
        ...sim,
        [type]: sim[type].map((c) => {
          if (c.id !== id) return c;
          const newAmounts = { ...c.amounts };
          for (let y = fromYear; y <= sim.endYear; y++) {
            if (value === 0) {
              delete newAmounts[y];
            } else {
              newAmounts[y] = value;
            }
          }
          return { ...c, amounts: newAmounts };
        }),
      });
    },
    [sim, update],
  );

  // Move a category up or down within its section
  const moveCategory = useCallback(
    (type: "income" | "costs" | "balanceInputs", id: string, direction: "up" | "down") => {
      if (!sim) return;
      const arr = [...sim[type]];
      const idx = arr.findIndex((c) => c.id === id);
      if (idx < 0) return;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= arr.length) return;
      [arr[idx], arr[targetIdx]] = [arr[targetIdx], arr[idx]];
      update({ ...sim, [type]: arr });
    },
    [sim, update],
  );

  // Reload a specific scenario by id
  const loadScenario = useCallback(async (id: string) => {
    setLoading(true);
    const s = await getSimulation(id);
    if (s) {
      setSim(s);
      setResult(simulate(s));
    }
    setLoading(false);
  }, []);

  // Reinitialize from DB (used after clear/import)
  const reinitialize = useCallback(async () => {
    setLoading(true);
    const all = await listSimulations();
    let active: Simulation;
    if (all.length > 0) {
      active = all[0];
    } else {
      active = createDemoSimulation();
      await saveSimulation(active);
    }
    setSim(active);
    setResult(simulate(active));
    setLoading(false);
  }, []);

  return {
    sim,
    result,
    loading,
    setMeta,
    addFamilyMember,
    removeFamilyMember,
    updateFamilyMember,
    addCategory,
    removeCategory,
    setCategoryLabel,
    setCategoryAmount,
    setCategoryGrowthRate,
    clearAmountsFromYear,
    fillAmountsFromYear,
    moveCategory,
    loadScenario,
    reinitialize,
  };
}
