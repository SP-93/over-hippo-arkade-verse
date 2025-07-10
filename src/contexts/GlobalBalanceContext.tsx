import React, { createContext, useContext, ReactNode } from 'react';
import { useSecureBalance } from '@/hooks/useSecureBalance';

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
    refreshBalance,
    gameChips,
    overBalance,
    hasWallet,
    canPlayGame
  } = useSecureBalance();

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