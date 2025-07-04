import { PseudoSnake3D } from "./PseudoSnake3D";

interface SnakeGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

export const SnakeGame = (props: SnakeGameProps) => {
  console.log("SnakeGame wrapper loaded - CSS 3D version");
  return <PseudoSnake3D {...props} />;
};