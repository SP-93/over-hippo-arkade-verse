import { HD2006Tetris } from "./HD2006Tetris";

interface TetrisGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

export const TetrisGame = (props: TetrisGameProps) => {
  console.log("TetrisGame wrapper loaded - 2006 HD version");
  return <HD2006Tetris {...props} />;
};