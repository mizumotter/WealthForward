import { useCallback, useEffect, useState } from "react";
import type { Simulation, FamilyMember } from "@/lib/types";
import { createSimulation, createCategory, createFamilyMember } from "@/lib/types";
import { simulate, type SimulationResult } from "@/lib/engine";
import { getSimulation, listSimulations, saveSimulation } from "@/lib/db";

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
        active = createSimulation({ name: "Base" });
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
    (patch: Partial<Pick<Simulation, "name" | "startYear" | "endYear">>) => {
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
    (type: "income" | "costs", label: string) => {
      if (!sim) return;
      const cat = createCategory(label);
      update({ ...sim, [type]: [...sim[type], cat] });
    },
    [sim, update],
  );

  const removeCategory = useCallback(
    (type: "income" | "costs", id: string) => {
      if (!sim) return;
      update({ ...sim, [type]: sim[type].filter((c) => c.id !== id) });
    },
    [sim, update],
  );

  const setCategoryLabel = useCallback(
    (type: "income" | "costs", id: string, label: string) => {
      if (!sim) return;
      update({
        ...sim,
        [type]: sim[type].map((c) => (c.id === id ? { ...c, label } : c)),
      });
    },
    [sim, update],
  );

  const setCategoryAmount = useCallback(
    (type: "income" | "costs", id: string, year: number, amount: number) => {
      if (!sim) return;
      update({
        ...sim,
        [type]: sim[type].map((c) =>
          c.id === id ? { ...c, amounts: { ...c.amounts, [year]: amount } } : c,
        ),
      });
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
    loadScenario,
  };
}
