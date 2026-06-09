import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Upload, Info, Trash2 } from "lucide-react";
import { exportAllAsJson, importFromJson, clearAllData } from "@/lib/db";
import type { Simulation } from "@/lib/types";

type Props = {
  sim: Simulation;
  onMeta: (patch: Partial<Pick<Simulation, "startYear" | "endYear">>) => void;
  onReload: () => void;
};

export function SettingsView({ sim, onMeta, onReload }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleExport = async () => {
    const json = await exportAllAsJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wealthforward-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const count = await importFromJson(text);
      setImportStatus(`${count} scenario(s) imported`);
      onReload();
    } catch {
      setImportStatus("Import failed: invalid format");
    }
    // Reset file input
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-6 max-w-xl">
      {/* Scenario settings */}
      <motion.div
        className="rounded-xl border border-border bg-card p-6 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Scenario
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Start Year</label>
              <input
                type="number"
                min={1900}
                max={2200}
                value={sim.startYear}
                onChange={(e) => {
                  const v = Math.max(1900, Math.min(2200, Number(e.target.value)));
                  if (Number.isFinite(v)) onMeta({ startYear: v });
                }}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">End Year</label>
              <input
                type="number"
                min={1900}
                max={2200}
                value={sim.endYear}
                onChange={(e) => {
                  const raw = Math.max(1900, Math.min(2200, Number(e.target.value)));
                  // Cap range to 100 years from startYear
                  const v = Math.min(raw, sim.startYear + 100);
                  if (Number.isFinite(v)) onMeta({ endYear: v });
                }}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Backup */}
      <motion.div
        className="rounded-xl border border-border bg-card p-6 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Backup
        </h3>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Upload className="h-4 w-4" />
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
        {importStatus && (
          <p className="text-sm text-muted-foreground">{importStatus}</p>
        )}
        <div className="flex items-start gap-2 rounded-md bg-secondary/50 p-3">
          <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Data is stored in your browser (IndexedDB). Export regularly as a
            backup. Clearing browser data will erase all scenarios.
          </p>
        </div>
      </motion.div>

      {/* Danger zone */}
      <motion.div
        className="rounded-xl border border-destructive/30 bg-card p-6 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-sm font-semibold text-destructive uppercase tracking-wider">
          Danger Zone
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          All data will be permanently deleted from this browser. This cannot be undone.
        </p>
        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            className="flex items-center gap-2 rounded-md border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear All Data
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                await clearAllData();
                setConfirmClear(false);
                onReload();
              }}
              className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              Yes, delete everything
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="rounded-md bg-secondary px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
