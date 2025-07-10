import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, RefreshCw, Trash2, Bug } from "lucide-react";
import { walletPersistence } from "@/utils/walletPersistence";

interface WalletDebugPanelProps {
  className?: string;
}

export const WalletDebugPanel = ({ className }: WalletDebugPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState(walletPersistence.getDebugInfo());

  const refreshDebugInfo = () => {
    setDebugInfo(walletPersistence.getDebugInfo());
  };

  const clearAllData = () => {
    walletPersistence.clearWalletData();
    refreshDebugInfo();
  };

  const attemptReconnection = async () => {
    const success = await walletPersistence.attemptSilentReconnection();
    console.log('Manual reconnection attempt:', success ? 'Success' : 'Failed');
    refreshDebugInfo();
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const parseStorageValue = (value: string | null) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  return (
    <div className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Bug className="h-3 w-3 mr-1" />
            Debug
            <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2">
          <Card className="p-3 bg-muted/50 border-border">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Wallet Storage Debug</h4>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={refreshDebugInfo}
                    className="h-7 px-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={attemptReconnection}
                    className="h-7 px-2"
                  >
                    Reconnect
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAllData}
                    className="h-7 px-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Status */}
              <div className="flex gap-2">
                <Badge variant={walletPersistence.canRestoreWallet() ? "default" : "secondary"}>
                  {walletPersistence.canRestoreWallet() ? "Can Restore" : "No Valid Data"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {formatTimestamp(debugInfo.timestamp)}
                </Badge>
              </div>

              {/* localStorage */}
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground">localStorage</h5>
                <div className="space-y-1">
                  {debugInfo.localStorage.wallet && (
                    <div className="text-xs">
                      <span className="font-mono text-primary">wallet_connection:</span>
                      <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-x-auto">
                        {JSON.stringify(parseStorageValue(debugInfo.localStorage.wallet), null, 2)}
                      </pre>
                    </div>
                  )}
                  {debugInfo.localStorage.view && (
                    <div className="text-xs">
                      <span className="font-mono text-primary">current_view:</span>
                      <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-x-auto">
                        {JSON.stringify(parseStorageValue(debugInfo.localStorage.view), null, 2)}
                      </pre>
                    </div>
                  )}
                  {!debugInfo.localStorage.wallet && !debugInfo.localStorage.view && (
                    <p className="text-xs text-muted-foreground">No wallet data in localStorage</p>
                  )}
                </div>
              </div>

              {/* sessionStorage */}
              {debugInfo.sessionStorage && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-muted-foreground">sessionStorage (backup)</h5>
                  <div className="space-y-1">
                    {debugInfo.sessionStorage.walletBackup && (
                      <div className="text-xs">
                        <span className="font-mono text-primary">wallet_backup:</span>
                        <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-x-auto">
                          {JSON.stringify(parseStorageValue(debugInfo.sessionStorage.walletBackup), null, 2)}
                        </pre>
                      </div>
                    )}
                    {!debugInfo.sessionStorage.walletBackup && (
                      <p className="text-xs text-muted-foreground">No backup data in sessionStorage</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};