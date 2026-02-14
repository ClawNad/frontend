import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Rocket, X, Loader2, Globe, Twitter } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { parseEther, decodeEventLog } from 'viem'
import { toast } from 'sonner'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { z } from 'zod'
import { launchSchema, LAUNCH_CATEGORIES } from '@/lib/launch-schema'
import { CONTRACTS, agentFactoryAbi, agentLaunchedEventAbi } from '@/lib/contracts'
import { api } from '@/lib/api'
import { buildAgentURI } from '@/lib/agent-uri'

const FORM_STEPS = [
  { id: 1, label: 'Agent Info' },
  { id: 2, label: 'Review & Launch' },
]

interface LaunchFormData {
  agentName: string
  description: string
  persona: string
  category: string
  avatarImage: string
  tokenSymbol: string
  pricePerReq: string
  website: string
  twitter: string
  initialBuyMon: string
}

const defaultFormData: LaunchFormData = {
  agentName: '',
  description: '',
  persona: '',
  category: '',
  avatarImage: '',
  tokenSymbol: '',
  pricePerReq: '',
  website: '',
  twitter: '',
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
    persona: data.persona || undefined,
    category: data.category as '' | 'nlp' | 'security' | 'orchestration' | 'defi' | 'data' | 'automation' | 'nft' | 'gaming',
    imageUri: data.avatarImage || undefined,
    tokenSymbol: data.tokenSymbol,
    pricePerReq: data.pricePerReq || undefined,
    website: data.website || undefined,
    twitter: data.twitter || undefined,
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

const STEP_1_KEYS = ['name', 'description', 'persona', 'category', 'imageUri', 'tokenSymbol', 'pricePerReq', 'website', 'twitter', 'initialBuyAmount']

export default function LaunchPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { address: userAddress } = useAccount()

  const [step, setStep] = useState(1)
  const [data, setData] = useState<LaunchFormData>(defaultFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [txStatus, setTxStatus] = useState<TxStatus>('idle')
  const [launchResult, setLaunchResult] = useState<{ agentId?: string; tokenAddress?: string } | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const { writeContract, data: txHash, error: txError, reset: resetTx } = useWriteContract()
  const { isSuccess: txConfirmed, data: txReceipt } = useWaitForTransactionReceipt({ hash: txHash })

  // Handle tx confirmation
  useEffect(() => {
    if (txConfirmed && txReceipt) {
      setTxStatus('success')
      let foundAgentId: string | undefined
      for (const log of txReceipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: agentLaunchedEventAbi,
            data: log.data,
            topics: log.topics,
          })
          if (decoded.eventName === 'AgentLaunched') {
            const args = decoded.args as { agentId: bigint; token: string }
            foundAgentId = args.agentId.toString()
            setLaunchResult({
              agentId: foundAgentId,
              tokenAddress: args.token,
            })
            toast.success('Agent launched successfully!')
            break
          }
        } catch {
          // Not this event, continue
        }
      }
      if (!foundAgentId) {
        setLaunchResult({ agentId: 'unknown' })
        toast.success('Agent launched!')
      }

      // Invalidate agents list so the new agent appears, then auto-navigate
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      if (foundAgentId) {
        setTimeout(() => {
          navigate(`/agents/${foundAgentId}`)
        }, 3000)
      }
    }
  }, [txConfirmed, txReceipt, queryClient, navigate])

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

  const update = (partial: Partial<LaunchFormData>) => {
    setData((d) => ({ ...d, ...partial }))
    setErrors((e) => {
      const next = { ...e }
      Object.keys(partial).forEach((k) => {
        if (k === 'agentName') delete next.name
        if (k === 'description') delete next.description
        if (k === 'persona') delete next.persona
        if (k === 'category') delete next.category
        if (k === 'avatarImage') delete next.imageUri
        if (k === 'tokenSymbol') delete next.tokenSymbol
        if (k === 'pricePerReq') delete next.pricePerReq
        if (k === 'website') delete next.website
        if (k === 'twitter') delete next.twitter
        if (k === 'initialBuyMon') delete next.initialBuyAmount
      })
      return next
    })
  }

  const totalCostMon = 10 + 0.5 + (parseFloat(data.initialBuyMon) || 0)

  const validateStep = (s: number): boolean => {
    const payload = toLaunchPayload(data)

    if (s === 1) {
      const step1Schema = z.object({
        name: z.string().min(1, 'Agent name is required').max(100),
        description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
        category: z.enum(['nlp', 'security', 'orchestration', 'defi', 'data', 'automation', 'nft', 'gaming']),
        imageUri: z.string().optional(),
        tokenSymbol: z.string().min(2, 'Symbol must be 2–10 characters').max(10),
        pricePerReq: z.string().regex(/^\d+\.?\d*$/, 'Price must be a number (e.g. 0.001)').optional().or(z.literal('')).or(z.undefined()),
        website: z.string().url('Invalid URL').optional().or(z.literal('')).or(z.undefined()),
        twitter: z.string().optional(),
        initialBuyAmount: z.string().default('0'),
      })
      const result = step1Schema.safeParse(payload)
      if (result.success) { setErrors((e) => { const next = { ...e }; STEP_1_KEYS.forEach((k) => delete next[k]); return next }); return true }
      setErrors((e) => ({ ...e, ...flattenZodErrors(result.error) }))
      return false
    }

    // Step 2: validate everything
    const result = launchSchema.safeParse(payload)
    if (result.success) { setErrors({}); return true }
    setErrors(flattenZodErrors(result.error))
    return false
  }

  const validate = (): boolean => validateStep(2)

  const goNext = () => {
    if (!validateStep(step)) return
    setStep(2)
  }
  const goBack = () => {
    setErrors({})
    setStep(1)
  }

  const handleLaunch = async () => {
    if (!validate() || !userAddress) return

    try {
      // Step 1: Upload image if file exists
      setTxStatus('uploading')
      let imageUrl = ''
      if (avatarFile) {
        const uploadResult = await api.nadfun.uploadImage(avatarFile)
        imageUrl = uploadResult.data.url
      } else if (data.avatarImage && !data.avatarImage.startsWith('data:')) {
        imageUrl = data.avatarImage
      }

      // Step 2: Create token metadata — use agentName as tokenName
      setTxStatus('metadata')
      const metadataResult = await api.nadfun.createMetadata({
        name: data.agentName,
        symbol: data.tokenSymbol,
        description: data.description,
        image: imageUrl,
        website: data.website || undefined,
        twitter: data.twitter && data.twitter.startsWith('https://x.com/') ? data.twitter : undefined,
      })
      const tokenURI = metadataResult.data.url

      // Step 3: Get salt — deployer MUST be the AgentFactory address
      setTxStatus('salt')
      const saltResult = await api.nadfun.getSalt({
        name: data.agentName,
        symbol: data.tokenSymbol,
        deployer: CONTRACTS.agentFactory,
        tokenURI,
      })
      const salt = saltResult.data.salt as `0x${string}`

      // Step 4: Single transaction — launchAgent
      setTxStatus('signing')
      const initialBuy = parseEther(data.initialBuyMon || '0')
      const deployFee = parseEther('10')
      const totalValue = deployFee + initialBuy

      const agentURI = buildAgentURI({
        name: data.agentName,
        description: data.description,
        image: imageUrl || undefined,
        category: data.category || undefined,
        persona: data.persona || undefined,
        price: data.pricePerReq || undefined,
      })

      writeContract({
        address: CONTRACTS.agentFactory,
        abi: agentFactoryAbi,
        functionName: 'launchAgent',
        args: [
          {
            agentURI,
            endpoint: '',
            tokenName: data.agentName,
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
    resetTx()
  }

  const err = (key: string) => errors[key] ?? ''
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
                <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2">Agent Info</h3>

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
                  <label className={labelClass}>Persona / System Prompt</label>
                  <textarea className={cn(inputClass, 'h-24 resize-y min-h-[96px]', err('persona') && inputErrorClass)} placeholder="You are a helpful AI assistant specialized in..." value={data.persona} onChange={(e) => update({ persona: e.target.value })} rows={4} />
                  <p className="text-xs text-muted-foreground mt-1">Define how your agent behaves in chat. This is the system prompt sent to the LLM.</p>
                  {err('persona') && <p className="text-xs text-destructive mt-1">{err('persona')}</p>}
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

                {/* Divider — Token & Pricing */}
                <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2 pt-2">Token & Pricing</h3>

                <div>
                  <label className={labelClass}>Token Symbol *</label>
                  <input type="text" className={cn(inputClass, err('tokenSymbol') && inputErrorClass)} placeholder="e.g. SUMM" value={data.tokenSymbol} onChange={(e) => update({ tokenSymbol: e.target.value.toUpperCase() })} />
                  {err('tokenSymbol') && <p className="text-xs text-destructive mt-1">{err('tokenSymbol')}</p>}
                </div>

                <div>
                  <label className={labelClass}>Price Per Request</label>
                  <input type="text" className={cn(inputClass, err('pricePerReq') && inputErrorClass)} placeholder="0.001" value={data.pricePerReq} onChange={(e) => update({ pricePerReq: e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1">How much to charge per API call in USD (e.g. 0.001)</p>
                  {err('pricePerReq') && <p className="text-xs text-destructive mt-1">{err('pricePerReq')}</p>}
                </div>

                <div>
                  <label className={labelClass}>Initial Buy (MON)</label>
                  <input type="number" min="0" step="any" className={cn(inputClass, err('initialBuyAmount') && inputErrorClass)} placeholder="0" value={data.initialBuyMon} onChange={(e) => update({ initialBuyMon: e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1">Optional: buy tokens at launch for yourself</p>
                </div>

                {/* Divider — Social */}
                <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2 pt-2">Social Media</h3>

                <div>
                  <label className={labelClass}>
                    <Globe className="w-3.5 h-3.5 inline mr-1" />
                    Website
                  </label>
                  <input type="url" className={cn(inputClass, err('website') && inputErrorClass)} placeholder="https://yourproject.com" value={data.website} onChange={(e) => update({ website: e.target.value })} />
                  {err('website') && <p className="text-xs text-destructive mt-1">{err('website')}</p>}
                </div>

                <div>
                  <label className={labelClass}>
                    <Twitter className="w-3.5 h-3.5 inline mr-1" />
                    X (Twitter)
                  </label>
                  <input type="url" className={inputClass} placeholder="https://x.com/yourhandle" value={data.twitter} onChange={(e) => update({ twitter: e.target.value })} />
                </div>
              </div>
            )}

            {/* STEP 2: Review & Launch */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-primary border-b border-primary/30 pb-2">Review & Launch</h3>
                <div className="text-sm space-y-2">
                  <ReviewRow label="Agent" value={data.agentName} />
                  <ReviewRow label="Description" value={data.description ? `${data.description.slice(0, 100)}${data.description.length > 100 ? '...' : ''}` : '—'} />
                  {data.persona && <ReviewRow label="Persona" value={`${data.persona.slice(0, 100)}${data.persona.length > 100 ? '...' : ''}`} />}
                  <ReviewRow label="Category" value={data.category} />
                  <ReviewRow label="Token Symbol" value={`$${data.tokenSymbol}`} />
                  {data.pricePerReq && <ReviewRow label="Per-Request Price" value={`$${data.pricePerReq}`} />}
                  <ReviewRow label="Initial Buy" value={`${data.initialBuyMon || '0'} MON`} />
                  {data.website && <ReviewRow label="Website" value={data.website} />}
                  {data.twitter && <ReviewRow label="X (Twitter)" value={data.twitter} />}
                  {data.avatarImage && (
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-muted-foreground w-28 shrink-0">Avatar</span>
                      <img src={data.avatarImage} alt="Avatar" className="w-8 h-8 rounded object-cover border border-border" />
                    </div>
                  )}
                </div>

                <div className="border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-foreground">
                  <p className="font-medium mb-1">Launch costs</p>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    <li>10 MON (nad.fun deploy fee)</li>
                    <li>~0.5 MON gas</li>
                    {parseFloat(data.initialBuyMon) > 0 && <li>{data.initialBuyMon} MON (initial buy)</li>}
                  </ul>
                  <p className="font-bold text-primary mt-2">TOTAL: ~{totalCostMon.toFixed(1)} MON</p>
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
                        {launchResult.agentId && launchResult.agentId !== 'unknown' && (
                          <p className="text-muted-foreground animate-pulse">Redirecting to agent page...</p>
                        )}
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
          {step === 1 && txStatus === 'idle' && (
            <div className="flex justify-end mt-4">
              <Button type="button" size="sm" onClick={goNext} className="gap-1">
                Review & Launch
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          {step === 2 && txStatus === 'idle' && (
            <div className="flex justify-start mt-4">
              <Button type="button" variant="outline" size="sm" onClick={goBack} className="gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 py-1 border-b border-border/20">
      <span className="text-muted-foreground text-xs w-28 shrink-0">{label}</span>
      <span className="text-white text-sm break-all">{value || '—'}</span>
    </div>
  )
}
