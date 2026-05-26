// Remote data layer — Supabase read/write for user-owned data.
// All functions are fire-and-forget safe (never throw to callers).

import { getSupabase } from "./supabase";
import type {
  StoreState,
  StoredProfile,
  StoredTest,
  BlockLog,
  StoredTask,
  CalendarEvent,
  DailyMoodLog,
  FixedSlot,
} from "./store";
import type { PlanningProfile, WeeklyGoal, WeeklyExecutionLog } from "./planning/types";

function sb() {
  return getSupabase();
}

function logErr(context: string, err: unknown) {
  console.error(`[store-remote] ${context}:`, err);
}

export async function loadAll(userId: string): Promise<Partial<StoreState>> {
  const client = sb();
  if (!client) return {};

  const [
    profileRes,
    planningRes,
    testsRes,
    blockLogsRes,
    tasksRes,
    eventsRes,
    dailyLogsRes,
    weeklyGoalsRes,
    weeklyExecsRes,
  ] = await Promise.all([
    client.from("user_profiles").select("data").eq("user_id", userId).maybeSingle(),
    client.from("user_planning").select("data").eq("user_id", userId).maybeSingle(),
    client.from("user_tests").select("data").eq("user_id", userId).order("created_at", { ascending: false }),
    client.from("user_block_logs").select("data").eq("user_id", userId),
    client.from("user_tasks").select("data").eq("user_id", userId).order("created_at", { ascending: false }),
    client.from("user_events").select("data").eq("user_id", userId).order("event_date", { ascending: true }),
    client.from("user_daily_logs").select("data").eq("user_id", userId),
    client.from("user_weekly_goals").select("data").eq("user_id", userId),
    client.from("user_weekly_executions").select("data").eq("user_id", userId),
  ]);

  const rawPlanning = planningRes.data?.data as (PlanningProfile & { fixedSlots?: FixedSlot[] }) | undefined;
  const { fixedSlots: remoteFixedSlots, ...planningData } = rawPlanning ?? {};

  return {
    profile: (profileRes.data?.data as StoredProfile) ?? undefined,
    planning: Object.keys(planningData).length > 0 ? (planningData as PlanningProfile) : undefined,
    fixedSlots: remoteFixedSlots ?? [],
    tests: (testsRes.data ?? []).map((r) => r.data as StoredTest),
    blockLogs: (blockLogsRes.data ?? []).map((r) => r.data as BlockLog),
    tasks: (tasksRes.data ?? []).map((r) => r.data as StoredTask),
    events: (eventsRes.data ?? []).map((r) => r.data as CalendarEvent),
    dailyMoodLogs: (dailyLogsRes.data ?? []).map((r) => r.data as DailyMoodLog),
    weeklyGoals: (weeklyGoalsRes.data ?? []).map((r) => r.data as WeeklyGoal),
    weeklyExecutions: (weeklyExecsRes.data ?? []).map((r) => r.data as WeeklyExecutionLog),
  };
}

export async function saveProfileRemote(userId: string, profile: StoredProfile): Promise<void> {
  const client = sb();
  if (!client) return;
  const { error } = await client
    .from("user_profiles")
    .upsert({ user_id: userId, data: profile, updated_at: new Date().toISOString() });
  if (error) logErr("saveProfile", error);
}

export async function savePlanningRemote(userId: string, planning: PlanningProfile, fixedSlots?: FixedSlot[]): Promise<void> {
  const client = sb();
  if (!client) return;
  const data = fixedSlots !== undefined ? { ...planning, fixedSlots } : planning;
  const { error } = await client
    .from("user_planning")
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
  if (error) logErr("savePlanning", error);
}

export async function saveTestRemote(userId: string, test: StoredTest): Promise<void> {
  const client = sb();
  if (!client) return;
  const { error } = await client
    .from("user_tests")
    .upsert({ id: test.id, user_id: userId, data: test, updated_at: new Date().toISOString() });
  if (error) logErr("saveTest", error);
}

export async function deleteTestRemote(userId: string, testId: string): Promise<void> {
  const client = sb();
  if (!client) return;
  const [t, b] = await Promise.all([
    client.from("user_tests").delete().eq("id", testId).eq("user_id", userId),
    client.from("user_block_logs").delete().eq("test_id", testId).eq("user_id", userId),
  ]);
  if (t.error) logErr("deleteTest", t.error);
  if (b.error) logErr("deleteTestBlockLogs", b.error);
}

export async function saveBlockLogRemote(userId: string, log: BlockLog): Promise<void> {
  const client = sb();
  if (!client) return;
  const { error } = await client
    .from("user_block_logs")
    .upsert(
      {
        user_id: userId,
        test_id: log.testId,
        block_idx: log.blockIdx,
        data: log,
        completed_at: log.completedAt,
      },
      { onConflict: "user_id,test_id,block_idx" },
    );
  if (error) logErr("saveBlockLog", error);
}

export async function saveTaskRemote(userId: string, task: StoredTask): Promise<void> {
  const client = sb();
  if (!client) return;
  const { error } = await client
    .from("user_tasks")
    .upsert({
      id: task.id,
      user_id: userId,
      data: task,
      status: task.status,
      completed_at: task.completedAt ?? null,
      updated_at: new Date().toISOString(),
    });
  if (error) logErr("saveTask", error);
}

export async function deleteTaskRemote(userId: string, taskId: string): Promise<void> {
  const client = sb();
  if (!client) return;
  const { error } = await client
    .from("user_tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId);
  if (error) logErr("deleteTask", error);
}

export async function saveEventRemote(userId: string, event: CalendarEvent): Promise<void> {
  const client = sb();
  if (!client) return;
  const { error } = await client
    .from("user_events")
    .upsert({ id: event.id, user_id: userId, data: event, event_date: event.date });
  if (error) logErr("saveEvent", error);
}

export async function deleteEventRemote(userId: string, eventId: string): Promise<void> {
  const client = sb();
  if (!client) return;
  const { error } = await client
    .from("user_events")
    .delete()
    .eq("id", eventId)
    .eq("user_id", userId);
  if (error) logErr("deleteEvent", error);
}

export async function saveDailyMoodLogRemote(userId: string, log: DailyMoodLog): Promise<void> {
  const client = sb();
  if (!client) return;
  const { error } = await client
    .from("user_daily_logs")
    .upsert({ user_id: userId, date_iso: log.dateISO, data: log }, { onConflict: "user_id,date_iso" });
  if (error) logErr("saveDailyMoodLog", error);
}

export async function saveWeeklyGoalRemote(userId: string, goal: WeeklyGoal): Promise<void> {
  const client = sb();
  if (!client) return;
  const { error } = await client
    .from("user_weekly_goals")
    .upsert({ user_id: userId, week_start_iso: goal.weekStartISO, data: goal, updated_at: new Date().toISOString() });
  if (error) logErr("saveWeeklyGoal", error);
}

export async function saveWeeklyExecutionRemote(userId: string, log: WeeklyExecutionLog): Promise<void> {
  const client = sb();
  if (!client) return;
  const { error } = await client
    .from("user_weekly_executions")
    .upsert({ user_id: userId, week_start_iso: log.weekStartISO, data: log, updated_at: new Date().toISOString() });
  if (error) logErr("saveWeeklyExecution", error);
}

export async function syncTasksRemote(userId: string, tasks: StoredTask[]): Promise<void> {
  const client = sb();
  if (!client) return;
  if (tasks.length === 0) return;
  const rows = tasks.map((t) => ({
    id: t.id,
    user_id: userId,
    data: t,
    status: t.status,
    completed_at: t.completedAt ?? null,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await client.from("user_tasks").upsert(rows);
  if (error) logErr("syncTasks", error);
}
