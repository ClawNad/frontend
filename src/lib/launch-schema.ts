import { z } from 'zod'

export const launchSchema = z.object({
  name: z.string().min(1, 'Agent name is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
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
  tokenSymbol: z
    .string()
    .min(2, 'Symbol must be 2–10 characters')
    .max(10)
    .transform((s) => s.toUpperCase()),
  pricePerReq: z.string().regex(/^\d+\.?\d*$/, 'Price must be a number (e.g. 0.001)').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter: z.string().optional(),
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
