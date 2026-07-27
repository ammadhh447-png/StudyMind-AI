"use client";

import { Calendar, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PlannerAddTaskValues = {
  title: string;
  dueDate: string;
  scheduledTime: string;
};

type PlannerAddTaskFormProps = {
  value: PlannerAddTaskValues;
  onChange: (value: PlannerAddTaskValues) => void;
  onSubmit: () => void;
  disabled?: boolean;
  className?: string;
};

export function PlannerAddTaskForm({
  value,
  onChange,
  onSubmit,
  disabled,
  className,
}: PlannerAddTaskFormProps) {
  return (
    <form
      className={cn("flex w-full flex-col gap-2", className)}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="h-9 min-w-[12rem] flex-1 text-sm"
          placeholder="New task…"
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          disabled={disabled}
        />
        <label className="relative inline-flex h-9 min-w-[9.5rem] items-center">
          <Calendar className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#c9a84c]" />
          <input
            type="date"
            aria-label="Task date"
            disabled={disabled}
            value={value.dueDate}
            onChange={(e) => onChange({ ...value, dueDate: e.target.value })}
            className="h-9 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] pl-8 pr-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/40"
          />
        </label>
        <label className="relative inline-flex h-9 min-w-[7.5rem] items-center">
          <Clock className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#c9a84c]" />
          <input
            type="time"
            aria-label="Task time"
            disabled={disabled}
            value={value.scheduledTime}
            onChange={(e) => onChange({ ...value, scheduledTime: e.target.value })}
            className="h-9 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] pl-8 pr-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/40"
          />
        </label>
        <Button
          type="submit"
          size="sm"
          className="h-9 shrink-0 px-3"
          disabled={disabled || !value.title.trim()}
          aria-label="Add task"
        >
          <Plus className="h-4 w-4 sm:hidden" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>
    </form>
  );
}

export function defaultPlannerAddValues(): PlannerAddTaskValues {
  const now = new Date();
  let h = now.getHours();
  let m = Math.ceil(now.getMinutes() / 5) * 5;
  if (m === 60) {
    m = 0;
    h = (h + 1) % 24;
  }
  return {
    title: "",
    dueDate: [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-"),
    scheduledTime: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
  };
}
