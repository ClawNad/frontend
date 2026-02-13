import { z } from 'zod'

const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  endpoint: z.string().url('Invalid URL'),
  version: z.string().default('1.0.0'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  price: z.string().regex(/^\$\d+\.?\d*$/, 'Price must be in format $0.00'),
})

export const launchSchema = z.object({
  name: z.string().min(1, 'Agent name is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  endpoint: z
    .string()
    .url('Invalid URL')
    .refine((s) => s.startsWith('https://'), 'Endpoint must start with https://'),
  category: z.enum([
    'nlp',
    'security',
    'orchestration',
    'defi',
    'data',
    'automation',
    'nft',
    'gaming',
  ]),
  imageUri: z.string().optional(),
  services: z.array(serviceSchema).min(1, 'At least one service is required'),
  tokenName: z.string().min(1, 'Token name is required').max(50),
  tokenSymbol: z
    .string()
    .min(2, 'Symbol must be 2–10 characters')
    .max(10)
    .transform((s) => s.toUpperCase()),
  tokenImageUri: z.string().optional(),
  initialBuyAmount: z.string().default('0'),
})

export type LaunchSchema = z.infer<typeof launchSchema>

export const LAUNCH_CATEGORIES = [
  { value: 'nlp', label: 'NLP' },
  { value: 'security', label: 'Security' },
  { value: 'orchestration', label: 'Orchestration' },
  { value: 'defi', label: 'DeFi' },
  { value: 'data', label: 'Data' },
  { value: 'automation', label: 'Automation' },
  { value: 'nft', label: 'NFT' },
  { value: 'gaming', label: 'Gaming' },
] as const
