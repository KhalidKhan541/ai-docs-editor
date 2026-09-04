"use client";

import Link from "next/link";
import { ArrowRight, Zap, Users, Shield, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Zap,
    title: "Real-time Collaboration",
    description: "Edit simultaneously with your team. See changes as they happen with conflict-free resolution.",
  },
  {
    icon: Sparkles,
    title: "AI Writing Assistant",
    description: "Generate content, rewrite sections, fix grammar, and translate with built-in AI commands.",
  },
  {
    icon: Users,
    title: "Team Workspaces",
    description: "Organize documents in shared folders. Control access with granular permissions.",
  },
  {
    icon: Shield,
    title: "Version History",
    description: "Never lose work. Browse and restore any previous version with visual diff comparison.",
  },
];

const testimonials = [
  { name: "Sarah Chen", role: "Product Lead at Stripe", text: "DocuFlow cut our document review cycle in half. The AI suggestions are surprisingly good." },
  { name: "Marcus Rivera", role: "Engineering Manager", text: "Finally, a docs tool that developers actually enjoy using. The slash commands are a game-changer." },
  { name: "Aisha Patel", role: "Content Strategist", text: "The real-time collaboration feels buttery smooth. We switched from Google Docs and never looked back." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">DocuFlow</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm text-gray-600 transition-colors hover:text-gray-900">Features</Link>
            <Link href="#testimonials" className="text-sm text-gray-600 transition-colors hover:text-gray-900">Testimonials</Link>
            <Link href="#pricing" className="text-sm text-gray-600 transition-colors hover:text-gray-900">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
                Get Started <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50/50 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <Badge variant="secondary" className="mb-6 border border-violet-200 bg-violet-50 text-violet-700">
            <Sparkles className="mr-1 h-3 w-3" /> Now with AI-powered editing
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Write better,
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              together
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            The collaborative editor that combines real-time editing, AI assistance,
            and powerful version control in one seamless experience.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800">
                Start writing <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">Learn more</Button>
            </Link>
          </div>

          <div className="relative mt-16 mx-auto max-w-4xl">
            <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="ml-4 flex items-center gap-2 text-sm text-gray-500">
                  <Zap className="h-3.5 w-3.5" /> Product Requirements v2
                </div>
                <div className="ml-auto flex -space-x-2">
                  {["bg-blue-500", "bg-green-500", "bg-purple-500"].map((color, i) => (
                    <div key={i} className={`h-6 w-6 rounded-full ${color} border-2 border-white`} />
                  ))}
                </div>
              </div>
              <div className="min-h-[320px] p-6 text-left">
                <div className="mb-4 text-2xl font-bold text-gray-900">Product Requirements</div>
                <div className="space-y-3 text-gray-600">
                  <p>This document outlines the core requirements for the Q1 product launch...</p>
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
                    AI Suggestion: Consider adding performance benchmarks to strengthen the scalability section.
                  </div>
                  <div className="ml-4 border-l-2 border-purple-400 pl-3 text-purple-600">
                    <span className="text-xs font-medium">AI Generated:</span> Based on industry standards, we recommend targeting sub-100ms response times...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need to write brilliantly</h2>
            <p className="mt-3 text-lg text-gray-600">Powerful features wrapped in a beautiful, distraction-free interface.</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                  <feature.icon className="h-5 w-5 text-violet-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Trusted by teams worldwide</h2>
            <p className="mt-3 text-lg text-gray-600">See what our users have to say about DocuFlow.</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-gray-200 p-6">
                <p className="text-gray-600">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-900">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to transform your writing workflow?</h2>
          <p className="mt-4 text-lg text-gray-400">Join thousands of teams already using DocuFlow to write better, together.</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                Get started for free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Check className="h-4 w-4 text-green-400" /> No credit card required
              <span className="mx-2">·</span>
              <Check className="h-4 w-4 text-green-400" /> 14-day free trial
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-indigo-600">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">DocuFlow</span>
          </div>
          <p className="text-sm text-gray-500">&copy; 2026 DocuFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
