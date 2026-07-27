"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  background: "var(--surface-solid)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
};

export function MiniSparkline({ data }: { data: number[] }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-10 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke="#c9a84c"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeeklyActivityChart({
  data,
}: {
  data?: { day: string; value: number }[];
}) {
  const chartData = (data && data.length ? data : []).map((item) => ({
    day: item.day,
    value: item.value,
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a84c" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#c9a84c" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="day" stroke="#9a8f7e" fontSize={12} tickLine={false} />
        <YAxis stroke="#9a8f7e" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#e2b96f"
          fill="url(#activityFill)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StudyOverviewDonut({
  data = [],
}: {
  data?: { name: string; value: number; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          innerRadius={55}
          outerRadius={78}
          paddingAngle={4}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function WeeklyStudyBar({
  data,
}: {
  data?: { day: string; value: number }[];
}) {
  const chartData = (data && data.length ? data : []).map((item) => ({
    day: item.day,
    value: item.value,
  }));
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="day" stroke="#9a8f7e" fontSize={11} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="value" fill="#c9a84c" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GroupProgressOverview({
  progress,
  tasksDone,
  tasksTotal,
  quizzes,
  files,
  members,
}: {
  progress: number;
  tasksDone: number;
  tasksTotal: number;
  quizzes: number;
  files: number;
  members: number;
}) {
  const taskSlice = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : Math.min(100, tasksDone * 15);
  const data = [
    { name: "Tasks", value: Math.max(taskSlice, 8), color: "#c9a84c" },
    { name: "Quizzes", value: Math.max(Math.min(quizzes * 12, 100), 8), color: "#e2b96f" },
    { name: "Notes", value: Math.max(Math.min(files * 8, 100), 8), color: "#b07a2a" },
    { name: "Active members", value: Math.max(Math.min(members * 10, 100), 8), color: "#f0d08a" },
  ];

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center">
      <div className="relative h-[200px] w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={58}
              outerRadius={82}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{progress}%</span>
          <span className="text-xs text-muted">Overall progress</span>
        </div>
      </div>
      <ul className="grid w-full max-w-[200px] gap-2 text-sm sm:w-auto">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="text-muted">{d.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProgressRing({ value }: { value: number }) {
  const data = [
    { name: "done", value },
    { name: "rest", value: 100 - value },
  ];
  return (
    <div className="relative h-44 w-44">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={62}
            outerRadius={78}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            <Cell fill="#c9a84c" />
            <Cell fill="rgba(255,255,255,0.06)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{value}%</span>
        <span className="text-xs text-muted">Overall</span>
      </div>
    </div>
  );
}
