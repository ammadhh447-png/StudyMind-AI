"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

const steps = [
  {
    step: "01",
    title: "Upload materials",
    body: "PDFs, Word docs, presentations, and images — stored on Cloudinary with OCR.",
  },
  {
    step: "02",
    title: "Learn with AI",
    body: "Chat, summarise, generate quizzes, flashcards, and mind maps via OpenRouter.",
  },
  {
    step: "03",
    title: "Track & improve",
    body: "Dashboard analytics, weak topics, planner tasks, and quiz attempts.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="modules" className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">How StudyMind AI works</h2>
          <p className="mt-3 text-muted">From upload to exam-ready in three steps</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <GlassCard className="relative h-full overflow-hidden">
                <span className="text-5xl font-black text-[#c9a84c]/20">{s.step}</span>
                <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{s.body}</p>
                <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-[#c9a84c]/10 blur-2xl" />
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section className="px-6 pb-24 pt-8">
      <div className="mx-auto max-w-5xl">
        <GlassCard glow className="relative overflow-hidden px-8 py-12 text-center md:px-16">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#c9a84c]/15 via-transparent to-[#8a6420]/10" />
          <h2 className="relative text-3xl font-bold sm:text-4xl">
            Ready to study like your mockups?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-muted">
            Create a free account and open the full dashboard — notes, AI assistant,
            quizzes, flashcards, planner, and more.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-white/5 px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-muted">© {new Date().getFullYear()} StudyMind AI</p>
        <div className="flex gap-6 text-sm text-muted">
          <Link href="/login" className="hover:text-foreground">
            Sign In
          </Link>
          <Link href="/signup" className="hover:text-foreground">
            Sign Up
          </Link>
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
