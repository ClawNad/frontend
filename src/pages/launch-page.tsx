import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Rocket, Plus, X, Loader2 } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, decodeEventLog } from 'viem'
import { toast } from 'sonner'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { z } from 'zod'
import { launchSchema, LAUNCH_CATEGORIES } from '@/lib/launch-schema'
import { CONTRACTS, agentFactoryAbi, agentLaunchedEventAbi } from '@/lib/contracts'
import { api } from '@/lib/api'

const FORM_STEPS = [
  { id: 1, label: 'Agent Info' },
  { id: 2, label: 'Services' },
  { id: 3, label: 'Token' },
  { id: 4, label: 'Review & Launch' },
]

interface ServiceEntry {
  name: string
  endpoint: string
  version: string
  skills: string[]
  pricePerReq: string
}

interface LaunchFormData {
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

type TxStatus = 'idle' | 'uploading' | 'metadata' | 'salt' | 'signing' | 'confirming' | 'success' | 'error'

const inputClass =
  'w-full h-10 px-3 bg-muted/50 border border-border text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary transition-colors'
const labelClass = 'block text-xs font-medium text-foreground mb-1.5'
const inputErrorClass = 'border-destructive focus:border-destructive'
const ACCEPT_IMAGES = 'image/png,image/jpeg,image/webp,image/gif'

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

export default function LaunchPage() {
  const navigate = useNavigate()
  const { address: userAddress } = useAccount()

  const [step, setStep] = useState(1)
  const [data, setData] = useState<LaunchFormData>(defaultFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [txStatus, setTxStatus] = useState<TxStatus>('idle')
  const [launchResult, setLaunchResult] = useState<{ agentId?: string; tokenAddress?: string } | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [tokenFile, setTokenFile] = useState<File | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [tokenUploading, setTokenUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const tokenInputRef = useRef<HTMLInputElement>(null)

  const { writeContract, data: txHash, error: txError, reset: resetTx } = useWriteContract()
  const { isSuccess: txConfirmed, data: txReceipt } = useWaitForTransactionReceipt({ hash: txHash })

  // Handle tx confirmation
  useEffect(() => {
    if (txConfirmed && txReceipt) {
      setTxStatus('success')
      // Parse AgentLaunched event
      for (const log of txReceipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: agentLaunchedEventAbi,
            data: log.data,
            topics: log.topics,
          })
          if (decoded.eventName === 'AgentLaunched') {
            const args = decoded.args as { agentId: bigint; token: string }
            setLaunchResult({
              agentId: args.agentId.toString(),
              tokenAddress: args.token,
            })
            toast.success('Agent launched successfully!')
            return
          }
        } catch {
          // Not this event, continue
        }
      }
      setLaunchResult({ agentId: 'unknown' })
      toast.success('Agent launched!')
    }
  }, [txConfirmed, txReceipt])

  // Handle tx error
  useEffect(() => {
    if (txError) {
      setTxStatus('error')
      const msg = txError.message.includes('User rejected')
        ? 'Transaction cancelled'
        : txError.message.slice(0, 120)
      toast.error(msg)
    }
  }, [txError])

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setAvatarFile(file)
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
    setTokenFile(file)
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
  }

  const totalCostMon = 10 + 0.5 + (parseFloat(data.initialBuyMon) || 0)

  const validateStep = (s: number): boolean => {
    const payload = toLaunchPayload(data)

    if (s === 1) {
      const step1Schema = z.object({
        name: z.string().min(1, 'Agent name is required').max(100),
        description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
        endpoint: z.string().url('Invalid URL').refine((v) => v.startsWith('https://'), 'Endpoint must start with https://'),
        category: z.enum(['nlp', 'security', 'orchestration', 'defi', 'data', 'automation', 'nft', 'gaming']),
        imageUri: z.string().optional(),
      })
      const result = step1Schema.safeParse(payload)
      if (result.success) { setErrors((e) => { const next = { ...e }; STEP_1_KEYS.forEach((k) => delete next[k]); return next }); return true }
      setErrors((e) => ({ ...e, ...flattenZodErrors(result.error) }))
      return false
    }

    if (s === 2) {
      const step2Schema = z.object({
        services: z.array(z.object({
          name: z.string().min(1, 'Service name is required'),
          endpoint: z.string().url('Invalid URL'),
          version: z.string().default('1.0.0'),
          skills: z.array(z.string()).min(1, 'At least one skill is required'),
          price: z.string().regex(/^\$\d+\.?\d*$/, 'Price must be in format $0.00'),
        })).min(1, 'At least one service is required'),
      })
      const result = step2Schema.safeParse(payload)
      if (result.success) { setErrors((e) => { const next = { ...e }; Object.keys(next).filter((k) => k.startsWith(STEP_2_PREFIX)).forEach((k) => delete next[k]); return next }); return true }
      setErrors((e) => ({ ...e, ...flattenZodErrors(result.error) }))
      return false
    }

    if (s === 3) {
      const step3Schema = z.object({
        tokenName: z.string().min(1, 'Token name is required').max(50),
        tokenSymbol: z.string().min(2, 'Symbol must be 2–10 characters').max(10),
        tokenImageUri: z.string().optional(),
        initialBuyAmount: z.string().default('0'),
      })
      const result = step3Schema.safeParse(payload)
      if (result.success) { setErrors((e) => { const next = { ...e }; STEP_3_KEYS.forEach((k) => delete next[k]); return next }); return true }
      setErrors((e) => ({ ...e, ...flattenZodErrors(result.error) }))
      return false
    }

    // Step 4: validate everything
    const result = launchSchema.safeParse(payload)
    if (result.success) { setErrors({}); return true }
    setErrors(flattenZodErrors(result.error))
    return false
  }

  const validate = (): boolean => validateStep(4)

  const goNext = () => {
    if (!validateStep(step)) return
    setStep((s) => Math.min(4, s + 1))
  }
  const goBack = () => {
    setErrors({})
    setStep((s) => Math.max(1, s - 1))
  }

  const handleLaunch = async () => {
    if (!validate() || !userAddress) return

    try {
      // Step 1: Upload image if file exists
      setTxStatus('uploading')
      let imageUrl = ''
      const fileToUpload = avatarFile || tokenFile
      if (fileToUpload) {
        const uploadResult = await api.nadfun.uploadImage(fileToUpload)
        imageUrl = uploadResult.data.url
      } else if (data.avatarImage && !data.avatarImage.startsWith('data:')) {
        imageUrl = data.avatarImage
      } else if (data.tokenImage && !data.tokenImage.startsWith('data:')) {
        imageUrl = data.tokenImage
      }

      // Step 2: Create token metadata
      setTxStatus('metadata')
      const metadataResult = await api.nadfun.createMetadata({
        name: data.tokenName,
        symbol: data.tokenSymbol,
        description: data.description,
        image: imageUrl,
      })
      const tokenURI = metadataResult.data.url

      // Step 3: Get salt — deployer MUST be the AgentFactory address
      setTxStatus('salt')
      const saltResult = await api.nadfun.getSalt({
        name: data.tokenName,
        symbol: data.tokenSymbol,
        deployer: CONTRACTS.agentFactory, // AgentFactory address, NOT user wallet
        tokenURI,
      })
      const salt = saltResult.data.salt as `0x${string}`

      // Step 4: Single transaction — launchAgent
      setTxStatus('signing')
      const initialBuy = parseEther(data.initialBuyMon || '0')
      const deployFee = parseEther('10')
      const totalValue = deployFee + initialBuy

      const agentURI = data.apiEndpoint // Use endpoint as agentURI for MVP

      writeContract({
        address: CONTRACTS.agentFactory,
        abi: agentFactoryAbi,
        functionName: 'launchAgent',
        args: [
          {
            agentURI,
            endpoint: data.apiEndpoint,
            tokenName: data.tokenName,
            tokenSymbol: data.tokenSymbol,
            tokenURI,
            initialBuyAmount: initialBuy,
            salt,
          },
        ],
        value: totalValue,
      })

      setTxStatus('confirming')
    } catch (err) {
      setTxStatus('error')
      toast.error(err instanceof Error ? err.message : 'Launch failed')
    }
  }

  const resetForm = () => {
    setStep(1)
    setData(defaultFormData)
    setErrors({})
    setTxStatus('idle')
    setLaunchResult(null)
    setAvatarFile(null)
    setTokenFile(null)
    resetTx()
  }

  const stepErrors = errorsForStep(step, errors)
  const err = (key: string) => stepErrors[key] ?? ''
  const isLaunching = txStatus !== 'idle' && txStatus !== 'success' && txStatus !== 'error'

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-8">
          <h1 className="text-xl font-bold text-white uppercase tracking-wide mb-6">Launch Agent</h1>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-1 mb-6 text-xs">
            {FORM_STEPS.map((s, i) => (
              <span key={s.id} className="flex items-center gap-1">
                <span
                  className={cn(
                    'font-medium',
                    step === s.id ? 'text-primary' : step > s.id ? 'text-primary/80' : 'text-muted-foreground',
                  )}
                >
                  ({s.id}) {s.label}
                </span>
                {i < FORM_STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              </span>
            ))}
          </div>

          <div className="border border-border bg-card p-4 sm:p-6">
            {/* STEP 1: Agent Info */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2">Step 1: Agent Info</h3>
                <div>
                  <label className={labelClass}>Agent Name *</label>
                  <input type="text" className={cn(inputClass, err('name') && inputErrorClass)} placeholder="e.g. SummaryBot" value={data.agentName} onChange={(e) => update({ agentName: e.target.value })} />
                  {err('name') && <p className="text-xs text-destructive mt-1">{err('name')}</p>}
                </div>
                <div>
                  <label className={labelClass}>Description *</label>
                  <textarea className={cn(inputClass, 'h-20 resize-y min-h-[80px]', err('description') && inputErrorClass)} placeholder="AI-powered text summarization agent" value={data.description} onChange={(e) => update({ description: e.target.value })} rows={3} />
                  {err('description') && <p className="text-xs text-destructive mt-1">{err('description')}</p>}
                </div>
                <div>
                  <label className={labelClass}>API Endpoint *</label>
                  <input type="url" className={cn(inputClass, err('endpoint') && inputErrorClass)} placeholder="https://summary.clawnad.dev" value={data.apiEndpoint} onChange={(e) => update({ apiEndpoint: e.target.value })} />
                  {err('endpoint') && <p className="text-xs text-destructive mt-1">{err('endpoint')}</p>}
                </div>
                <div>
                  <label className={labelClass}>Category *</label>
                  <select className={cn(inputClass, err('category') && inputErrorClass)} value={data.category} onChange={(e) => update({ category: e.target.value })}>
                    <option value="">Select...</option>
                    {LAUNCH_CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                  </select>
                  {err('category') && <p className="text-xs text-destructive mt-1">{err('category')}</p>}
                </div>
                <div>
                  <label className={labelClass}>Avatar Image</label>
                  <input ref={avatarInputRef} type="file" accept={ACCEPT_IMAGES} className="hidden" onChange={handleAvatarFile} />
                  <div className="flex gap-2 items-start">
                    <Button type="button" variant="outline" size="sm" className="text-xs shrink-0" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading}>
                      {avatarUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                    <div className="flex-1 min-w-0 flex gap-2 items-center">
                      <input type="text" className={inputClass} placeholder="or paste image URL" value={data.avatarImage.startsWith('data:') ? '' : data.avatarImage} onChange={(e) => update({ avatarImage: e.target.value })} />
                      {data.avatarImage && (
                        <div className="shrink-0 flex items-center gap-1">
                          <img src={data.avatarImage} alt="Avatar" className="w-10 h-10 rounded object-cover border border-border" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          <button type="button" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => { update({ avatarImage: '' }); setAvatarFile(null) }}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Services */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2">Step 2: Services</h3>
                {data.services.map((svc, i) => (
                  <div key={i} className="border border-border p-3 space-y-3 bg-muted/20">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground">Service #{i + 1}</span>
                      {data.services.length > 1 && (
                        <button type="button" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => removeService(i)}>Remove</button>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>Name *</label>
                      <input type="text" className={cn(inputClass, err(`services.${i}.name`) && inputErrorClass)} placeholder="e.g. summarize" value={svc.name} onChange={(e) => updateService(i, { name: e.target.value })} />
                      {err(`services.${i}.name`) && <p className="text-xs text-destructive mt-1">{err(`services.${i}.name`)}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Endpoint *</label>
                      <input type="url" className={cn(inputClass, err(`services.${i}.endpoint`) && inputErrorClass)} placeholder="https://..." value={svc.endpoint} onChange={(e) => updateService(i, { endpoint: e.target.value })} />
                      {err(`services.${i}.endpoint`) && <p className="text-xs text-destructive mt-1">{err(`services.${i}.endpoint`)}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Version</label>
                      <input type="text" className={inputClass} placeholder="1.0.0" value={svc.version} onChange={(e) => updateService(i, { version: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Skills *</label>
                      <input type="text" className={cn(inputClass, err(`services.${i}.skills`) && inputErrorClass)} placeholder="summarization, extraction (comma-separated)" value={svc.skills.join(', ')} onChange={(e) => updateService(i, { skills: e.target.value.split(/[\s,]+/).filter(Boolean) })} />
                      {err(`services.${i}.skills`) && <p className="text-xs text-destructive mt-1">{err(`services.${i}.skills`)}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Price per request * ($0.00)</label>
                      <input type="text" className={cn(inputClass, err(`services.${i}.price`) && inputErrorClass)} placeholder="$0.001" value={svc.pricePerReq} onChange={(e) => updateService(i, { pricePerReq: e.target.value })} />
                      {err(`services.${i}.price`) && <p className="text-xs text-destructive mt-1">{err(`services.${i}.price`)}</p>}
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="w-full gap-2" onClick={addService}>
                  <Plus className="w-4 h-4" /> Add Another Service
                </Button>
              </div>
            )}

            {/* STEP 3: Token */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2">Step 3: Token</h3>
                <div>
                  <label className={labelClass}>Token Name *</label>
                  <input type="text" className={cn(inputClass, err('tokenName') && inputErrorClass)} placeholder="e.g. SummaryBot" value={data.tokenName} onChange={(e) => update({ tokenName: e.target.value })} />
                  {err('tokenName') && <p className="text-xs text-destructive mt-1">{err('tokenName')}</p>}
                </div>
                <div>
                  <label className={labelClass}>Token Symbol *</label>
                  <input type="text" className={cn(inputClass, err('tokenSymbol') && inputErrorClass)} placeholder="e.g. SUMM" value={data.tokenSymbol} onChange={(e) => update({ tokenSymbol: e.target.value.toUpperCase() })} />
                  {err('tokenSymbol') && <p className="text-xs text-destructive mt-1">{err('tokenSymbol')}</p>}
                </div>
                <div>
                  <label className={labelClass}>Token Image</label>
                  <input ref={tokenInputRef} type="file" accept={ACCEPT_IMAGES} className="hidden" onChange={handleTokenFile} />
                  <div className="flex gap-2 items-start">
                    <Button type="button" variant="outline" size="sm" className="text-xs shrink-0" onClick={() => tokenInputRef.current?.click()} disabled={tokenUploading}>
                      {tokenUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                    <div className="flex-1 min-w-0 flex gap-2 items-center">
                      <input type="text" className={inputClass} placeholder="or paste image URL" value={data.tokenImage.startsWith('data:') ? '' : data.tokenImage} onChange={(e) => update({ tokenImage: e.target.value })} />
                      {data.tokenImage && (
                        <div className="shrink-0 flex items-center gap-1">
                          <img src={data.tokenImage} alt="Token" className="w-10 h-10 rounded object-cover border border-border" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          <button type="button" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => { update({ tokenImage: '' }); setTokenFile(null) }}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Initial Buy (MON)</label>
                  <input type="number" min="0" step="any" className={cn(inputClass, err('initialBuyAmount') && inputErrorClass)} placeholder="0" value={data.initialBuyMon} onChange={(e) => update({ initialBuyMon: e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1">Optional: buy tokens at launch for yourself</p>
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
                <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2">Step 4: Review & Launch</h3>
                <div className="text-sm space-y-2">
                  <p><span className="text-muted-foreground">Agent:</span> {data.agentName || '—'}</p>
                  <p><span className="text-muted-foreground">Description:</span> {data.description ? `${data.description.slice(0, 80)}...` : '—'}</p>
                  <p><span className="text-muted-foreground">Endpoint:</span> {data.apiEndpoint || '—'}</p>
                  <p><span className="text-muted-foreground">Category:</span> {data.category || '—'}</p>
                  <p className="text-muted-foreground mt-2">Services:</p>
                  <ul className="list-disc list-inside ml-2">
                    {data.services.map((s, i) => (
                      <li key={i}>{s.name || 'Unnamed'} {s.endpoint && `— ${s.pricePerReq || '?'}/req`}</li>
                    ))}
                  </ul>
                  <p><span className="text-muted-foreground">Token:</span> ${data.tokenSymbol || '—'}</p>
                  <p><span className="text-muted-foreground">Initial Buy:</span> {data.initialBuyMon || '0'} MON</p>
                  <p className="font-bold text-primary mt-2">TOTAL COST: ~{totalCostMon.toFixed(1)} MON</p>
                </div>

                {/* Transaction status */}
                {txStatus !== 'idle' && (
                  <div className="border border-border p-3 space-y-2 text-xs">
                    <p className="font-medium text-foreground">Transaction Status</p>
                    {txStatus === 'uploading' && <p className="text-muted-foreground animate-pulse">Uploading image...</p>}
                    {txStatus === 'metadata' && <p className="text-muted-foreground animate-pulse">Creating token metadata...</p>}
                    {txStatus === 'salt' && <p className="text-muted-foreground animate-pulse">Getting deployment salt...</p>}
                    {txStatus === 'signing' && <p className="text-muted-foreground animate-pulse">Waiting for wallet signature...</p>}
                    {txStatus === 'confirming' && <p className="text-muted-foreground animate-pulse">Confirming on Monad...</p>}
                    {txStatus === 'error' && <p className="text-destructive">Transaction failed. Please try again.</p>}
                    {txStatus === 'success' && launchResult && (
                      <>
                        <p className="text-primary font-medium">Agent launched!</p>
                        {launchResult.agentId && launchResult.agentId !== 'unknown' && <p>Agent ID: #{launchResult.agentId}</p>}
                        {launchResult.tokenAddress && <p className="truncate">Token: {launchResult.tokenAddress}</p>}
                      </>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {!userAddress ? (
                  <p className="text-xs text-center text-muted-foreground py-2">Connect wallet to launch</p>
                ) : txStatus === 'success' ? (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={resetForm}>Launch Another</Button>
                    {launchResult?.agentId && launchResult.agentId !== 'unknown' && (
                      <Button className="flex-1" onClick={() => navigate(`/agents/${launchResult.agentId}`)}>
                        View Agent →
                      </Button>
                    )}
                  </div>
                ) : txStatus === 'error' ? (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => { setTxStatus('idle'); resetTx() }}>Reset</Button>
                    <Button className="flex-1 gap-2" onClick={handleLaunch}>
                      <Rocket className="w-4 h-4" /> Retry Launch
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full gap-2" onClick={handleLaunch} disabled={isLaunching}>
                    {isLaunching ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Launching...</>
                    ) : (
                      <><Rocket className="w-4 h-4" /> Launch Agent — {totalCostMon.toFixed(1)} MON</>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Footer: Back / Next */}
          {step < 4 && txStatus === 'idle' && (
            <div className="flex justify-between gap-2 mt-4">
              <Button type="button" variant="outline" size="sm" onClick={goBack} disabled={step === 1} className="gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              <Button type="button" size="sm" onClick={goNext} className="gap-1">
                {step === 3 ? 'Review & Launch' : `Next: ${FORM_STEPS[step].label}`}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
