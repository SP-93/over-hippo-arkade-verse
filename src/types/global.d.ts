declare global {
  interface Window {
    ethereum?: any;
    web3?: any;
    THREE?: any;
    gc?: () => void;
  }
}

export {};