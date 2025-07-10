import * as THREE from "three";

export interface Mario3DPlayer {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  grounded: boolean;
  lives: number;
  size: number;
  powerUp: 'small' | 'big' | 'fire';
}

export interface Mario3DEnemy {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  type: 'goomba' | 'koopa';
  alive: boolean;
}

export interface Mario3DCoin {
  id: number;
  position: THREE.Vector3;
  collected: boolean;
}

export interface Mario3DPlatform {
  position: THREE.Vector3;
  size: THREE.Vector3;
  type: 'ground' | 'brick' | 'pipe' | 'moving';
}

export interface Mario3DGameProps {
  onScoreChange?: (score: number) => void;
  onGameEnd?: () => void;
  onGameStart?: () => Promise<boolean>;
}