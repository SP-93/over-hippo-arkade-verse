import { HD2006Snake } from "./HD2006Snake";

interface SnakeGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => boolean;
}

export const SnakeGame = (props: SnakeGameProps) => {
  console.log("SnakeGame wrapper loaded - 2006 HD version");
  return <HD2006Snake {...props} />;
};