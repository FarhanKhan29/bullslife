/**
 * Minimap overlay (top-right). Campus is north-up and interiors are isometric.
 * You are shown in gold, other players in white.
 * Click it or press M to enlarge / shrink.
 */
import { BUILDINGS } from '../game/maps/buildings';
import { LAKE } from '../game/maps/campus';
import type { Ground, MapDef } from '../game/maps/types';
import { worldState } from '../game/worldState';
import { h } from './dom';

const COLORS: Partial<Record<Ground, string>> = {
  grass: '#86c46e',
  garden: '#9fdc88',
  path: '#d6cdbf',
  asphalt: '#6b7078',
  plaza: '#d6ae88',
  water: '#4fa3d6',
  booth: '#f7c45c',
  mat: '#4b5563',
};

export function createMinimap(): { el: HTMLElement; destroy: () => void } {
  const canvas = h('canvas', { width: 560, height: 305, 'aria-label': 'Minimap' }) as HTMLCanvasElement;
  const el = h('div', { class: 'minimap', title: 'Minimap (M)' }, canvas);
  const base = document.createElement('canvas');
  base.width = canvas.width;
  base.height = canvas.height;
  let drawnFor: MapDef | null = null;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let northUp = false;

  const proj = (gx: number, gy: number): [number, number] => northUp
    ? [ox + gx * scale, oy + gy * scale]
    : [ox + (gx - gy) * 32 * scale, oy + (gx + gy) * 16 * scale];

  const drawBase = (map: MapDef) => {
    const ctx = base.getContext('2d')!;
    ctx.clearRect(0, 0, base.width, base.height);
    northUp = map.id === 'campus';
    const worldW = northUp ? map.w : (map.w + map.h) * 32;
    const worldH = northUp ? map.h : (map.w + map.h) * 16;
    scale = Math.min((base.width - 16) / worldW, (base.height - 16) / worldH);
    ox = 8 + (northUp ? 0 : map.h * 32 * scale) + (base.width - 16 - worldW * scale) / 2;
    oy = 8 + (base.height - 16 - worldH * scale) / 2;
    for (let y = 0; y < map.h; y++)
      for (let x = 0; x < map.w; x++) {
        const g = map.ground[y][x];
        ctx.fillStyle = COLORS[g] ?? (map.id === 'campus' ? '#86c46e' : '#b9b7b2');
        if (northUp) {
          const [px, py] = proj(x, y);
          ctx.fillRect(px, py, scale + 0.5, scale + 0.5);
          continue;
        }
        ctx.beginPath();
        ctx.moveTo(...proj(x, y));
        ctx.lineTo(...proj(x + 1, y));
        ctx.lineTo(...proj(x + 1, y + 1));
        ctx.lineTo(...proj(x, y + 1));
        ctx.closePath();
        ctx.fill();
      }
    if (map.id === 'campus') {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const b of BUILDINGS) {
        ctx.fillStyle = '#7a4434';
        const [x, y] = proj(b.x0, b.y0);
        ctx.fillRect(x, y, b.w * scale, b.d * scale);
        const [cx, cy] = proj(b.x0 + b.w / 2, b.y0 + b.d / 2);
        ctx.font = '14px system-ui, "Apple Color Emoji", sans-serif';
        ctx.fillText(b.emoji, cx, cy);
      }
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText('Lake LaSalle', ...proj(LAKE.x, LAKE.y));
      ctx.fillText('↑ N', ox - 26, oy + 12);
    } else {
      // interior: furniture as dots
      ctx.fillStyle = 'rgba(40,40,60,0.45)';
      for (const p of map.props) {
        if (!p.tex) continue;
        const [x, y] = proj(p.gx, p.gy);
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }
    drawnFor = map;
  };

  const render = () => {
    const map = worldState.map;
    if (!map) return;
    if (map !== drawnFor) drawBase(map);
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(base, 0, 0);
    for (const o of worldState.others) {
      const [x, y] = proj(o.x, o.y);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#1b2433';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (worldState.me) {
      const [x, y] = proj(worldState.me.x, worldState.me.y);
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd75e';
      ctx.fill();
      ctx.strokeStyle = '#1b2433';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  };
  const timer = setInterval(render, 250);
  const toggle = () => el.classList.toggle('big');
  el.addEventListener('click', toggle);
  const onKey = (e: KeyboardEvent) => {
    const t = document.activeElement?.tagName;
    if (e.code === 'KeyM' && t !== 'INPUT' && t !== 'TEXTAREA' && t !== 'SELECT') toggle();
  };
  window.addEventListener('keydown', onKey);
  return {
    el,
    destroy() {
      clearInterval(timer);
      window.removeEventListener('keydown', onKey);
      el.remove();
    },
  };
}
