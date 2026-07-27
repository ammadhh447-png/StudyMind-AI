"use client";

import {
  Brain,
  CalendarDays,
  ClipboardList,
  FileText,
  GitBranch,
  Layers,
  MessageSquare,
  Mic,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";

const features = [
  {
    icon: FileText,
    title: "AI Notes Hub",
    desc: "Upload PDFs, DOCX, slides, and images with smart organisation.",
    tone: "from-violet-600/30 to-violet-600/5",
  },
  {
    icon: MessageSquare,
    title: "Contextual AI Chat",
    desc: "Ask questions grounded in your uploaded materials and sources.",
    tone: "from-indigo-600/30 to-indigo-600/5",
  },
  {
    icon: Sparkles,
    title: "Summariser",
    desc: "Key points and simplified explanations for complex topics.",
    tone: "from-cyan-600/20 to-cyan-600/5",
  },
  {
    icon: ClipboardList,
    title: "Quiz Generator",
    desc: "MCQs, true/false, and short answers with difficulty levels.",
    tone: "from-purple-600/30 to-purple-600/5",
  },
  {
    icon: Layers,
    title: "Smart Flashcards",
    desc: "Auto-generated revision decks with shuffle and progress tracking.",
    tone: "from-blue-600/30 to-blue-600/5",
  },
  {
    icon: CalendarDays,
    title: "Study Planner",
    desc: "Daily goals, weekly heatmaps, and exam preparation schedules.",
    tone: "from-violet-600/25 to-indigo-600/5",
  },
  {
    icon: TrendingUp,
    title: "Progress Analytics",
    desc: "Study hours, quiz scores, streaks, and weak topic insights.",
    tone: "from-emerald-600/20 to-emerald-600/5",
  },
  {
    icon: GitBranch,
    title: "Mind Maps",
    desc: "Visual concept maps generated from your lecture notes.",
    tone: "from-fuchsia-600/25 to-fuchsia-600/5",
  },
  {
    icon: Users,
    title: "Study Groups",
    desc: "Collaborate, share notes, and chat with classmates.",
    tone: "from-indigo-600/25 to-violet-600/5",
  },
  {
    icon: Mic,
    title: "Voice Tutor",
    desc: "Hands-free learning with speech-powered AI explanations.",
    tone: "from-violet-600/30 to-blue-600/5",
  },
  {
    icon: Brain,
    title: "Weak Topic AI",
    desc: "Detect gaps and get targeted revision recommendations.",
    tone: "from-red-500/15 to-violet-600/5",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-[#e2b96f]">
            Platform capabilities
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Everything in your design, built as real product modules
          </h2>
          <p className="mt-4 text-muted">
            Dark glass UI, neon purple accents, charts, and sidebar navigation —
            not a generic landing page.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 4) * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <GlassCard className="group h-full transition hover:border-[#c9a84c]/40 hover:shadow-[0_0_40px_-12px_var(--primary-glow)]">
                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.tone} ring-1 ring-white/10`}
                  >
                    <Icon className="h-5 w-5 text-[#f0d08a]" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
