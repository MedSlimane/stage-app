import { stageValues, type Progress, type Stage } from "./types";

export type ProgressInput = {
  sourceId: string;
  saved: boolean;
  stage: Stage;
  notes: string;
  priority?: number;
  tasks?: string[];
  nextStep?: string;
  followUp?: string;
};

/** Validates a PATCH body. Optional fields that are absent keep their stored value. */
export function parseProgressInput(body: unknown): ProgressInput | null {
  if (!body || typeof body !== "object") return null;
  const { sourceId, saved, stage, notes, priority, tasks, nextStep, followUp } = body as Record<string, unknown>;
  if (typeof sourceId !== "string" || !/^PFE-\d+$/.test(sourceId)) return null;
  if (typeof saved !== "boolean" || typeof notes !== "string" || notes.length > 10000) return null;
  if (typeof stage !== "string" || !stageValues.includes(stage as Stage)) return null;
  const input: ProgressInput = { sourceId, saved, stage: stage as Stage, notes };
  if (priority !== undefined) {
    if (!Number.isInteger(priority) || (priority as number) < 0 || (priority as number) > 3) return null;
    input.priority = priority as number;
  }
  if (tasks !== undefined) {
    if (!Array.isArray(tasks) || tasks.length > 20 || !tasks.every((t) => typeof t === "string" && /^[a-z-]{1,24}$/.test(t))) return null;
    input.tasks = [...new Set(tasks as string[])];
  }
  if (nextStep !== undefined) {
    if (typeof nextStep !== "string" || nextStep.length > 280) return null;
    input.nextStep = nextStep;
  }
  if (followUp !== undefined) {
    if (typeof followUp !== "string" || (followUp !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(followUp))) return null;
    input.followUp = followUp;
  }
  return input;
}

/** Mirrors convex/workspace.ts updateProgress, for the local demo store. */
export function mergeProgress(current: Progress | undefined, input: ProgressInput, now: number): Progress {
  const history = [...(current?.history ?? [])];
  if ((current?.stage ?? "exploring") !== input.stage) history.push({ stage: input.stage, at: now });
  return {
    sourceId: input.sourceId,
    saved: input.saved,
    stage: input.stage,
    notes: input.notes,
    priority: input.priority ?? current?.priority ?? 0,
    tasks: input.tasks ?? current?.tasks ?? [],
    nextStep: input.nextStep ?? current?.nextStep ?? "",
    followUp: input.followUp ?? current?.followUp ?? "",
    history: history.slice(-30),
    updatedAt: now,
  };
}
