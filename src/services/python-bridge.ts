/**
 * Bridge service for communicating with Python backend services
 * Provides advanced analytics and computation capabilities
 */

interface PythonServiceConfig {
  baseUrl: string;
  apiKey?: string;
}

interface NetworkInfo {
  chain_id: number;
  latest_block: number;
  gas_price_gwei: string;
  rpc_url: string;
}

interface BalanceInfo {
  address: string;
  balance_over: string;
  balance_wei: string;
  timestamp: number;
}

interface GasEstimate {
  gas_estimate: number;
  gas_price_gwei: string;
  total_cost_over: string;
  transaction_cost_over: string;
}

interface NetworkAnalytics {
  latest_block_number: number;
  latest_block_timestamp: number;
  latest_block_transactions: number;
  average_block_time_seconds: number;
  gas_utilization_percent: number;
}

export class PythonBridgeService {
  private config: PythonServiceConfig;

  constructor(config: PythonServiceConfig = { baseUrl: 'http://localhost:8000' }) {
    this.config = config;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        ...options.headers,
      };

      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        console.error(`Python service error: ${response.status} ${response.statusText}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Python bridge service error:', error);
      return null;
    }
  }

  /**
   * Check if Python services are available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const health = await this.makeRequest<{ status: string }>('/health');
      return health?.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Get Over Protocol network information
   */
  async getNetworkInfo(): Promise<NetworkInfo | null> {
    return this.makeRequest<NetworkInfo>('/network/info');
  }

  /**
   * Check OVER balance for an address using Python service
   */
  async checkBalance(address: string): Promise<BalanceInfo | null> {
    return this.makeRequest<BalanceInfo>('/balance/check', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(fromAddress: string, toAddress: string, amount: string): Promise<GasEstimate | null> {
    return this.makeRequest<GasEstimate>('/transaction/estimate-gas', {
      method: 'POST',
      body: JSON.stringify({
        from_address: fromAddress,
        to_address: toAddress,
        amount,
      }),
    });
  }

  /**
   * Get advanced network analytics
   */
  async getNetworkAnalytics(): Promise<NetworkAnalytics | null> {
    return this.makeRequest<NetworkAnalytics>('/analytics/network-stats');
  }

  /**
   * Enhanced balance checking with fallback to JavaScript service
   */
  async getEnhancedBalance(address: string): Promise<{
    source: 'python' | 'javascript' | 'error';
    balance: BalanceInfo | null;
    analytics?: NetworkAnalytics;
  }> {
    // Try Python service first for enhanced features
    const isAvailable = await this.isAvailable();
    
    if (isAvailable) {
      const [balance, analytics] = await Promise.all([
        this.checkBalance(address),
        this.getNetworkAnalytics(),
      ]);

      if (balance) {
        return { source: 'python', balance, analytics: analytics || undefined };
      }
    }

    // Fallback to JavaScript service (existing implementation)
    try {
      const { overProtocolBlockchainService } = await import('./over-protocol-blockchain');
      const jsBalance = await overProtocolBlockchainService.getOverBalance(address);
      
      if (jsBalance) {
        const balance: BalanceInfo = {
          address: jsBalance.address,
          balance_over: jsBalance.overBalance,
          balance_wei: jsBalance.overBalanceWei,
          timestamp: Math.floor(jsBalance.lastUpdated / 1000),
        };
        return { source: 'javascript', balance };
      }
    } catch (error) {
      console.error('JavaScript balance fallback failed:', error);
    }

    return { source: 'error', balance: null };
  }
}

// Global instance
export const pythonBridge = new PythonBridgeService();

// Helper hook for React components
export const usePythonBridge = () => {
  return pythonBridge;
};