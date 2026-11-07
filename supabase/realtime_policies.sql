-- OPTIONAL: private Realtime channels for BULLSLIFE.
--
-- By default the game uses PUBLIC Realtime channels (anyone with the public
-- anon key can join a room topic). That is fine for a hackathon demo because
-- nothing is stored and no private data is exchanged.
--
-- To require a (anonymous) Supabase session before joining a room:
--   1. Dashboard → Authentication → Sign In / Providers → enable "Anonymous sign-ins".
--   2. Dashboard → Realtime → Settings → turn OFF "Allow public access".
--   3. Run this SQL in the SQL editor.
--   4. Set VITE_SUPABASE_PRIVATE_CHANNELS=true and redeploy.

-- Allow signed-in users (anonymous users count) to RECEIVE broadcast + presence
-- on BULLSLIFE room topics only.
create policy "bullslife: read room messages"
on realtime.messages
for select
to authenticated
using (
  realtime.topic() like 'room:%'
  and realtime.messages.extension in ('broadcast', 'presence')
);

-- Allow signed-in users to SEND broadcast + presence on room topics only.
create policy "bullslife: write room messages"
on realtime.messages
for insert
to authenticated
with check (
  realtime.topic() like 'room:%'
  and realtime.messages.extension in ('broadcast', 'presence')
);

-- No tables are created: chat and positions are ephemeral and never stored.
