import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pause, Play, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

interface FroggerGameProps {
  onScoreChange: (score: number) => void;
  onGameEnd: (finalScore: number) => void;
  onGameStart?: () => boolean;
  chipCost?: number;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 700;
const GRID_SIZE = 50;
const ROWS = 14;
const COLS = 12;

interface Frog {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  animating: boolean;
  safe: boolean;
}

interface Vehicle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: 'car' | 'truck' | 'bus';
  color: string;
  lane: number;
}

interface Log {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  lane: number;
}

interface Turtle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  diving: boolean;
  diveTimer: number;
  lane: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export const FroggerGame = ({ onScoreChange, onGameEnd, onGameStart, chipCost = 1 }: FroggerGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3); // 1 chip = 3 lives
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [bestRow, setBestRow] = useState(ROWS - 1);

  // Game objects
  const [frog, setFrog] = useState<Frog>({
    x: CANVAS_WIDTH / 2 - GRID_SIZE / 2,
    y: (ROWS - 1) * GRID_SIZE,
    gridX: Math.floor(COLS / 2),
    gridY: ROWS - 1,
    animating: false,
    safe: false
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [turtles, setTurtles] = useState<Turtle[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});

  // Generate level data
  const generateVehicles = useCallback(() => {
    const newVehicles: Vehicle[] = [];
    const roadLanes = [8, 9, 10, 11, 12]; // Road section
    
    roadLanes.forEach((lane, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      const speed = (2 + Math.random() * 3) * direction * level * 0.5;
      const spacing = 150 + Math.random() * 100;
      
      for (let i = 0; i < 3; i++) {
        const vehicleTypes = ['car', 'truck', 'bus'] as const;
        const type = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
        const colors = ['hsl(0, 80%, 50%)', 'hsl(120, 80%, 40%)', 'hsl(240, 80%, 50%)', 'hsl(45, 100%, 50%)'];
        
        let width = GRID_SIZE;
        if (type === 'truck') width = GRID_SIZE * 1.5;
        if (type === 'bus') width = GRID_SIZE * 2;
        
        newVehicles.push({
          x: direction > 0 ? -width - (i * spacing) : CANVAS_WIDTH + (i * spacing),
          y: lane * GRID_SIZE + 5,
          width,
          height: GRID_SIZE - 10,
          speed,
          type,
          color: colors[Math.floor(Math.random() * colors.length)],
          lane
        });
      }
    });
    
    setVehicles(newVehicles);
  }, [level]);

  const generateWaterObjects = useCallback(() => {
    const newLogs: Log[] = [];
    const newTurtles: Turtle[] = [];
    const waterLanes = [2, 3, 4, 5, 6]; // Water section
    
    waterLanes.forEach((lane, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      const speed = (1 + Math.random() * 2) * direction;
      const spacing = 120 + Math.random() * 80;
      
      for (let i = 0; i < 4; i++) {
        if (Math.random() < 0.6) {
          // Logs
          const width = GRID_SIZE * (2 + Math.random());
          newLogs.push({
            x: direction > 0 ? -width - (i * spacing) : CANVAS_WIDTH + (i * spacing),
            y: lane * GRID_SIZE + 10,
            width,
            height: GRID_SIZE - 20,
            speed,
            lane
          });
        } else {
          // Turtles
          newTurtles.push({
            x: direction > 0 ? -GRID_SIZE - (i * spacing) : CANVAS_WIDTH + (i * spacing),
            y: lane * GRID_SIZE + 5,
            width: GRID_SIZE - 10,
            height: GRID_SIZE - 10,
            speed,
            diving: false,
            diveTimer: Math.random() * 180 + 120,
            lane
          });
        }
      }
    });
    
    setLogs(newLogs);
    setTurtles(newTurtles);
  }, [level]);

  // Add particles effect
  const addParticles = useCallback((x: number, y: number, color: string, count = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * -8 - 2,
        life: 30 + Math.random() * 20,
        color
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Game rendering
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'hsl(120, 50%, 30%)'; // Grass color
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw game areas
    // Safe zones (grass)
    ctx.fillStyle = 'hsl(120, 50%, 35%)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, GRID_SIZE); // Top goal
    ctx.fillRect(0, 7 * GRID_SIZE, CANVAS_WIDTH, GRID_SIZE); // Middle safe zone
    ctx.fillRect(0, (ROWS - 1) * GRID_SIZE, CANVAS_WIDTH, GRID_SIZE); // Bottom start

    // Road section
    ctx.fillStyle = 'hsl(0, 0%, 20%)';
    ctx.fillRect(0, 8 * GRID_SIZE, CANVAS_WIDTH, 5 * GRID_SIZE);
    
    // Road lines
    ctx.strokeStyle = 'hsl(60, 100%, 80%)';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 10]);
    for (let i = 9; i < 13; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * GRID_SIZE);
      ctx.lineTo(CANVAS_WIDTH, i * GRID_SIZE);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Water section
    const waterGradient = ctx.createLinearGradient(0, 2 * GRID_SIZE, 0, 7 * GRID_SIZE);
    waterGradient.addColorStop(0, 'hsl(200, 80%, 40%)');
    waterGradient.addColorStop(0.5, 'hsl(200, 80%, 50%)');
    waterGradient.addColorStop(1, 'hsl(200, 80%, 35%)');
    ctx.fillStyle = waterGradient;
    ctx.fillRect(0, 2 * GRID_SIZE, CANVAS_WIDTH, 5 * GRID_SIZE);

    // Water ripples
    const time = Date.now() * 0.005;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const y = 2 * GRID_SIZE + (i * 25);
      ctx.beginPath();
      for (let x = 0; x < CANVAS_WIDTH; x += 10) {
        const waveY = y + Math.sin((x * 0.02) + time + i) * 5;
        if (x === 0) ctx.moveTo(x, waveY);
        else ctx.lineTo(x, waveY);
      }
      ctx.stroke();
    }

    // Goal area lily pads
    ctx.fillStyle = 'hsl(120, 60%, 40%)';
    for (let i = 1; i < COLS - 1; i += 2) {
      ctx.beginPath();
      ctx.arc(i * GRID_SIZE + GRID_SIZE/2, GRID_SIZE/2, GRID_SIZE/3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw logs
    logs.forEach(log => {
      const logGradient = ctx.createLinearGradient(log.x, log.y, log.x, log.y + log.height);
      logGradient.addColorStop(0, 'hsl(30, 60%, 45%)');
      logGradient.addColorStop(0.5, 'hsl(30, 60%, 35%)');
      logGradient.addColorStop(1, 'hsl(30, 60%, 25%)');
      
      ctx.fillStyle = logGradient;
      ctx.fillRect(log.x, log.y, log.width, log.height);
      
      // Log texture lines
      ctx.strokeStyle = 'hsl(30, 60%, 20%)';
      ctx.lineWidth = 2;
      for (let i = 0; i < log.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(log.x + i, log.y);
        ctx.lineTo(log.x + i, log.y + log.height);
        ctx.stroke();
      }
    });

    // Draw turtles
    turtles.forEach(turtle => {
      if (!turtle.diving) {
        const turtleColor = turtle.diving ? 'hsl(200, 40%, 30%)' : 'hsl(120, 40%, 35%)';
        
        // Turtle shell
        ctx.fillStyle = turtleColor;
        ctx.shadowColor = turtleColor;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(turtle.x + turtle.width/2, turtle.y + turtle.height/2, turtle.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Shell pattern
        ctx.fillStyle = 'hsl(120, 40%, 25%)';
        ctx.beginPath();
        ctx.arc(turtle.x + turtle.width/2, turtle.y + turtle.height/2, turtle.width/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        if (!turtle.diving) {
          ctx.fillStyle = 'white';
          ctx.fillRect(turtle.x + turtle.width/4, turtle.y + turtle.height/4, 4, 4);
          ctx.fillRect(turtle.x + 3*turtle.width/4 - 4, turtle.y + turtle.height/4, 4, 4);
          
          ctx.fillStyle = 'black';
          ctx.fillRect(turtle.x + turtle.width/4 + 1, turtle.y + turtle.height/4 + 1, 2, 2);
          ctx.fillRect(turtle.x + 3*turtle.width/4 - 3, turtle.y + turtle.height/4 + 1, 2, 2);
        }
      }
    });
    ctx.shadowBlur = 0;

    // Draw vehicles
    vehicles.forEach(vehicle => {
      const vehicleGradient = ctx.createLinearGradient(vehicle.x, vehicle.y, vehicle.x, vehicle.y + vehicle.height);
      vehicleGradient.addColorStop(0, vehicle.color);
      vehicleGradient.addColorStop(1, vehicle.color.replace('50%)', '30%)'));
      
      ctx.fillStyle = vehicleGradient;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 5;
      ctx.fillRect(vehicle.x, vehicle.y, vehicle.width, vehicle.height);
      
      // Vehicle details
      ctx.fillStyle = 'hsl(0, 0%, 10%)';
      if (vehicle.speed > 0) {
        // Headlights
        ctx.fillRect(vehicle.x + vehicle.width - 5, vehicle.y + 5, 3, 8);
        ctx.fillRect(vehicle.x + vehicle.width - 5, vehicle.y + vehicle.height - 13, 3, 8);
      } else {
        // Taillights
        ctx.fillStyle = 'hsl(0, 100%, 50%)';
        ctx.fillRect(vehicle.x + 2, vehicle.y + 5, 3, 8);
        ctx.fillRect(vehicle.x + 2, vehicle.y + vehicle.height - 13, 3, 8);
      }
      
      // Windows
      ctx.fillStyle = 'hsl(200, 50%, 70%)';
      ctx.fillRect(vehicle.x + 8, vehicle.y + 8, vehicle.width - 16, vehicle.height - 16);
    });
    ctx.shadowBlur = 0;

    // Draw frog
    const frogBounce = Math.sin(Date.now() * 0.01) * 2;
    
    ctx.save();
    ctx.translate(frog.x + GRID_SIZE/2, frog.y + GRID_SIZE/2);
    
    // Frog shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(-GRID_SIZE/2, GRID_SIZE/2 - 2, GRID_SIZE, 4);
    
    // Frog body
    const frogGradient = ctx.createRadialGradient(0, frogBounce, 0, 0, frogBounce, GRID_SIZE/2);
    frogGradient.addColorStop(0, 'hsl(120, 80%, 50%)');
    frogGradient.addColorStop(1, 'hsl(120, 80%, 35%)');
    
    ctx.fillStyle = frogGradient;
    ctx.shadowColor = 'hsl(120, 80%, 50%)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, frogBounce, GRID_SIZE/2 - 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Frog legs
    ctx.fillStyle = 'hsl(120, 80%, 40%)';
    ctx.fillRect(-GRID_SIZE/2 + 2, frogBounce - 2, 8, 4); // Left leg
    ctx.fillRect(GRID_SIZE/2 - 10, frogBounce - 2, 8, 4); // Right leg
    ctx.fillRect(-2, frogBounce + GRID_SIZE/4, 4, 8); // Bottom legs
    
    // Frog eyes
    ctx.fillStyle = 'hsl(120, 80%, 60%)';
    ctx.beginPath();
    ctx.arc(-8, frogBounce - 8, 4, 0, Math.PI * 2);
    ctx.arc(8, frogBounce - 8, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-8, frogBounce - 8, 2, 0, Math.PI * 2);
    ctx.arc(8, frogBounce - 8, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    ctx.shadowBlur = 0;

    // Draw particles
    particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life / 50;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw UI
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Lives: ${lives}`, 20, 30);
    ctx.fillText(`Time: ${timeLeft}s`, 20, 50);
    ctx.fillText(`Level: ${level}`, 20, 70);

    // Time warning
    if (timeLeft < 10) {
      ctx.fillStyle = 'hsl(0, 100%, 50%)';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`TIME: ${timeLeft}`, CANVAS_WIDTH/2, 40);
    }

  }, [frog, vehicles, logs, turtles, particles, lives, timeLeft, level]);

  // Collision detection
  const checkCollision = useCallback((rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }, []);

  // Move frog
  const moveFrog = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (frog.animating || isPaused || gameOver) return;
    
    setFrog(prevFrog => {
      let newGridX = prevFrog.gridX;
      let newGridY = prevFrog.gridY;
      
      switch (direction) {
        case 'up':
          if (newGridY > 0) newGridY--;
          break;
        case 'down':
          if (newGridY < ROWS - 1) newGridY++;
          break;
        case 'left':
          if (newGridX > 0) newGridX--;
          break;
        case 'right':
          if (newGridX < COLS - 1) newGridX++;
          break;
      }
      
      // Check if movement is valid
      if (newGridX !== prevFrog.gridX || newGridY !== prevFrog.gridY) {
        // Score for forward progress
        if (direction === 'up' && newGridY < bestRow) {
          setBestRow(newGridY);
          const points = (ROWS - newGridY) * 10;
          setScore(prev => {
            const newScore = prev + points;
            onScoreChange(newScore);
            return newScore;
          });
        }
        
        return {
          ...prevFrog,
          gridX: newGridX,
          gridY: newGridY,
          x: newGridX * GRID_SIZE,
          y: newGridY * GRID_SIZE,
          animating: true
        };
      }
      
      return prevFrog;
    });
    
    // Reset animation
    setTimeout(() => {
      setFrog(prev => ({ ...prev, animating: false }));
    }, 100);
  }, [frog.animating, bestRow, isPaused, gameOver, onScoreChange]);

  // Game physics
  const updateGame = useCallback(() => {
    if (isPaused || gameOver) return;

    // Update timer
    setTimeLeft(prev => {
      if (prev <= 1) {
        setLives(livesCount => {
          if (livesCount <= 1) {
            setGameOver(true);
            setIsPlaying(false);
            onGameEnd(score);
            return 0;
          }
          return livesCount - 1;
        });
        
        // Reset frog position
        setFrog(prev => ({
          ...prev,
          gridX: Math.floor(COLS / 2),
          gridY: ROWS - 1,
          x: Math.floor(COLS / 2) * GRID_SIZE,
          y: (ROWS - 1) * GRID_SIZE
        }));
        
        return 60; // Reset timer
      }
      return prev - 1;
    });

    // Update vehicles
    setVehicles(prevVehicles => 
      prevVehicles.map(vehicle => {
        let newVehicle = { ...vehicle };
        newVehicle.x += newVehicle.speed;
        
        // Wrap around screen
        if (newVehicle.speed > 0 && newVehicle.x > CANVAS_WIDTH) {
          newVehicle.x = -newVehicle.width;
        } else if (newVehicle.speed < 0 && newVehicle.x + newVehicle.width < 0) {
          newVehicle.x = CANVAS_WIDTH;
        }
        
        return newVehicle;
      })
    );

    // Update logs
    setLogs(prevLogs => 
      prevLogs.map(log => {
        let newLog = { ...log };
        newLog.x += newLog.speed;
        
        // Wrap around screen
        if (newLog.speed > 0 && newLog.x > CANVAS_WIDTH) {
          newLog.x = -newLog.width;
        } else if (newLog.speed < 0 && newLog.x + newLog.width < 0) {
          newLog.x = CANVAS_WIDTH;
        }
        
        return newLog;
      })
    );

    // Update turtles
    setTurtles(prevTurtles => 
      prevTurtles.map(turtle => {
        let newTurtle = { ...turtle };
        newTurtle.x += newTurtle.speed;
        newTurtle.diveTimer--;
        
        // Diving behavior
        if (newTurtle.diveTimer <= 0) {
          newTurtle.diving = !newTurtle.diving;
          newTurtle.diveTimer = newTurtle.diving ? 60 : 120 + Math.random() * 60;
        }
        
        // Wrap around screen
        if (newTurtle.speed > 0 && newTurtle.x > CANVAS_WIDTH) {
          newTurtle.x = -newTurtle.width;
        } else if (newTurtle.speed < 0 && newTurtle.x + newTurtle.width < 0) {
          newTurtle.x = CANVAS_WIDTH;
        }
        
        return newTurtle;
      })
    );

    // Check collisions and game logic
    const frogRect = {
      x: frog.x + 5,
      y: frog.y + 5,
      width: GRID_SIZE - 10,
      height: GRID_SIZE - 10
    };

    // Check vehicle collisions (road area)
    if (frog.gridY >= 8 && frog.gridY <= 12) {
      vehicles.forEach(vehicle => {
        if (checkCollision(frogRect, vehicle)) {
          // Frog hit by vehicle
          setLives(prev => {
            if (prev <= 1) {
              setGameOver(true);
              setIsPlaying(false);
              onGameEnd(score);
              return 0;
            }
            return prev - 1;
          });
          
          addParticles(frog.x + GRID_SIZE/2, frog.y + GRID_SIZE/2, 'hsl(0, 100%, 60%)', 12);
          
          // Reset frog position
          setFrog(prev => ({
            ...prev,
            gridX: Math.floor(COLS / 2),
            gridY: ROWS - 1,
            x: Math.floor(COLS / 2) * GRID_SIZE,
            y: (ROWS - 1) * GRID_SIZE
          }));
          setTimeLeft(60);
          setBestRow(ROWS - 1);
        }
      });
    }

    // Check water area (must be on log or turtle)
    if (frog.gridY >= 2 && frog.gridY <= 6) {
      let onSafeObject = false;
      
      // Check logs
      logs.forEach(log => {
        if (checkCollision(frogRect, log)) {
          onSafeObject = true;
          // Move frog with log
          setFrog(prev => ({
            ...prev,
            x: Math.max(0, Math.min(CANVAS_WIDTH - GRID_SIZE, prev.x + log.speed))
          }));
        }
      });
      
      // Check turtles
      turtles.forEach(turtle => {
        if (checkCollision(frogRect, turtle) && !turtle.diving) {
          onSafeObject = true;
          // Move frog with turtle
          setFrog(prev => ({
            ...prev,
            x: Math.max(0, Math.min(CANVAS_WIDTH - GRID_SIZE, prev.x + turtle.speed))
          }));
        }
      });
      
      // Frog drowned
      if (!onSafeObject) {
        setLives(prev => {
          if (prev <= 1) {
            setGameOver(true);
            setIsPlaying(false);
            onGameEnd(score);
            return 0;
          }
          return prev - 1;
        });
        
        addParticles(frog.x + GRID_SIZE/2, frog.y + GRID_SIZE/2, 'hsl(200, 100%, 60%)', 8);
        
        // Reset frog position
        setFrog(prev => ({
          ...prev,
          gridX: Math.floor(COLS / 2),
          gridY: ROWS - 1,
          x: Math.floor(COLS / 2) * GRID_SIZE,
          y: (ROWS - 1) * GRID_SIZE
        }));
        setTimeLeft(60);
        setBestRow(ROWS - 1);
      }
    }

    // Check goal reached
    if (frog.gridY === 0) {
      const points = 1000 + (timeLeft * 10);
      setScore(prev => {
        const newScore = prev + points;
        onScoreChange(newScore);
        return newScore;
      });
      
      addParticles(frog.x + GRID_SIZE/2, frog.y + GRID_SIZE/2, 'hsl(45, 100%, 60%)', 15);
      
      // Next level
      setLevel(prev => prev + 1);
      setTimeLeft(60);
      setBestRow(ROWS - 1);
      
      // Reset frog position
      setFrog(prev => ({
        ...prev,
        gridX: Math.floor(COLS / 2),
        gridY: ROWS - 1,
        x: Math.floor(COLS / 2) * GRID_SIZE,
        y: (ROWS - 1) * GRID_SIZE
      }));
      
      // Regenerate level with increased difficulty
      setTimeout(() => {
        generateVehicles();
        generateWaterObjects();
      }, 500);
    }

    // Update particles
    setParticles(prevParticles =>
      prevParticles
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.2,
          life: particle.life - 1
        }))
        .filter(particle => particle.life > 0)
    );

  }, [frog, vehicles, logs, turtles, particles, timeLeft, bestRow, score, lives, level, isPaused, gameOver, checkCollision, addParticles, generateVehicles, generateWaterObjects, onScoreChange, onGameEnd]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || gameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          e.preventDefault();
          moveFrog('up');
          break;
        case 'ArrowDown':
        case 's':
          e.preventDefault();
          moveFrog('down');
          break;
        case 'ArrowLeft':
        case 'a':
          e.preventDefault();
          moveFrog('left');
          break;
        case 'ArrowRight':
        case 'd':
          e.preventDefault();
          moveFrog('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveFrog, isPlaying, isPaused, gameOver]);

  // Game loop
  useEffect(() => {
    if (isPlaying && !isPaused && !gameOver) {
      gameLoopRef.current = setInterval(() => {
        updateGame();
      }, 1000); // 1 second intervals for timer
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
  }, [isPlaying, isPaused, gameOver, updateGame]);

  // Render loop
  useEffect(() => {
    const renderLoop = () => {
      render();
      requestAnimationFrame(renderLoop);
    };
    renderLoop();
  }, [render]);

  // Initialize level
  useEffect(() => {
    if (isPlaying) {
      generateVehicles();
      generateWaterObjects();
    }
  }, [isPlaying, generateVehicles, generateWaterObjects]);

  const startGame = () => {
    if (onGameStart && !onGameStart()) {
      return;
    }
    
    setScore(0);
    setLives(3);
    setLevel(1);
    setTimeLeft(60);
    setBestRow(ROWS - 1);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    setFrog({
      x: Math.floor(COLS / 2) * GRID_SIZE,
      y: (ROWS - 1) * GRID_SIZE,
      gridX: Math.floor(COLS / 2),
      gridY: ROWS - 1,
      animating: false,
      safe: false
    });
    setVehicles([]);
    setLogs([]);
    setTurtles([]);
    setParticles([]);
    onScoreChange(0);
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      {/* Game Canvas */}
      <Card className="flex-1 p-6 bg-gradient-card border-neon-green backdrop-glass hover-lift">
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-2xl font-bold text-neon-green animate-text-glow drop-shadow-lg">🐸 Frogger Road Cross</h3>
          
          <div className="bg-gradient-to-br from-background/80 to-background/60 p-6 rounded-xl border-2 border-neon-green shadow-intense backdrop-blur-sm">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="border border-primary/30 rounded-lg bg-gradient-to-br from-background/40 to-background/20"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>

          <div className="flex gap-2">
            {!isPlaying ? (
              <Button onClick={startGame} variant="default" className="animate-neon-pulse">
                <Play className="h-4 w-4 mr-2" />
                Start Crossing
              </Button>
            ) : (
              <Button onClick={pauseGame} variant="secondary">
                {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
            )}
          </div>

          {gameOver && (
            <div className="text-center space-y-2 animate-zoom-in">
              <h3 className="text-xl font-bold text-danger-red">Game Over!</h3>
              <p className="text-muted-foreground">Final Score: {score.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Level Reached: {level}</p>
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
          <p className="text-xl font-bold">{lives}</p>
        </Card>

        <Card className="p-4 bg-gradient-card border-neon-pink">
          <h4 className="font-bold text-neon-pink mb-2">Time Left</h4>
          <p className={`text-xl font-bold ${timeLeft < 10 ? 'text-danger-red animate-pulse' : ''}`}>
            {timeLeft}s
          </p>
        </Card>

        {/* Mobile Controls */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 lg:hidden z-50">
          <Card className="p-3 bg-gradient-card/95 border-neon-green backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-2">
              <div></div>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => moveFrog('up')}
                className="h-12 w-12 border-neon-green text-neon-green hover:bg-neon-green/20"
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
              <div></div>
              
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => moveFrog('left')}
                className="h-12 w-12 border-neon-green text-neon-green hover:bg-neon-green/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => moveFrog('down')}
                className="h-12 w-12 border-neon-green text-neon-green hover:bg-neon-green/20"
              >
                <ArrowDown className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onTouchStart={() => moveFrog('right')}
                className="h-12 w-12 border-neon-green text-neon-green hover:bg-neon-green/20"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="p-4 bg-gradient-card border-border">
          <h4 className="font-bold mb-2">Instructions</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Arrow keys: Move frog</p>
            <p>• Cross roads avoiding cars</p>
            <p>• Jump on logs/turtles in water</p>
            <p>• Reach lily pads at top</p>
            <p>• Watch the timer!</p>
          </div>
        </Card>
      </div>
    </div>
  );
};