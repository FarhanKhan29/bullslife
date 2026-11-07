# BULLSLIFE 🐂

**Your Campus. Your People. Your Story.**

A cozy multiplayer isometric campus-life game set on a stylised UB North Campus, built for **UB Hacking 2026**.
Create a student, walk around the whole North Campus, go inside **all 19 buildings**, sit, sleep, eat and play, meet other real players, chat, collect Campus Passport stamps, and team up to open the Secret Garden.

**Play it:** https://bullslife.vercel.app

- **Engine:** Phaser 3 (2D isometric), Vite, TypeScript
- **Multiplayer:** Supabase Realtime (Presence + Broadcast)
- **Art:** 100 % original and procedural (Canvas 2D): avatars, buildings, props, ground. Buildings are stylised from reference photos on Wikimedia Commons: Student Union (rotunda + glass dome, round atrium with the seal and balcony), Capen Hall (stepped brick, ribbon windows), Davis Hall (leaning copper volume), Ellicott's stepped brick towers, Alumni Arena's vault roof and more; paths use the Academic Spine's hexagonal pavers.
- **No accounts, no stored chat, no personal info** — temporary guest identities only

---

## For teammates

1. Accept the GitHub invite, then clone:
   ```bash
   git clone https://github.com/FitsZenin/bullslife.git
   cd bullslife
   npm install
   ```
2. Copy `.env.example` to `.env.local` and paste the Supabase URL + anon key (ask in the team chat — they're public client keys, but keep them out of git).
3. `npm run dev`, then open http://localhost:5173.
4. Work on a branch (`git checkout -b my-feature`), push it, and open a pull request — avoid editing the same file as a teammate at the same time.
5. Every push to `main` automatically redeploys https://bullslife.vercel.app (pull requests get their own preview link).

## Quick start (local)

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open http://localhost:5173.

Without Supabase keys the game runs in **Local mode**: everything works, and multiplayer connects
**browser tabs on the same device** (via `BroadcastChannel`). Open two tabs to try it.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm test` | Unit tests (Vitest) |
| `npm run build` | Type-check + production build into `dist/` |
| `npm run preview` | Serve the production build locally |

## Online multiplayer (Supabase)

1. Create a free project at https://supabase.com.
2. Dashboard → **Project Settings → API**: copy the **Project URL** and the **anon / publishable** key.
3. Copy `.env.example` to `.env.local` and fill in:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
   ```
4. Restart `npm run dev`. The menu badge switches from "Local mode" to "Online multiplayer".

No tables or SQL are required — Realtime Broadcast and Presence work out of the box on public channels.

> ⚠️ Only use the **anon/publishable** key. **Never** put the `service_role` key in `.env` files for this app:
> every `VITE_*` variable is bundled into the JavaScript that ships to every browser.

### Optional: private channels

To require an (anonymous) Supabase session before a client can join a room, follow the steps at the top of
[`supabase/realtime_policies.sql`](supabase/realtime_policies.sql), then set `VITE_SUPABASE_PRIVATE_CHANNELS=true`.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel: **Add New → Project**, import the repo (framework preset: Vite — `vercel.json` already sets it).
3. Add the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Production + Preview).
4. Deploy. Share the URL — players can invite each other with `?room=<code>` links from the Friends menu.

## How to play

| Key | Action |
| --- | --- |
| `W A S D` / arrows | Walk (on touch screens: drag anywhere) |
| `Shift` | Run |
| `E` / `Space` | Interact: sit, lie down, eat & drink, use objects, collect stamps (walk into a door to enter) |
| `M` | Toggle the minimap (or click it) |
| `Enter` | Chat (Esc to stop typing) |
| `1`–`5` | Emotes 👋 🎉 ❤️ ❓ ⭐ |

Goals:
- Visit every building and collect all **19 Campus Passport stamps** (one inside each building).
- With a friend, stand on **switches A and B** near Davis Hall at the same time to open the portal to the **Secret Garden**.
- Try the **photo booth** east of the fountain (saves a PNG on your device, never uploaded).

### The buildings

| Area | Building | Inside |
| --- | --- | --- |
| Core | Student Union | Round atrium with the UB seal, info desk, Bulls Café, lounge |
| Academic Spine | Capen Hall | Silverman Library: stacks, computers, reading tables, help desk |
| | Lockwood Library | Tall stacks, reading room with green lamps, Special Collections |
| | Norton Hall | Lecture hall with screen, podium and rows of seats |
| | Talbert Hall | Classroom with a shared whiteboard, Tutoring Center |
| | Baldy Hall | 24/7 computer lab and offices |
| | Clemens Hall | Humanities gallery, sculptures, easel |
| Engineering | Davis Hall | CSE lab: robot arm, 3D printers, cleanroom window |
| | Bell Hall | Machine shop with lathes |
| | Furnas Hall | Design studio: drafting tables, 3D printing |
| | Ketter Hall | Earthquake shake table (shakes the screen!) |
| Residence halls | Ellicott Complex | Dorm rooms with beds, lounge with TV and ping-pong, laundry |
| | Governors | Common room with a piano, dorm room |
| | Greiner Hall | Suite with kitchen, bedrooms, study lounge |
| Sports, arts, food | Alumni Arena | Basketball court, hoops, bleachers, trophy case |
| | UB Stadium | Football field, goalposts, stands |
| | Center for the Arts | Theatre stage with grand piano and drums, gallery |
| | The Commons | UB campus store and café |
| | Crossroads Culinary | Food stations: pizza, grill, Buffalo wings, noodles, salad, dessert |

Everything you do is shared with other players in the same room: sitting and lying poses, the food or ball you hold,
basketball shots and field goals, music, the earthquake test, and whiteboard text.

## Project structure

```
src/
  main.ts                  boot + menu/playing state machine
  core/                    config, settings, audio (Web Audio), session bus, storage
  character/
    appearance.ts          outfit data model, presets, validation, save/load
    avatarRenderer.ts      layered procedural avatar drawing (shared by editor + game)
  game/
    WorldScene.ts          Phaser scene: rendering, movement, collisions, triggers, interactions, remote players
    Avatar.ts              avatar game object: sprite sheet, poses, held items, name tag, bubbles, emotes
    iso.ts                 isometric projection, collision, depth helpers
    art.ts / furniture.ts  procedural props and furniture
    ubBuildings.ts         the 19 building exteriors (generic generator + custom designs)
    textures.ts            texture registry, ground/floor/wall rendering (chunked for big maps)
    items.ts               holdable items + interaction flavour text
    maps/
      buildings.ts         building registry: position, door, look, passport stamp
      campus.ts            the outdoor North Campus layout
      interiorKit.ts       Room toolkit used to describe interiors as data
      interiors*.ts        the 19 unique interiors
      registry.ts          map lookup (campus + interiors)
  net/
    multiplayer.ts         room state: validation, dedupe, ghost cleanup
    supabaseTransport.ts   Supabase Realtime (Presence + Broadcast)
    localTransport.ts      BroadcastChannel fallback (Local mode)
  social/                  chat safety + local mute/block/report/favorites
  activities/              Campus Passport, co-op switches
  ui/                      HTML/CSS menus and overlays (menu, editor, HUD, chat, panels, minimap)
tests/                     Vitest unit tests
supabase/                  optional Realtime authorization policies
```

## Multiplayer design

- **Presence** (`room:<code>` channel, key = guest id): nickname, outfit, current map, co-op plate. Leaving presence removes the avatar immediately — no ghosts.
- **Broadcast** events: `move` (max 10/s while walking, one on stop, heartbeat every 4 s idle; includes pose and held item), `chat`, `emote`, `hello` (newcomer asks for positions + whiteboards), `coop`, `fx` (shots, music, earthquake), `board` (whiteboard text, filtered like chat).
- Every packet is validated; movement uses sequence numbers to drop duplicates/out-of-order packets; chat is de-duplicated by message id.
- Remote avatars are interpolated smoothly and snap if they teleport.
- Players who never appear in presence are pruned after 20 s. Reconnects re-track presence automatically.
- The co-op portal opens only when **two different players** report standing on plates A and B in the shared presence state; every client computes this independently.

## Safety limitations (please read)

- Chat filtering, rate limiting (5 messages / 10 s, 0.8 s minimum gap, duplicate blocking) and length limits (140 chars) run **in the browser**. They protect normal players but a modified client could bypass them.
- **Mute / block / favorites are local to your browser tab** — they hide players for you only; they are not server-wide bans.
- **Reports are saved on your device only**; this build has no moderation backend and does not send them anywhere. The UI says so.
- Names are sanitized (letters, numbers, spaces, `_ - .`, 2–16 chars); all text is rendered with `textContent`, never HTML.
- Nothing is stored server-side: no chat history, no positions, no accounts.
- Public rooms are joinable by anyone who has the site URL. Use "New private room" for a hard-to-guess code (not a security boundary).

A production version would need server-side moderation (e.g. a Supabase Edge Function relaying chat with filtering and rate limits) and authenticated accounts.

## Testing

Automated: `npm test` (58 tests) covers isometric math, collision, appearance validation, chat sanitizing and rate limits,
network packet validation (incl. poses and items), co-op logic, and every map: spawns walkable, exits, a stamp in each
interior, and every building door reachable from campus.

### Manual cross-device checklist

Use two **different devices** (or two browsers) with Supabase configured, both on the deployed URL.

- [ ] Menu: PLAY, MY CHARACTER, FRIENDS, SETTINGS all open something.
- [ ] First PLAY opens the character editor; changes show instantly in the preview; the look persists after reload.
- [ ] WASD/arrows move; you can't walk through buildings, trees, the fountain or the lake; you walk behind/in front of buildings correctly.
- [ ] Device A and B: online counter shows 2; each sees the other's name and outfit.
- [ ] Movement on A appears smoothly on B (and vice versa).
- [ ] Chat from A appears in B's chat panel and as a speech bubble above A's avatar; `<b>tags</b>` show as plain text.
- [ ] Emotes 1–5 appear above the sender on both devices.
- [ ] Friends → Copy invite link → open on B → both in the same room code.
- [ ] Walk into any building door, explore, collect its passport stamp, walk out through EXIT.
- [ ] A inside a building and B outside don't see each other; both see each other again when A exits.
- [ ] Sit on a chair, lie on a dorm bed, grab food: the other device sees the pose and the item.
- [ ] Shoot hoops in Alumni Arena / write on a whiteboard: the other device sees the shot / the text.
- [ ] Passport keeps its stamps after reload.
- [ ] A stands on switch A, B stands on switch B → both see the celebration and the portal opens; walking in teleports to the Secret Garden.
- [ ] Close B's tab → within a few seconds B disappears from A and "left" appears in chat (no ghost).
- [ ] Turn B's Wi-Fi off/on → B reconnects and reappears.
- [ ] Mute/Block/Report from the Friends panel hide that player's chat/avatar for you.
- [ ] Phone: drag to move, chat and emotes usable.

### What was verified during development

- `npm test` (58 tests) and `npm run build` pass.
- All 19 interiors were visited in the browser; lying on a bed, sitting at a table, eating, basketball and whiteboards were tried.
- Over Supabase, a second client's sitting pose and held food appeared correctly on the first client.
- In Local mode, two browser tabs were tested end-to-end: presence (count 2), outfit sync, movement sync,
  chat sync with HTML shown as text, speech bubbles, co-op portal opening on both clients, Secret Garden teleport,
  Student Union enter/stamp/exit, and ghost removal after closing a tab.
- **Supabase online mode** was tested with two independent clients (separate browser tabs, separate guest ids, all traffic
  through Supabase Realtime): presence count, outfit + name sync, movement sync, chat and emotes in both directions,
  co-op portal opening on both clients, map change (Union vs campus visibility), and instant removal on tab close.
- Still to verify on **two physical devices** over the deployed URL (phone + laptop), using the checklist above.

## Credits

Made by a team of three for UB Hacking 2026 with AI-assisted development. All art, sound and code are original;
the campus is a loose, stylised tribute to UB North Campus, not an exact map.
