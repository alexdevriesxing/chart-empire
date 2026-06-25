import Phaser from "phaser";
import { EmpireScene } from "./scenes/EmpireScene";

let instance: Phaser.Game | null = null;

export function bootGame(container: HTMLElement): Phaser.Game {
  if (instance) return instance;
  instance = new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    transparent: true,
    backgroundColor: "#080b1a",
    width: container.clientWidth || window.innerWidth,
    height: container.clientHeight || window.innerHeight,
    scene: [EmpireScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false
    }
  });
  return instance;
}

export function destroyGame(): void {
  instance?.destroy(true);
  instance = null;
}
