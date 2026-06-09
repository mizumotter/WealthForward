import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Table2,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TabId = "table" | "chart" | "settings";

const tabs: { id: TabId; label: string; icon: typeof TrendingUp }[] = [
  { id: "table", label: "Table", icon: Table2 },
  { id: "chart", label: "Chart", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

type Props = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: ReactNode;
};

export function AppShell({ activeTab, onTabChange, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold tracking-tight">
                Wealth<span className="text-primary">Forward</span>
              </span>
            </motion.div>
          </div>

          {/* Tab nav */}
          <nav className="flex items-center gap-1 rounded-lg bg-secondary/50 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-tab"
                      className="absolute inset-0 rounded-md bg-background shadow-sm"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
