"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play, Sparkles, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

const stats = [
  { value: "12+", label: "AI study modules" },
  { value: "4.9", label: "Student rating" },
  { value: "10k+", label: "Notes processed" },
  { value: "24/7", label: "AI tutor access" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-16 md:pt-24">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#c9a84c]/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 top-40 h-80 w-80 rounded-full bg-[#c9a84c]/15 blur-[100px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 px-4 py-1.5 text-sm text-[#f0d08a]"
          >
            <Sparkles className="h-4 w-4" />
            AI-Powered Learning Assistant
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Your entire study workflow in one{" "}
            <span className="gradient-text">intelligent workspace</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-muted"
          >
            Upload PDFs and slides, chat with AI on your notes, generate quizzes
            and flashcards, plan exams, track weak topics, and collaborate — with
            the same premium dashboard experience you designed for StudyMind AI.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button asChild size="lg" className="shadow-lg shadow-[#c9a84c]/25">
              <Link href="/signup">
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#preview">
                <Play className="h-4 w-4" />
                See Preview
              </Link>
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-8 flex items-center gap-2 text-sm text-muted"
          >
            <div className="flex -space-x-2">
              {["A", "M", "S", "K"].map((l) => (
                <div
                  key={l}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#070816] bg-gradient-to-br from-[#c9a84c] to-[#a07830] text-xs font-bold"
                >
                  {l}
                </div>
              ))}
            </div>
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              Loved by students preparing for exams
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative"
        >
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#c9a84c]/30 to-[#8a6420]/15 blur-2xl" />
          <GlassCard glow className="relative overflow-hidden p-2 md:p-3">
            <div className="mb-3 flex items-center gap-2 px-2 pt-1">
              <div className="h-3 w-3 rounded-full bg-red-400/80" />
              <div className="h-3 w-3 rounded-full bg-amber-400/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
              <span className="ml-2 text-xs text-muted">studymind.ai/dashboard</span>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-[#0a0c18]">
              <Image
                src="/studymind-showcase.png"
                alt="StudyMind AI dashboard preview"
                fill
                className="object-cover object-left-top"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070816] via-transparent to-transparent" />
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <div className="relative mx-auto mt-16 grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard className="text-center">
              <p className="text-2xl font-bold gradient-text">{s.value}</p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
