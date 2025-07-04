import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pause, Play, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

interface PacManGameProps {
  onScoreChange: (score: number) => void;
  onGameEnd: (finalScore: number) => void;
}

const BOARD_WIDTH = 19;
const BOARD_HEIGHT = 15;

// Simple maze layout (1 = wall, 0 = empty, 2 = dot, 3 = power pellet)
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

export const PacManGame = ({ onScoreChange, onGameEnd }: PacManGameProps) => {
  const [pacman, setPacman] = useState({ x: 9, y: 11, direction: { x: 0, y: 0 } });
  const [ghosts, setGhosts] = useState([
    { x: 9, y: 7, direction: { x: 1, y: 0 }, color: 'hsl(0 100% 50%)' },
    { x: 8, y: 7, direction: { x: -1, y: 0 }, color: 'hsl(300 100% 50%)' },
    { x: 10, y: 7, direction: { x: 0, y: 1 }, color: 'hsl(180 100% 50%)' }
  ]);
  const [maze, setMaze] = useState(() => MAZE.map(row => [...row]));
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [powerMode, setPowerMode] = useState(false);
  const [nextDirection, setNextDirection] = useState({ x: 0, y: 0 });
  const gameLoopRef = useRef<NodeJS.Timeout>();

  const isValidMove = useCallback((x: number, y: number) => {
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT && maze[y][x] !== 1;
  }, [maze]);

  const moveGhosts = useCallback(() => {
    setGhosts(currentGhosts => 
      currentGhosts.map(ghost => {
        const possibleMoves = [
          { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
        ].filter(move => 
          isValidMove(ghost.x + move.x, ghost.y + move.y) &&
          !(move.x === -ghost.direction.x && move.y === -ghost.direction.y)
        );

        if (possibleMoves.length === 0) return ghost;

        const nextMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        return {
          ...ghost,
          x: ghost.x + nextMove.x,
          y: ghost.y + nextMove.y,
          direction: nextMove
        };
      })
    );
  }, [isValidMove]);

  const movePacman = useCallback(() => {
    setPacman(currentPacman => {
      let direction = currentPacman.direction;
      
      // Try to change direction if requested
      if (nextDirection.x !== 0 || nextDirection.y !== 0) {
        const newX = currentPacman.x + nextDirection.x;
        const newY = currentPacman.y + nextDirection.y;
        if (isValidMove(newX, newY)) {
          direction = nextDirection;
          setNextDirection({ x: 0, y: 0 });
        }
      }

      const newX = currentPacman.x + direction.x;
      const newY = currentPacman.y + direction.y;

      if (!isValidMove(newX, newY)) {
        return { ...currentPacman, direction: { x: 0, y: 0 } };
      }

      // Tunnel effect for horizontal edges
      const finalX = newX < 0 ? BOARD_WIDTH - 1 : newX >= BOARD_WIDTH ? 0 : newX;

      return {
        x: finalX,
        y: newY,
        direction
      };
    });
  }, [isValidMove, nextDirection]);

  const checkCollisions = useCallback(() => {
    // Check dots
    if (maze[pacman.y][pacman.x] === 2) {
      const newMaze = [...maze];
      newMaze[pacman.y][pacman.x] = 0;
      setMaze(newMaze);
      
      const newScore = score + 10;
      setScore(newScore);
      onScoreChange(newScore);
    }

    // Check power pellets
    if (maze[pacman.y][pacman.x] === 3) {
      const newMaze = [...maze];
      newMaze[pacman.y][pacman.x] = 0;
      setMaze(newMaze);
      
      const newScore = score + 50;
      setScore(newScore);
      onScoreChange(newScore);
      setPowerMode(true);
      
      setTimeout(() => setPowerMode(false), 5000);
    }

    // Check ghost collisions
    const collision = ghosts.some(ghost => 
      ghost.x === pacman.x && ghost.y === pacman.y
    );

    if (collision) {
      if (powerMode) {
        const newScore = score + 100;
        setScore(newScore);
        onScoreChange(newScore);
      } else {
        const newLives = lives - 1;
        setLives(newLives);
        
        if (newLives <= 0) {
          setGameOver(true);
          setIsPlaying(false);
          onGameEnd(score);
        } else {
          // Reset positions
          setPacman({ x: 9, y: 11, direction: { x: 0, y: 0 } });
          setGhosts([
            { x: 9, y: 7, direction: { x: 1, y: 0 }, color: 'hsl(0 100% 50%)' },
            { x: 8, y: 7, direction: { x: -1, y: 0 }, color: 'hsl(300 100% 50%)' },
            { x: 10, y: 7, direction: { x: 0, y: 1 }, color: 'hsl(180 100% 50%)' }
          ]);
        }
      }
    }

    // Check if all dots collected
    const dotsRemaining = maze.flat().filter(cell => cell === 2 || cell === 3).length;
    if (dotsRemaining === 0) {
      setGameOver(true);
      setIsPlaying(false);
      onGameEnd(score + 1000); // Bonus for completing level
    }
  }, [pacman, ghosts, maze, score, lives, powerMode, onScoreChange, onGameEnd]);

  const changeDirection = useCallback((newDirection: { x: number; y: number }) => {
    if (!isPlaying || isPaused || gameOver) return;
    setNextDirection(newDirection);
  }, [isPlaying, isPaused, gameOver]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          changeDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          changeDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          e.preventDefault();
          changeDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [changeDirection, isPlaying, isPaused, gameOver]);

  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      gameLoopRef.current = setInterval(() => {
        movePacman();
        moveGhosts();
        checkCollisions();
      }, 200);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPlaying, isPaused, gameOver, movePacman, moveGhosts, checkCollisions]);

  const startGame = () => {
    setMaze(MAZE.map(row => [...row]));
    setPacman({ x: 9, y: 11, direction: { x: 0, y: 0 } });
    setGhosts([
      { x: 9, y: 7, direction: { x: 1, y: 0 }, color: 'hsl(0 100% 50%)' },
      { x: 8, y: 7, direction: { x: -1, y: 0 }, color: 'hsl(300 100% 50%)' },
      { x: 10, y: 7, direction: { x: 0, y: 1 }, color: 'hsl(180 100% 50%)' }
    ]);
    setScore(0);
    setLives(3);
    setPowerMode(false);
    setNextDirection({ x: 0, y: 0 });
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    onScoreChange(0);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  const renderBoard = () => {
    return maze.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => {
          let content = '';
          let className = 'w-6 h-6 flex items-center justify-center text-xs ';
          
          if (cell === 1) {
            className += 'bg-neon-blue border border-neon-blue/50';
          } else if (cell === 2) {
            className += 'bg-background/20';
            content = '•';
          } else if (cell === 3) {
            className += 'bg-background/20';
            content = '●';
          } else {
            className += 'bg-background/20';
          }

          // Add pacman
          if (pacman.x === x && pacman.y === y) {
            className += ' bg-arcade-gold shadow-neon animate-neon-pulse';
            content = '◉';
          }

          // Add ghosts
          const ghost = ghosts.find(g => g.x === x && g.y === y);
          if (ghost) {
            className += ` shadow-neon ${powerMode ? 'animate-float' : ''}`;
            content = powerMode ? '👻' : '👾';
          }

          return (
            <div key={x} className={className} style={{ color: ghost?.color }}>
              {content}
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      {/* Game Board */}
      <Card className="flex-1 p-6 bg-gradient-card border-primary">
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-2xl font-bold text-primary">Pac-Man</h3>
          
          <div className="bg-background/50 p-4 rounded-lg border-2 border-primary shadow-neon">
            <div className="flex flex-col bg-background/20 p-2 rounded">
              {renderBoard()}
            </div>
          </div>

          <div className="flex gap-2">
            {!isPlaying ? (
              <Button onClick={startGame} variant="default" className="animate-neon-pulse">
                <Play className="h-4 w-4 mr-2" />
                Start Game
              </Button>
            ) : (
              <Button onClick={pauseGame} variant="secondary">
                {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
            )}
          </div>

          {powerMode && (
            <div className="text-center animate-neon-pulse">
              <p className="text-arcade-gold font-bold">POWER MODE!</p>
            </div>
          )}

          {gameOver && (
            <div className="text-center space-y-2 animate-zoom-in">
              <h3 className="text-xl font-bold text-danger-red">Game Over!</h3>
              <p className="text-muted-foreground">Final Score: {score.toLocaleString()}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Game Info */}
      <div className="w-full lg:w-64 space-y-4">
        <Card className="p-4 bg-gradient-card border-neon-blue">
          <h4 className="font-bold text-neon-blue mb-2">Score</h4>
          <p className="text-2xl font-bold text-arcade-gold">{score.toLocaleString()}</p>
        </Card>

        <Card className="p-4 bg-gradient-card border-neon-green">
          <h4 className="font-bold text-neon-green mb-2">Lives</h4>
          <p className="text-xl font-bold">{'◉ '.repeat(lives)}</p>
        </Card>

        {/* Mobile Controls */}
        <Card className="p-4 bg-gradient-card border-arcade-gold lg:hidden">
          <h4 className="font-bold text-arcade-gold mb-4">Controls</h4>
          <div className="grid grid-cols-3 gap-2">
            <div></div>
            <Button 
              variant="outline" 
              size="sm"
              onTouchStart={() => changeDirection({ x: 0, y: -1 })}
              className="h-12"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <div></div>
            
            <Button 
              variant="outline" 
              size="sm"
              onTouchStart={() => changeDirection({ x: -1, y: 0 })}
              className="h-12"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div></div>
            <Button 
              variant="outline" 
              size="sm"
              onTouchStart={() => changeDirection({ x: 1, y: 0 })}
              className="h-12"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <div></div>
            <Button 
              variant="outline" 
              size="sm"
              onTouchStart={() => changeDirection({ x: 0, y: 1 })}
              className="h-12"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <div></div>
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-4 bg-gradient-card border-border">
          <h4 className="font-bold mb-2">Instructions</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Arrow keys: Move Pac-Man</p>
            <p>• Eat dots: 10 points each</p>
            <p>• Power pellets: 50 points</p>
            <p>• Eat ghosts in power mode</p>
            <p>• Avoid ghosts normally</p>
            <p>• Clear all dots to win</p>
          </div>
        </Card>
      </div>
    </div>
  );
};