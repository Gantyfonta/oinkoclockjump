
export interface Vector {
  x: number;
  y: number;
}

export interface ClockEntity {
  id: string;
  x: number;
  y: number;
  radius: number;
  angle: number;
  rotationSpeed: number;
  color: string;
}

export interface PigEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  attachedTo: string | null; // ID of the clock
  jumpAngle: number; // Angle relative to clock center if attached
}

export enum GameStatus {
  START,
  PLAYING,
  GAMEOVER
}

export interface GameState {
  status: GameStatus;
  score: number;
  highScore: number;
  pig: PigEntity;
  clocks: ClockEntity[];
  cameraY: number;
}
