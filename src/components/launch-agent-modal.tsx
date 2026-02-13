import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { X, ChevronRight, ChevronLeft, Rocket, Plus } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import { z } from 'zod'
import { launchSchema, LAUNCH_CATEGORIES } from '@/lib/launch-schema'

const STEPS = [
  { id: 1, label: 'Agent Info' },
  { id: 2, label: 'Services' },
  { id: 3, label: 'Token' },
  { id: 4, label: 'Review & Launch' },
]

export interface ServiceEntry {
  name: string
  endpoint: string
  version: string
  skills: string[]
  pricePerReq: string // stored as $0.00 for schema
}

export interface LaunchFormData {
  agentName: string
  description: string
  apiEndpoint: string
  category: string
  avatarImage: string
  services: ServiceEntry[]
  tokenName: string
  tokenSymbol: string
  tokenImage: string
  initialBuyMon: string
}

const defaultService: ServiceEntry = {
  name: '',
  endpoint: '',
  version: '1.0.0',
  skills: [],
  pricePerReq: '',
}

const defaultFormData: LaunchFormData = {
  agentName: '',
  description: '',
  apiEndpoint: '',
  category: '',
  avatarImage: '',
  services: [{ ...defaultService }],
  tokenName: '',
  tokenSymbol: '',
  tokenImage: '',
  initialBuyMon: '0',
}

type TxStatus = 'idle' | 'uploading' | 'signing' | 'confirming' | 'success'

export interface LaunchAgentModalProps {
  open: boolean
  onClose: () => void
}

const inputClass =
  'w-full h-10 px-3 bg-muted/50 border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary transition-colors'
const labelClass = 'block text-xs font-medium text-foreground mb-1.5'
const inputErrorClass = 'border-destructive focus:border-destructive'

const ACCEPT_IMAGES = 'image/png,image/jpeg,image/webp,image/gif'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** Build payload for zod from form data */
function toLaunchPayload(data: LaunchFormData) {
  return {
    name: data.agentName,
    description: data.description,
    endpoint: data.apiEndpoint,
    category: data.category as '' | 'nlp' | 'security' | 'orchestration' | 'defi' | 'data' | 'automation' | 'nft' | 'gaming',
    imageUri: data.avatarImage || undefined,
    services: data.services.map((s) => ({
      name: s.name,
      endpoint: s.endpoint,
      version: s.version || '1.0.0',
      skills: s.skills.length ? s.skills : [],
      price: s.pricePerReq.trim().startsWith('$') ? s.pricePerReq.trim() : `$${s.pricePerReq.trim() || '0'}`,
    })),
    tokenName: data.tokenName,
    tokenSymbol: data.tokenSymbol,
    tokenImageUri: data.tokenImage || undefined,
    initialBuyAmount: data.initialBuyMon || '0',
  }
}

/** Flatten zod errors to field path -> message */
function flattenZodErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const e of err.issues) {
    const key = e.path.join('.')
    if (key) out[key] = e.message
  }
  return out
}

const STEP_1_KEYS = ['name', 'description', 'endpoint', 'category', 'imageUri']
const STEP_2_PREFIX = 'services'
const STEP_3_KEYS = ['tokenName', 'tokenSymbol', 'tokenImageUri', 'initialBuyAmount']

function errorsForStep(step: number, errors: Record<string, string>): Record<string, string> {
  if (step === 1) return Object.fromEntries(Object.entries(errors).filter(([k]) => STEP_1_KEYS.includes(k)))
  if (step === 2) return Object.fromEntries(Object.entries(errors).filter(([k]) => k.startsWith(STEP_2_PREFIX)))
  if (step === 3) return Object.fromEntries(Object.entries(errors).filter(([k]) => STEP_3_KEYS.includes(k)))
  return errors
}

export function LaunchAgentModal({ open, onClose }: LaunchAgentModalProps) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<LaunchFormData>(defaultFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [txStatus, setTxStatus] = useState<TxStatus>('idle')
  const [launchResult, setLaunchResult] = useState<{ agentId?: string; tokenAddress?: string } | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [tokenUploading, setTokenUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const tokenInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setAvatarUploading(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      update({ avatarImage: dataUrl })
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleTokenFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setTokenUploading(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      update({ tokenImage: dataUrl })
    } finally {
      setTokenUploading(false)
    }
  }

  const update = (partial: Partial<LaunchFormData>) => {
    setData((d) => ({ ...d, ...partial }))
    setErrors((e) => {
      const next = { ...e }
      Object.keys(partial).forEach((k) => {
        if (k === 'agentName') delete next.name
        if (k === 'description') delete next.description
        if (k === 'apiEndpoint') delete next.endpoint
        if (k === 'category') delete next.category
        if (k === 'avatarImage') delete next.imageUri
        if (k === 'tokenName') delete next.tokenName
        if (k === 'tokenSymbol') delete next.tokenSymbol
        if (k === 'tokenImage') delete next.tokenImageUri
        if (k === 'initialBuyMon') delete next.initialBuyAmount
      })
      return next
    })
  }

  const addService = () => setData((d) => ({ ...d, services: [...d.services, { ...defaultService }] }))
  const updateService = (index: number, partial: Partial<ServiceEntry>) => {
    setData((d) => ({
      ...d,
      services: d.services.map((s, i) => (i === index ? { ...s, ...partial } : s)),
    }))
    setErrors((e) => {
      const next = { ...e }
      Object.keys(partial).forEach((key) => {
        const path = `services.${index}.${key === 'pricePerReq' ? 'price' : key}`
        delete next[path]
      })
      return next
    })
  }
  const removeService = (index: number) => {
    if (data.services.length <= 1) return
    setData((d) => ({ ...d, services: d.services.filter((_, i) => i !== index) }))
    setErrors((e) => {
      const next = { ...e }
      Object.keys(e).filter((k) => k.startsWith(`services.${index}`)).forEach((k) => delete next[k])
      return next
    })
  }

  const totalCostMon = 10 + 0.5 + (parseFloat(data.initialBuyMon) || 0)

  const validate = (): boolean => {
    const payload = toLaunchPayload(data)
    const result = launchSchema.safeParse(payload)
    if (result.success) {
      setErrors({})
      return true
    }
    const flat = flattenZodErrors(result.error)
    setErrors(flat)
    return false
  }

  const goNext = () => {
    if (!validate()) return
    setStep((s) => Math.min(4, s + 1))
  }

  const goBack = () => {
    setErrors({})
    setStep((s) => Math.max(1, s - 1))
  }

  const handleLaunch = async () => {
    if (!validate()) return
    setTxStatus('uploading')
    // TODO: Upload to IPFS, get agentUri, call /api/v1/agents/launch, sign tx
    await new Promise((r) => setTimeout(r, 800))
    setTxStatus('signing')
    await new Promise((r) => setTimeout(r, 600))
    setTxStatus('confirming')
    await new Promise((r) => setTimeout(r, 1000))
    setTxStatus('success')
    setLaunchResult({ agentId: '42', tokenAddress: '0xDe..7c' })
  }

  const resetAndClose = () => {
    setStep(1)
    setData(defaultFormData)
    setErrors({})
    setTxStatus('idle')
    setLaunchResult(null)
    onClose()
  }

  const stepErrors = errorsForStep(step, errors)
  const err = (key: string) => stepErrors[key] ?? ''

  return (
    <>
      <div
        className="fixed inset-0 z-[1000] bg-black/60"
        aria-hidden
        onClick={resetAndClose}
      />
      <div className="fixed left-1/2 top-1/2 z-[1001] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-hidden flex flex-col bg-background border border-border shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Launch Agent</h2>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-2 -m-2 text-muted-foreground hover:text-foreground outline-none focus:ring-2 focus:ring-primary rounded"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1 px-4 py-2 border-b border-border shrink-0 text-xs">
          {STEPS.map((s, i) => (
            <span key={s.id} className="flex items-center gap-1">
              <span
                className={cn(
                  'font-medium',
                  step === s.id ? 'text-primary' : step > s.id ? 'text-primary/80' : 'text-muted-foreground'
                )}
              >
                ({s.id}) {s.label}
              </span>
              {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </span>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* STEP 1: Agent Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2">
                Step 1: Agent Info
              </h3>
              <div>
                <label className={labelClass}>Agent Name *</label>
                <input
                  type="text"
                  className={cn(inputClass, err('name') && inputErrorClass)}
                  placeholder="e.g. SummaryBot"
                  value={data.agentName}
                  onChange={(e) => update({ agentName: e.target.value })}
                />
                {err('name') && <p className="text-xs text-destructive mt-1">{err('name')}</p>}
              </div>
              <div>
                <label className={labelClass}>Description *</label>
                <textarea
                  className={cn(inputClass, 'h-20 resize-y min-h-[80px]', err('description') && inputErrorClass)}
                  placeholder="AI-powered text summarization agent"
                  value={data.description}
                  onChange={(e) => update({ description: e.target.value })}
                  rows={3}
                />
                {err('description') && <p className="text-xs text-destructive mt-1">{err('description')}</p>}
              </div>
              <div>
                <label className={labelClass}>API Endpoint *</label>
                <input
                  type="url"
                  className={cn(inputClass, err('endpoint') && inputErrorClass)}
                  placeholder="https://summary.clawnad.dev"
                  value={data.apiEndpoint}
                  onChange={(e) => update({ apiEndpoint: e.target.value })}
                />
                {err('endpoint') && <p className="text-xs text-destructive mt-1">{err('endpoint')}</p>}
              </div>
              <div>
                <label className={labelClass}>Category *</label>
                <select
                  className={cn(inputClass, err('category') && inputErrorClass)}
                  value={data.category}
                  onChange={(e) => update({ category: e.target.value })}
                >
                  <option value="">Select...</option>
                  {LAUNCH_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {err('category') && <p className="text-xs text-destructive mt-1">{err('category')}</p>}
              </div>
              <div>
                <label className={labelClass}>Avatar Image</label>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept={ACCEPT_IMAGES}
                  className="hidden"
                  onChange={handleAvatarFile}
                />
                <div className="flex gap-2 items-start">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs shrink-0"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? 'Uploading…' : 'Upload'}
                  </Button>
                  <div className="flex-1 min-w-0 flex gap-2 items-center">
                    <input
                      type="text"
                      className={cn(inputClass, err('imageUri') && inputErrorClass)}
                      placeholder="or paste IPFS / image URL"
                      value={data.avatarImage.startsWith('data:') ? '' : data.avatarImage}
                      onChange={(e) => update({ avatarImage: e.target.value })}
                    />
                    {data.avatarImage && (
                      <div className="shrink-0 flex items-center gap-1">
                        {data.avatarImage.startsWith('data:') ? (
                          <img
                            src={data.avatarImage}
                            alt="Avatar"
                            className="w-10 h-10 rounded object-cover border border-border"
                          />
                        ) : (
                          <img
                            src={data.avatarImage}
                            alt="Avatar"
                            className="w-10 h-10 rounded object-cover border border-border"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                        )}
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => update({ avatarImage: '' })}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {err('imageUri') && <p className="text-xs text-destructive mt-1">{err('imageUri')}</p>}
              </div>
            </div>
          )}

          {/* STEP 2: Services */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2">
                Step 2: Services
              </h3>
              {err('services') && (
                <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2">
                  {err('services')}
                </p>
              )}
              {data.services.map((svc, i) => (
                <div key={i} className="border border-border p-3 space-y-3 bg-muted/20">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">Service #{i + 1}</span>
                    {data.services.length > 1 && (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => removeService(i)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Name *</label>
                    <input
                      type="text"
                      className={cn(inputClass, err(`services.${i}.name`) && inputErrorClass)}
                      placeholder="e.g. summarize"
                      value={svc.name}
                      onChange={(e) => updateService(i, { name: e.target.value })}
                    />
                    {err(`services.${i}.name`) && <p className="text-xs text-destructive mt-1">{err(`services.${i}.name`)}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Endpoint *</label>
                    <input
                      type="url"
                      className={cn(inputClass, err(`services.${i}.endpoint`) && inputErrorClass)}
                      placeholder="https://summary.../api/summarize"
                      value={svc.endpoint}
                      onChange={(e) => updateService(i, { endpoint: e.target.value })}
                    />
                    {err(`services.${i}.endpoint`) && <p className="text-xs text-destructive mt-1">{err(`services.${i}.endpoint`)}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Version</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="1.0.0"
                      value={svc.version}
                      onChange={(e) => updateService(i, { version: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Skills *</label>
                    <input
                      type="text"
                      className={cn(inputClass, err(`services.${i}.skills`) && inputErrorClass)}
                      placeholder="summarization, extraction (comma or space)"
                      value={svc.skills.join(', ')}
                      onChange={(e) =>
                        updateService(i, {
                          skills: e.target.value.split(/[\s,]+/).filter(Boolean),
                        })
                      }
                    />
                    {err(`services.${i}.skills`) && <p className="text-xs text-destructive mt-1">{err(`services.${i}.skills`)}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Price per request * ($0.00)</label>
                    <input
                      type="text"
                      className={cn(inputClass, err(`services.${i}.price`) && inputErrorClass)}
                      placeholder="$0.001"
                      value={svc.pricePerReq}
                      onChange={(e) => updateService(i, { pricePerReq: e.target.value })}
                    />
                    {err(`services.${i}.price`) && <p className="text-xs text-destructive mt-1">{err(`services.${i}.price`)}</p>}
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="w-full gap-2" onClick={addService}>
                <Plus className="w-4 h-4" />
                Add Another Service
              </Button>
            </div>
          )}

          {/* STEP 3: Token */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2">
                Step 3: Token
              </h3>
              <div>
                <label className={labelClass}>Token Name *</label>
                <input
                  type="text"
                  className={cn(inputClass, err('tokenName') && inputErrorClass)}
                  placeholder="e.g. SummaryBot"
                  value={data.tokenName}
                  onChange={(e) => update({ tokenName: e.target.value })}
                />
                {err('tokenName') && <p className="text-xs text-destructive mt-1">{err('tokenName')}</p>}
              </div>
              <div>
                <label className={labelClass}>Token Symbol *</label>
                <input
                  type="text"
                  className={cn(inputClass, err('tokenSymbol') && inputErrorClass)}
                  placeholder="e.g. SUMM"
                  value={data.tokenSymbol}
                  onChange={(e) => update({ tokenSymbol: e.target.value.toUpperCase() })}
                />
                {err('tokenSymbol') && <p className="text-xs text-destructive mt-1">{err('tokenSymbol')}</p>}
              </div>
              <div>
                <label className={labelClass}>Token Image</label>
                <input
                  ref={tokenInputRef}
                  type="file"
                  accept={ACCEPT_IMAGES}
                  className="hidden"
                  onChange={handleTokenFile}
                />
                <div className="flex gap-2 items-start">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs shrink-0"
                    onClick={() => tokenInputRef.current?.click()}
                    disabled={tokenUploading}
                  >
                    {tokenUploading ? 'Uploading…' : 'Upload'}
                  </Button>
                  <div className="flex-1 min-w-0 flex gap-2 items-center">
                    <input
                      type="text"
                      className={cn(inputClass, err('tokenImageUri') && inputErrorClass)}
                      placeholder="or paste IPFS / image URL"
                      value={data.tokenImage.startsWith('data:') ? '' : data.tokenImage}
                      onChange={(e) => update({ tokenImage: e.target.value })}
                    />
                    {data.tokenImage && (
                      <div className="shrink-0 flex items-center gap-1">
                        {data.tokenImage.startsWith('data:') ? (
                          <img
                            src={data.tokenImage}
                            alt="Token"
                            className="w-10 h-10 rounded object-cover border border-border"
                          />
                        ) : (
                          <img
                            src={data.tokenImage}
                            alt="Token"
                            className="w-10 h-10 rounded object-cover border border-border"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                        )}
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => update({ tokenImage: '' })}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {err('tokenImageUri') && <p className="text-xs text-destructive mt-1">{err('tokenImageUri')}</p>}
              </div>
              <div>
                <label className={labelClass}>Initial Buy (MON)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className={cn(inputClass, err('initialBuyAmount') && inputErrorClass)}
                  placeholder="0"
                  value={data.initialBuyMon}
                  onChange={(e) => update({ initialBuyMon: e.target.value })}
                />
                {err('initialBuyAmount') && <p className="text-xs text-destructive mt-1">{err('initialBuyAmount')}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: buy tokens at launch for yourself
                </p>
              </div>
              <div className="border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-foreground">
                <p className="font-medium mb-1">Launch costs</p>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  <li>10 MON (nad.fun deploy fee)</li>
                  <li>~0.5 MON gas</li>
                  <li>+ initial buy amount (if any)</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Launch */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2">
                Step 4: Review & Launch
              </h3>
              <div className="text-sm space-y-2">
                <p><span className="text-muted-foreground">Agent:</span> {data.agentName || '—'}</p>
                <p><span className="text-muted-foreground">Description:</span> {data.description ? `${data.description.slice(0, 50)}...` : '—'}</p>
                <p><span className="text-muted-foreground">Endpoint:</span> {data.apiEndpoint || '—'}</p>
                <p><span className="text-muted-foreground">Category:</span> {data.category || '—'}</p>
                <p className="text-muted-foreground mt-2">Services:</p>
                <ul className="list-disc list-inside ml-2">
                  {data.services.map((s, i) => (
                    <li key={i}>
                      {s.name || 'Unnamed'} {s.endpoint && `— ${s.pricePerReq || '?'}/req`}
                    </li>
                  ))}
                </ul>
                <p><span className="text-muted-foreground">Token:</span> ${data.tokenSymbol || '—'}</p>
                <p><span className="text-muted-foreground">Initial Buy:</span> {data.initialBuyMon || '0'} MON</p>
                <p className="font-bold text-primary mt-2">TOTAL COST: ~{totalCostMon.toFixed(1)} MON</p>
              </div>

              {txStatus !== 'idle' && (
                <div className="border border-border p-3 space-y-2 text-xs">
                  <p className="font-medium text-foreground">Transaction Status</p>
                  {txStatus === 'uploading' && <p className="text-muted-foreground">Uploading registration to IPFS...</p>}
                  {txStatus === 'signing' && <p className="text-muted-foreground">Waiting for wallet signature...</p>}
                  {txStatus === 'confirming' && <p className="text-muted-foreground">Confirming on Monad...</p>}
                  {txStatus === 'success' && launchResult && (
                    <>
                      <p className="text-primary font-medium">Agent launched!</p>
                      <p>Agent ID: {launchResult.agentId}</p>
                      <p>Token: {launchResult.tokenAddress}</p>
                      <Button asChild variant="outline" size="sm" className="mt-2">
                        <Link to="/agent" onClick={resetAndClose}>View Agent →</Link>
                      </Button>
                    </>
                  )}
                </div>
              )}

              {txStatus === 'success' ? (
                <Button className="w-full" onClick={resetAndClose}>
                  Done
                </Button>
              ) : (
                <Button
                  className="w-full gap-2"
                  onClick={handleLaunch}
                  disabled={txStatus !== 'idle'}
                >
                  <Rocket className="w-4 h-4" />
                  Launch Agent — {totalCostMon.toFixed(1)} MON
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer: Back / Next */}
        {step < 4 && txStatus === 'idle' && (
          <div className="flex justify-between gap-2 border-t border-border px-4 py-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goBack}
              disabled={step === 1}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={goNext}
              className="gap-1"
            >
              {step === 3 ? 'Review & Launch' : `Next: ${STEPS[step].label}`}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
