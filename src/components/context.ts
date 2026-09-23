"use client";
import { createContext, useContext } from "react";
import type { Opportunity, Progress, Snapshot } from "@/lib/types";

export type View = "today" | "discover" | "saved" | "pipeline" | "reports" | "profile";
export type Theme = "system" | "light" | "dark";
export type Filters = {
  query: string;
  geo: string;
  remote: boolean;
  timing: boolean;
  watch: boolean;
  skill: string;
  sort: "fit" | "newest" | "deadline" | "company";
};
export const emptyFilters: Filters = { query: "", geo: "All", remote: false, timing: false, watch: false, skill: "", sort: "fit" };

export type WorkspaceApi = {
  data: Snapshot;
  offline: boolean;
  getProgress: (id: string) => Progress;
  roleById: (id: string) => Opportunity | undefined;
  update: (next: Progress, options?: { undo?: string }) => Promise<boolean>;
  openRole: (id: string, list?: string[]) => void;
  navigate: (view: View) => void;
  notify: (message: string) => void;
  isNew: (o: Opportunity) => boolean;
  compare: string[];
  toggleCompare: (id: string) => void;
  filters: Filters;
  setFilters: (update: Partial<Filters>) => void;
  openFilters: () => void;
  openPalette: () => void;
  install: () => void;
  installed: boolean;
  theme: Theme;
  setTheme: (t: Theme) => void;
  exportCSV: () => void;
  exportCalendar: () => void;
  showShortcuts: () => void;
  lock: () => void;
};

export const WorkspaceContext = createContext<Omit<WorkspaceApi, "update"> | null>(null);
// Provided separately: the updater reads refs, which the React compiler forbids inside render-time objects.
export const UpdateContext = createContext<WorkspaceApi["update"] | null>(null);
export function useWorkspace(): WorkspaceApi {
  const value = useContext(WorkspaceContext);
  const update = useContext(UpdateContext);
  if (!value || !update) throw new Error("useWorkspace must be used inside the workspace");
  return { ...value, update };
}
