"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/cn";
import { saveTask } from "@/lib/store";
import type { StoredTask } from "@/lib/store";
import { SUBJECT_AREAS } from "@/lib/master/subjects/hierarchy";
import { TaskDetailModal } from "./TaskDetailModal";

const DAYS = [
  { key: "Mon", label: "月" },
  { key: "Tue", label: "火" },
  { key: "Wed", label: "水" },
  { key: "Thu", label: "木" },
  { key: "Fri", label: "金" },
  { key: "Sat", label: "土" },
  { key: "Sun", label: "日" },
] as const;

type DayKey = (typeof DAYS)[number]["key"] | "unassigned";

function getMondayOfCurrentWeek(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateForDayKey(monday: Date, key: DayKey): string | undefined {
  if (key === "unassigned") return undefined;
  const idx = DAYS.findIndex((d) => d.key === key);
  if (idx < 0) return undefined;
  const d = new Date(monday);
  d.setDate(monday.getDate() + idx);
  return d.toISOString().slice(0, 10);
}

function dayKeyForDate(monday: Date, dateISO: string): DayKey {
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    if (d.toISOString().slice(0, 10) === dateISO) {
      return DAYS[i].key;
    }
  }
  return "unassigned";
}

function formatColumnDate(monday: Date, idx: number): string {
  const d = new Date(monday);
  d.setDate(monday.getDate() + idx);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

type TaskCardProps = {
  task: StoredTask;
  onTap: (task: StoredTask) => void;
  isDragging?: boolean;
};

function TaskCard({ task, onTap, isDragging = false }: TaskCardProps) {
  const area = SUBJECT_AREAS.find((a) => a.id === task.subjectArea);

  return (
    <button
      type="button"
      onClick={() => onTap(task)}
      className={cn(
        "w-full rounded-xl border border-ink-100/80 bg-white p-2.5 text-left transition",
        "active:scale-[0.98]",
        isDragging && "rotate-1 shadow-lg opacity-95",
      )}
    >
      <div className="text-[12px] font-bold leading-snug text-ink-900 line-clamp-2">
        {task.title}
      </div>
      <div className="mt-1.5 flex items-center gap-1 flex-wrap">
        {area ? (
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[9px] font-bold",
              area.tone,
            )}
          >
            {area.shortName}
          </span>
        ) : null}
        <span className="rounded-md bg-cream-100 px-1.5 py-0.5 text-[9px] font-bold text-ink-600 tabular-nums">
          {task.blocks}blk
        </span>
      </div>
    </button>
  );
}

type SortableTaskCardProps = {
  task: StoredTask;
  onTap: (task: StoredTask) => void;
};

function SortableTaskCard({ task, onTap }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} onTap={onTap} />
    </div>
  );
}

type ColumnProps = {
  dayKey: DayKey;
  label: string;
  dateLabel?: string;
  tasks: StoredTask[];
  isToday: boolean;
  onTap: (task: StoredTask) => void;
};

function Column({ dayKey, label, dateLabel, tasks, isToday, onTap }: ColumnProps) {
  const { isOver, setNodeRef } = useSortable({ id: `col:${dayKey}` });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[128px] flex-none flex-col rounded-2xl border p-2 transition",
        isToday
          ? "border-sky-300 bg-sky-50/60"
          : "border-ink-100/80 bg-cream-50/60",
        isOver && "border-sky-400 bg-sky-50",
      )}
    >
      <div className="mb-2 text-center">
        <div
          className={cn(
            "text-[11px] font-bold",
            isToday ? "text-sky-700" : "text-ink-500",
          )}
        >
          {label}
        </div>
        {dateLabel ? (
          <div className="text-[9px] text-ink-400 tabular-nums">{dateLabel}</div>
        ) : null}
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-1.5 min-h-[60px]">
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onTap={onTap} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

type Props = {
  tasks: StoredTask[];
};

export function WeeklyTaskBoard({ tasks }: Props) {
  const [activeTask, setActiveTask] = useState<StoredTask | null>(null);
  const [detailTask, setDetailTask] = useState<StoredTask | null>(null);

  const monday = useMemo(() => getMondayOfCurrentWeek(), []);
  const todayISO = new Date().toISOString().slice(0, 10);

  const allColumns: DayKey[] = ["unassigned", ...DAYS.map((d) => d.key)];

  const tasksByColumn = useMemo(() => {
    const map: Record<DayKey, StoredTask[]> = {
      unassigned: [],
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
      Sun: [],
    };
    for (const task of tasks) {
      if (!task.assignedDate) {
        map["unassigned"].push(task);
      } else {
        const key = dayKeyForDate(monday, task.assignedDate);
        map[key].push(task);
      }
    }
    return map;
  }, [tasks, monday]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  const findColumnForTask = useCallback(
    (taskId: string): DayKey | null => {
      for (const col of allColumns) {
        if (tasksByColumn[col].some((t) => t.id === taskId)) return col;
      }
      return null;
    },
    [tasksByColumn, allColumns],
  );

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    const task = tasks.find((t) => t.id === id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const overId = String(over.id);

    let targetCol: DayKey | null = null;

    if (overId.startsWith("col:")) {
      targetCol = overId.replace("col:", "") as DayKey;
    } else {
      targetCol = findColumnForTask(overId);
    }

    if (!targetCol) return;

    const sourceCol = findColumnForTask(taskId);
    if (sourceCol === targetCol) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newDate = dateForDayKey(monday, targetCol);
    saveTask({ ...task, assignedDate: newDate });
  }

  function handleDragCancel() {
    setActiveTask(null);
  }

  return (
    <>
      <section>
        <div className="text-[10px] font-semibold text-ink-400 mb-2">
          今週のタスクボード
        </div>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-2" style={{ width: "max-content" }}>
              {/* 未割り当て列 */}
              <Column
                dayKey="unassigned"
                label="未定"
                tasks={tasksByColumn["unassigned"]}
                isToday={false}
                onTap={setDetailTask}
              />

              {/* 曜日列 */}
              {DAYS.map((day, idx) => {
                const dateISO = (() => {
                  const d = new Date(monday);
                  d.setDate(monday.getDate() + idx);
                  return d.toISOString().slice(0, 10);
                })();
                return (
                  <Column
                    key={day.key}
                    dayKey={day.key}
                    label={day.label}
                    dateLabel={formatColumnDate(monday, idx)}
                    tasks={tasksByColumn[day.key]}
                    isToday={dateISO === todayISO}
                    onTap={setDetailTask}
                  />
                );
              })}
            </div>
          </div>

          <DragOverlay>
            {activeTask ? (
              <TaskCard task={activeTask} onTap={() => {}} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      </section>

      {detailTask ? (
        <TaskDetailModal
          task={detailTask}
          onClose={() => setDetailTask(null)}
        />
      ) : null}
    </>
  );
}
