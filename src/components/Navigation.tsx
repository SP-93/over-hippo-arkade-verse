import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalBalance } from '@/contexts/GlobalBalanceContext';
import { LogOut, Shield, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type NavigationTab = 'home' | 'dashboard' | 'games';

interface NavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { user, signOut } = useAuth();
  const { gameChips, overBalance } = useGlobalBalance();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const goToAdmin = () => {
    navigate('/admin');
  };

  return (
    <div className="flex items-center justify-between w-full mb-8">
      {/* Navigation Tabs */}
      <div className="flex gap-4">
        <Button
          variant={activeTab === 'home' ? 'default' : 'outline'}
          onClick={() => onTabChange('home')}
          className="animate-fade-in"
        >
          Home
        </Button>
        <Button
          variant={activeTab === 'dashboard' ? 'default' : 'outline'}
          onClick={() => onTabChange('dashboard')}
          className="animate-fade-in"
        >
          Dashboard
        </Button>
        <Button
          variant={activeTab === 'games' ? 'default' : 'outline'}
          onClick={() => onTabChange('games')}
          className="animate-fade-in"
        >
          Games
        </Button>
      </div>

      {/* User Info and Actions */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-muted-foreground">{user.email}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-primary font-bold">{gameChips}</span>
              <span className="text-muted-foreground">chips</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-secondary font-bold">{overBalance}</span>
              <span className="text-muted-foreground">OVER</span>
            </div>
          </div>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={goToAdmin}
          className="bg-background/50 hover:bg-background/80"
        >
          <Shield className="h-4 w-4 mr-2" />
          Admin
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="bg-background/50 hover:bg-background/80"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};