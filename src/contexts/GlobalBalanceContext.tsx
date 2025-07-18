import React, { createContext, useContext, ReactNode } from 'react';
import { useOptimizedBalance } from '@/hooks/useOptimizedBalance';
import { useAuth } from './AuthContext';

interface GlobalBalanceContextType {
  balance: any;
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
  gameChips: number;
  overBalance: number;
  woverBalance: number;
  hasWallet: boolean;
  canPlayGame: (gameType: string) => boolean;
}

const GlobalBalanceContext = createContext<GlobalBalanceContextType | undefined>(undefined);

interface GlobalBalanceProviderProps {
  children: ReactNode;
}

export const GlobalBalanceProvider = ({ children }: GlobalBalanceProviderProps) => {
  const { user } = useAuth();
  const {
    balance,
    isLoading,
    refreshBalance
  } = useOptimizedBalance(user?.id);

  // Extract values with safe defaults - only if user is authenticated
  const gameChips = user ? (balance?.game_chips || 3) : 0;
  const overBalance = user ? (balance?.over_balance || 0) : 0;
  const woverBalance = user ? (balance?.wover_balance || 0) : 0;
  const hasWallet = user ? (balance?.has_wallet || false) : false;
  const canPlayGame = (gameType: string) => user && gameChips > 0;

  const contextValue: GlobalBalanceContextType = {
    balance,
    isLoading,
    refreshBalance,
    gameChips,
    overBalance,
    woverBalance,
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