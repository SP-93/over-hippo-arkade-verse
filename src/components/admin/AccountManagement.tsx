import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Unlock, 
  UserX, 
  AlertTriangle, 
  Clock,
  Search,
  RefreshCw
} from "lucide-react";
import { enhancedAuthService } from "@/services/enhanced-auth";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
import { toast } from "sonner";

export const AccountManagement = () => {
  const [failedAttempts, setFailedAttempts] = useState<any[]>([]);
  const [lockedAccounts, setLockedAccounts] = useState<any[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { unlockAccount, forceLogoutUser } = useEnhancedAuth();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [attempts, lockouts] = await Promise.all([
        enhancedAuthService.getFailedLoginAttempts(100),
        enhancedAuthService.getAccountLockouts()
      ]);
      
      setFailedAttempts(attempts);
      setLockedAccounts(lockouts);
    } catch (error) {
      console.error('Error loading account data:', error);
      toast.error('Failed to load account data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUnlockAccount = async (email: string) => {
    const success = await unlockAccount(email);
    if (success) {
      await loadData(); // Refresh data
    }
  };

  const handleForceLogout = async (email: string) => {
    const success = await forceLogoutUser(email);
    if (success) {
      toast.success(`Forced logout for ${email}`);
    }
  };

  const filteredAttempts = failedAttempts.filter(attempt =>
    !searchEmail || attempt.email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  const filteredLockouts = lockedAccounts.filter(lockout =>
    !searchEmail || lockout.email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neon-blue">Account Management</h2>
        <Button 
          onClick={loadData} 
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Locked Accounts */}
      <Card className="p-6 bg-gradient-card border-red-500">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-red-500">Locked Accounts</h3>
          <Badge variant="destructive">{filteredLockouts.length}</Badge>
        </div>
        
        {filteredLockouts.length === 0 ? (
          <p className="text-muted-foreground">No locked accounts</p>
        ) : (
          <div className="space-y-3">
            {filteredLockouts.map((lockout) => (
              <div 
                key={lockout.id} 
                className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-red-500/20"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <UserX className="h-4 w-4 text-red-500" />
                    <span className="font-medium">{lockout.email}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-4">
                      <span>Failed attempts: {lockout.failure_count}</span>
                      <span>Locked until: {new Date(lockout.locked_until).toLocaleString()}</span>
                      {lockout.last_attempt_ip && (
                        <span>IP: {lockout.last_attempt_ip}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleUnlockAccount(lockout.email)}
                    variant="outline"
                    size="sm"
                    className="border-neon-green text-neon-green hover:bg-neon-green/10"
                  >
                    <Unlock className="h-4 w-4 mr-1" />
                    Unlock
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Failed Attempts */}
      <Card className="p-6 bg-gradient-card border-arcade-gold">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-arcade-gold" />
          <h3 className="text-lg font-semibold text-arcade-gold">Recent Failed Login Attempts</h3>
          <Badge variant="outline" className="border-arcade-gold text-arcade-gold">
            {filteredAttempts.length}
          </Badge>
        </div>
        
        {filteredAttempts.length === 0 ? (
          <p className="text-muted-foreground">No recent failed attempts</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredAttempts.map((attempt) => (
              <div 
                key={attempt.id} 
                className="flex items-center justify-between p-3 bg-card/30 rounded-lg border border-arcade-gold/20"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-arcade-gold" />
                    <span className="font-medium">{attempt.email}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span>{new Date(attempt.attempt_time).toLocaleString()}</span>
                      {attempt.ip_address && <span>IP: {attempt.ip_address}</span>}
                      {attempt.failure_reason && (
                        <span className="text-red-400">Reason: {attempt.failure_reason}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleForceLogout(attempt.email)}
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Force Logout
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};