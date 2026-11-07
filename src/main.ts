/**
 * BULLSLIFE entry point: boots Phaser (world rendering) and the HTML UI
 * (menus + overlays), and switches between "menu" and "playing" states.
 */
import Phaser from 'phaser';
import './ui/styles.css';
import { unlockAudio } from './core/audio';
import { getNet, session } from './core/session';
import { WorldScene, type WorldData } from './game/WorldScene';
import { openCharacterEditor } from './ui/characterEditor';
import { closeModal } from './ui/dom';
import { createHud } from './ui/hud';
import { createMenu } from './ui/menu';
import { openFriends, openSettings } from './ui/panels';

const dpr = Math.min(window.devicePixelRatio || 1, 2);
// never create a 0x0 canvas (WebGL framebuffers fail on hidden/zero-size windows)
const viewW = () => Math.max(320, window.innerWidth || document.documentElement.clientWidth || 800);
const viewH = () => Math.max(240, window.innerHeight || document.documentElement.clientHeight || 600);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#9fd6ee',
  scale: {
    mode: Phaser.Scale.NONE,
    width: Math.round(viewW() * dpr),
    height: Math.round(viewH() * dpr),
    zoom: 1 / dpr,
  },
  render: { antialias: true, roundPixels: false },
  input: { keyboard: true, touch: true },
  scene: [],
  banner: false,
});
game.registry.set('dpr', dpr);
game.scene.add('world', WorldScene, true, { mode: 'attract', map: 'campus' } satisfies WorldData);

window.addEventListener('resize', () => {
  game.scale.resize(Math.round(viewW() * dpr), Math.round(viewH() * dpr));
  game.scale.setZoom(1 / dpr);
});

// hide boot screen once the first frame is drawn
game.events.once(Phaser.Core.Events.POST_RENDER, () => {
  const boot = document.getElementById('boot');
  boot?.classList.add('hide');
  setTimeout(() => boot?.remove(), 600);
});

const world = () => game.scene.getScene('world') as WorldScene;

// ---------------------------------------------------------------- state machine
let menu: ReturnType<typeof createMenu> | null = null;
let hud: ReturnType<typeof createHud> | null = null;

function showMenu() {
  hud?.destroy();
  hud = null;
  menu = createMenu({
    play: startPlaying,
    character: () => openCharacterEditor(),
    friends: openFriends,
    settings: openSettings,
  });
}

async function startPlaying() {
  unlockAudio();
  if (session.isNewPlayer) {
    // first visit: create your character before entering campus
    openCharacterEditor({ cta: '🏫 Enter Campus', onDone: startPlaying });
    return;
  }
  closeModal();
  menu?.destroy();
  menu = null;
  session.playing = true;
  const net = getNet();
  net.updateMeta({ look: session.appearance });
  void net.connect(session.room);
  world().scene.restart({ mode: 'play', map: 'campus' } satisfies WorldData);
  hud = createHud({
    friends: openFriends,
    character: () => openCharacterEditor(),
    settings: openSettings,
    leave: leaveToMenu,
  });
}

async function leaveToMenu() {
  session.playing = false;
  await getNet().disconnect();
  world().scene.restart({ mode: 'attract', map: 'campus' } satisfies WorldData);
  showMenu();
}

showMenu();

// handy for debugging in the console
(window as any).bullslife = { game, session };
