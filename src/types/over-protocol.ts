// Over Protocol Smart Contract Types and Interfaces

export interface OverProtocolContract {
  address: string;
  abi: any[];
}

export interface ChipPurchaseTransaction {
  from: string;
  to: string;
  value: string;
  chipAmount: number;
  timestamp: number;
  txHash?: string;
  status?: 'pending' | 'confirmed' | 'failed';
}

export interface WithdrawalTransaction {
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  txHash?: string;
}

export interface GameReward {
  player: string;
  gameType: 'tetris' | 'snake' | 'pacman';
  score: number;
  overReward: number;
  timestamp: number;
}

export interface PlayerBalance {
  address: string;
  overTokens: number;
  gameChips: number;
  lastUpdated: number;
}

// Smart Contract Configuration
export const OVER_PROTOCOL_CONFIG = {
  NETWORK: 'Over Protocol Mainnet',
  CHAIN_ID: '0xd3a0', // Over Protocol Chain ID (54176)
  RPC_URL: 'https://rpc.overprotocol.com', // Official Over Protocol RPC
  ARCADE_CONTRACT: '0x...', // To be deployed
  OVER_TOKEN: '0x...', // Native OVER token
  CHIP_PRICE: 0.1, // 0.1 OVER per chip
  MIN_WITHDRAWAL: 1.0 // Minimum 1 OVER for withdrawal
};

// Game reward rates (OVER tokens per 1000 points)
export const GAME_REWARD_RATES = {
  tetris: 0.001,
  snake: 0.0015,
  pacman: 0.002
};

export interface SmartContractError extends Error {
  code: number;
  data?: any;
}

export interface MetaMaskError extends Error {
  code: 4001 | 4100 | 4200 | 4900 | 4901;
}