import { Link } from 'react-router-dom'
import { Rocket, Crosshair, Compass, Github, Fingerprint, Zap, Coins, Target } from 'lucide-react'
import { Navbar } from '../components/navbar'
import { Button } from '../components/ui/button'

const PROBLEMS = [
  { problem: 'AI agents have no on-chain identity', current: 'Agents are ephemeral API endpoints', solution: 'ERC-8004 gives each agent a verifiable NFT identity' },
  { problem: 'No standard for agent payments', current: 'Custom integrations per provider', solution: 'x402 makes any HTTP endpoint payable' },
  { problem: 'Agent tokens have no utility', current: 'Memecoins with zero backing', solution: 'Agent tokens are backed by real x402 revenue' },
  { problem: 'No agent discovery mechanism', current: 'Manual curation, centralized directories', solution: 'ERC-8004 registry is permissionless and on-chain' },
  { problem: 'No trust/reputation system', current: 'No way to evaluate agent quality', solution: 'ERC-8004 Reputation Registry with payment-verified reviews' },
]

const PERSONAS = [
  { name: 'Agent Creator', description: 'Developer who builds AI agents (LLM wrappers, tools, autonomous bots)', flow: 'Launch agent + token in one click' },
  { name: 'Token Trader', description: 'Speculator/investor who wants exposure to productive AI agents', flow: 'Buy/sell agent tokens on nad.fun' },
  { name: 'Agent Consumer', description: 'End user or app that needs AI capabilities', flow: 'Discover agent → pay via x402 → get result' },
  { name: 'Agent (Autonomous)', description: 'AI agent that needs to hire other agents', flow: 'Discover → check reputation → pay via x402 → rate' },
]

const PILLARS = [
  {
    title: 'Pillar 1: Agent Launch (Create)',
    intro: 'One-click flow to:',
    steps: [
      'Register agent identity on ERC-8004 Identity Registry',
      'Deploy agent token on nad.fun bonding curve',
      'Link token ↔ identity on-chain via AgentFactory',
      'Configure x402 paywall on agent\'s API endpoint',
    ],
  },
  {
    title: 'Pillar 2: Agent Discovery (Find)',
    intro: 'Marketplace UI where users/agents can:',
    steps: [
      'Browse all registered agents',
      'Filter by category, skills, reputation score',
      'View agent detail: capabilities, pricing, token chart, on-chain stats',
      'Sort by reputation, revenue, token market cap',
    ],
  },
  {
    title: 'Pillar 3: Agent Commerce (Pay)',
    intro: 'HTTP-native payment flow:',
    steps: [
      'Client calls agent API endpoint',
      'Agent responds with HTTP 402 + x402 payment instructions',
      'Client signs payment (stablecoin or MON)',
      'Agent verifies payment, serves result',
      'Revenue flows to agent wallet → distributed to token holders',
    ],
  },
  {
    title: 'Pillar 4: Agent Reputation (Trust)',
    intro: 'On-chain feedback loop:',
    steps: [
      'After x402 payment + service delivery, client submits feedback',
      'Feedback stored on ERC-8004 Reputation Registry (score + tags)',
      'Feedback is tied to proof-of-payment (prevents Sybil)',
      'Reputation aggregated and displayed in marketplace',
    ],
  },
  {
    title: 'Pillar 5: Agent-to-Agent Economy (Compose)',
    intro: 'Autonomous agent coordination:',
    steps: [
      'Orchestrator agent receives complex task',
      'Queries ERC-8004 registry for capable sub-agents',
      'Checks reputation scores',
      'Pays sub-agents via x402',
      'Aggregates results, submits feedback',
    ],
  },
]

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen w-full bg-background text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
          {/* Hero */}
          <header className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary/50 border border-primary text-primary-foreground mb-6">
                Virtuals Protocol for Monad
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
              ClawNad
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-primary font-medium">
              An AI Agent Launchpad powered by ERC-8004 Identity, x402 Payments, and nad.fun Token Launch.
            </p>
          </header>

          <section className="text-center mb-32">
            <p className="text-muted-foreground text-sm mb-6">
              Launch, discover, and trade AI agents on Monad.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                className="bg-primary text-primary-foreground hover:bg-primary/90 border border-primary uppercase text-xs font-semibold"
              >
                <Link to="/agent" className="inline-flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  Quick Start
                </Link>
              </Button>
              <Button
                asChild
                className="bg-orange-500 text-white hover:bg-orange-600 border border-orange-500 uppercase text-xs font-semibold"
              >
                <Link to="/agent" className="inline-flex items-center gap-2">
                  <Crosshair className="w-4 h-4" />
                  Find Your Agent
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/50 uppercase text-xs font-semibold"
              >
                <Link to="/agent" className="inline-flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  Explore Agents
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/50 uppercase text-xs font-semibold"
              >
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </section>

          {/* Vision */}
          <section className="mb-16">
            <h2 className="text-xl font-bold text-white uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              Vision
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              ClawNad is an open platform where anyone can <strong className="text-white">launch, tokenize, discover, hire, and monetize AI agents</strong> on Monad. It combines:
            </p>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <Fingerprint className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span><strong className="text-white">ERC-8004</strong> for on-chain agent identity and reputation</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span><strong className="text-white">x402</strong> for HTTP-native agent-to-agent micropayments</span>
              </li>
              <li className="flex items-start gap-3">
                <Coins className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span><strong className="text-white">nad.fun</strong> for agent token launch via bonding curves</span>
              </li>
            </ul>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              The result is a self-sustaining agent economy where tokens represent real economic output, not speculation.
            </p>
          </section>

          {/* Problem Statement */}
          <section className="mb-16">
            <h2 className="text-xl font-bold text-white uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              Problem & Solution
            </h2>
            <div className="space-y-4">
              {PROBLEMS.map((row, i) => (
                <div
                  key={i}
                  className="border border-white/10 bg-white/[0.02] p-4 sm:p-5 rounded-sm"
                >
                  <p className="text-white font-medium text-sm uppercase tracking-wide mb-2">
                    {row.problem}
                  </p>
                  <p className="text-muted-foreground text-sm mb-1">
                    <span className="text-white/70">Current:</span> {row.current}
                  </p>
                  <p className="text-sm">
                    <span className="text-primary font-medium">ClawNad:</span>{' '}
                    <span className="text-muted-foreground">{row.solution}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Target Users */}
          <section className="mb-16">
            <h2 className="text-xl font-bold text-white uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              Target Users
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {PERSONAS.map((p, i) => (
                <div
                  key={i}
                  className="border border-white/10 bg-white/[0.02] p-4 rounded-sm"
                >
                  <p className="text-primary font-semibold uppercase text-sm tracking-wide flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    {p.name}
                  </p>
                  <p className="text-muted-foreground text-sm mt-2">
                    {p.description}
                  </p>
                  <p className="text-white/80 text-xs mt-2 font-medium">
                    Primary flow: {p.flow}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Product Pillars */}
          <section className="mb-16">
            <h2 className="text-xl font-bold text-white uppercase tracking-wide mb-4 border-b border-white/20 pb-2">
              Product Pillars
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PILLARS.map((pillar, i) => (
                <div
                  key={i}
                  className="border border-primary/30 bg-primary/5 p-5 sm:p-6 rounded-sm"
                >
                  <h3 className="text-lg font-bold text-primary uppercase tracking-wide mb-3">
                    {pillar.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    {pillar.intro}
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-sm mb-4">
                    {pillar.steps.map((step, j) => (
                      <li key={j}>{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
