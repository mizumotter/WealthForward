import { useState } from "react";
import { AppShell, type TabId } from "@/components/layout/app-shell";
import { AboutBanner } from "@/components/simulation/about-banner";
import { YearGrid } from "@/components/simulation/year-grid";
import { SimChart } from "@/components/simulation/sim-chart";
import { SettingsView } from "@/components/simulation/settings-view";
import { useSimulation } from "@/hooks/use-simulation";

function App() {
  const [tab, setTab] = useState<TabId>("table");
  const {
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
    reinitialize,
  } = useSimulation();

  if (loading || !sim || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell activeTab={tab} onTabChange={setTab}>
      {tab === "table" && (
        <>
        <AboutBanner />
        <YearGrid
          sim={sim}
          result={result}
          onSetAmount={setCategoryAmount}
          onSetLabel={setCategoryLabel}
          onAddCategory={addCategory}
          onRemoveCategory={removeCategory}
          onAddFamily={addFamilyMember}
          onRemoveFamily={removeFamilyMember}
          onUpdateFamily={updateFamilyMember}
          onSetGrowthRate={setCategoryGrowthRate}
          onClearFromYear={clearAmountsFromYear}
          onFillFromYear={fillAmountsFromYear}
          onMoveCategory={moveCategory}
        />
        </>
      )}
      {tab === "chart" && <SimChart result={result} />}
      {tab === "settings" && (
        <SettingsView
          sim={sim}
          onMeta={setMeta}
          onReload={reinitialize}
        />
      )}
    </AppShell>
  );
}

export default App;
