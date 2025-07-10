import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Zap, 
  Gamepad2, 
  Coins, 
  Network, 
  FileText,
  ExternalLink
} from "lucide-react";

interface PlatformInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlatformInfoModal = ({ isOpen, onClose }: PlatformInfoModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-card border-neon-blue">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-neon-blue flex items-center gap-2">
            <Gamepad2 className="h-6 w-6" />
            Over Protocol Gaming Platform
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Platform Overview */}
          <section>
            <h3 className="text-lg font-semibold text-arcade-gold mb-3">Platform Overview</h3>
            <p className="text-muted-foreground leading-relaxed">
              A cutting-edge blockchain gaming platform built on Over Protocol L1. Experience classic arcade games 
              reimagined with modern 3D graphics, blockchain integration, and play-to-earn mechanics.
            </p>
          </section>

          {/* Key Features */}
          <section>
            <h3 className="text-lg font-semibold text-arcade-gold mb-3">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                <Zap className="h-5 w-5 text-neon-green mt-1" />
                <div>
                  <h4 className="font-semibold text-neon-green">High Performance</h4>
                  <p className="text-sm text-muted-foreground">60fps 3D games with WebGL optimization</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                <Shield className="h-5 w-5 text-neon-blue mt-1" />
                <div>
                  <h4 className="font-semibold text-neon-blue">Secure</h4>
                  <p className="text-sm text-muted-foreground">Blockchain-verified transactions</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                <Coins className="h-5 w-5 text-arcade-gold mt-1" />
                <div>
                  <h4 className="font-semibold text-arcade-gold">Play-to-Earn</h4>
                  <p className="text-sm text-muted-foreground">Earn OVER tokens through gameplay</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                <Network className="h-5 w-5 text-purple-400 mt-1" />
                <div>
                  <h4 className="font-semibold text-purple-400">Cross-Platform</h4>
                  <p className="text-sm text-muted-foreground">Works on desktop and mobile</p>
                </div>
              </div>
            </div>
          </section>

          {/* Over Protocol Integration */}
          <section>
            <h3 className="text-lg font-semibold text-arcade-gold mb-3">Over Protocol Integration</h3>
            <div className="bg-background/30 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-neon-blue text-neon-blue">L1 Blockchain</Badge>
                <Badge variant="outline" className="border-neon-green text-neon-green">Low Gas Fees</Badge>
                <Badge variant="outline" className="border-arcade-gold text-arcade-gold">Fast Transactions</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Built on Over Protocol's Layer 1 blockchain, ensuring fast, secure, and cost-effective 
                transactions for all gaming operations including chip purchases, score recording, and rewards distribution.
              </p>
            </div>
          </section>

          {/* Available Games */}
          <section>
            <h3 className="text-lg font-semibold text-arcade-gold mb-3">Available Games</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                "3D Snake", "3D Tetris", "3D Mario", "3D Asteroids",
                "3D Breakout", "3D Flipper", "3D Pac-Man", "3D Frogger", "3D King Kong"
              ].map((game) => (
                <div key={game} className="text-center p-2 bg-background/20 rounded-md">
                  <span className="text-sm font-medium text-muted-foreground">{game}</span>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Roadmap Preview */}
          <section>
            <h3 className="text-lg font-semibold text-arcade-gold mb-3">Development Roadmap</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                <span className="text-sm">✅ Core 3D Games & Blockchain Integration</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-arcade-gold rounded-full"></div>
                <span className="text-sm">🔄 Advanced Gaming Features & Tournaments</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-neon-blue rounded-full"></div>
                <span className="text-sm">📋 Enhanced Security & Performance Optimization</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                <span className="text-sm">🔮 Platform Expansion & Community Features</span>
              </div>
            </div>
          </section>

          {/* Documentation Links */}
          <section>
            <h3 className="text-lg font-semibold text-arcade-gold mb-3">Documentation</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-between" disabled>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Platform White Paper
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </Button>
              
              <Button variant="outline" className="w-full justify-between" disabled>
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Tokenomics White Paper
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-between border-neon-blue text-neon-blue hover:bg-neon-blue/10"
                onClick={() => window.open('https://over.network', '_blank')}
              >
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Over Protocol Official
                </div>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </section>

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="neon" className="px-8">
              Get Started
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};