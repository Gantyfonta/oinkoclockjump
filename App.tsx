
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GameStatus, 
  GameState, 
  ClockEntity, 
  PigEntity 
} from './types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PIG_SIZE, 
  JUMP_SPEED, 
  ROTATION_BASE_SPEED, 
  CLOCK_SPACING, 
  CLOCK_RADIUS,
  CLOCK_COLORS
} from './constants';
import { GameUI } from './components/GameUI';

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    status: GameStatus.START,
    score: 0,
    highScore: parseInt(localStorage.getItem('highScore') || '0'),
    pig: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 150, vx: 0, vy: 0, attachedTo: 'c0', jumpAngle: -Math.PI / 2 },
    clocks: [],
    cameraY: 0,
  });

  const requestRef = useRef<number>();
  const stateRef = useRef<GameState>(gameState);

  // Sync ref with state for the game loop
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  const generateClock = (id: string, y: number, index: number): ClockEntity => {
    // Increase speed and vary properties based on difficulty (index)
    const speedMultiplier = 1 + (index * 0.05);
    const direction = index % 2 === 0 ? 1 : -1;
    
    return {
      id,
      x: 50 + Math.random() * (CANVAS_WIDTH - 100),
      y,
      radius: CLOCK_RADIUS,
      angle: Math.random() * Math.PI * 2,
      rotationSpeed: ROTATION_BASE_SPEED * speedMultiplier * direction,
      color: CLOCK_COLORS[index % CLOCK_COLORS.length]
    };
  };

  const initGame = useCallback(() => {
    const initialClocks: ClockEntity[] = [];
    // First clock is always center bottom
    initialClocks.push({
      id: 'c0',
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 150,
      radius: CLOCK_RADIUS,
      angle: -Math.PI / 2,
      rotationSpeed: ROTATION_BASE_SPEED,
      color: CLOCK_COLORS[0]
    });

    // Generate several ahead
    for (let i = 1; i < 6; i++) {
      initialClocks.push(generateClock(`c${i}`, CANVAS_HEIGHT - 150 - i * CLOCK_SPACING, i));
    }

    setGameState(prev => ({
      ...prev,
      status: GameStatus.PLAYING,
      score: 0,
      cameraY: 0,
      clocks: initialClocks,
      pig: { 
        x: CANVAS_WIDTH / 2, 
        y: CANVAS_HEIGHT - 150 + CLOCK_RADIUS, 
        vx: 0, 
        vy: 0, 
        attachedTo: 'c0', 
        jumpAngle: 0 
      }
    }));
  }, []);

  const handleJump = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== GameStatus.PLAYING || !s.pig.attachedTo) return;

    const currentClock = s.clocks.find(c => c.id === s.pig.attachedTo);
    if (!currentClock) return;

    // Jump in direction of current angle
    const angle = currentClock.angle;
    const vx = Math.cos(angle) * JUMP_SPEED;
    const vy = Math.sin(angle) * JUMP_SPEED;

    setGameState(prev => ({
      ...prev,
      pig: {
        ...prev.pig,
        vx,
        vy,
        attachedTo: null
      }
    }));
  }, []);

  const update = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== GameStatus.PLAYING) return;

    let newClocks = s.clocks.map(c => ({
      ...c,
      angle: (c.angle + c.rotationSpeed) % (Math.PI * 2)
    }));

    let newPig = { ...s.pig };
    let newScore = s.score;
    let newStatus = s.status;
    let newCameraY = s.cameraY;

    if (newPig.attachedTo) {
      // Pig rotates with clock
      const clock = newClocks.find(c => c.id === newPig.attachedTo);
      if (clock) {
        newPig.x = clock.x + Math.cos(clock.angle) * clock.radius;
        newPig.y = clock.y + Math.sin(clock.angle) * clock.radius;
      }
    } else {
      // Flying
      newPig.x += newPig.vx;
      newPig.y += newPig.vy;

      // Check for collisions with other clocks
      for (const clock of newClocks) {
        // Don't re-attach to the one we just left immediately if vy/vx hasn't cleared it? 
        // Actually, the logic usually prevents that if we jump outward.
        const dx = newPig.x - clock.x;
        const dy = newPig.y - clock.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < clock.radius + 10) {
          // Snap to clock
          newPig.attachedTo = clock.id;
          newPig.vx = 0;
          newPig.vy = 0;
          
          // If this is a "new" higher clock, increase score
          const clockIndex = parseInt(clock.id.replace('c', ''));
          if (clockIndex > s.score) {
            newScore = clockIndex;
          }
          break;
        }
      }

      // Check bounds
      if (newPig.x < -100 || newPig.x > CANVAS_WIDTH + 100 || newPig.y > s.cameraY + CANVAS_HEIGHT + 100) {
        newStatus = GameStatus.GAMEOVER;
      }
    }

    // Camera follow
    const targetCameraY = Math.min(newPig.y - CANVAS_HEIGHT / 2, newCameraY);
    newCameraY += (targetCameraY - newCameraY) * 0.1;

    // Infinite clock generation
    const lastClock = newClocks[newClocks.length - 1];
    if (lastClock.y > newCameraY - 500) {
      const nextIndex = parseInt(lastClock.id.replace('c', '')) + 1;
      newClocks.push(generateClock(`c${nextIndex}`, lastClock.y - CLOCK_SPACING, nextIndex));
    }
    // Cleanup old clocks
    if (newClocks.length > 15) {
      newClocks.shift();
    }

    // High score check
    let newHighScore = s.highScore;
    if (newStatus === GameStatus.GAMEOVER) {
      if (newScore > s.highScore) {
        newHighScore = newScore;
        localStorage.setItem('highScore', newHighScore.toString());
      }
    }

    setGameState(prev => ({
      ...prev,
      clocks: newClocks,
      pig: newPig,
      score: newScore,
      cameraY: newCameraY,
      status: newStatus,
      highScore: newHighScore
    }));

    requestRef.current = requestAnimationFrame(update);
  }, []);

  useEffect(() => {
    if (gameState.status === GameStatus.PLAYING) {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState.status, update]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (stateRef.current.status === GameStatus.PLAYING) {
          handleJump();
        } else {
          initGame();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump, initGame]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-0">
      <div 
        ref={containerRef}
        className="relative bg-indigo-950 overflow-hidden shadow-2xl rounded-3xl border-8 border-indigo-800"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        onMouseDown={(e) => {
            if (gameState.status === GameStatus.PLAYING) handleJump();
            else initGame();
        }}
        onTouchStart={(e) => {
            if (gameState.status === GameStatus.PLAYING) handleJump();
            else initGame();
        }}
      >
        <GameUI 
          status={gameState.status} 
          score={gameState.score} 
          highScore={gameState.highScore}
          onStart={initGame}
        />

        {/* Game Scene */}
        <svg 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT} 
          className="absolute inset-0"
          viewBox={`0 ${gameState.cameraY} ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        >
          {/* Background Stars/Details */}
          <defs>
            <radialGradient id="clockGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="0.2" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Clocks */}
          {gameState.clocks.map(clock => (
            <g key={clock.id} transform={`translate(${clock.x}, ${clock.y})`}>
              {/* Outer Ring */}
              <circle 
                r={clock.radius} 
                fill="#1e1b4b" 
                stroke={clock.color} 
                strokeWidth="6" 
                className="transition-colors duration-500"
              />
              {/* Inner Glow */}
              <circle r={clock.radius} fill="url(#clockGrad)" />
              
              {/* Clock Numbers (simplified dots) */}
              {[...Array(12)].map((_, i) => (
                <circle 
                  key={i}
                  cx={Math.cos((i * 30 * Math.PI) / 180) * (clock.radius - 12)}
                  cy={Math.sin((i * 30 * Math.PI) / 180) * (clock.radius - 12)}
                  r="2"
                  fill={clock.color}
                  opacity="0.4"
                />
              ))}

              {/* Clock Hand */}
              <line 
                x1="0" 
                y1="0" 
                x2={Math.cos(clock.angle) * clock.radius} 
                y2={Math.sin(clock.angle) * clock.radius} 
                stroke={clock.color} 
                strokeWidth="8"
                strokeLinecap="round"
              />
              <circle r="6" fill={clock.color} />
            </g>
          ))}

          {/* Pig Character */}
          <g transform={`translate(${gameState.pig.x}, ${gameState.pig.y})`}>
            {/* Simple Pig Visual */}
            <g transform={`rotate(${gameState.pig.attachedTo ? 0 : (Math.atan2(gameState.pig.vy, gameState.pig.vx) * 180) / Math.PI + 90})`}>
              {/* Body */}
              <ellipse cx="0" cy="0" rx="18" ry="16" fill="#F472B6" />
              {/* Ears */}
              <path d="M-12 -12 L-18 -20 L-6 -14 Z" fill="#EC4899" />
              <path d="M12 -12 L18 -20 L6 -14 Z" fill="#EC4899" />
              {/* Snout */}
              <ellipse cx="0" cy="4" rx="8" ry="6" fill="#F9A8D4" />
              <circle cx="-3" cy="4" r="1.5" fill="#BE185D" />
              <circle cx="3" cy="4" r="1.5" fill="#BE185D" />
              {/* Eyes */}
              <circle cx="-6" cy="-4" r="2.5" fill="black" />
              <circle cx="6" cy="-4" r="2.5" fill="black" />
            </g>
          </g>
        </svg>

        {/* Ambient Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-indigo-900/40" />
      </div>
    </div>
  );
};

export default App;
