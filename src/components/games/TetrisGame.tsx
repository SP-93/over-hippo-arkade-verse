import { Tetris2025 } from "./Tetris2025";

interface TetrisGameProps {
  onScoreChange?: (score: number) => void;  
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

export const TetrisGame = (props: TetrisGameProps) => {
  console.log("TetrisGame wrapper loaded - 2025 Ultra Modern version");
  return <Tetris2025 {...props} />;
};