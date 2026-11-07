/**
 * Character editor: big live preview (rotatable + walk animation) and
 * option groups. Every change re-renders the preview immediately.
 */
import {
  ACCESSORIES,
  BACKPACKS,
  CLOTH_COLORS,
  GLASSES,
  HAIR_COLORS,
  HAIR_STYLES,
  HATS,
  PANTS,
  PANTS_COLORS,
  PRESETS,
  SHOE_COLORS,
  SHOES,
  SKIN_TONES,
  TOPS,
  randomAppearance,
  sanitizeName,
  type Appearance,
} from '../character/appearance';
import { drawPreview, type Facing } from '../character/avatarRenderer';
import { play } from '../core/audio';
import { session, setAppearance } from '../core/session';
import { h, openModal, toast } from './dom';

const LABELS: Record<string, string> = {
  tshirt: 'T-shirt',
  hoodie: 'Hoodie',
  jacket: 'Jacket',
  varsity: 'Varsity',
  hightops: 'High-tops',
  shades: 'Sunglasses',
  none: 'None',
};
const label = (v: string) => LABELS[v] ?? v;

export function openCharacterEditor(opts: { cta?: string; onDone?: () => void } = {}) {
  let look: Appearance = { ...session.appearance };
  let facing: Facing = 'front';
  let walking = true;
  let flip = false;
  let raf = 0;
  let frame = 0;
  let last = 0;

  const preview = h('canvas', { width: 320, height: 480, 'aria-label': 'Character preview' });
  const draw = () => {
    const ctx = preview.getContext('2d')!;
    ctx.save();
    if (flip && facing === 'side') {
      ctx.translate(preview.width, 0);
      ctx.scale(-1, 1);
    }
    drawPreview(preview, look, facing, walking ? 1 + (frame % 4) : 0);
    ctx.restore();
  };
  const loop = (t: number) => {
    if (t - last > 150) {
      frame++;
      last = t;
      draw();
    }
    raf = requestAnimationFrame(loop);
  };

  const groups = h('div');
  const nameInput = h('input', { class: 'field', maxlength: 16, value: look.name, 'aria-label': 'Nickname', placeholder: 'Your nickname' }) as HTMLInputElement;
  nameInput.addEventListener('input', () => {
    look.name = nameInput.value;
  });

  const set = <K extends keyof Appearance>(k: K, v: Appearance[K]) => {
    look = { ...look, [k]: v };
    play('click');
    rebuild();
    draw();
  };

  const chips = <K extends keyof Appearance>(title: string, key: K, values: readonly string[]) =>
    h(
      'div',
      { class: 'opt-group' },
      h('div', { class: 'opt-label', text: title }),
      h('div', { class: 'chips' }, ...values.map((v) => h('button', { class: 'chip' + (look[key] === v ? ' on' : ''), onclick: () => set(key, v as Appearance[K]), text: label(v) }))),
    );
  const swatches = <K extends keyof Appearance>(title: string, key: K, values: string[]) =>
    h(
      'div',
      { class: 'opt-group' },
      h('div', { class: 'opt-label', text: title }),
      h(
        'div',
        { class: 'swatches' },
        ...values.map((c) => h('button', { class: 'swatch' + (look[key] === c ? ' on' : ''), style: `background:${c}`, 'aria-label': `${title} ${c}`, onclick: () => set(key, c as Appearance[K]) })),
      ),
    );

  const presetRow = h(
    'div',
    { class: 'presets' },
    ...PRESETS.map((p) => {
      const c = h('canvas', { width: 112, height: 168 });
      drawPreview(c, { name: '', ...p.look }, 'front', 0);
      return h(
        'button',
        {
          class: 'preset',
          onclick: () => {
            look = { ...look, ...p.look };
            play('click');
            rebuild();
            draw();
          },
        },
        c,
        p.label,
      );
    }),
  );

  function rebuild() {
    groups.replaceChildren(
      h('div', { class: 'section-title', text: '✨ Quick presets' }),
      presetRow,
      h('div', { class: 'section-title', text: '💇 Hair & face' }),
      chips('Hairstyle', 'hair', HAIR_STYLES),
      swatches('Hair color', 'hairColor', HAIR_COLORS),
      swatches('Skin tone', 'skin', SKIN_TONES),
      chips('Glasses', 'glasses', GLASSES),
      h('div', { class: 'section-title', text: '👕 Outfit' }),
      chips('Top', 'top', TOPS),
      swatches('Top color', 'topColor', CLOTH_COLORS),
      chips('Bottoms', 'pants', PANTS),
      swatches('Bottoms color', 'pantsColor', PANTS_COLORS),
      chips('Shoes', 'shoes', SHOES),
      swatches('Shoes color', 'shoesColor', SHOE_COLORS),
      h('div', { class: 'section-title', text: '🎒 Accessories' }),
      chips('Hat', 'hat', HATS),
      chips('Backpack', 'backpack', BACKPACKS),
      chips('Extra', 'accessory', ACCESSORIES),
      swatches('Accessory color (hat, bag, scarf…)', 'accentColor', CLOTH_COLORS),
    );
  }
  rebuild();

  const rotate = (dir: 1 | -1) => {
    const order: [Facing, boolean][] = [
      ['front', false],
      ['side', false],
      ['back', false],
      ['side', true],
    ];
    const i = order.findIndex(([f, fl]) => f === facing && (f !== 'side' || fl === flip));
    const n = order[(i + dir + order.length) % order.length];
    facing = n[0];
    flip = n[1];
    draw();
  };
  const walkBtn = h('button', { class: 'btn small ghost', text: '⏸ Pose' });
  walkBtn.addEventListener('click', () => {
    walking = !walking;
    walkBtn.textContent = walking ? '⏸ Pose' : '▶ Walk';
    draw();
  });

  const body = h(
    'div',
    { class: 'editor' },
    h(
      'div',
      { class: 'editor-preview' },
      preview,
      h(
        'div',
        {},
        h(
          'div',
          { class: 'controls' },
          h('button', { class: 'btn small ghost', 'aria-label': 'Rotate left', onclick: () => rotate(-1), text: '⟲' }),
          walkBtn,
          h('button', { class: 'btn small ghost', 'aria-label': 'Rotate right', onclick: () => rotate(1), text: '⟳' }),
        ),
        h('div', { class: 'opt-group', style: 'margin-top:12px;text-align:left' }, h('div', { class: 'opt-label', text: 'Nickname' }), nameInput, h('div', { class: 'muted', style: 'margin-top:4px', text: 'No real names needed — pick a fun guest name.' })),
      ),
    ),
    groups,
  );

  const save = () => {
    const name = sanitizeName(look.name);
    if (name === 'Guest' && look.name.trim().toLowerCase() !== 'guest') {
      toast('Nickname needs 2–16 letters or numbers.', 'warn');
      nameInput.focus();
      return;
    }
    look.name = name;
    setAppearance(look);
    play('stamp');
    m.close();
    opts.onDone?.();
  };

  const m = openModal({
    title: 'My Character',
    icon: '🎨',
    wide: true,
    body,
    foot: h(
      'div',
      { class: 'row' },
      h(
        'button',
        {
          class: 'btn ghost',
          onclick: () => {
            look = randomAppearance(look.name);
            play('click');
            rebuild();
            draw();
          },
          text: '🎲 Randomize',
        },
      ),
      h('button', { class: 'btn gold', onclick: save, text: opts.cta ?? '💾 Save Character' }),
    ),
    onClose: () => cancelAnimationFrame(raf),
  });
  draw();
  raf = requestAnimationFrame(loop);
}
