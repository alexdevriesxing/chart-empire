import Phaser from "phaser";

export class EmpireScene extends Phaser.Scene {
  private glowBars: Phaser.GameObjects.Rectangle[] = [];
  private skyline: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super("empire");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#080b1a");
    this.buildBackdrop();
    this.scale.on("resize", () => this.positionBackdrop());
    window.addEventListener("chart-empire-week", this.celebrate);
    this.events.once("shutdown", () => window.removeEventListener("chart-empire-week", this.celebrate));
  }

  update(time: number): void {
    this.glowBars.forEach((bar, index) => {
      bar.scaleY = 0.35 + Math.abs(Math.sin(time / 520 + index * 0.58)) * 1.25;
    });
  }

  private buildBackdrop(): void {
    for (let index = 0; index < 26; index += 1) {
      const building = this.add.rectangle(0, 0, 40 + (index % 4) * 18, 100 + (index % 7) * 42, index % 3 === 0 ? 0x111c36 : 0x0d1429, 0.92).setOrigin(0.5, 1);
      this.skyline.push(building);
      if (index % 2 === 0) {
        for (let light = 0; light < 4; light += 1) {
          this.add.circle(0, 0, 2, index % 4 === 0 ? 0x18e0ff : 0xff2e88, 0.55).setData({ building: index, light });
        }
      }
    }
    for (let index = 0; index < 32; index += 1) {
      const bar = this.add.rectangle(0, 0, 7, 28 + (index % 5) * 12, index % 3 === 0 ? 0xff2e88 : index % 3 === 1 ? 0x18e0ff : 0x7c3aed, 0.18).setOrigin(0.5, 1);
      this.glowBars.push(bar);
    }
    for (let index = 0; index < 18; index += 1) {
      const particle = this.add.circle(
        Math.random() * this.scale.width,
        Math.random() * this.scale.height,
        1 + Math.random() * 3,
        index % 2 ? 0x18e0ff : 0xff2e88,
        0.34
      );
      this.tweens.add({ targets: particle, y: particle.y - 180, x: particle.x + 30, alpha: 0, duration: 4000 + Math.random() * 5000, repeat: -1, delay: Math.random() * 3000 });
    }
    this.positionBackdrop();
  }

  private positionBackdrop(): void {
    const { width, height } = this.scale;
    this.skyline.forEach((building, index) => {
      building.setPosition((index / (this.skyline.length - 1)) * width, height);
    });
    this.glowBars.forEach((bar, index) => {
      bar.setPosition((index / (this.glowBars.length - 1)) * width, height - 8);
    });
    this.children.list.filter((child) => child instanceof Phaser.GameObjects.Arc && child.getData("building") !== undefined).forEach((child) => {
      const light = child as Phaser.GameObjects.Arc;
      const building = this.skyline[Number(light.getData("building"))];
      const level = Number(light.getData("light"));
      if (building) light.setPosition(building.x + (level % 2 ? 8 : -8), building.y - 24 - level * 22);
    });
  }

  private celebrate = (event: Event): void => {
    const report = (event as CustomEvent<{ peakChart: number | null }>).detail;
    if (!report.peakChart || report.peakChart > 10) return;
    const colors = [0xff2e88, 0x18e0ff, 0x7c3aed, 0xffd166, 0x10b981];
    for (let index = 0; index < 80; index += 1) {
      const piece = this.add.rectangle(this.scale.width / 2, -10, 4 + Math.random() * 7, 10 + Math.random() * 12, colors[index % colors.length]!, 0.9).setRotation(Math.random() * Math.PI);
      this.tweens.add({
        targets: piece,
        x: piece.x + (Math.random() - 0.5) * this.scale.width,
        y: this.scale.height + 50,
        rotation: piece.rotation + Math.PI * 5,
        duration: 1800 + Math.random() * 1300,
        ease: "Cubic.easeIn",
        onComplete: () => piece.destroy()
      });
    }
  };
}
