# BULLSLIFE 🐂

**Your Campus. Your People. Your Story.**

A cozy multiplayer isometric campus-life game set on a stylised UB North Campus, built for **UB Hacking 2026**.
Create a student, walk around the whole North Campus, go inside **20 buildings**, sit, sleep, eat and play, meet other real players, chat, collect Campus Passport stamps, and team up to open the Secret Garden.

**Play it:** https://bullslife.vercel.app

The layout follows the [official UB North Campus map](https://engineering.buffalo.edu/content/dam/authoritative/wayfinding/directions/North%20Campus%20Parking%20Map%2011x17.pdf). The game compresses walking distances and includes 20 playable buildings and several linked floors. The campus minimap is north-up.

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
| `E` / `Space` | Interact with doors, cashiers, furniture, objects and dropped items |
| `6`–`8` | Select an inventory slot (or click it) |
| `F` / `G` | Eat or drink the selected item / put it on the ground |
| `M` | Toggle the minimap (or click it) |
| `Enter` | Chat (Esc to stop typing) |
| `1`–`5` | Emotes 👋 🎉 ❤️ ❓ ⭐ |

Goals:
- Collect all **19 Campus Passport stamps**. The University Bookstore is an extra stop.
- With a friend, stand on **switches A and B** near Davis Hall at the same time to open the portal to the **Secret Garden**.
- Try the **photo booth** east of the fountain (saves a PNG on your device, never uploaded).

### Inventory and dining

The three slots hold food, books, sports equipment and store purchases. Select a slot, press **Eat** or **F** to consume food, or **Drop** or **G** to put it down. Press **E** nearby to pick it up. If all slots are full, the item in your selected slot trades places with the item on the ground. Use **↔** to swap two inventory slots. Inventory, UB Card balances and personal drops persist in the current browser tab across building visits and reloads.

Go to the **UB Card Office at 1Capen** to buy an in-game Meal Plan with Campus Cash. The HUD's UB Card button shows your balance. At C3 and Governors Dining Center, pay or swipe at the entrance before visiting the stations. The game uses simulated balances, prices and meal exchanges.

The layouts use published references, including the [Silverman and Lockwood floor plans](https://library.buffalo.edu/use/floor-plans.html), [UB Dining locations](https://ubdining.com/locations/north), and [UB building profiles](https://www.buffalo.edu/administrative-services/managing-facilities/planning-designing-and-construction/building-profiles.html). Interiors condense those spaces into playable rooms.

### Chat

- **Campus chat** is visible to everyone in the current public room.
- **Private message:** Open **Friends** and select 💬 next to an online player. Use the conversation selector above chat to switch or reply.
- **Friends chat:** Open **Friends → New friends room → Copy invite link**. Friends can open the link or paste it into **Join a friend’s room**. Anyone with that link can join and read the chat while present, so share it with the intended group.
- Private messages and friends chat are encrypted in the browser using Web Crypto. Supabase relays the ciphertext, and chat history lives in the current page. Private messages use temporary guest identities. HTTPS or localhost is required for encrypted chat.

### The buildings

| Area | Building | Inside |
| --- | --- | --- |
| Core | Student Union | Welcome Center, Tim Hortons, Campus Tees, Moe’s, Union Marketplace and upstairs dining |
| Academic Spine | Capen Hall | 1Capen UB Card Office, connected One World Café and third-floor Silverman Library |
| | Lockwood Library | Second-floor courtyard, Services Desk, periodicals and computers |
| | Norton Hall | Woldman Theatre and a passage to One World Café |
| | Talbert Hall | Classroom and International Student Services |
| | Baldy Hall | Classrooms, study corridor and link to Lockwood |
| | Clemens Hall | Humanities seminar room and language lab |
| Engineering | Davis Hall | CSE lab: robot arm, 3D printers, cleanroom window |
| | Bell Hall | Industrial and systems engineering classrooms and lab |
| | Furnas Hall | Materials Characterization Laboratory and engineering workstations |
| | Ketter Hall | Earthquake shake table (shakes the screen!) |
| Residence halls | Ellicott Complex | Red Jacket rooms, link to Ellicott Food Court, The Elli and C3 |
| | Governors | Common room, Teddy’s in Roosevelt and a link to Governors Dining Center |
| | Greiner Hall | Bulls on the Run, a study lounge and a separate double-room suite |
| Sports, arts, food | Alumni Arena | Basketball court, hoops, bleachers, trophy case |
| | UB Stadium | Football field, goalposts, stands |
| | Center for the Arts | Skylit atrium, separate Mainstage Theatre and UB Art Gallery |
| | The Commons | Subway and Young Chow storefronts and checkout |
| | University Bookstore | Separate building on Lee Road with textbooks and UB gear |
| | Crossroads Culinary | Cashier and named dining stations including Oreganos, Global Noodle and Blue Dragon |

Other players in the room can see sitting and lying poses, the food or ball you hold,
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
    ubBuildings.ts         the 20 building exteriors
    textures.ts            texture registry, ground/floor/wall rendering (chunked for big maps)
    items.ts               holdable items + interaction flavour text
    maps/
      buildings.ts         building registry: position, door, look, passport stamp
      campus.ts            the outdoor North Campus layout
      interiorKit.ts       Room toolkit used to describe interiors as data
      interiors*.ts        building interiors and connected floors
      registry.ts          map lookup (campus + interiors)
  net/
    multiplayer.ts         room state: validation, dedupe, ghost cleanup
    supabaseTransport.ts   Supabase Realtime (Presence + Broadcast)
    localTransport.ts      BroadcastChannel fallback (Local mode)
  social/                  encrypted chat, chat safety, local mute/block/report/favorites
  activities/              Campus Passport, co-op switches
  ui/                      HTML/CSS menus and overlays (menu, editor, HUD, chat, panels, minimap)
tests/                     Vitest unit tests
supabase/                  optional Realtime authorization policies
```

## Multiplayer design

- **Presence** (`room:north-v2:<code>` for public rooms, key = guest id): nickname, outfit, current map, co-op plate. Leaving presence removes the avatar immediately — no ghosts.
- **Broadcast** events: `move` (max 10/s while walking, one on stop, heartbeat every 4 s idle; includes pose and held item), `chat`, `sealed-chat` (encrypted chat), `emote`, `hello` (newcomer asks for positions + whiteboards), `coop`, `fx` (shots, music, earthquake), `board` (whiteboard text, filtered like chat).
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
- Public rooms are joinable by room code. Friends-room invites carry the group key in the URL fragment. Create a fresh friends room if an invite has been shared too widely.

A production version would need server-side moderation (e.g. a Supabase Edge Function relaying chat with filtering and rate limits) and authenticated accounts.

## Testing

Automated: `npm test` covers isometric math, collision, appearance validation, chat sanitizing and rate limits,
network packet validation (incl. poses and items), chat encryption and recipient isolation, co-op logic, and every map: spawns walkable, exits, a stamp in each
interior, and every building door reachable from campus.

### Manual cross-device checklist

Use two **different devices** (or two browsers) with Supabase configured, both on the deployed URL.

- [ ] Menu: PLAY, MY CHARACTER, FRIENDS, SETTINGS all open something.
- [ ] First PLAY opens the character editor; changes show instantly in the preview; the look persists after reload.
- [ ] WASD/arrows move; you can't walk through buildings, trees, the fountain or the lake; you walk behind/in front of buildings correctly.
- [ ] Device A and B: online counter shows 2; each sees the other's name and outfit.
- [ ] Movement on A appears smoothly on B (and vice versa).
- [ ] Chat from A appears in B's chat panel and as a speech bubble above A's avatar; `<b>tags</b>` show as plain text.
- [ ] With A, B and C in one public room, A privately messages B. B can reply and C receives neither message.
- [ ] A creates a friends room and B joins by invite. A and B see the friends chat while C remains in the public room.
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
the stylised campus uses the real building layout with compressed distances.
