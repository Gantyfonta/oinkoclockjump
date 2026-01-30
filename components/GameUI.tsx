
import React from 'react';
import { GameStatus } from '../types';

interface GameUIProps {
  status: GameStatus;
  score: number;
  highScore: number;
  onStart: () => void;
}

export const GameUI: React.FC<GameUIProps> = ({ status, score, highScore, onStart }) => {
  if (status === GameStatus.START) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20 text-white p-6 text-center">
        <h1 className="text-6xl font-black mb-4 tracking-tighter text-pink-400 drop-shadow-lg">
          OINK-O-CLOCK
        </h1>
        <div className="bg-white/10 p-4 rounded-xl mb-8">
          <p className="text-xl mb-2">Time your jumps between clocks!</p>
          <p className="text-sm opacity-70">Tap or Press Space to Jump</p>
        </div>
        <button
          onClick={onStart}
          className="bg-pink-500 hover:bg-pink-400 text-white font-bold py-4 px-12 rounded-full text-2xl transition-transform active:scale-95 shadow-xl shadow-pink-500/20"
        >
          OINK START!
        </button>
      </div>
    );
  }

  if (status === GameStatus.GAMEOVER) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/80 backdrop-blur-md z-20 text-white p-6 text-center">
        <h2 className="text-5xl font-black mb-2 text-white">BACON BITS!</h2>
        <p className="text-2xl mb-8">You fell through time...</p>
        
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="bg-black/30 p-4 rounded-lg">
            <p className="text-xs uppercase opacity-60">Score</p>
            <p className="text-4xl font-bold">{score}</p>
          </div>
          <div className="bg-black/30 p-4 rounded-lg">
            <p className="text-xs uppercase opacity-60">Best</p>
            <p className="text-4xl font-bold">{highScore}</p>
          </div>
        </div>

        <button
          onClick={onStart}
          className="bg-white text-pink-600 hover:bg-gray-100 font-black py-4 px-12 rounded-full text-2xl transition-transform active:scale-95 shadow-2xl"
        >
          TRY AGAIN
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none z-10">
      <div className="text-white drop-shadow-md">
        <p className="text-xs uppercase font-bold opacity-70">Score</p>
        <p className="text-4xl font-black">{score}</p>
      </div>
      <div className="text-white text-right drop-shadow-md">
        <p className="text-xs uppercase font-bold opacity-70">High Score</p>
        <p className="text-2xl font-black">{highScore}</p>
      </div>
    </div>
  );
};
