import { Snake2025 } from "./Snake2025";

interface SnakeGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

export const SnakeGame = (props: SnakeGameProps) => {
  console.log("SnakeGame wrapper loaded - 2025 Ultra Modern version");
  return <Snake2025 {...props} />;
};