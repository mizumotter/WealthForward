import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Table2, TrendingUp, ShieldCheck, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "wf-about-dismissed";

export function AboutBanner() {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, open ? "0" : "1");
    } catch {
      // ignore
    }
  }, [open]);

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-left text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
      >
        <TrendingUp className="h-4 w-4 shrink-0" />
        <span className="flex-1">About WealthForward</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="rounded-b-lg border border-t-0 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent px-4 py-4 space-y-3">
              <p className="text-sm text-foreground/80 leading-relaxed">
                A free life simulation tool. Enter your family, income, expenses,
                and savings to project your net worth over the next 50 years.
                No sign-up required.
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <Feature icon={Table2} text="Spreadsheet-style input for yearly cashflow" />
                <Feature icon={TrendingUp} text="Visualize your future with interactive charts" />
                <Feature icon={ShieldCheck} text="Data stays in your browser — nothing is sent to a server" />
                <Feature icon={Eraser} text="Clear all data with one click when you're done" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Feature({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}
