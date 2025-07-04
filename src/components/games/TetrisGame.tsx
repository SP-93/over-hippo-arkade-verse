import { Tetris3DGame } from "./Tetris3DGame";

interface TetrisGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

export const TetrisGame = (props: TetrisGameProps) => {
  console.log("TetrisGame wrapper loaded - 3D version");
  return <Tetris3DGame {...props} />;
};