// Type declarations for wallet extensions
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
    };
    okxwallet?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isOKXWallet?: boolean;
    };
  }
}

export {};