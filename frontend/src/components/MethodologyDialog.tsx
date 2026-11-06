import { BookOpen } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { REFERENCES } from '@/sim/references'

/** "About / Methodology": plain-language description of the model and its limits. */
export function MethodologyDialog() {
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="About and methodology">
              <BookOpen />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>About &amp; methodology</TooltipContent>
      </Tooltip>
      <DialogContent className="grid max-h-[85dvh] grid-rows-[auto_1fr] gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b p-6 pb-4">
          <p className="eyebrow">About</p>
          <DialogTitle className="text-xl font-bold tracking-tight">Methodology</DialogTitle>
          <DialogDescription>
            How the simulator models a counterforce strike, following Davis &amp; Schilling (1973)
            and Lawrence (2026).
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="min-h-0">
          <div className="grid gap-5 p-6 text-sm leading-relaxed">
            <p className="rounded-md bg-maroon/8 p-3 text-maroon">
              <strong>This tool illustrates uncertainty. It does not predict real outcomes.</strong>{' '}
              Following Lawrence (2026), its purpose is to show how much the result of a strike
              depends on assumptions and on chance, not to forecast what an actual attack would
              achieve.
            </p>

            <Section title="Accuracy: the CEP">
              Each warhead is aimed at the centre of a silo. Where it actually lands is random: the
              miss in each direction follows a bell curve (a circular Gaussian). The{' '}
              <em>circular error probable</em> (CEP) is the radius within which half of all warheads
              land. Mathematically, the spread in each direction is σ = CEP / 1.1774.
            </Section>

            <Section title="Damage: the lethal radius">
              A silo is destroyed if any warhead detonates within the <em>lethal radius</em> (LR) of
              it, and survives otherwise. This is the &ldquo;cookie-cutter&rdquo; rule both papers
              use. It applies to every silo, so a warhead aimed at one silo can destroy a neighbour.
              Combining it with the CEP gives the single-shot kill probability, SSKP = 1 −
              0.5^((LR/CEP)²). The optional helper computes LR from yield and silo hardness with the
              Davis &amp; Schilling formula. That formula gives about 169 m for a 100 kt warhead
              against 2,000 psi, while Lawrence uses 179 m. Sources differ, so you can enter LR
              directly.
            </Section>

            <Section title="Reliability: two kinds of failure">
              <ul className="ml-4 list-disc space-y-1">
                <li>
                  <strong>Delivery reliability (R_del)</strong>: the missile can fail during boost.
                  Then no warhead arrives at all. These failures are counted but not drawn on the
                  map.
                </li>
                <li>
                  <strong>Warhead reliability (R_wh)</strong>: a warhead that arrives can fail to
                  detonate. It lands at its impact point but does nothing, and is drawn as a hollow
                  circle.
                </li>
              </ul>
              <p className="mt-2">
                Overall reliability is OAR = R_del · R_wh, and the terminal kill probability per
                warhead is TKP = R_del · R_wh · SSKP. Defaults are Lawrence&apos;s Table 1 values
                (0.95 each).
              </p>
            </Section>

            <Section title="Two different attacker capabilities">
              <ul className="ml-4 list-disc space-y-1">
                <li>
                  <strong>Reprogramming (within a volley)</strong>: from Davis &amp; Schilling. If
                  on, boost failures are detected and replaced from reserves before warheads are
                  assigned, so only the A = N − failures surviving warheads (on average N · R_del)
                  are spread over the targets. Those can then fail only by warhead reliability, so
                  TKP = R_wh · SSKP.
                </li>
                <li>
                  <strong>Damage assessment (between volleys)</strong>: if the attacker knows which
                  silos were destroyed, the next volley targets only survivors. This is{' '}
                  <em>perfect</em> damage assessment. Real assessment would be slower and less
                  certain. If it&apos;s off, every volley targets every silo, wasting warheads on
                  silos that are already destroyed.
                </li>
              </ul>
            </Section>

            <Section title="Allocation">
              Each volley&apos;s warheads are spread as evenly as possible over the targets: every
              target gets the same number, and the remainder go to randomly chosen targets.
            </Section>

            <Section title="The analytic comparison">
              Lawrence&apos;s &ldquo;standard reductionist analysis&rdquo; computes the expected
              number of surviving silos, x̄ = Σ (1 − TKP)^nᵢ, plus any untargeted silos. The chart
              shows it two ways:
              <ul className="mt-1 ml-4 list-disc space-y-1">
                <li>
                  <strong>Dashed</strong>: per volley, using that volley&apos;s actual allocation
                  and the silos actually alive going in.
                </li>
                <li>
                  <strong>Dotted</strong>: one up-front prediction for the whole campaign, computed
                  before any firing, with perfect damage assessment and an even split each volley.
                </li>
              </ul>
              <p className="mt-2">
                Comparing simulated outcomes with that single up-front number is the point of
                Lawrence&apos;s paper: the reductionist figure hides how widely real outcomes can
                vary.
              </p>
            </Section>

            <Section title="Monte Carlo trials">
              One animated run is a single draw. &ldquo;Run N trials&rdquo; repeats the whole
              campaign many times, each with its own random seed derived from yours, and reports the
              mean ± standard deviation of surviving silos, the range, and a histogram, as Lawrence
              does. Surviving warheads = surviving silos × warheads per silo (default 3 for Chinese
              silos, per Lawrence Table 2 and the DoD estimate).
            </Section>

            <Section title="Not modelled yet">
              <ul className="ml-4 list-disc space-y-1">
                <li>Fratricide: warheads destroying or deflecting each other.</li>
                <li>Burst timing and second-shot windows.</li>
                <li>Non-Gaussian (e.g. fat-tailed) miss distributions.</li>
                <li>
                  Graded damage functions, such as the &ldquo;Sigma-20&rdquo; function Davis &amp;
                  Schilling mention.
                </li>
              </ul>
              <p className="mt-2">
                Lawrence&apos;s fratricide and fat-tail models are in the paper&apos;s supplementary
                material and are not implemented here.
              </p>
            </Section>

            <Section title="Data">
              Silo coordinates marked <strong>Placeholder data</strong> are unverified. Don&apos;t
              treat them as confirmed silo locations. Each base&apos;s source is listed in the Data
              sources card.
            </Section>

            <Section title="References">
              <ul className="ml-4 list-disc space-y-1">
                {Object.values(REFERENCES).map((r) => (
                  <li key={r.short}>{r.full}</li>
                ))}
              </ul>
            </Section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-1">
      <h3 className="font-semibold">{title}</h3>
      <div className="text-muted-foreground [&_strong]:text-foreground">{children}</div>
    </section>
  )
}
