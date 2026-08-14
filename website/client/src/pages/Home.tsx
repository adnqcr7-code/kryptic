/* Constraint Atlas: asymmetrical engineering atlas layout with evidence-first hierarchy, graphite/cream surfaces, marker-lime verification states, and no decorative controls that do not work. */
import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clipboard,
  Github,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Terminal,
  TimerReset,
  Workflow,
} from "lucide-react";

const repoUrl = "https://github.com/adnqcr7-code/kryptic";
const installCommand = "npx kryptic setup";

const steps = [
  { number: "01", label: "PLAN", detail: "A bounded change plan with explicit acceptance criteria." },
  { number: "02", label: "ACT", detail: "Constrained tools, direct process execution, no shell ambiguity." },
  { number: "03", label: "VERIFY", detail: "Exit status, captured output, diff, and workspace state." },
  { number: "04", label: "REPAIR", detail: "A concrete failure opens a transactional recovery path." },
];

const safeguards = [
  { icon: LockKeyhole, label: "Workspace + secret boundaries", copy: "The agent knows where it may work—and where it may not." },
  { icon: ShieldCheck, label: "Evidence over prose", copy: "A model saying ‘done’ is not verification. Execution is." },
  { icon: RotateCcw, label: "Transactional rollback", copy: "Interrupted or failed work can return to a known state." },
  { icon: TimerReset, label: "Resume without guesswork", copy: "Stable action indices make a second attempt explainable." },
];

export default function Home() {
  const [copied, setCopied] = useState(false);

  const copyInstall = async () => {
    await navigator.clipboard?.writeText(installCommand);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-paper text-ink selection:bg-lime selection:text-ink">
      <div className="atlas-grain fixed inset-0 pointer-events-none opacity-40" aria-hidden="true" />
      <header className="relative z-20 border-b border-ink/10 bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-10">
          <a href="#top" className="group flex items-center gap-3" aria-label="Kryptic home">
            <img src="/assets/kryptic-mark.svg" alt="" className="h-9 w-9 object-contain mix-blend-screen" />
            <span className="font-display text-lg font-bold tracking-[-0.03em]">kryptic<span className="text-orange">/</span></span>
          </a>
          <nav className="hidden items-center gap-8 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/60 md:flex" aria-label="Primary navigation">
            <a className="transition-colors hover:text-ink" href="#system">System</a>
            <a className="transition-colors hover:text-ink" href="#proof">Evidence</a>
            <a className="transition-colors hover:text-ink" href="#boundaries">Boundaries</a>
          </nav>
          <a href={repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-ink/20 bg-ink px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-paper transition-transform duration-150 hover:-translate-y-0.5 hover:bg-slate active:scale-[0.97]">
            View repository <ArrowUpRight size={14} strokeWidth={1.8} />
          </a>
        </div>
      </header>

      <div id="top" className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[84px_1fr]">
        <aside className="hidden border-r border-ink/10 lg:block">
          <div className="sticky top-0 flex h-screen flex-col items-center justify-between py-8">
            <span className="font-mono text-[10px] tracking-[0.28em] text-ink/50 [writing-mode:vertical-rl]">LOCAL-FIRST / 2026</span>
            <div className="space-y-7 font-mono text-[10px] text-ink/40">
              <a href="#system" className="block transition-colors hover:text-ink">01</a>
              <a href="#proof" className="block text-lime transition-colors hover:text-ink">02</a>
              <a href="#boundaries" className="block transition-colors hover:text-ink">03</a>
              <a href="#start" className="block transition-colors hover:text-ink">04</a>
            </div>
            <span className="font-mono text-[10px] tracking-[0.28em] text-ink/50 [writing-mode:vertical-rl]">VERIFY / REPAIR</span>
          </div>
        </aside>

        <div className="min-w-0">
          <section className="relative min-h-[680px] border-b border-ink/10 px-5 pb-20 pt-14 lg:px-16 lg:pb-28 lg:pt-20">
            <div className="pointer-events-none absolute inset-y-0 right-0 -z-0 hidden w-[58%] overflow-hidden bg-blueprint/35 lg:block">
              <img src="/assets/kryptic-hero-atlas.png" alt="Abstract Kryptic engineering atlas diagram" className="h-full w-full object-cover object-left opacity-20 mix-blend-screen" />
            </div>
            <div className="relative z-10 max-w-3xl">
              <div className="mb-9 flex items-center gap-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-slate">
                <span className="h-2 w-2 bg-lime shadow-[0_0_0_4px_rgba(200,242,74,0.25)]" />
                Open-source engineering agent / v1.0.2
              </div>
              <h1 className="max-w-4xl font-display text-[clamp(3.4rem,8vw,8rem)] font-bold leading-[0.88] tracking-[-0.075em] text-ink">
                Agents can propose.<br /><span className="text-lime">Kryptic has to</span><br /><span className="relative inline-block">prove.<span className="absolute -bottom-2 left-1 h-3 w-[calc(100%-0.2rem)] bg-lime/70 lg:-bottom-3 lg:h-5" /></span>
              </h1>
              <p className="mt-10 max-w-xl text-lg leading-relaxed text-ink/70 lg:text-xl">A local-first AI engineering agent for developers who want actions proven, changes recoverable, and benchmarks reproducible.</p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <a href="#start" className="group inline-flex items-center gap-3 bg-lime px-5 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-transform duration-150 hover:-translate-y-0.5 hover:bg-lime/80 active:scale-[0.97]">
                  Run the demo <ArrowDownRight size={15} className="transition-transform group-hover:translate-y-0.5" />
                </a>
                <a href={repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-ink/25 px-5 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink hover:bg-ink/5">
                  Inspect the source <ArrowUpRight size={15} />
                </a>
              </div>
            </div>
            <div className="relative z-10 mt-20 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-6 border-t border-ink/20 pt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/60 sm:grid-cols-4">
              <div><span className="mb-1 block text-2xl font-semibold tracking-[-0.06em] text-ink">42/42</span>regression checks</div>
              <div><span className="mb-1 block text-2xl font-semibold tracking-[-0.06em] text-ink">11/11</span>benchmark cases</div>
              <div><span className="mb-1 block text-2xl font-semibold tracking-[-0.06em] text-ink">0</span>API keys for demo</div>
              <div><span className="mb-1 block text-2xl font-semibold tracking-[-0.06em] text-ink">MIT</span>open source</div>
            </div>
          </section>

          <section id="system" className="border-b border-ink/10 bg-ink px-5 py-20 text-paper lg:px-16 lg:py-28">
            <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
              <div>
                <div className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-lime"><span>01</span><span className="h-px w-8 bg-lime/60" /> system map</div>
                <h2 className="max-w-md font-display text-4xl font-bold leading-[0.95] tracking-[-0.06em] sm:text-5xl">The loop is the product.</h2>
                <p className="mt-6 max-w-sm text-base leading-relaxed text-paper/65">Kryptic keeps the work legible. Each stage has a boundary, a result, and a reason to continue—or stop.</p>
              </div>
              <div className="grid gap-0 border-l border-paper/20">
                {steps.map((step, index) => (
                  <div key={step.number} className="group relative grid gap-5 border-b border-paper/15 px-6 py-6 transition-colors hover:bg-paper/[0.05] sm:grid-cols-[78px_140px_1fr] sm:items-center sm:px-8">
                    <span className="font-mono text-xs text-lime">{step.number}</span>
                    <span className="font-mono text-xs font-semibold tracking-[0.18em] text-paper">{step.label}</span>
                    <span className="text-sm leading-relaxed text-paper/55">{step.detail}</span>
                    {index < steps.length - 1 && <ChevronRight size={16} className="absolute -bottom-2 -left-2 z-10 hidden bg-ink text-lime sm:block" />}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="proof" className="border-b border-ink/10 px-5 py-20 lg:px-16 lg:py-28">
            <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <div className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slate"><span>02</span><span className="h-px w-8 bg-slate/60" /> evidence ledger</div>
                <h2 className="max-w-xl font-display text-4xl font-bold leading-[0.95] tracking-[-0.06em] sm:text-5xl">Trust is an artifact.</h2>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-ink/60">Verification is not a model statement. It is an execution result you can inspect.</p>
            </div>
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative overflow-hidden bg-ink p-6 text-paper sm:p-9">
                <div className="absolute right-0 top-0 h-40 w-40 translate-x-1/4 -translate-y-1/4 rounded-full border border-lime/30" />
                <div className="absolute right-10 top-10 h-20 w-20 rounded-full border border-lime/20" />
                <div className="relative flex items-center justify-between border-b border-paper/15 pb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/55"><span>verification trace</span><span className="text-lime">live / local</span></div>
                <img src="/assets/kryptic-proof-panel.png" alt="Four-stage verification workflow diagram" className="my-8 h-auto w-full opacity-95 mix-blend-screen" />
                <div className="grid grid-cols-3 gap-4 border-t border-paper/15 pt-5 font-mono text-[10px] uppercase tracking-[0.15em] text-paper/45"><span><b className="block text-lg text-lime">0</b>claims</span><span><b className="block text-lg text-paper">4</b>stages</span><span><b className="block text-lg text-paper">1</b>evidence trail</span></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {safeguards.map(({ icon: Icon, label, copy }, index) => (
                  <div key={label} className="border border-ink/15 bg-white/30 p-5 transition-transform duration-150 hover:-translate-y-0.5 hover:border-slate/50">
                    <div className="mb-7 flex items-start justify-between"><Icon size={20} strokeWidth={1.5} className="text-slate" /><span className="font-mono text-[9px] tracking-[0.15em] text-slate/70">{index === 0 ? "SCOPE LOCK" : index === 1 ? "EXIT 0" : index === 2 ? "ROLLBACK READY" : "RESUME SAFE"}</span></div>
                    <h3 className="font-display text-lg font-bold tracking-[-0.03em]">{label}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink/60">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="boundaries" className="border-b border-ink/10 bg-paper px-5 py-20 lg:px-16 lg:py-28">
            <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-start">
              <div>
                <div className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slate"><span>03</span><span className="h-px w-8 bg-slate/60" /> boundary conditions</div>
                <h2 className="max-w-lg font-display text-4xl font-bold leading-[0.95] tracking-[-0.06em] sm:text-5xl">Fewer surprises.<br />More recoveries.</h2>
                <p className="mt-7 max-w-md text-base leading-relaxed text-ink/65">Kryptic is built around the uncomfortable parts of engineering agents: permissions, partial failure, ambiguous patches, and the moment a model is confidently wrong.</p>
                <a href={repoUrl + "#readme"} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-slate underline decoration-slate/30 underline-offset-8 transition-colors hover:text-ink">Read the engineering notes <ArrowUpRight size={14} /></a>
              </div>
              <div className="relative border-l-2 border-orange pl-7 sm:pl-9">
                <div className="absolute -left-[7px] top-0 h-3 w-3 bg-orange" />
                <div className="font-mono text-[10px] uppercase tracking-[0.17em] text-orange">failure is a state</div>
                <blockquote className="mt-6 font-display text-2xl font-semibold leading-tight tracking-[-0.04em] text-ink sm:text-3xl">“A model can say that a test passed. Kryptic treats the command’s exit status, captured output, resulting diff, and workspace state as the evidence.”</blockquote>
                <div className="mt-8 grid grid-cols-2 gap-3 font-mono text-[10px] uppercase tracking-[0.13em] text-ink/55"><span className="border border-ink/15 px-3 py-3"><Check size={14} className="mb-2 text-lime" />literal patches</span><span className="border border-ink/15 px-3 py-3"><Check size={14} className="mb-2 text-lime" />rollback paths</span></div>
              </div>
            </div>
          </section>

          <section id="start" className="bg-ink px-5 py-16 text-paper lg:px-16 lg:py-20">
            <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
              <div><div className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-lime"><span>04</span><span className="h-px w-8 bg-lime/50" /> start local</div><h2 className="max-w-2xl font-display text-4xl font-bold leading-[0.93] tracking-[-0.065em] sm:text-6xl">Run the demo.<br />Inspect the evidence.</h2><p className="mt-6 max-w-lg text-base leading-relaxed text-paper/65">No hosted service. No API key required. Just a bounded local run that lets you see what Kryptic means by “done.”</p></div>
              <div className="w-full max-w-md"><div className="flex items-center justify-between border border-paper/25 bg-paper px-4 py-3 font-mono text-xs text-ink"><span><span className="mr-2 text-slate">$</span>{installCommand}</span><button onClick={copyInstall} aria-label="Copy install command" className="ml-4 text-ink/60 transition-colors hover:text-ink">{copied ? <Check size={16} /> : <Clipboard size={16} />}</button></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper/45"><span className="inline-flex items-center gap-1"><Terminal size={12} /> Node.js 22+</span><span className="inline-flex items-center gap-1"><Github size={12} /> open source</span></div><a href={repoUrl} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 bg-lime px-5 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-transform duration-150 hover:-translate-y-0.5 hover:bg-lime/80 active:scale-[0.97]">Get Kryptic <ArrowUpRight size={15} /></a></div>
            </div>
          </section>

          <footer className="flex flex-col justify-between gap-5 border-t border-ink/20 bg-paper px-5 py-7 font-mono text-[10px] uppercase tracking-[0.15em] text-ink/50 sm:flex-row sm:items-center lg:px-16">
            <span>© 2026 Kryptic / built for inspectable work</span><span className="flex items-center gap-3"><span className="h-2 w-2 bg-lime" /> local-first / evidence-led / recoverable</span><a href={repoUrl} target="_blank" rel="noreferrer" className="text-ink transition-colors hover:text-slate">GitHub <ArrowUpRight size={12} className="inline" /></a>
          </footer>
        </div>
      </div>
    </main>
  );
}
