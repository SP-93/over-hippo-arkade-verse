import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { pythonBridge } from '@/services/python-bridge';
import { Cpu, Server, TrendingUp, RefreshCw } from 'lucide-react';

interface NetworkAnalytics {
  latest_block_number: number;
  latest_block_timestamp: number;
  latest_block_transactions: number;
  average_block_time_seconds: number;
  gas_utilization_percent: number;
}

export const PythonServiceStatus: React.FC = () => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [analytics, setAnalytics] = useState<NetworkAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const checkServices = async () => {
    setLoading(true);
    try {
      const available = await pythonBridge.isAvailable();
      setIsAvailable(available);

      if (available) {
        const networkAnalytics = await pythonBridge.getNetworkAnalytics();
        setAnalytics(networkAnalytics);
      }
    } catch (error) {
      console.error('Error checking Python services:', error);
      setIsAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkServices();
  }, []);

  return (
    <Card className="p-4 bg-glass-primary border-glass-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-neon-cyan" />
          <h3 className="text-lg font-semibold text-foreground">Python Services</h3>
          <Badge variant={isAvailable ? "default" : "destructive"}>
            {isAvailable === null ? 'Checking...' : isAvailable ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={checkServices}
          disabled={loading}
          className="border-glass-border hover:bg-glass-secondary"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isAvailable && analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-glass-secondary rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Server className="w-4 h-4 text-neon-blue" />
              <span className="text-sm text-muted-foreground">Latest Block</span>
            </div>
            <div className="text-lg font-semibold text-foreground">
              #{analytics.latest_block_number.toLocaleString()}
            </div>
          </div>

          <div className="bg-glass-secondary rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-neon-green" />
              <span className="text-sm text-muted-foreground">Block Time</span>
            </div>
            <div className="text-lg font-semibold text-foreground">
              {analytics.average_block_time_seconds}s
            </div>
          </div>

          <div className="bg-glass-secondary rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-4 h-4 text-neon-purple" />
              <span className="text-sm text-muted-foreground">Gas Usage</span>
            </div>
            <div className="text-lg font-semibold text-foreground">
              {analytics.gas_utilization_percent.toFixed(1)}%
            </div>
          </div>

          <div className="bg-glass-secondary rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Server className="w-4 h-4 text-neon-cyan" />
              <span className="text-sm text-muted-foreground">Transactions</span>
            </div>
            <div className="text-lg font-semibold text-foreground">
              {analytics.latest_block_transactions}
            </div>
          </div>
        </div>
      )}

      {isAvailable === false && (
        <div className="text-center py-4">
          <p className="text-muted-foreground mb-2">
            Python services are offline. Using JavaScript fallback.
          </p>
          <p className="text-sm text-muted-foreground">
            To enable advanced features, start the Python service:
            <code className="ml-2 px-2 py-1 bg-glass-secondary rounded text-neon-cyan">
              cd python-services && python main.py
            </code>
          </p>
        </div>
      )}
    </Card>
  );
};