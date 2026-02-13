import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { defineChain } from 'viem'

/** Monad logo for chain icon (RainbowKit has no built-in) - https://www.monad.xyz/brand-and-media-kit */
export const MONAD_ICON_URL = 'https://cdn.prod.website-files.com/667c57e6f9254a4b6d914440/67b135627be8437b3cda15ae_Monad%20Logomark.svg'

/** Monad Mainnet - https://docs.monad.xyz/developer-essentials/network-information */
export const monad = defineChain({
  id: 143,
  name: 'Monad',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://explorer.monad.xyz',
    },
  },
})

/** Monad chain with icon for RainbowKit modal + navbar */
const monadWithIcon = {
  ...monad,
  iconUrl: MONAD_ICON_URL,
  iconBackground: '#0E091C',
} as const

/** Set VITE_WALLETCONNECT_PROJECT_ID in .env from https://cloud.walletconnect.com */
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? 'YOUR_PROJECT_ID'

export const config = getDefaultConfig({
  appName: 'ClawNAD',
  projectId,
  chains: [monadWithIcon],
  ssr: false,
})
