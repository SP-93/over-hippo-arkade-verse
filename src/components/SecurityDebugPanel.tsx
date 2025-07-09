import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  detectBrowserCapabilities, 
  getBrowserOptimizedSettings, 
  detectWalletExtensions,
  needsFallbackCleanup 
} from '@/utils/browserCompatibility';
import { Shield, Eye, Zap, AlertTriangle, Info, TestTube } from 'lucide-react';

interface SecurityDebugPanelProps {
  onTriggerCleanup?: () => void;
  isVisible?: boolean;
}

export const SecurityDebugPanel: React.FC<SecurityDebugPanelProps> = ({ 
  onTriggerCleanup, 
  isVisible = false 
}) => {
  const [capabilities, setCapabilities] = useState<any>(null);
  const [walletExtensions, setWalletExtensions] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    if (isVisible) {
      setCapabilities(detectBrowserCapabilities());
      setWalletExtensions(detectWalletExtensions());
      setSettings(getBrowserOptimizedSettings());
    }
  }, [isVisible]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testVisibilityAPI = () => {
    try {
      if (typeof document !== 'undefined' && 'visibilityState' in document) {
        addTestResult(`✅ Visibility API: ${document.visibilityState}`);
        console.log('🧪 Visibility API test - State:', document.visibilityState);
      } else {
        addTestResult('❌ Visibility API not supported');
      }
    } catch (error) {
      addTestResult('❌ Visibility API test failed');
      console.error('Visibility API test error:', error);
    }
  };

  const testLocalStorage = () => {
    try {
      const testKey = 'security_test_key';
      const testValue = 'test_value_' + Date.now();
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved === testValue) {
        addTestResult('✅ localStorage working correctly');
        console.log('🧪 localStorage test passed');
      } else {
        addTestResult('❌ localStorage test failed');
      }
    } catch (error) {
      addTestResult('❌ localStorage not available');
      console.error('localStorage test error:', error);
    }
  };

  const testWalletExtensions = () => {
    try {
      const extensions = detectWalletExtensions();
      const detected = Object.entries(extensions)
        .filter(([_, available]) => available)
        .map(([name, _]) => name);
      
      if (detected.length > 0) {
        addTestResult(`✅ Wallets detected: ${detected.join(', ')}`);
        console.log('🧪 Wallet extensions test:', extensions);
      } else {
        addTestResult('ℹ️ No wallet extensions detected');
      }
    } catch (error) {
      addTestResult('❌ Wallet detection test failed');
      console.error('Wallet detection test error:', error);
    }
  };

  const testSecurityCleanup = () => {
    try {
      if (onTriggerCleanup) {
        onTriggerCleanup();
        addTestResult('✅ Security cleanup triggered');
        console.log('🧪 Manual security cleanup test triggered');
      } else {
        addTestResult('❌ No cleanup function provided');
      }
    } catch (error) {
      addTestResult('❌ Security cleanup test failed');
      console.error('Security cleanup test error:', error);
    }
  };

  const simulatePageHide = () => {
    try {
      // Simulate page visibility change
      const event = new Event('visibilitychange');
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(event);
      
      addTestResult('✅ Page hide simulation triggered');
      console.log('🧪 Page hide simulation test');
      
      // Restore visibility after test
      setTimeout(() => {
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      }, 1000);
      
    } catch (error) {
      addTestResult('❌ Page hide simulation failed');
      console.error('Page hide simulation error:', error);
    }
  };

  const runAllTests = () => {
    console.log('🧪 Running comprehensive security tests...');
    addTestResult('🚀 Starting comprehensive tests...');
    
    setTimeout(() => testVisibilityAPI(), 100);
    setTimeout(() => testLocalStorage(), 200);
    setTimeout(() => testWalletExtensions(), 300);
    setTimeout(() => {
      addTestResult('🎯 All tests completed');
      console.log('🧪 All security tests completed');
    }, 500);
  };

  if (!isVisible) return null;

  return (
    <Card className="p-6 bg-gradient-card border-yellow-500 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <TestTube className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-bold text-yellow-500">Security Debug Panel</h3>
        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
          Development Only
        </Badge>
      </div>

      {/* Browser Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            Browser Capabilities
          </h4>
          {capabilities && (
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Visibility API:</span>
                <Badge variant={capabilities.supportsVisibilityAPI ? 'default' : 'destructive'}>
                  {capabilities.supportsVisibilityAPI ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Before Unload:</span>
                <Badge variant={capabilities.supportsBeforeUnload ? 'default' : 'destructive'}>
                  {capabilities.supportsBeforeUnload ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>localStorage:</span>
                <Badge variant={capabilities.supportsLocalStorage ? 'default' : 'destructive'}>
                  {capabilities.supportsLocalStorage ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Browser:</span>
                <Badge variant="secondary">{capabilities.browserType}</Badge>
              </div>
              {needsFallbackCleanup() && (
                <div className="flex items-center gap-1 text-yellow-500">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="text-xs">Needs fallback cleanup</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Settings
          </h4>
          {settings && (
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Debounce:</span>
                <Badge variant="secondary">{settings.debounceMs}ms</Badge>
              </div>
              <div className="flex justify-between">
                <span>Session Timeout:</span>
                <Badge variant="secondary">{Math.round(settings.sessionTimeoutMs / 60000)}min</Badge>
              </div>
              <div className="flex justify-between">
                <span>Use Visibility API:</span>
                <Badge variant={settings.useVisibilityAPI ? 'default' : 'destructive'}>
                  {settings.useVisibilityAPI ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Extensions */}
      <div className="mb-6">
        <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
          <Eye className="h-4 w-4" />
          Detected Wallets
        </h4>
        <div className="flex flex-wrap gap-2">
          {walletExtensions && Object.entries(walletExtensions).map(([name, detected]) => (
            <Badge 
              key={name} 
              variant={detected ? 'default' : 'secondary'}
              className={detected ? 'bg-green-500' : ''}
            >
              {name}: {detected ? '✅' : '❌'}
            </Badge>
          ))}
        </div>
      </div>

      {/* Test Controls */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        <Button size="sm" variant="outline" onClick={testVisibilityAPI}>
          Test Visibility
        </Button>
        <Button size="sm" variant="outline" onClick={testLocalStorage}>
          Test Storage
        </Button>
        <Button size="sm" variant="outline" onClick={testWalletExtensions}>
          Test Wallets
        </Button>
        <Button size="sm" variant="outline" onClick={simulatePageHide}>
          Simulate Hide
        </Button>
        <Button size="sm" variant="destructive" onClick={testSecurityCleanup}>
          <Zap className="h-3 w-3 mr-1" />
          Test Cleanup
        </Button>
        <Button size="sm" variant="default" onClick={runAllTests}>
          Run All Tests
        </Button>
      </div>

      {/* Test Results */}
      <div className="space-y-1">
        <h4 className="font-semibold text-sm">Test Results (Latest 5)</h4>
        <div className="bg-muted/20 p-3 rounded-lg text-xs font-mono space-y-1 max-h-32 overflow-y-auto">
          {testResults.length === 0 ? (
            <div className="text-muted-foreground">No tests run yet...</div>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="text-foreground">
                {result}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
        <p className="text-xs text-yellow-600">
          <AlertTriangle className="h-3 w-3 inline mr-1" />
          This debug panel is only visible in development mode and will be automatically hidden in production.
        </p>
      </div>
    </Card>
  );
};