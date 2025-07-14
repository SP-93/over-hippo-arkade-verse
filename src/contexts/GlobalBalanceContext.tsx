import React, { createContext, useContext, ReactNode } from 'react';
import { useOptimizedBalance } from '@/hooks/useOptimizedBalance';

interface GlobalBalanceContextType {
  balance: any;
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
  gameChips: number;
  overBalance: number;
  hasWallet: boolean;
  canPlayGame: (gameType: string) => boolean;
}

const GlobalBalanceContext = createContext<GlobalBalanceContextType | undefined>(undefined);

interface GlobalBalanceProviderProps {
  children: ReactNode;
}

export const GlobalBalanceProvider = ({ children }: GlobalBalanceProviderProps) => {
  const {
    balance,
    isLoading,
    refreshBalance
  } = useOptimizedBalance();

  // Extract values with safe defaults
  const gameChips = balance?.game_chips || 3;
  const overBalance = balance?.over_balance || 0;
  const hasWallet = balance?.has_wallet || false;
  const canPlayGame = (gameType: string) => gameChips > 0;

  const contextValue: GlobalBalanceContextType = {
    balance,
    isLoading,
    refreshBalance,
    gameChips,
    overBalance,
    hasWallet,
    canPlayGame
  };

  return (
    <GlobalBalanceContext.Provider value={contextValue}>
      {children}
    </GlobalBalanceContext.Provider>
  );
};

export const useGlobalBalance = () => {
  const context = useContext(GlobalBalanceContext);
  if (context === undefined) {
    throw new Error('useGlobalBalance must be used within a GlobalBalanceProvider');
  }
  return context;
};