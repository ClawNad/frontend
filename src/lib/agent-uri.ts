/**
 * ERC-8004 Agent URI utilities.
 *
 * Standard format: data:application/json;base64,<base64-encoded JSON>
 * JSON schema: { type, name, description, image?, services[], skills[], createdAt, version, persona?, price? }
 */

const DATA_URI_PREFIX = 'data:application/json;base64,'

export interface AgentURIData {
  name?: string
  description?: string
  image?: string
  persona?: string
  price?: string
  skills?: string[]
}

/** Build an ERC-8004 compliant agentURI (data URI with base64 JSON) */
export function buildAgentURI(opts: {
  name: string
  description: string
  image?: string
  category?: string
  persona?: string
  price?: string
}): string {
  const metadata = {
    type: 'erc8004-agent-registration-v1',
    name: opts.name,
    description: opts.description,
    image: opts.image || undefined,
    services: [
      { type: 'web', endpoint: 'https://clawnad.vercel.app' },
    ],
    skills: opts.category ? [opts.category] : [],
    createdAt: new Date().toISOString(),
    version: '1.0.0',
    // ClawNad custom fields
    persona: opts.persona || undefined,
    price: opts.price || undefined,
  }

  const jsonBytes = new TextEncoder().encode(JSON.stringify(metadata))
  let binary = ''
  for (const byte of jsonBytes) binary += String.fromCharCode(byte)
  return `${DATA_URI_PREFIX}${btoa(binary)}`
}

/** Parse an agentURI — handles both ERC-8004 data URIs and legacy JSON strings */
export function parseAgentURI(uri: string): AgentURIData {
  if (!uri) return {}

  let obj: Record<string, unknown> | null = null

  // ERC-8004 data URI format
  if (uri.startsWith(DATA_URI_PREFIX)) {
    try {
      const binary = atob(uri.slice(DATA_URI_PREFIX.length))
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
      const json = new TextDecoder().decode(bytes)
      obj = JSON.parse(json)
    } catch { /* malformed */ }
  }

  // Legacy: raw JSON string
  if (!obj) {
    try {
      const parsed = JSON.parse(uri)
      if (typeof parsed === 'object' && parsed !== null) {
        obj = parsed as Record<string, unknown>
      }
    } catch { /* not JSON — ignore */ }
  }

  if (!obj) return {}

  return {
    name: typeof obj.name === 'string' ? obj.name : undefined,
    description: typeof obj.description === 'string' ? obj.description : undefined,
    image: typeof obj.image === 'string' ? obj.image : undefined,
    persona: typeof obj.persona === 'string' ? obj.persona : undefined,
    price: typeof obj.price === 'string' ? obj.price : undefined,
    skills: Array.isArray(obj.skills) ? obj.skills.filter((s): s is string => typeof s === 'string') : undefined,
  }
}
