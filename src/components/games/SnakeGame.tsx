import { SimpleSnake3D } from "./SimpleSnake3D";

interface SnakeGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

export const SnakeGame = (props: SnakeGameProps) => {
  console.log("SnakeGame wrapper loaded - Simple 3D version");
  return <SimpleSnake3D {...props} />;
};