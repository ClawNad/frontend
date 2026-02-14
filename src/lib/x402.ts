import type { WalletClient } from 'viem'

/** Backend base URL (strip /api/v1 from API URL since agent routes are at root) */
const BACKEND_BASE = (import.meta.env.VITE_API_URL || 'https://api.clawnad.xyz/api/v1').replace('/api/v1', '')

// --- x402 Protocol Types ---

interface PaymentRequirement {
  scheme: string
  network: string
  amount?: string
  maxAmountRequired?: string
  resource?: string
  description?: string
  payTo: string
  asset: string
  maxTimeoutSeconds?: number
  extra?: {
    name: string
    version: string
  }
}

interface PaymentRequired {
  x402Version: number
  accepts: PaymentRequirement[]
}

// --- Helpers ---

async function parsePaymentRequired(response: Response): Promise<PaymentRequired> {
  // Try PAYMENT-REQUIRED header first (base64 encoded)
  const header = response.headers.get('PAYMENT-REQUIRED')
  if (header) {
    try {
      return JSON.parse(atob(header))
    } catch {
      return JSON.parse(header)
    }
  }

  // Fallback: parse the response body (some setups don't expose custom headers via CORS)
  const body = await response.json().catch(() => null)
  if (body && body.accepts) {
    return body as PaymentRequired
  }

  throw new Error(
    'Could not read payment requirements. The backend may need to add ' +
    'Access-Control-Expose-Headers: PAYMENT-REQUIRED to its CORS config.',
  )
}

async function signEIP3009(
  walletClient: WalletClient,
  requirement: PaymentRequirement,
): Promise<string> {
  const account = walletClient.account
  if (!account) throw new Error('No wallet account connected')

  // Random nonce (bytes32)
  const nonceBytes = crypto.getRandomValues(new Uint8Array(32))
  const nonce = ('0x' + Array.from(nonceBytes).map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`

  const validAfter = 0n
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour

  // Extract chain ID from network string (e.g., "eip155:10143" → 10143)
  const chainId = BigInt(requirement.network.split(':')[1] || '10143')

  // EIP-712 domain — use token's EIP-712 name/version from the payment requirement
  const domain = {
    name: requirement.extra?.name || 'USD Coin',
    version: requirement.extra?.version || '2',
    chainId,
    verifyingContract: requirement.asset as `0x${string}`,
  }

  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  }

  const paymentAmount = requirement.amount || requirement.maxAmountRequired || '0'

  const message = {
    from: account.address,
    to: requirement.payTo as `0x${string}`,
    value: BigInt(paymentAmount),
    validAfter,
    validBefore,
    nonce,
  }

  const signature = await walletClient.signTypedData({
    account,
    domain,
    types,
    primaryType: 'TransferWithAuthorization',
    message,
  })

  // Build x402 payment payload
  const payload = {
    x402Version: 2,
    scheme: requirement.scheme,
    network: requirement.network,
    payload: {
      signature,
      authorization: {
        from: account.address,
        to: requirement.payTo,
        value: paymentAmount,
        validAfter: String(validAfter),
        validBefore: String(validBefore),
        nonce,
      },
    },
  }

  return btoa(JSON.stringify(payload))
}

/**
 * Make a paid POST request to an agent service endpoint.
 * Handles the full x402 flow: initial request → 402 → sign payment → retry.
 */
export async function fetchWithPayment<T>(
  path: string,
  walletClient: WalletClient,
  body: unknown,
): Promise<T> {
  const url = `${BACKEND_BASE}${path}`

  // Step 1: Initial request
  const initialResponse = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  // If the endpoint doesn't require payment, return directly
  if (initialResponse.ok) {
    return initialResponse.json()
  }

  if (initialResponse.status !== 402) {
    const error = await initialResponse.json().catch(() => ({ error: initialResponse.statusText }))
    throw new Error(error.error || `Request failed: ${initialResponse.status}`)
  }

  // Step 2: Parse payment requirements from 402 response
  const paymentRequired = await parsePaymentRequired(initialResponse)
  const requirement = paymentRequired.accepts[0]
  if (!requirement) throw new Error('No acceptable payment scheme found')

  // Step 3: Sign EIP-3009 transferWithAuthorization (triggers wallet popup)
  const paymentHeader = await signEIP3009(walletClient, requirement)

  // Step 4: Retry with X-PAYMENT header
  const paidResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-PAYMENT': paymentHeader,
    },
    body: JSON.stringify(body),
  })

  if (!paidResponse.ok) {
    const error = await paidResponse.json().catch(() => ({ error: paidResponse.statusText }))
    throw new Error(error.error || `Payment failed: ${paidResponse.status}`)
  }

  return paidResponse.json()
}

// --- Service Type Detection ---

export type AgentServiceType = 'summary' | 'code-audit' | 'orchestrator'

export interface AgentService {
  type: AgentServiceType
  label: string
  actionPath: string
  price: string
}

export const AGENT_SERVICES: Record<AgentServiceType, AgentService & { chatPath: string; chatPrice: string }> = {
  summary: {
    type: 'summary',
    label: 'Text Summarizer',
    actionPath: '/agents/summary/summarize',
    price: '$0.001',
    chatPath: '/agents/summary/chat',
    chatPrice: '$0.01',
  },
  'code-audit': {
    type: 'code-audit',
    label: 'Code Auditor',
    actionPath: '/agents/code-audit/audit',
    price: '$0.005',
    chatPath: '/agents/code-audit/chat',
    chatPrice: '$0.01',
  },
  orchestrator: {
    type: 'orchestrator',
    label: 'Orchestrator',
    actionPath: '/agents/orchestrator/execute',
    price: '$0.01',
    chatPath: '/agents/orchestrator/chat',
    chatPrice: '$0.01',
  },
}

/** Known agent ID → service type mapping */
const AGENT_ID_MAP: Record<string, AgentServiceType> = {
  '127': 'summary',
  '128': 'code-audit',
  '129': 'orchestrator',
}

/** Detect the agent's service type by agent ID or endpoint URL */
export function detectServiceType(agentId?: string, endpoint?: string): AgentServiceType | null {
  if (agentId && AGENT_ID_MAP[agentId]) return AGENT_ID_MAP[agentId]
  if (endpoint) {
    const lower = endpoint.toLowerCase()
    if (lower.includes('summary')) return 'summary'
    if (lower.includes('code-audit') || lower.includes('codeaudit') || lower.includes('audit')) return 'code-audit'
    if (lower.includes('orchestrator')) return 'orchestrator'
  }
  return null
}

// --- Streaming Chat Helpers ---

/**
 * Make a paid streaming POST request (SSE) to an agent chat endpoint.
 * Handles x402 flow then reads the SSE stream, calling onChunk for each token.
 */
export async function fetchStreamWithPayment(
  path: string,
  walletClient: WalletClient,
  body: unknown,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): Promise<void> {
  const url = `${BACKEND_BASE}${path}`

  // Step 1: Initial request
  const initialResponse = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  let response: Response

  if (initialResponse.ok) {
    response = initialResponse
  } else if (initialResponse.status === 402) {
    // Step 2: Parse payment requirements
    const paymentRequired = await parsePaymentRequired(initialResponse)
    const requirement = paymentRequired.accepts[0]
    if (!requirement) throw new Error('No acceptable payment scheme found')

    // Step 3: Sign payment
    const paymentHeader = await signEIP3009(walletClient, requirement)

    // Step 4: Retry with payment
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PAYMENT': paymentHeader,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `Payment failed: ${response.status}`)
    }
  } else {
    const error = await initialResponse.json().catch(() => ({ error: initialResponse.statusText }))
    throw new Error(error.error || `Request failed: ${initialResponse.status}`)
  }

  // Read SSE stream
  readSSEStream(response, onChunk, onDone, onError)
}

/** Parse an SSE response stream, extracting content chunks */
function readSSEStream(
  response: Response,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): void {
  const reader = response.body?.getReader()
  if (!reader) {
    onError(new Error('No readable stream in response'))
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  function processLines(text: string) {
    buffer += text
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') {
        onDone()
        return true
      }
      try {
        const parsed = JSON.parse(data)
        if (parsed.content) onChunk(parsed.content)
        if (parsed.error) onError(new Error(parsed.error))
      } catch {
        // skip malformed chunks
      }
    }
    return false
  }

  ;(async () => {
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const isDone = processLines(decoder.decode(value, { stream: true }))
        if (isDone) return
      }
      onDone()
    } catch (err) {
      onError(err instanceof Error ? err : new Error('Stream read error'))
    }
  })()
}
