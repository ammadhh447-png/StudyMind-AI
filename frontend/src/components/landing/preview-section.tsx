"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

const highlights = [
  "Dashboard with live stats & charts",
  "Notes, chat, quizzes & flashcards",
  "Planner, groups, voice tutor & settings",
];

export function PreviewSection() {
  return (
    <section id="preview" className="relative px-6 py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.12),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-[#e2b96f]">
              Product preview
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              The same multi-screen experience from your mockups
            </h2>
            <p className="mt-4 text-muted">
              Dashboard, notes grid, AI assistant with sources, quiz performance
              sidebar, flashcard deck, mind map gallery, planner, groups, and
              settings — all in one cohesive StudyMind AI interface.
            </p>
            <ul className="mt-6 space-y-3">
              {highlights.map((h) => (
                <li key={h} className="flex items-center gap-3 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c9a84c]/30 text-[#f0d08a]">
                    ✓
                  </span>
                  {h}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8" size="lg">
              <Link href="/signup">
                Open your workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-violet-600/20 to-indigo-600/10 blur-3xl" />
            <GlassCard glow className="relative overflow-hidden p-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10">
                <Image
                  src="/studymind-showcase.png"
                  alt="StudyMind AI full UI collage"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
