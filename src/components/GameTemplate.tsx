import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Construction, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GameTemplateProps {
  gameId: string;
  title: string;
  description: string;
  comingSoonDate?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  genre: string;
  features: string[];
}

export const GameTemplate = ({ 
  gameId, 
  title, 
  description, 
  comingSoonDate = "Coming Soon",
  difficulty,
  genre,
  features
}: GameTemplateProps) => {
  const navigate = useNavigate();

  const difficultyColors = {
    Easy: 'text-neon-green border-neon-green',
    Medium: 'text-arcade-gold border-arcade-gold', 
    Hard: 'text-danger-red border-danger-red'
  };

  return (
    <div className="min-h-screen bg-gradient-bg p-4 relative">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Arcade
          </Button>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {title}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 bg-gradient-card border-primary backdrop-glass hover-lift">
          <div className="text-center space-y-6">
            {/* Game Icon */}
            <div className="mx-auto w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-intense animate-float">
              <Construction className="h-10 w-10 text-white" />
            </div>

            {/* Title & Description */}
            <div className="space-y-4">
              <h1 className="text-4xl font-black bg-gradient-hero bg-clip-text text-transparent animate-gradient">
                {title}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {description}
              </p>
            </div>

            {/* Game Info */}
            <div className="flex flex-wrap justify-center gap-4 my-8">
              <Badge className={`px-4 py-2 ${difficultyColors[difficulty]}`}>
                Difficulty: {difficulty}
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-neon-blue border-neon-blue">
                Genre: {genre}
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-neon-pink border-neon-pink">
                <Calendar className="h-4 w-4 mr-2" />
                {comingSoonDate}
              </Badge>
            </div>

            {/* Features */}
            <div className="bg-gradient-to-br from-background/50 to-background/30 p-6 rounded-xl border border-primary/30">
              <h3 className="text-lg font-bold mb-4 text-primary">Planned Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coming Soon Message */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-xl border border-primary/20">
              <Construction className="h-8 w-8 text-primary mx-auto mb-3 animate-bounce" />
              <h3 className="text-xl font-bold text-primary mb-2">Game Under Development</h3>
              <p className="text-muted-foreground">
                This game is currently being developed by our team. We're working hard to bring you an amazing 
                gaming experience. Check back soon for updates!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button 
                variant="default" 
                onClick={() => navigate('/')}
                className="btn-neon"
              >
                Explore Other Games
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  // TODO: Add to wishlist/notification system
                  alert('We\'ll notify you when this game is ready!');
                }}
              >
                Notify Me When Ready
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};