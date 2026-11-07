/**
 * The main world scene. One scene class renders any map (the campus or any
 * building interior); changing location restarts it with another map.
 *
 * Modes:
 *   'attract' — no player; the camera drifts over the campus behind the main menu
 *   'play'    — local player, input, networking, interactions
 */
import Phaser from 'phaser';
import { collectStamp, stampCount, STAMPS, STAMP_TOTAL } from '../activities/passport';
import { isCoopSolved, plateOccupants, PORTAL_OPEN_MS } from '../activities/coop';
import { play as sfx } from '../core/audio';
import { NET } from '../core/config';
import { bus, getNet, session } from '../core/session';
import { getSettings, settingsEvents } from '../core/settings';
import { isBlocked, isMuted } from '../social/moderation';
import type { FxKind } from '../net/multiplayer';
import { Avatar, type Pose } from './Avatar';
import { depthOf, isInFrontOf, isoToScreen, moveWithCollision, screenDirToGrid } from './iso';
import { ITEMS, useFlavor } from './items';
import { BUILDING_BY_ID } from './maps/buildings';
import { COOP, LAKE } from './maps/campus';
import { buildMap } from './maps/registry';
import type { Interactable, ItemId, MapDef, MapId, Prop, PropAct, Trigger } from './maps/types';
import { ORIGINS, registerAllTextures, renderGround } from './textures';
import { worldState } from './worldState';
import { appearanceKey } from '../character/appearance';

const SPEED_PX = 160; // on-screen walking speed (px / second at zoom 1)
const SPRINT = 1.75;
const PLAYER_R = 0.28; // collision radius in tiles
const ITEM_MS = 120_000; // how long you carry food / a ball

const MAP_CACHE = new Map<MapId, MapDef>();
function getMap(id: MapId): MapDef {
  if (!MAP_CACHE.has(id)) MAP_CACHE.set(id, buildMap(id));
  return MAP_CACHE.get(id)!;
}

interface BuildingRef {
  img: Phaser.GameObjects.Image;
  footprint: { x0: number; y0: number; x1: number; y1: number };
  depth: number;
}

type Target = { kind: 'interactable'; it: Interactable } | { kind: 'prop'; prop: Prop; act: PropAct };

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
  private target: Target | null = null;
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
  private pose: Pose = 'stand';
  private standPos: { x: number; y: number } | null = null;
  private seatDepthBoost = 0;
  private itemUntil = 0;
  private boardTexts = new Map<string, Phaser.GameObjects.Text>();
  private hoopScore = 0;

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
    this.target = null;
    this.transitioning = false;
    this.player = undefined;
    this.plateSprites = { A: null, B: null };
    this.portalSwirl = undefined;
    this.portalArch = undefined;
    this.joystick = null;
    this.triggerCooldown = 600;
    this.pose = 'stand';
    this.standPos = null;
    this.boardTexts = new Map();
  }

  create() {
    registerAllTextures(this);
    this.map = getMap(this.mapId);
    this.cameras.main.setBackgroundColor(this.mapId === 'campus' ? '#9fd6ee' : '#2b2233');

    this.buildGround();
    this.buildProps();
    this.buildBoards();
    if (this.mapId === 'campus') this.buildCampusLife();
    this.setupCamera();

    if (this.mode === 'play') this.setupPlay();
    else this.startAttract();

    this.unsubs.push(settingsEvents.on('change', () => this.applyZoom()));
    this.scale.on('resize', this.applyZoom, this);
    this.events.once('shutdown', () => {
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
      this.scale.off('resize', this.applyZoom, this);
      bus.emit('prompt', null);
      worldState.me = null;
    });
    this.cameras.main.fadeIn(350, 20, 24, 36);
    worldState.map = this.map;
  }

  // ---------------------------------------------------------------- building the world
  private buildGround() {
    renderGroundCached(this, this.map).forEach((c) => this.add.image(c.x, c.y, c.key).setOrigin(0, 0).setDepth(-100000));
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
      const o = ORIGINS.get(p.tex);
      if (!o) continue;
      const pos = isoToScreen(f.x0, f.y0);
      const img = this.add.image(pos.x, pos.y, p.tex).setOrigin(o.x, o.y).setScale(o.s);
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
    const high = getSettings().quality === 'high';
    for (const p of this.map.props.filter((p) => !p.footprint)) {
      if (!p.tex) continue; // invisible interaction point (e.g. bleacher seats)
      const o = ORIGINS.get(p.tex);
      if (!o) continue;
      const pos = isoToScreen(p.gx, p.gy);
      const img = this.add.image(pos.x, pos.y, p.tex).setOrigin(o.x, o.y).setScale(o.s);
      img.setDepth(this.resolveDepth(p.gx, p.gy) + (p.depthBias ?? 0));
      if (p.tex === 'flagpole') {
        const flag = this.add.image(pos.x + 1, pos.y - 58, 'flag').setOrigin(0, 0).setScale(o.s).setDepth(img.depth + 1);
        this.tweens.add({ targets: flag, scaleX: { from: o.s, to: o.s * 0.86 }, angle: { from: -2, to: 3 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      }
      if (p.tex === 'fountain' && high) {
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

  /** Text layers on whiteboards (shared over the network). */
  private buildBoards() {
    for (const b of this.map.boards ?? []) {
      const s = isoToScreen(b.x, b.y);
      const t = this.add
        .text(s.x, s.y - 42, '', {
          fontFamily: '"Comic Sans MS", "Chalkboard SE", Nunito, sans-serif',
          fontSize: '11px',
          color: '#1f5fbf',
          wordWrap: { width: 96, useAdvancedWrap: true },
          align: 'center',
        })
        .setOrigin(0.5, 1)
        .setResolution(2)
        .setDepth(this.resolveDepth(b.x, b.y) + 0.5);
      this.boardTexts.set(b.id, t);
      t.setText(getNet().boards.get(this.mapId + '|' + b.id) ?? 'Write something!');
    }
  }

  private buildCampusLife() {
    // co-op plates
    for (const k of ['A', 'B'] as const) {
      const pos = k === 'A' ? COOP.plateA : COOP.plateB;
      const s = isoToScreen(pos.x, pos.y);
      const o = ORIGINS.get('plate_A_off')!;
      this.plateSprites[k] = this.add
        .image(s.x, s.y, `plate_${k}_off`)
        .setOrigin(o.x, o.y)
        .setScale(o.s)
        .setDepth(depthOf(pos.x, pos.y) - 30);
    }
    // portal (arch always visible, swirl only while open)
    const ps = isoToScreen(COOP.portal.x, COOP.portal.y);
    const ao = ORIGINS.get('portal_arch')!;
    this.portalArch = this.add.image(ps.x, ps.y, 'portal_arch').setOrigin(ao.x, ao.y).setScale(ao.s).setDepth(this.resolveDepth(COOP.portal.x, COOP.portal.y));
    this.portalArch.setAlpha(0.55);
    this.portalSwirl = this.add.image(ps.x, ps.y - 26, 'portal_swirl').setScale(ao.s * 0.9).setDepth(this.portalArch.depth + 1).setAlpha(0);
    this.tweens.add({ targets: this.portalSwirl, angle: 360, duration: 3000, repeat: -1 });
    const gs = isoToScreen(COOP.gardenReturn.x, COOP.gardenReturn.y);
    const gsw = this.add.image(gs.x, gs.y - 26, 'portal_swirl').setScale(ao.s * 0.9).setDepth(depthOf(COOP.gardenReturn.x, COOP.gardenReturn.y) + 1);
    this.tweens.add({ targets: gsw, angle: 360, duration: 3000, repeat: -1 });

    const high = getSettings().quality === 'high';
    // lake sparkles
    for (let i = 0; i < (high ? 18 : 6); i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 0.8;
      const s = isoToScreen(LAKE.x + Math.cos(a) * LAKE.rx * r, LAKE.y + Math.sin(a) * LAKE.ry * r);
      const sp = this.add.image(s.x, s.y, 'sparkle').setScale(0.3).setAlpha(0).setDepth(-90000);
      this.tweens.add({ targets: sp, alpha: { from: 0, to: 0.9 }, scale: { from: 0.15, to: 0.4 }, duration: 900, yoyo: true, repeat: -1, delay: Math.random() * 3000, repeatDelay: Math.random() * 2500 });
    }
    if (high) {
      // falling autumn leaves follow the camera so they cover the whole (big) campus
      const leaves = this.add
        .particles(0, 0, 'leaf', {
          x: { min: -900, max: 900 },
          y: { min: -600, max: 300 },
          lifespan: 6000,
          speedX: { min: 8, max: 30 },
          speedY: { min: 14, max: 30 },
          rotate: { min: 0, max: 360 },
          scale: { min: 0.5, max: 0.9 },
          alpha: { start: 0, end: 0, ease: (t: number) => Math.sin(t * Math.PI) * 0.9 } as any,
          tint: [0xe8913c, 0xd65d3d, 0xe8bd3a, 0xf2a93b],
          frequency: 90,
        })
        .setDepth(950000);
      const follow = () => leaves.setPosition(this.cameras.main.midPoint.x, this.cameras.main.midPoint.y);
      this.events.on('update', follow);
      this.unsubs.push(() => this.events.off('update', follow));
      for (let i = 0; i < 6; i++) {
        const c = this.add.ellipse(Math.random() * 4000 - 2200, Math.random() * 2400, 420, 180, 0x1b2a3a, 0.06).setDepth(940000);
        this.tweens.add({ targets: c, x: c.x + 2600, duration: 90000 + Math.random() * 30000, repeat: -1, onRepeat: () => (c.x = -2600) });
      }
    }
    for (let i = 0; i < (high ? 12 : 4); i++) this.spawnCritter(i % 3 === 0 ? 'squirrel' : 'bird');
  }

  private spawnCritter(tex: 'bird' | 'squirrel') {
    const pick = () => {
      for (let tries = 0; tries < 50; tries++) {
        const x = 2 + Math.random() * (this.map.w - 4);
        const y = 2 + Math.random() * (this.map.h - 4);
        const g = this.map.ground[Math.floor(y)]?.[Math.floor(x)];
        if ((g === 'grass' || g === 'plaza') && !this.map.colliders.some((c) => c.kind === 'rect' && x > c.x0 - 1 && x < c.x1 + 1 && y > c.y0 - 1 && y < c.y1 + 1)) return { x, y };
      }
      return { x: 44, y: 36 };
    };
    let pos = pick();
    const s = isoToScreen(pos.x, pos.y);
    const o = ORIGINS.get(tex)!;
    const img = this.add.image(s.x, s.y, tex).setOrigin(o.x, o.y).setScale(o.s).setDepth(this.resolveDepth(pos.x, pos.y));
    const hop = () => {
      if (!img.active) return;
      const near = this.player && Math.hypot(this.player.gx - pos.x, this.player.gy - pos.y) < 2.2;
      if (near && tex === 'bird') {
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
        this.tweens.add({ targets: img, scaleY: { from: o.s, to: o.s * 0.8 }, duration: 120, yoyo: true });
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
    const indoor = this.mapId !== 'campus' ? (this.map.w > 20 ? 1 : 1.15) : 1;
    const base = this.mode === 'attract' ? 0.9 : getSettings().zoom * indoor;
    this.cameras.main.setZoom(dpr * base);
  }

  private startAttract() {
    const cam = this.cameras.main;
    const stops = [
      { x: 44, y: 30 },
      { x: 34, y: 28 },
      { x: 35, y: 15 },
      { x: 10, y: 45 },
      { x: 52, y: 46 },
      { x: 70, y: 50 },
      { x: 66, y: 30 },
      { x: 12, y: 6 },
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
        duration: 10000,
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
      shift: k(K.SHIFT),
    };
    const onKey = (ev: KeyboardEvent) => {
      if (isTyping() || ev.repeat) return;
      if (ev.code === 'KeyE' || ev.code === 'Space') this.interact();
      const n = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].indexOf(ev.code);
      if (n >= 0) bus.emit('localEmote', n);
    };
    window.addEventListener('keydown', onKey);
    this.unsubs.push(() => window.removeEventListener('keydown', onKey));

    this.setupTouchJoystick();

    const net = getNet();
    net.updateMeta({ map: this.mapId, plate: null });
    this.sendMove();
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
      net.on('fx', (id, kind, ok, x, y) => {
        const av = this.remotes.get(id);
        if (av) this.playFx(av, kind, ok, { x, y }, false);
      }),
      net.on('board', (map, b, text) => {
        if (map === this.mapId) this.boardTexts.get(b)?.setText(text || 'Write something!');
      }),
    );
    bus.emit('location', this.mapId, this.map.name);
    const b = BUILDING_BY_ID.get(this.mapId);
    if (b) bus.emit('toast', `${b.emoji} ${b.name} — ${b.blurb}`, 'info');
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

  // ---------------------------------------------------------------- interactions
  private interact() {
    const p = this.player;
    if (!p || this.transitioning) return;
    if (this.pose !== 'stand') return this.standUp();
    const t = this.target;
    if (!t) return;
    if (t.kind === 'interactable') return this.useInteractable(t.it);
    const act = t.act;
    const prop = t.prop;
    if (act.kind === 'sit' || act.kind === 'lie') {
      const taken = [...this.remotes.values()].some((r) => r.pose !== 'stand' && Math.hypot(r.gx - prop.gx, r.gy - prop.gy) < 0.35);
      if (taken) {
        bus.emit('toast', act.kind === 'sit' ? 'That seat is taken!' : 'Someone is already napping there 😴', 'warn');
        return;
      }
      this.standPos = { x: p.gx, y: p.gy };
      p.setGridPos(prop.gx, prop.gy);
      this.pose = act.kind === 'sit' ? 'sit' : 'lie';
      p.setPose(this.pose);
      if (act.kind === 'sit') {
        p.facing = act.facing;
        p.flip = !!act.flip;
      }
      this.seatDepthBoost = 0.6;
      sfx('sit');
      if (act.kind === 'lie') bus.emit('toast', '😴 Sweet dreams… press E or move to get up.', 'info');
      this.sendMove();
      return;
    }
    if (act.kind === 'eat') {
      p.setItem(act.item);
      this.itemUntil = Date.now() + ITEM_MS;
      sfx('eat');
      bus.emit('toast', act.text, 'success');
      this.sendMove();
      return;
    }
    // use
    switch (act.use) {
      case 'hoop':
      case 'kick': {
        const tgt = act.target ?? { x: prop.gx, y: prop.gy };
        const ok = Math.random() < (act.use === 'hoop' ? 0.55 : 0.6);
        this.playFx(p, act.use, ok, tgt, true);
        getNet().sendFx(act.use, ok, tgt.x, tgt.y);
        break;
      }
      case 'piano':
      case 'drums':
      case 'shake':
      case 'pingpong':
        this.playFx(p, act.use, true, { x: prop.gx, y: prop.gy }, true);
        getNet().sendFx(act.use, true, prop.gx, prop.gy);
        break;
      case 'whiteboard': {
        const id = act.board!;
        const cur = getNet().boards.get(this.mapId + '|' + id) ?? '';
        bus.emit('askText', 'Write on the whiteboard', cur, (text) => {
          if (text === null) return;
          getNet().setBoard(this.mapId, id, text);
          this.boardTexts.get(id)?.setText(text || 'Write something!');
          sfx('click');
        });
        break;
      }
      case 'book':
        p.setItem('book');
        this.itemUntil = Date.now() + ITEM_MS;
        this.sendMove();
        bus.emit('info', '📖 ' + useFlavor('book', act.text));
        break;
      case 'info':
        sfx('click');
        bus.emit('info', useFlavor('info', act.text));
        break;
      default:
        sfx('click');
        bus.emit('toast', useFlavor(act.use, act.text), 'info');
    }
  }

  private standUp() {
    const p = this.player!;
    if (this.standPos) p.setGridPos(this.standPos.x, this.standPos.y);
    this.standPos = null;
    this.pose = 'stand';
    this.seatDepthBoost = 0;
    p.setPose('stand');
    this.sendMove();
  }

  private useInteractable(it: Interactable) {
    const p = this.player!;
    const a = it.action;
    if (a.type === 'stamp') {
      const isNew = collectStamp(a.stamp);
      const info = STAMPS.find((s) => s.id === a.stamp)!;
      if (isNew) {
        sfx('stamp');
        this.celebrate(p.x, p.y - 60, 24);
        bus.emit('toast', `${info.emoji} Passport stamp: ${info.name}! (${stampCount()}/${STAMP_TOTAL})`, 'success');
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

  /** Visual + audio effect of an interaction, for the local player or a remote one. */
  private playFx(av: Avatar, kind: FxKind, ok: boolean, target: { x: number; y: number }, local: boolean) {
    const near = !local && this.player ? Math.hypot(av.gx - this.player.gx, av.gy - this.player.gy) < 10 : true;
    if (kind === 'hoop' || kind === 'kick') {
      const ball = this.add.text(av.x, av.y - 40, kind === 'hoop' ? '🏀' : '🏈', { fontSize: '18px' }).setOrigin(0.5).setResolution(2).setDepth(1_400_000);
      const t = isoToScreen(target.x, target.y);
      const height = kind === 'hoop' ? 78 : 96;
      const miss = ok ? 0 : (Math.random() < 0.5 ? -1 : 1) * 26;
      const sx = ball.x;
      const sy = ball.y;
      if (local) sfx('kick');
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 900,
        onUpdate: (tw) => {
          const k = tw.getValue() ?? 0;
          const ex = t.x + miss;
          const ey = t.y - height;
          ball.setPosition(sx + (ex - sx) * k, sy + (ey - sy) * k - Math.sin(k * Math.PI) * 90);
          ball.setAngle(k * 540);
        },
        onComplete: () => {
          if (near) sfx(ok ? 'swish' : 'miss');
          this.tweens.add({ targets: ball, y: ball.y + (ok ? 60 : 30), x: ball.x + (ok ? 0 : miss), alpha: 0, duration: 600, onComplete: () => ball.destroy() });
          if (ok) {
            av.floatText(kind === 'hoop' ? '+2' : "It's good!", '#ffd75e');
            if (local) {
              this.hoopScore += kind === 'hoop' ? 2 : 3;
              bus.emit('toast', kind === 'hoop' ? `🏀 Swish! Your score: ${this.hoopScore}` : `🏈 Field goal! Your score: ${this.hoopScore}`, 'success');
            }
          } else if (local) bus.emit('toast', kind === 'hoop' ? '🏀 Clank! Try again.' : '🏈 Wide right… try again!', 'info');
        },
      });
      return;
    }
    if (kind === 'piano' || kind === 'drums') {
      if (near) sfx(kind);
      for (let i = 0; i < 4; i++) this.time.delayedCall(i * 180, () => av.floatText(kind === 'piano' ? ['♪', '♫', '♬'][i % 3] : '🥁', '#ffd75e'));
      return;
    }
    if (kind === 'pingpong') {
      if (near) sfx('ping');
      av.floatText('🏓');
      if (local) bus.emit('toast', '🏓 Rally! 11–9, you win.', 'success');
      return;
    }
    if (kind === 'shake') {
      if (local || near) {
        sfx('quake');
        this.cameras.main.shake(1400, 0.008);
      }
      if (local) bus.emit('toast', '🏗️ Earthquake test running… the model building survived!', 'success');
    }
  }

  private takePhoto() {
    if (!this.player) return;
    let n = 3;
    bus.emit('toast', '📸 Say cheese! 3…', 'info');
    this.time.addEvent({
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
      worldState.me = { x: this.player.gx, y: this.player.gy };
      worldState.others = [...this.remotes.values()].map((r) => ({ x: r.gx, y: r.gy }));
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
    let moving = len > 0.01;
    if (moving && this.pose !== 'stand') this.standUp();
    if (moving) {
      const speed = SPEED_PX * (this.keys.shift.isDown ? SPRINT : 1);
      vx = (vx / len) * speed;
      vy = (vy / len) * speed;
      const g = screenDirToGrid(vx * dt, vy * dt);
      const next = moveWithCollision(p.gx, p.gy, g.dx, g.dy, PLAYER_R, this.map.colliders, { w: this.map.w, h: this.map.h });
      moving = Math.abs(next.x - p.gx) + Math.abs(next.y - p.gy) > 0.0001;
      p.setGridPos(next.x, next.y);
      if (Math.abs(vx) > Math.abs(vy) * 0.75) {
        p.facing = 'side';
        p.flip = vx < 0;
      } else p.facing = vy > 0 ? 'front' : 'back';
      if (!moving) moving = len > 0.01; // keep walking animation against walls
    }
    if (p.item && Date.now() > this.itemUntil) {
      p.setItem(null);
      this.sendMove();
    }
    p.moving = moving;
    p.tick(dt * 1000);
    p.setDepth(this.resolveDepth(p.gx, p.gy) + this.seatDepthBoost);
    this.fadeOccludingBuildings();

    // network: throttled while moving, one packet on stop, slow heartbeat while idle
    const now = this.time.now;
    if ((moving && now - this.lastSend >= NET.moveSendIntervalMs) || moving !== this.lastSentMoving || now - this.lastSend > NET.idleHeartbeatMs) this.sendMove();

    this.triggerCooldown -= dt * 1000;
    if (this.triggerCooldown <= 0 && this.pose === 'stand') this.checkTriggers();
    this.updatePrompt();
  }

  private sendMove() {
    const p = this.player;
    if (!p) return;
    this.lastSend = this.time.now;
    this.lastSentMoving = p.moving;
    getNet().sendMove(p.gx, p.gy, p.facing, p.flip, p.moving, this.mapId, this.pose, p.item);
  }

  private drawJoystick() {
    const g = this.joyGfx;
    if (!g) return;
    g.clear();
    const j = this.joystick;
    if (!j) return;
    const cam = this.cameras.main;
    const z = cam.zoom;
    const dpr = (this.game.registry.get('dpr') as number) ?? 1;
    const ox = (j.ox - cam.width / 2) / z + cam.width / 2;
    const oy = (j.oy - cam.height / 2) / z + cam.height / 2;
    g.fillStyle(0xffffff, 0.18).fillCircle(ox, oy, (44 / z) * dpr);
    g.fillStyle(0xffffff, 0.55).fillCircle(ox + j.vx * 28, oy + j.vy * 28, (18 / z) * dpr);
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
      this.sendMove();
      if (t.id === 'portal') bus.emit('toast', '🌸 Welcome to the Secret Garden!', 'success');
    }
  }

  private updatePrompt() {
    const p = this.player!;
    let best: Target | null = null;
    let bestD = Infinity;
    if (this.pose === 'stand') {
      for (const it of this.map.interactables) {
        const d = Math.hypot(it.gx - p.gx, it.gy - p.gy);
        if (d < it.radius && d < bestD) {
          best = { kind: 'interactable', it };
          bestD = d;
        }
      }
      for (const prop of this.map.props) {
        if (!prop.act) continue;
        const d = Math.hypot(prop.gx - p.gx, prop.gy - p.gy);
        // seats/beds need you close; other things are usable from a bit further
        const reach = prop.reach ?? (prop.act.kind === 'sit' ? 0.9 : 1.3);
        if (d < reach + 0.35 && d - 0.15 < bestD) {
          best = { kind: 'prop', prop, act: prop.act };
          bestD = d - 0.15;
        }
      }
    }
    this.target = best;
    let text: string | null = null;
    if (this.pose === 'sit') text = 'E|Stand up';
    else if (this.pose === 'lie') text = 'E|Get up';
    else if (best?.kind === 'interactable') text = 'E|' + best.it.prompt;
    else if (best?.kind === 'prop') text = 'E|' + actLabel(best.act);
    if (!text && this.mapId === 'campus') text = this.coopPrompt();
    if (text !== this.currentPrompt) {
      this.currentPrompt = text;
      bus.emit('prompt', text);
    }
  }

  // ---------------------------------------------------------------- co-op
  private coopPrompt(): string | null {
    const p = this.player!;
    if (Math.hypot(p.gx - COOP.area.x, p.gy - COOP.area.y) > COOP.area.r) return null;
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
      net.announceCoop(now + PORTAL_OPEN_MS);
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
      const dx = rp.x - av.gx;
      const dy = rp.y - av.gy;
      const dist = Math.hypot(dx, dy);
      if (dist > 4 || rp.pose !== av.pose) av.setGridPos(rp.x, rp.y);
      else {
        const k = 1 - Math.exp(-dt * 12);
        av.setGridPos(av.gx + dx * k, av.gy + dy * k);
      }
      av.facing = rp.facing;
      av.flip = rp.flip;
      av.setPose(rp.pose);
      av.setItem(rp.item);
      av.moving = rp.pose === 'stand' && (rp.moving || dist > 0.08);
      av.tick(dt * 1000);
      av.setDepth(this.resolveDepth(av.gx, av.gy) + (rp.pose === 'stand' ? 0 : 0.6));
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

function actLabel(a: PropAct): string {
  if (a.kind === 'sit') return 'Sit down';
  if (a.kind === 'lie') return 'Lie down';
  if (a.kind === 'eat') return `${a.label} ${ITEMS[a.item as ItemId]}`;
  return a.label;
}

/** Ground canvases are expensive: render each map once and keep the textures. */
function renderGroundCached(scene: Phaser.Scene, map: MapDef): { key: string; x: number; y: number }[] {
  const prefix = 'ground_' + map.id + '_';
  const cached = (scene.registry.get(prefix) as { key: string; x: number; y: number }[] | undefined) ?? null;
  if (cached && cached.every((c) => scene.textures.exists(c.key))) return cached;
  const out = renderGround(map).map((c, i) => {
    const key = prefix + i;
    if (!scene.textures.exists(key)) scene.textures.addCanvas(key, c.canvas);
    return { key, x: c.x, y: c.y };
  });
  scene.registry.set(prefix, out);
  return out;
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
