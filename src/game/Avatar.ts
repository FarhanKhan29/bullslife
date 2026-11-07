/**
 * An avatar in the world (local or remote): layered sprite sheet, name tag,
 * speech bubble and emotes. Positions are in GRID space; the container is
 * placed at the projected screen position of the avatar's feet.
 */
import Phaser from 'phaser';
import { appearanceKey, type Appearance } from '../character/appearance';
import { FRAME_H, FRAME_W, renderSpriteSheet, FACINGS, WALK_FRAMES, type Facing } from '../character/avatarRenderer';
import { CHAT } from '../core/config';
import { isoToScreen } from './iso';
import { ITEMS } from './items';
import type { ItemId } from './maps/types';

export type Pose = 'stand' | 'sit' | 'lie';

const SHEET_SCALE = 3;
const DISPLAY_SCALE = 1.3 / SHEET_SCALE;
export const EMOTES = [
  { emoji: '👋', label: 'Hello!' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '❤️', label: 'Heart' },
  { emoji: '❓', label: 'Question' },
  { emoji: '⭐', label: 'Follow me!' },
];

/** Generates (once) and returns the texture key for an appearance. */
export function ensureAvatarTexture(scene: Phaser.Scene, a: Appearance): string {
  const key = appearanceKey(a);
  if (scene.textures.exists(key)) return key;
  const canvas = renderSpriteSheet(a, SHEET_SCALE);
  const tex = scene.textures.addCanvas(key, canvas)!;
  const fw = FRAME_W * SHEET_SCALE;
  const fh = FRAME_H * SHEET_SCALE;
  FACINGS.forEach((facing, row) => {
    for (let f = 0; f <= WALK_FRAMES + 1; f++) tex.add(`${facing}_${f}`, 0, f * fw, row * fh, fw, fh);
  });
  return key;
}

export class Avatar extends Phaser.GameObjects.Container {
  gx: number;
  gy: number;
  facing: Facing = 'front';
  flip = false;
  moving = false;
  readonly isLocal: boolean;
  private sprite: Phaser.GameObjects.Sprite;
  private nameTag: Phaser.GameObjects.Text;
  private bubble: Phaser.GameObjects.Container | null = null;
  private bubbleTimer: Phaser.Time.TimerEvent | null = null;
  private texKey: string;
  private animTime = Math.random() * 1000;
  private ring: Phaser.GameObjects.Ellipse | null = null;
  pose: Pose = 'stand';
  item: ItemId | null = null;
  private itemText: Phaser.GameObjects.Text | null = null;
  private zzzTimer = 0;

  constructor(scene: Phaser.Scene, gx: number, gy: number, look: Appearance, isLocal: boolean) {
    super(scene, 0, 0);
    this.gx = gx;
    this.gy = gy;
    this.isLocal = isLocal;
    this.texKey = ensureAvatarTexture(scene, look);
    if (isLocal) {
      this.ring = scene.add.ellipse(0, 0, 34, 14, 0xffd75e, 0.0).setStrokeStyle(2, 0xffd75e, 0.85);
      this.add(this.ring);
    }
    this.sprite = scene.add.sprite(0, 0, this.texKey, 'front_0');
    this.sprite.setOrigin(0.5, 46 / 48);
    this.sprite.setScale(DISPLAY_SCALE);
    this.nameTag = scene.add
      .text(0, -66, look.name, {
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: isLocal ? '#ffe27a' : '#ffffff',
        stroke: '#1b2433',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 1)
      .setResolution(2);
    this.add([this.sprite, this.nameTag]);
    scene.add.existing(this);
    this.syncPosition();
  }

  setLook(look: Appearance) {
    this.texKey = ensureAvatarTexture(this.scene, look);
    this.sprite.setTexture(this.texKey, `${this.facing}_0`);
    this.nameTag.setText(look.name);
  }

  setGridPos(gx: number, gy: number) {
    this.gx = gx;
    this.gy = gy;
    this.syncPosition();
  }

  syncPosition() {
    const p = isoToScreen(this.gx, this.gy);
    this.setPosition(p.x, p.y);
  }

  /** Advance walk animation and pose. */
  tick(dtMs: number) {
    this.animTime += dtMs;
    if (this.pose === 'lie') {
      // lying on a bed: rotate the idle sprite and puff out a few Zzz
      this.sprite.setFrame('front_0').setFlipX(false).setAngle(-78).setPosition(-4, -14);
      this.nameTag.setY(-44);
      this.zzzTimer -= dtMs;
      if (this.zzzTimer <= 0) {
        this.zzzTimer = 1400;
        const z = this.scene.add.text(-6, -30, 'z', { fontFamily: 'Fredoka, sans-serif', fontSize: '14px', color: '#ffffff', stroke: '#1b2433', strokeThickness: 3 }).setResolution(2);
        this.add(z);
        this.scene.tweens.add({ targets: z, x: 10, y: -64, alpha: 0, scale: 1.6, duration: 1600, onComplete: () => z.destroy() });
      }
    } else {
      const sitting = this.pose === 'sit';
      const frame = sitting ? WALK_FRAMES + 1 : this.moving ? 1 + (Math.floor(this.animTime / 130) % WALK_FRAMES) : 0;
      this.sprite.setFrame(`${this.facing}_${frame}`).setAngle(0).setPosition(0, sitting ? -9 : 0);
      this.sprite.setFlipX(this.facing === 'side' && this.flip);
      this.nameTag.setY(sitting ? -72 : -66);
    }
    if (this.ring) this.ring.setAlpha(this.pose === 'stand' ? 0.55 + Math.sin(this.animTime / 300) * 0.25 : 0);
    if (this.itemText) {
      const side = this.facing === 'side' ? (this.flip ? -12 : 12) : this.facing === 'back' ? -12 : 13;
      this.itemText.setPosition(side, this.pose === 'sit' ? -30 : -24).setVisible(this.pose !== 'lie' && this.facing !== 'back');
    }
  }

  setPose(p: Pose) {
    this.pose = p;
  }

  setItem(item: ItemId | null) {
    if (item === this.item) return;
    this.item = item;
    this.itemText?.destroy();
    this.itemText = null;
    if (item) {
      this.itemText = this.scene.add
        .text(12, -24, ITEMS[item], { fontSize: '16px', fontFamily: 'system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif' })
        .setOrigin(0.5, 1)
        .setResolution(2);
      this.add(this.itemText);
      this.scene.tweens.add({ targets: this.itemText, scale: { from: 0.2, to: 1 }, duration: 220, ease: 'Back.Out' });
    }
  }

  /** Floating effect text (♪, +1, 💥…) above the avatar. */
  floatText(text: string, color = '#ffffff') {
    const t = this.scene.add
      .text((Math.random() - 0.5) * 20, -70, text, { fontFamily: 'Fredoka, system-ui, "Apple Color Emoji", sans-serif', fontSize: '18px', color, stroke: '#1b2433', strokeThickness: 3 })
      .setOrigin(0.5)
      .setResolution(2);
    this.add(t);
    this.scene.tweens.add({ targets: t, y: -110, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
  }

  showBubble(text: string) {
    this.bubble?.destroy();
    this.bubbleTimer?.remove();
    const label = this.scene.add
      .text(0, 0, text, {
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: '13px',
        color: '#1b2433',
        wordWrap: { width: 170, useAdvancedWrap: true },
        align: 'center',
      })
      .setOrigin(0.5, 1)
      .setResolution(2);
    const padX = 10;
    const padY = 6;
    const w = Math.max(40, label.width + padX * 2);
    const h = label.height + padY * 2;
    const g = this.scene.add.graphics();
    g.fillStyle(0x0b1a2e, 0.18);
    g.fillRoundedRect(-w / 2 + 2, -h + 3, w, h, 10);
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(-w / 2, -h, w, h, 10);
    g.fillTriangle(-6, -1, 6, -1, 0, 8);
    g.lineStyle(1.5, 0x1b2433, 0.15);
    g.strokeRoundedRect(-w / 2, -h, w, h, 10);
    label.setPosition(0, -padY);
    const c = this.scene.add.container(0, -88, [g, label]);
    c.setScale(0.6).setAlpha(0);
    this.scene.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 180, ease: 'Back.Out' });
    this.add(c);
    this.bubble = c;
    this.bubbleTimer = this.scene.time.delayedCall(CHAT.bubbleMs, () => {
      this.scene.tweens.add({
        targets: c,
        alpha: 0,
        y: c.y - 10,
        duration: 300,
        onComplete: () => {
          c.destroy();
          if (this.bubble === c) this.bubble = null;
        },
      });
    });
  }

  showEmote(index: number) {
    const e = EMOTES[index];
    if (!e) return;
    const t = this.scene.add
      .text(0, -78, e.emoji, { fontSize: '30px', fontFamily: 'system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif' })
      .setOrigin(0.5, 1)
      .setResolution(2)
      .setScale(0.2);
    this.add(t);
    this.scene.tweens.add({ targets: t, scale: 1, duration: 260, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: t, y: -118, alpha: 0, delay: 1300, duration: 700, onComplete: () => t.destroy() });
    if (index === 4) this.showBubble('⭐ Follow me!');
  }
}
