import { useState } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Wallet, Send, Loader2, DollarSign, AlertCircle, FileCode, Bot, FileText } from 'lucide-react'
import { toast } from 'sonner'
import type { Agent } from '@/types/agent'
import { fetchWithPayment, detectServiceType, AGENT_SERVICES, type AgentServiceType } from '@/lib/x402'

interface TryAgentTabProps {
  agent: Pick<Agent, 'endpoint'>
}

type Status = 'idle' | 'sending' | 'signing' | 'processing' | 'done' | 'error'

// --- Response types ---

interface SummaryResponse {
  data: {
    agentId: number
    summary: string
    inputLength: number
    model: string
  }
}

interface AuditResponse {
  data: {
    agentId: number
    audit: string
    language: string
    codeLength: number
    model: string
  }
}

interface OrchestratorStep {
  step: number
  agent: string
  action: string
  result: string
}

interface OrchestratorResponse {
  data: {
    agentId: number
    task: string
    plan: string
    steps: OrchestratorStep[]
    finalResult: string
    model: string
  }
}

export function TryAgentTab({ agent }: TryAgentTabProps) {
  const { isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { openConnectModal } = useConnectModal()

  const serviceType = detectServiceType(agent.endpoint || '')

  if (!serviceType) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-10 h-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Service not available</p>
        <p className="text-xs text-muted-foreground/70 mt-1">This agent does not expose a supported service endpoint.</p>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Wallet className="w-10 h-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Connect wallet to try this agent</p>
        <p className="text-xs text-muted-foreground/70 mt-1 mb-4">
          Agent services require a micropayment ({AGENT_SERVICES[serviceType].price} USDC)
        </p>
        <button
          type="button"
          onClick={() => openConnectModal?.()}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold uppercase hover:bg-primary/90 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  const service = AGENT_SERVICES[serviceType]

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2 mb-3 flex items-center gap-2">
          <Bot className="w-3.5 h-3.5" />
          Try {service.label}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Each request costs {service.price} USDC (paid via x402 micropayment). Your wallet will prompt you to sign.
        </p>
      </section>

      {serviceType === 'summary' && <SummaryForm walletClient={walletClient!} service={service} />}
      {serviceType === 'code-audit' && <AuditForm walletClient={walletClient!} service={service} />}
      {serviceType === 'orchestrator' && <OrchestratorForm walletClient={walletClient!} service={service} />}
    </div>
  )
}

// --- Summary Form ---

function SummaryForm({ walletClient, service }: { walletClient: NonNullable<ReturnType<typeof useWalletClient>['data']>; service: typeof AGENT_SERVICES['summary'] }) {
  const [text, setText] = useState('')
  const [maxLength, setMaxLength] = useState('500')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<SummaryResponse['data'] | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error('Please enter text to summarize')
      return
    }

    setStatus('sending')
    setError('')
    setResult(null)

    try {
      setStatus('signing')
      const response = await fetchWithPayment<SummaryResponse>(
        service.actionPath,
        walletClient,
        { text: text.trim(), maxLength: Number(maxLength) || undefined },
      )
      setStatus('done')
      setResult(response.data)
      toast.success('Summary generated!')
    } catch (err) {
      setStatus('error')
      const message = err instanceof Error ? err.message : 'Request failed'
      setError(message)
      toast.error(message)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Text to summarize</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text here..."
          rows={6}
          className="w-full bg-muted/30 border border-border text-sm text-white placeholder:text-muted-foreground/50 p-3 focus:outline-none focus:border-primary resize-y"
          disabled={status === 'signing' || status === 'sending'}
        />
        <div className="flex items-center gap-3 mt-2">
          <label className="text-xs text-muted-foreground">Max length:</label>
          <input
            type="number"
            value={maxLength}
            onChange={(e) => setMaxLength(e.target.value)}
            className="w-20 bg-muted/30 border border-border text-xs text-white p-1.5 focus:outline-none focus:border-primary"
            disabled={status === 'signing' || status === 'sending'}
          />
        </div>
      </div>

      <SubmitButton status={status} onClick={handleSubmit} price={service.price} />

      {error && <ErrorDisplay message={error} />}
      {result && (
        <ResultCard>
          <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{result.summary}</p>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/30 text-[10px] text-muted-foreground">
            <span>Input: {result.inputLength} chars</span>
            <span>Model: {result.model}</span>
          </div>
        </ResultCard>
      )}
    </div>
  )
}

// --- Code Audit Form ---

function AuditForm({ walletClient, service }: { walletClient: NonNullable<ReturnType<typeof useWalletClient>['data']>; service: typeof AGENT_SERVICES['code-audit'] }) {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('solidity')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<AuditResponse['data'] | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please enter code to audit')
      return
    }

    setStatus('sending')
    setError('')
    setResult(null)

    try {
      setStatus('signing')
      const response = await fetchWithPayment<AuditResponse>(
        service.actionPath,
        walletClient,
        { code: code.trim(), language: language || undefined },
      )
      setStatus('done')
      setResult(response.data)
      toast.success('Audit complete!')
    } catch (err) {
      setStatus('error')
      const message = err instanceof Error ? err.message : 'Request failed'
      setError(message)
      toast.error(message)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">
          <FileCode className="w-3.5 h-3.5 inline mr-1" />
          Code to audit
        </label>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your smart contract or code here..."
          rows={10}
          className="w-full bg-muted/30 border border-border text-sm text-white placeholder:text-muted-foreground/50 p-3 font-mono focus:outline-none focus:border-primary resize-y"
          disabled={status === 'signing' || status === 'sending'}
        />
        <div className="flex items-center gap-3 mt-2">
          <label className="text-xs text-muted-foreground">Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-muted/30 border border-border text-xs text-white p-1.5 focus:outline-none focus:border-primary"
            disabled={status === 'signing' || status === 'sending'}
          >
            <option value="solidity">Solidity</option>
            <option value="rust">Rust</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
          </select>
        </div>
      </div>

      <SubmitButton status={status} onClick={handleSubmit} price={service.price} />

      {error && <ErrorDisplay message={error} />}
      {result && (
        <ResultCard>
          <div className="text-sm text-white leading-relaxed whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
            {result.audit}
          </div>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/30 text-[10px] text-muted-foreground">
            <span>Language: {result.language}</span>
            <span>Code: {result.codeLength} chars</span>
            <span>Model: {result.model}</span>
          </div>
        </ResultCard>
      )}
    </div>
  )
}

// --- Orchestrator Form ---

function OrchestratorForm({ walletClient, service }: { walletClient: NonNullable<ReturnType<typeof useWalletClient>['data']>; service: typeof AGENT_SERVICES['orchestrator'] }) {
  const [task, setTask] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<OrchestratorResponse['data'] | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!task.trim()) {
      toast.error('Please enter a task')
      return
    }

    setStatus('sending')
    setError('')
    setResult(null)

    try {
      setStatus('signing')
      const response = await fetchWithPayment<OrchestratorResponse>(
        service.actionPath,
        walletClient,
        { task: task.trim() },
      )
      setStatus('done')
      setResult(response.data)
      toast.success('Task executed!')
    } catch (err) {
      setStatus('error')
      const message = err instanceof Error ? err.message : 'Request failed'
      setError(message)
      toast.error(message)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">
          <FileText className="w-3.5 h-3.5 inline mr-1" />
          Task description
        </label>
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Describe the task you want the orchestrator to perform..."
          rows={4}
          className="w-full bg-muted/30 border border-border text-sm text-white placeholder:text-muted-foreground/50 p-3 focus:outline-none focus:border-primary resize-y"
          disabled={status === 'signing' || status === 'sending'}
        />
      </div>

      <SubmitButton status={status} onClick={handleSubmit} price={service.price} />

      {error && <ErrorDisplay message={error} />}
      {result && (
        <ResultCard>
          {/* Plan */}
          <div className="mb-4">
            <h4 className="text-xs font-bold uppercase text-primary mb-1.5">Plan</h4>
            <p className="text-sm text-white/80">{result.plan}</p>
          </div>

          {/* Steps */}
          {result.steps.length > 0 && (
            <div className="mb-4 space-y-2">
              <h4 className="text-xs font-bold uppercase text-primary mb-1.5">Execution Steps</h4>
              {result.steps.map((step) => (
                <div key={step.step} className="border border-border/30 bg-muted/20 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5">
                      Step {step.step}
                    </span>
                    <span className="text-xs text-muted-foreground">{step.agent}</span>
                  </div>
                  <p className="text-xs text-white/70 mb-1">{step.action}</p>
                  <p className="text-sm text-white whitespace-pre-wrap">{step.result}</p>
                </div>
              ))}
            </div>
          )}

          {/* Final result */}
          <div>
            <h4 className="text-xs font-bold uppercase text-primary mb-1.5">Final Result</h4>
            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{result.finalResult}</p>
          </div>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/30 text-[10px] text-muted-foreground">
            <span>Steps: {result.steps.length}</span>
            <span>Model: {result.model}</span>
          </div>
        </ResultCard>
      )}
    </div>
  )
}

// --- Shared UI Components ---

function SubmitButton({ status, onClick, price }: { status: Status; onClick: () => void; price: string }) {
  const isLoading = status === 'sending' || status === 'signing' || status === 'processing'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-bold uppercase hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {status === 'signing' ? 'Sign in wallet...' : 'Processing...'}
        </>
      ) : (
        <>
          <Send className="w-4 h-4" />
          Run Agent
          <span className="text-[10px] font-normal opacity-70 ml-1 inline-flex items-center gap-0.5">
            <DollarSign className="w-3 h-3" />
            {price} USDC
          </span>
        </>
      )}
    </button>
  )
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
      <AlertCircle className="w-4 h-4 inline mr-1.5" />
      {message}
    </div>
  )
}

function ResultCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-primary/30 bg-primary/5 p-4">
      <h4 className="text-xs font-bold uppercase text-primary mb-3">Result</h4>
      {children}
    </div>
  )
}
