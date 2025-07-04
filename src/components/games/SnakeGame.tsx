import { Snake3DGame } from "./Snake3DGame";

interface SnakeGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

export const SnakeGame = (props: SnakeGameProps) => {
  return <Snake3DGame {...props} />;
};