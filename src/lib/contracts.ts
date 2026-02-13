export const CONTRACTS = {
  agentFactory: (import.meta.env.VITE_AGENT_FACTORY ?? '0x86B9373b92c63B81df06752efd54F69Fa7e9fD17') as `0x${string}`,
  revenueRouter: (import.meta.env.VITE_REVENUE_ROUTER ?? '0xB43b319D64759206846d6109c33a04a2c2f84450') as `0x${string}`,
  agentRating: (import.meta.env.VITE_AGENT_RATING ?? '0xB167BBa391b7C1C5D3e3b7Ae8034e43E5bb44306') as `0x${string}`,
  bondingCurveRouter: (import.meta.env.VITE_BONDING_CURVE_ROUTER ?? '0x6F6B8F1a20703309951a5127c45B49b1CD981A22') as `0x${string}`,
  lens: (import.meta.env.VITE_LENS ?? '0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea') as `0x${string}`,
} as const

// --- ABIs ---

export const agentFactoryAbi = [
  {
    name: 'launchAgent',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'agentURI', type: 'string' },
          { name: 'endpoint', type: 'string' },
          { name: 'tokenName', type: 'string' },
          { name: 'tokenSymbol', type: 'string' },
          { name: 'tokenURI', type: 'string' },
          { name: 'initialBuyAmount', type: 'uint256' },
          { name: 'salt', type: 'bytes32' },
        ],
      },
    ],
    outputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'token', type: 'address' },
    ],
  },
] as const

export const bondingCurveRouterAbi = [
  {
    name: 'buy',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amountOut', type: 'uint256' },
      { name: 'actionId', type: 'uint8' },
    ],
    outputs: [],
  },
  {
    name: 'sell',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'actionId', type: 'uint8' },
    ],
    outputs: [],
  },
] as const

export const agentRatingAbi = [
  {
    name: 'rateAgent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'score', type: 'int128' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
      { name: 'feedbackURI', type: 'string' },
      { name: 'feedbackHash', type: 'bytes32' },
    ],
    outputs: [],
  },
] as const

export const lensAbi = [
  {
    name: 'getAmountOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'isBuy', type: 'bool' },
    ],
    outputs: [
      { name: 'router', type: 'address' },
      { name: 'amountOut', type: 'uint256' },
    ],
  },
  {
    name: 'getProgress',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'isGraduated',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
] as const

export const erc20Abi = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const

// Event ABI for parsing launchAgent receipt
export const agentLaunchedEventAbi = [
  {
    type: 'event',
    name: 'AgentLaunched',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'token', type: 'address', indexed: false },
      { name: 'creator', type: 'address', indexed: false },
    ],
  },
] as const
