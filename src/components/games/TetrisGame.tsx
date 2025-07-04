import { Tetris3DGame } from "./Tetris3DGame";

interface TetrisGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

export const TetrisGame = (props: TetrisGameProps) => {
  return <Tetris3DGame {...props} />;
};