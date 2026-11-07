/**
 * The main world scene. One scene class renders any map (campus or the
 * Student Union interior); changing location restarts it with another map.
 *
 * Modes:
 *   'attract' — no player; the camera drifts over the campus behind the main menu
 *   'play'    — local player, input, networking, interactions
 */
import Phaser from 'phaser';
import { collectStamp, stampCount, STAMPS } from '../activities/passport';
import { isCoopSolved, plateOccupants, PORTAL_OPEN_MS } from '../activities/coop';
import { play as sfx } from '../core/audio';
import { NET } from '../core/config';
import { bus, getNet, session } from '../core/session';
import { getSettings, settingsEvents } from '../core/settings';
import { isBlocked, isMuted } from '../social/moderation';
import { RES } from './art';
import { Avatar } from './Avatar';
import { depthOf, isInFrontOf, isoToScreen, moveWithCollision, screenDirToGrid } from './iso';
import { buildCampus, COOP, LAKE } from './maps/campus';
import type { Interactable, MapDef, MapId, Trigger } from './maps/types';
import { buildUnion } from './maps/union';
import { ORIGINS, registerAllTextures, renderGround } from './textures';
import { appearanceKey } from '../character/appearance';

const SPEED_PX = 150; // on-screen walking speed (px / second at zoom 1)
const PLAYER_R = 0.28; // collision radius in tiles

const MAP_CACHE = new Map<MapId, MapDef>();
function getMap(id: MapId): MapDef {
  if (!MAP_CACHE.has(id)) {
    const map = id === 'campus' ? buildCampus() : buildUnion();
    // every prop's own collider (trees, benches, furniture) also blocks movement
    const known = new Set(map.colliders);
    for (const p of map.props) if (p.collider && !known.has(p.collider)) map.colliders.push(p.collider);
    MAP_CACHE.set(id, map);
  }
  return MAP_CACHE.get(id)!;
}

interface BuildingRef {
  img: Phaser.GameObjects.Image;
  footprint: { x0: number; y0: number; x1: number; y1: number };
  depth: number;
}

export interface WorldData {
  map?: MapId;
  mode?: 'attract' | 'play';
  spawn?: { x: number; y: number };
}

export class WorldScene extends Phaser.Scene {
  private mapId: MapId = 'campus';
  private mode: 'attract' | 'play' = 'attract';
  private spawn?: { x: number; y: number };
  private map!: MapDef;
  private player?: Avatar;
  private remotes = new Map<string, Avatar>();
  private remoteLook = new Map<string, string>();
  private buildings: BuildingRef[] = [];
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private currentPrompt: string | null = null;
  private nearInteractable: Interactable | null = null;
  private lastSend = 0;
  private lastSentMoving = false;
  private transitioning = false;
  private plateSprites: Record<'A' | 'B', Phaser.GameObjects.Image | null> = { A: null, B: null };
  private portalSwirl?: Phaser.GameObjects.Image;
  private portalArch?: Phaser.GameObjects.Image;
  private coopWasSolved = false;
  private joystick: { id: number; ox: number; oy: number; vx: number; vy: number } | null = null;
  private joyGfx?: Phaser.GameObjects.Graphics;
  private unsubs: (() => void)[] = [];
  private triggerCooldown = 0;

  constructor() {
    super('world');
  }

  init(data: WorldData) {
    this.mapId = data.map ?? 'campus';
    this.mode = data.mode ?? 'attract';
    this.spawn = data.spawn;
    this.remotes = new Map();
    this.remoteLook = new Map();
    this.buildings = [];
    this.currentPrompt = null;
    this.transitioning = false;
    this.player = undefined;
    this.plateSprites = { A: null, B: null };
    this.portalSwirl = undefined;
    this.portalArch = undefined;
    this.joystick = null;
    this.triggerCooldown = 600;
  }

  create() {
    registerAllTextures(this);
    this.map = getMap(this.mapId);
    this.cameras.main.setBackgroundColor(this.mapId === 'campus' ? '#9fd6ee' : '#2b2233');

    this.buildGround();
    this.buildProps();
    if (this.mapId === 'campus') this.buildCampusLife();
    this.setupCamera();

    if (this.mode === 'play') this.setupPlay();
    else this.startAttract();

    const offSettings = settingsEvents.on('change', () => this.applyZoom());
    this.unsubs.push(offSettings);
    this.scale.on('resize', this.applyZoom, this);
    this.events.once('shutdown', () => {
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
      this.scale.off('resize', this.applyZoom, this);
      bus.emit('prompt', null);
    });
    this.cameras.main.fadeIn(350, 20, 24, 36);
  }

  // ---------------------------------------------------------------- building the world
  private buildGround() {
    const key = 'ground_' + this.mapId;
    const layer = renderGround(this.map);
    if (!this.textures.exists(key)) this.textures.addCanvas(key, layer.canvas);
    this.add.image(layer.offsetX, layer.offsetY, key).setOrigin(0, 0).setDepth(-100000);
  }

  private propDepth(gx: number, gy: number, bias = 0) {
    return this.resolveDepth(gx, gy) + bias;
  }

  /** Depth for small things (avatars, props) taking big building footprints into account. */
  resolveDepth(gx: number, gy: number): number {
    let d = depthOf(gx, gy);
    for (const b of this.buildings) {
      const f = b.footprint;
      if (gx > f.x0 - 1.5 && gy > f.y0 - 1.5 && gx < f.x1 + 4 && gy < f.y1 + 4) {
        if (isInFrontOf(gx, gy, f)) d = Math.max(d, b.depth + 1);
        else d = Math.min(d, b.depth - 1);
      }
    }
    return d;
  }

  private buildProps() {
    // buildings first so other props can sort against them
    for (const p of this.map.props.filter((p) => p.footprint)) {
      const f = p.footprint!;
      const o = ORIGINS.get(p.tex)!;
      const pos = isoToScreen(f.x0, f.y0);
      const img = this.add.image(pos.x, pos.y, p.tex).setOrigin(o.x, o.y).setScale(1 / RES);
      const depth = depthOf(f.x1, f.y1);
      img.setDepth(depth);
      this.buildings.push({ img, footprint: f, depth });
      if (p.label) {
        const c = isoToScreen((f.x0 + f.x1) / 2, (f.y0 + f.y1) / 2);
        this.add
          .text(c.x, c.y - (p.labelHeight ?? 150), p.label, {
            fontFamily: 'Fredoka, Nunito, system-ui, sans-serif',
            fontSize: '15px',
            color: '#ffffff',
            backgroundColor: '#1b2433cc',
            padding: { x: 10, y: 4 },
          })
          .setOrigin(0.5, 1)
          .setResolution(2)
          .setDepth(900000);
      }
    }
    for (const p of this.map.props.filter((p) => !p.footprint)) {
      const o = ORIGINS.get(p.tex);
      if (!o) continue;
      const pos = isoToScreen(p.gx, p.gy);
      const img = this.add.image(pos.x, pos.y, p.tex).setOrigin(o.x, o.y).setScale(1 / RES);
      img.setDepth(this.propDepth(p.gx, p.gy, p.depthBias ?? 0));
      if (p.tex === 'flagpole') {
        const flag = this.add.image(pos.x + 1, pos.y - 58, 'flag').setOrigin(0, 0).setScale(1 / RES).setDepth(img.depth + 1);
        this.tweens.add({ targets: flag, scaleX: { from: 1 / RES, to: 0.86 / RES }, angle: { from: -2, to: 3 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      }
      if (p.tex === 'fountain' && getSettings().quality === 'high') {
        this.add
          .particles(pos.x, pos.y - 24, 'sparkle', {
            speedX: { min: -40, max: 40 },
            speedY: { min: -120, max: -70 },
            gravityY: 260,
            lifespan: 800,
            scale: { start: 0.35, end: 0.05 },
            alpha: { start: 0.9, end: 0 },
            tint: [0xffffff, 0xbfe6ff, 0x8fd0f5],
            frequency: 45,
          })
          .setDepth(img.depth + 1);
      }
      if (p.tex === 'lantern' || p.tex === 'lamp') {
        this.tweens.add({ targets: img, alpha: { from: 1, to: 0.88 }, duration: 1200 + Math.random() * 800, yoyo: true, repeat: -1 });
      }
    }
  }

  private buildCampusLife() {
    // co-op plates
    for (const k of ['A', 'B'] as const) {
      const pos = k === 'A' ? COOP.plateA : COOP.plateB;
      const s = isoToScreen(pos.x, pos.y);
      this.plateSprites[k] = this.add
        .image(s.x, s.y, `plate_${k}_off`)
        .setOrigin(ORIGINS.get('plate_A_off')!.x, ORIGINS.get('plate_A_off')!.y)
        .setScale(1 / RES)
        .setDepth(depthOf(pos.x, pos.y) - 30);
    }
    // portal (arch always visible, swirl only while open)
    const ps = isoToScreen(COOP.portal.x, COOP.portal.y);
    const ao = ORIGINS.get('portal_arch')!;
    this.portalArch = this.add.image(ps.x, ps.y, 'portal_arch').setOrigin(ao.x, ao.y).setScale(1 / RES).setDepth(this.resolveDepth(COOP.portal.x, COOP.portal.y));
    this.portalArch.setAlpha(0.55);
    this.portalSwirl = this.add.image(ps.x, ps.y - 26, 'portal_swirl').setScale(0.9 / RES).setDepth(this.portalArch.depth + 1).setAlpha(0);
    this.tweens.add({ targets: this.portalSwirl, angle: 360, duration: 3000, repeat: -1 });
    // garden return portal swirl (always on)
    const gs = isoToScreen(COOP.gardenReturn.x, COOP.gardenReturn.y);
    const gsw = this.add.image(gs.x, gs.y - 26, 'portal_swirl').setScale(0.9 / RES).setDepth(depthOf(COOP.gardenReturn.x, COOP.gardenReturn.y) + 1);
    this.tweens.add({ targets: gsw, angle: 360, duration: 3000, repeat: -1 });

    const high = getSettings().quality === 'high';
    // lake sparkles
    for (let i = 0; i < (high ? 14 : 5); i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 0.8;
      const s = isoToScreen(LAKE.x + Math.cos(a) * LAKE.rx * r, LAKE.y + Math.sin(a) * LAKE.ry * r);
      const sp = this.add.image(s.x, s.y, 'sparkle').setScale(0.3).setAlpha(0).setDepth(-90000);
      this.tweens.add({ targets: sp, alpha: { from: 0, to: 0.9 }, scale: { from: 0.15, to: 0.4 }, duration: 900, yoyo: true, repeat: -1, delay: Math.random() * 3000, repeatDelay: Math.random() * 2500 });
    }
    // falling autumn leaves
    if (high) {
      const w = this.map.w * 32 + this.map.h * 32;
      this.add
        .particles(0, 0, 'leaf', {
          x: { min: -this.map.h * 32, max: this.map.w * 32 },
          y: { min: -200, max: (this.map.w + this.map.h) * 16 },
          lifespan: 6000,
          speedX: { min: 8, max: 30 },
          speedY: { min: 14, max: 30 },
          rotate: { min: 0, max: 360 },
          scale: { min: 0.5, max: 0.9 },
          alpha: { start: 0, end: 0, ease: (t: number) => Math.sin(t * Math.PI) * 0.9 } as any,
          tint: [0xe8913c, 0xd65d3d, 0xe8bd3a, 0xf2a93b],
          frequency: Math.max(40, 160000 / w),
        })
        .setDepth(950000);
      // drifting cloud shadows
      for (let i = 0; i < 4; i++) {
        const c = this.add.ellipse(Math.random() * 2000 - 1000, Math.random() * 1200, 420, 180, 0x1b2a3a, 0.06).setDepth(940000);
        this.tweens.add({ targets: c, x: c.x + 1400, duration: 60000 + Math.random() * 30000, repeat: -1, onRepeat: () => (c.x = -1600) });
      }
    }
    // little critters (purely decorative — NOT players)
    for (let i = 0; i < (high ? 6 : 2); i++) this.spawnCritter(i % 3 === 0 ? 'squirrel' : 'bird');
  }

  private spawnCritter(tex: 'bird' | 'squirrel') {
    const pick = () => {
      for (let tries = 0; tries < 50; tries++) {
        const x = 2 + Math.random() * (this.map.w - 4);
        const y = 2 + Math.random() * (this.map.h - 4);
        const g = this.map.ground[Math.floor(y)]?.[Math.floor(x)];
        if ((g === 'grass' || g === 'plaza') && !this.map.colliders.some((c) => c.kind === 'rect' && x > c.x0 - 1 && x < c.x1 + 1 && y > c.y0 - 1 && y < c.y1 + 1)) return { x, y };
      }
      return { x: 20, y: 24 };
    };
    let pos = pick();
    const s = isoToScreen(pos.x, pos.y);
    const o = ORIGINS.get(tex)!;
    const img = this.add.image(s.x, s.y, tex).setOrigin(o.x, o.y).setScale(1 / RES).setDepth(this.resolveDepth(pos.x, pos.y));
    const hop = () => {
      if (!img.active) return;
      const near = this.player && Math.hypot(this.player.gx - pos.x, this.player.gy - pos.y) < 2.2;
      if (near && tex === 'bird') {
        // fly away and land elsewhere
        this.tweens.add({
          targets: img,
          y: img.y - 260,
          x: img.x + (Math.random() - 0.5) * 300,
          alpha: 0,
          duration: 900,
          onComplete: () => {
            pos = pick();
            const n = isoToScreen(pos.x, pos.y);
            img.setPosition(n.x, n.y - 200).setAlpha(0).setDepth(this.resolveDepth(pos.x, pos.y));
            this.tweens.add({ targets: img, y: n.y, alpha: 1, duration: 900, delay: 2500, onComplete: () => this.time.delayedCall(800, hop) });
          },
        });
        return;
      }
      const nx = Phaser.Math.Clamp(pos.x + (Math.random() - 0.5) * 1.6, 1, this.map.w - 1);
      const ny = Phaser.Math.Clamp(pos.y + (Math.random() - 0.5) * 1.6, 1, this.map.h - 1);
      const g = this.map.ground[Math.floor(ny)]?.[Math.floor(nx)];
      if (g === 'grass' || g === 'plaza') {
        pos = { x: nx, y: ny };
        const n = isoToScreen(nx, ny);
        img.setFlipX(n.x < img.x);
        this.tweens.add({ targets: img, x: n.x, y: n.y, duration: tex === 'squirrel' ? 380 : 260, ease: 'Sine.Out' });
        this.tweens.add({ targets: img, scaleY: { from: 1 / RES, to: 0.8 / RES }, duration: 120, yoyo: true });
        img.setDepth(this.resolveDepth(nx, ny));
      }
      this.time.delayedCall(500 + Math.random() * 2200, hop);
    };
    this.time.delayedCall(Math.random() * 2000, hop);
  }

  // ---------------------------------------------------------------- camera
  private setupCamera() {
    const cam = this.cameras.main;
    const left = -this.map.h * 32 - 60;
    const right = this.map.w * 32 + 60;
    const top = -(this.map.wallHeight ?? 0) - 260;
    const bottom = (this.map.w + this.map.h) * 16 + 80;
    cam.setBounds(left, top, right - left, bottom - top);
    this.applyZoom();
  }

  private applyZoom() {
    const dpr = (this.game.registry.get('dpr') as number) ?? 1;
    const base = this.mode === 'attract' ? 0.9 : getSettings().zoom * (this.mapId === 'union' ? 1.25 : 1);
    this.cameras.main.setZoom(dpr * base);
  }

  private startAttract() {
    const cam = this.cameras.main;
    const stops = [
      { x: 22, y: 20 },
      { x: 11, y: 12 },
      { x: 33, y: 11 },
      { x: 40, y: 21 },
      { x: 33, y: 34 },
      { x: 24, y: 27 },
    ];
    let i = 0;
    const first = isoToScreen(stops[0].x, stops[0].y);
    cam.centerOn(first.x, first.y);
    const next = () => {
      i = (i + 1) % stops.length;
      const p = isoToScreen(stops[i].x, stops[i].y);
      const startX = cam.midPoint.x;
      const startY = cam.midPoint.y;
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 9000,
        ease: 'Sine.InOut',
        onUpdate: (tw) => {
          const t = tw.getValue() ?? 0;
          cam.centerOn(startX + (p.x - startX) * t, startY + (p.y - startY) * t);
        },
        onComplete: next,
      });
    };
    next();
  }

  // ---------------------------------------------------------------- play mode
  private setupPlay() {
    const spawn = this.spawn ?? this.map.spawn;
    this.player = new Avatar(this, spawn.x, spawn.y, session.appearance, true);
    this.player.setDepth(this.resolveDepth(spawn.x, spawn.y));
    this.cameras.main.startFollow(this.player, false, 0.12, 0.12, 0, 20);

    const kb = this.input.keyboard!;
    kb.disableGlobalCapture(); // never steal keys from the chat input
    const k = (code: number) => kb.addKey(code, false);
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      up: k(K.W),
      down: k(K.S),
      left: k(K.A),
      right: k(K.D),
      up2: k(K.UP),
      down2: k(K.DOWN),
      left2: k(K.LEFT),
      right2: k(K.RIGHT),
      e: k(K.E),
      space: k(K.SPACE),
    };
    const onKey = (ev: KeyboardEvent) => {
      if (isTyping()) return;
      if (ev.code === 'KeyE' || ev.code === 'Space') this.interact();
      const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].indexOf(ev.code);
      if (n >= 0) bus.emit('localEmote', n);
    };
    window.addEventListener('keydown', onKey);
    this.unsubs.push(() => window.removeEventListener('keydown', onKey));

    this.setupTouchJoystick();

    const net = getNet();
    net.updateMeta({ map: this.mapId, plate: null });
    this.sendMove(true);
    this.unsubs.push(
      bus.on('localChat', (text) => this.player?.showBubble(text)),
      bus.on('localEmote', (e) => {
        this.player?.showEmote(e);
        net.sendEmote(e);
        sfx('emote');
      }),
      bus.on('appearance', (a) => this.player?.setLook(a)),
      bus.on('photo', () => this.takePhoto()),
      bus.on('interact', () => this.interact()),
      net.on('chat', (msg) => {
        if (isMuted(msg.id)) return;
        this.remotes.get(msg.id)?.showBubble(msg.text);
      }),
      net.on('emote', (id, e) => {
        if (isMuted(id)) return;
        this.remotes.get(id)?.showEmote(e);
      }),
      net.on('coop', () => this.checkCoop(true)),
    );
    bus.emit('location', this.mapId, this.map.name);
  }

  private setupTouchJoystick() {
    this.joyGfx = this.add.graphics().setScrollFactor(0).setDepth(2_000_000);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!p.wasTouch || this.joystick) return;
      this.joystick = { id: p.id, ox: p.x, oy: p.y, vx: 0, vy: 0 };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.joystick || p.id !== this.joystick.id) return;
      const dx = p.x - this.joystick.ox;
      const dy = p.y - this.joystick.oy;
      const len = Math.hypot(dx, dy);
      const dead = 12;
      this.joystick.vx = len > dead ? dx / len : 0;
      this.joystick.vy = len > dead ? dy / len : 0;
    });
    const end = (p: Phaser.Input.Pointer) => {
      if (this.joystick && p.id === this.joystick.id) this.joystick = null;
    };
    this.input.on('pointerup', end);
    this.input.on('pointerupoutside', end);
  }

  private interact() {
    const it = this.nearInteractable;
    if (!it || !this.player || this.transitioning) return;
    const a = it.action;
    if (a.type === 'stamp') {
      const isNew = collectStamp(a.stamp);
      const info = STAMPS.find((s) => s.id === a.stamp)!;
      if (isNew) {
        sfx('stamp');
        this.celebrate(this.player.x, this.player.y - 60, 24);
        bus.emit('toast', `${info.emoji} Passport stamp: ${info.name}! (${stampCount()}/3)`, 'success');
        bus.emit('openPanel', 'passport');
      } else {
        sfx('click');
        bus.emit('toast', `You already have the ${info.name} stamp.`, 'info');
      }
    } else if (a.type === 'info') {
      sfx('click');
      bus.emit('info', a.text);
    } else if (a.type === 'photo') {
      this.takePhoto();
    }
  }

  private takePhoto() {
    if (!this.player) return;
    let n = 3;
    bus.emit('toast', '📸 Say cheese! 3…', 'info');
    const timer = this.time.addEvent({
      delay: 700,
      repeat: 2,
      callback: () => {
        n--;
        if (n > 0) bus.emit('toast', `📸 ${n}…`, 'info');
        else {
          bus.emit('prompt', null);
          document.body.classList.add('photo-mode');
          this.time.delayedCall(60, () => {
            this.game.renderer.snapshot((image) => {
              document.body.classList.remove('photo-mode');
              sfx('shutter');
              this.cameras.main.flash(250, 255, 255, 255);
              downloadSnapshot(image as HTMLImageElement);
              bus.emit('toast', 'Photo saved to your device (never uploaded).', 'success');
            });
          });
        }
      },
    });
    void timer;
  }

  private celebrate(x: number, y: number, count = 60) {
    const emitter = this.add.particles(x, y, 'confetti', {
      speed: { min: 120, max: 320 },
      angle: { min: 200, max: 340 },
      gravityY: 420,
      lifespan: 1600,
      rotate: { min: 0, max: 360 },
      scale: { min: 0.6, max: 1.1 },
      tint: [0x005bbb, 0xffd75e, 0xd94b4b, 0x3fae6b, 0xff8fb1, 0xffffff],
      emitting: false,
    });
    emitter.setDepth(1_500_000);
    emitter.explode(count);
    this.time.delayedCall(2000, () => emitter.destroy());
  }

  // ---------------------------------------------------------------- per-frame
  update(_time: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    if (this.mode === 'play' && this.player) {
      this.updatePlayer(dt);
      this.updateRemotes(dt);
      if (this.mapId === 'campus') this.checkCoop(false);
    }
  }

  private updatePlayer(dt: number) {
    const p = this.player!;
    let vx = 0;
    let vy = 0;
    if (!isTyping() && !this.transitioning) {
      const k = this.keys;
      if (k.left.isDown || k.left2.isDown) vx -= 1;
      if (k.right.isDown || k.right2.isDown) vx += 1;
      if (k.up.isDown || k.up2.isDown) vy -= 1;
      if (k.down.isDown || k.down2.isDown) vy += 1;
      if (this.joystick) {
        vx += this.joystick.vx;
        vy += this.joystick.vy;
      }
    }
    this.drawJoystick();
    const len = Math.hypot(vx, vy);
    const moving = len > 0.01;
    if (moving) {
      vx = (vx / len) * SPEED_PX;
      vy = (vy / len) * SPEED_PX;
      const g = screenDirToGrid(vx * dt, vy * dt);
      const next = moveWithCollision(p.gx, p.gy, g.dx, g.dy, PLAYER_R, this.map.colliders, { w: this.map.w, h: this.map.h });
      p.setGridPos(next.x, next.y);
      if (Math.abs(vx) > Math.abs(vy) * 0.75) {
        p.facing = 'side';
        p.flip = vx < 0;
      } else p.facing = vy > 0 ? 'front' : 'back';
    }
    p.moving = moving;
    p.tick(dt * 1000);
    p.setDepth(this.resolveDepth(p.gx, p.gy));
    this.fadeOccludingBuildings();

    // network: throttled while moving, one packet on stop, slow heartbeat while idle
    const now = this.time.now;
    if ((moving && now - this.lastSend >= NET.moveSendIntervalMs) || moving !== this.lastSentMoving || now - this.lastSend > NET.idleHeartbeatMs) {
      this.sendMove(false);
    }

    this.triggerCooldown -= dt * 1000;
    if (this.triggerCooldown <= 0) this.checkTriggers();
    this.updatePrompt();
  }

  private sendMove(_force: boolean) {
    const p = this.player;
    if (!p) return;
    this.lastSend = this.time.now;
    this.lastSentMoving = p.moving;
    getNet().sendMove(p.gx, p.gy, p.facing, p.flip, p.moving, this.mapId);
  }

  private drawJoystick() {
    const g = this.joyGfx;
    if (!g) return;
    g.clear();
    const j = this.joystick;
    if (!j) return;
    // pointer coords are in game pixels; graphics are drawn in camera space
    const cam = this.cameras.main;
    const z = cam.zoom;
    const ox = (j.ox - cam.width / 2) / z + cam.width / 2;
    const oy = (j.oy - cam.height / 2) / z + cam.height / 2;
    g.fillStyle(0xffffff, 0.18).fillCircle(ox, oy, 44 / z * (this.game.registry.get('dpr') ?? 1));
    g.fillStyle(0xffffff, 0.55).fillCircle(ox + j.vx * 28, oy + j.vy * 28, 18 / z * (this.game.registry.get('dpr') ?? 1));
  }

  private fadeOccludingBuildings() {
    const p = this.player!;
    for (const b of this.buildings) {
      const f = b.footprint;
      const behind = !isInFrontOf(p.gx, p.gy, f) && p.gx > f.x0 - 3 && p.gy > f.y0 - 3 && p.gx < f.x1 + 1 && p.gy < f.y1 + 1;
      const target = behind ? 0.45 : 1;
      b.img.setAlpha(Phaser.Math.Linear(b.img.alpha, target, 0.15));
    }
  }

  private checkTriggers() {
    if (this.transitioning) return;
    const p = this.player!;
    const hit = this.map.triggers.find((t) => p.gx >= t.x0 && p.gx <= t.x1 && p.gy >= t.y0 && p.gy <= t.y1);
    if (hit) this.runTrigger(hit);
  }

  private runTrigger(t: Trigger) {
    const a = t.action;
    const p = this.player!;
    if (a.type === 'goto') {
      this.transitioning = true;
      sfx('door');
      this.cameras.main.fadeOut(300, 20, 24, 36);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.restart({ map: a.to, mode: 'play', spawn: a.spawn } satisfies WorldData);
      });
    } else if (a.type === 'teleport') {
      if (a.requires === 'portal' && getNet().coopUntil <= Date.now()) return;
      sfx('door');
      this.triggerCooldown = 800;
      this.cameras.main.flash(300, 200, 180, 255);
      p.setGridPos(a.x, a.y);
      this.cameras.main.centerOn(p.x, p.y);
      this.sendMove(true);
      if (t.id === 'portal') bus.emit('toast', '🌸 Welcome to the Secret Garden!', 'success');
    }
  }

  private updatePrompt() {
    const p = this.player!;
    let best: Interactable | null = null;
    let bestD = Infinity;
    for (const it of this.map.interactables) {
      const d = Math.hypot(it.gx - p.gx, it.gy - p.gy);
      if (d < it.radius && d < bestD) {
        best = it;
        bestD = d;
      }
    }
    this.nearInteractable = best;
    let text: string | null = best ? best.prompt : null;
    if (!text && this.mapId === 'campus') text = this.coopPrompt();
    if (text !== this.currentPrompt) {
      this.currentPrompt = text;
      bus.emit('prompt', text && best ? `E|${text}` : text);
    }
  }

  // ---------------------------------------------------------------- co-op
  private coopPrompt(): string | null {
    const p = this.player!;
    const near = Math.hypot(p.gx - 30, p.gy - 34.5) < 7.5;
    if (!near) return null;
    const net = getNet();
    if (net.coopUntil > Date.now()) return `🌀 Portal open! ${Math.ceil((net.coopUntil - Date.now()) / 1000)}s — walk into the arch`;
    const { onA, onB } = plateOccupants(net.allMetas());
    const mine = net.selfMeta.plate;
    if (mine) return `You're on plate ${mine}. Waiting for a teammate on plate ${mine === 'A' ? 'B' : 'A'}…  (A: ${onA.length ? '✅' : '⬜'}  B: ${onB.length ? '✅' : '⬜'})`;
    return `Team Switches: stand on A and B with a friend  (A: ${onA.length ? '✅' : '⬜'}  B: ${onB.length ? '✅' : '⬜'})`;
  }

  private checkCoop(fromNetwork: boolean) {
    const net = getNet();
    const p = this.player;
    if (p && this.mapId === 'campus') {
      let plate: 'A' | 'B' | null = null;
      if (Math.hypot(p.gx - COOP.plateA.x, p.gy - COOP.plateA.y) < COOP.plateRadius) plate = 'A';
      else if (Math.hypot(p.gx - COOP.plateB.x, p.gy - COOP.plateB.y) < COOP.plateRadius) plate = 'B';
      if (plate !== net.selfMeta.plate) {
        net.updateMeta({ plate });
        if (plate) sfx('plate');
      }
    }
    const metas = net.allMetas();
    const { onA, onB } = plateOccupants(metas);
    this.plateSprites.A?.setTexture(onA.length ? 'plate_A_on' : 'plate_A_off');
    this.plateSprites.B?.setTexture(onB.length ? 'plate_B_on' : 'plate_B_off');

    const solved = isCoopSolved(metas);
    const now = Date.now();
    if (solved && !this.coopWasSolved) {
      const until = now + PORTAL_OPEN_MS;
      net.announceCoop(until);
      this.onPortalOpened();
    } else if (fromNetwork && net.coopUntil > now && this.portalSwirl?.alpha === 0) {
      this.onPortalOpened();
    }
    this.coopWasSolved = solved;
    const open = net.coopUntil > now;
    if (this.portalSwirl) {
      const target = open ? 1 : 0;
      if (Math.abs(this.portalSwirl.alpha - target) > 0.01) this.portalSwirl.setAlpha(Phaser.Math.Linear(this.portalSwirl.alpha, target, 0.1));
      this.portalArch?.setAlpha(open ? 1 : 0.55);
    }
  }

  private onPortalOpened() {
    sfx('success');
    const s = isoToScreen(COOP.portal.x, COOP.portal.y);
    this.celebrate(s.x, s.y - 40, 90);
    if (this.player) this.celebrate(this.player.x, this.player.y - 50, 40);
    this.cameras.main.shake(250, 0.004);
    bus.emit('toast', '🎉 Teamwork! The Secret Garden portal is open for 60s!', 'success');
  }

  // ---------------------------------------------------------------- remote players
  private updateRemotes(dt: number) {
    const net = getNet();
    const seen = new Set<string>();
    for (const rp of net.players.values()) {
      if (!rp.meta || !rp.hasPosition || rp.map !== this.mapId || isBlocked(rp.id)) continue;
      seen.add(rp.id);
      let av = this.remotes.get(rp.id);
      const key = appearanceKey(rp.meta.look) + rp.meta.look.name;
      if (!av) {
        av = new Avatar(this, rp.x, rp.y, rp.meta.look, false);
        av.setAlpha(0);
        this.tweens.add({ targets: av, alpha: 1, duration: 300 });
        this.remotes.set(rp.id, av);
        this.remoteLook.set(rp.id, key);
      } else if (this.remoteLook.get(rp.id) !== key) {
        av.setLook(rp.meta.look);
        this.remoteLook.set(rp.id, key);
      }
      // smooth interpolation toward the latest network position
      const dx = rp.x - av.gx;
      const dy = rp.y - av.gy;
      const dist = Math.hypot(dx, dy);
      if (dist > 4) av.setGridPos(rp.x, rp.y);
      else {
        const k = 1 - Math.exp(-dt * 12);
        av.setGridPos(av.gx + dx * k, av.gy + dy * k);
      }
      av.facing = rp.facing;
      av.flip = rp.flip;
      av.moving = rp.moving || dist > 0.08;
      av.tick(dt * 1000);
      av.setDepth(this.resolveDepth(av.gx, av.gy));
    }
    for (const [id, av] of this.remotes) {
      if (!seen.has(id)) {
        av.destroy();
        this.remotes.delete(id);
        this.remoteLook.delete(id);
      }
    }
  }
}

function isTyping(): boolean {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

function downloadSnapshot(image: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);
  // little caption strip
  const h = Math.round(canvas.height * 0.06);
  ctx.fillStyle = 'rgba(0,47,102,0.85)';
  ctx.fillRect(0, canvas.height - h, canvas.width, h);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(h * 0.5)}px system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText(`BULLSLIFE · ${new Date().toLocaleDateString()}`, h * 0.5, canvas.height - h / 2);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bullslife-photo-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, 'image/png');
}

