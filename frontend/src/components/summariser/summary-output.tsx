import { BookOpen, Lightbulb, ListChecks, Sparkles, Star } from "lucide-react";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { GlassCard } from "@/components/ui/glass-card";

export type StudySummary = {
  title?: string;
  quickOverview?: string;
  keyPoints?: string[];
  definitions?: { term: string; meaning: string }[];
  examTips?: string[];
  rememberThis?: string;
};

type SummaryOutputProps = {
  summary: StudySummary | null;
  format?: "structured" | "text";
};

export function SummaryOutput({ summary, format }: SummaryOutputProps) {
  if (!summary) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-muted">
        <Sparkles className="mb-3 h-8 w-8 text-[#c9a84c]/60" />
        <p>Generate a summary to see key points, definitions, and exam tips here.</p>
      </div>
    );
  }

  if (format === "text" && summary.quickOverview && !summary.keyPoints?.length) {
    return (
      <div className="scrollbar-thin h-full overflow-y-auto p-5">
        <ChatMarkdown content={summary.quickOverview} />
      </div>
    );
  }

  return (
    <div className="scrollbar-thin h-full space-y-4 overflow-y-auto p-4 md:p-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-[#e2b96f]">Topic</p>
        <h2 className="mt-1 text-lg font-semibold">{summary.title || "Study summary"}</h2>
      </div>

      {summary.quickOverview ? (
        <GlassCard className="border-[#c9a84c]/20 bg-violet-500/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <BookOpen className="h-4 w-4 text-[#e2b96f]" />
            Quick overview
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{summary.quickOverview}</p>
        </GlassCard>
      ) : null}

      {summary.keyPoints && summary.keyPoints.length > 0 ? (
        <GlassCard className="p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <ListChecks className="h-4 w-4 text-cyan-300" />
            Key points for exams
          </div>
          <ul className="space-y-2">
            {summary.keyPoints.map((point) => (
              <li
                key={point}
                className="flex gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-foreground/90"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      ) : null}

      {summary.definitions && summary.definitions.length > 0 ? (
        <GlassCard className="p-4">
          <div className="mb-3 text-sm font-medium">Important terms</div>
          <dl className="space-y-2">
            {summary.definitions.map((d) => (
              <div key={d.term} className="rounded-lg bg-white/5 px-3 py-2">
                <dt className="text-sm font-medium text-[#f0d08a]">{d.term}</dt>
                <dd className="mt-1 text-sm text-muted">{d.meaning}</dd>
              </div>
            ))}
          </dl>
        </GlassCard>
      ) : null}

      {summary.examTips && summary.examTips.length > 0 ? (
        <GlassCard className="p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="h-4 w-4 text-amber-300" />
            Exam tips
          </div>
          <ul className="space-y-2 text-sm text-foreground/90">
            {summary.examTips.map((tip) => (
              <li key={tip} className="rounded-lg bg-white/5 px-3 py-2">
                {tip}
              </li>
            ))}
          </ul>
        </GlassCard>
      ) : null}

      {summary.rememberThis ? (
        <div className="rounded-xl border border-[#c9a84c]/30 bg-gradient-to-r from-violet-600/15 to-indigo-600/10 px-4 py-3">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#f0d08a]">
            <Star className="h-3.5 w-3.5" />
            Remember this
          </div>
          <p className="text-sm font-medium">{summary.rememberThis}</p>
        </div>
      ) : null}
    </div>
  );
}
