/** Chat keys stay in the browser. The multiplayer transport only relays ciphertext. */
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function bytes(value: string) {
  return Uint8Array.from(value.match(/../g) ?? [], (byte) => Number.parseInt(byte, 16));
}

async function fingerprint(key: Uint8Array<ArrayBuffer>): Promise<string> {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', key))).slice(0, 32);
}

export const isChatKey = (value: unknown): value is string => typeof value === 'string' && /^04[0-9a-f]{128}$/.test(value);

export function readFriendsInvite(hash: string): string | null {
  const token = new URLSearchParams(hash.replace(/^#/, '')).get('friends');
  return token && /^[0-9a-f]{64}$/.test(token) ? token : null;
}

export function makeFriendsInvite(): string {
  return hex(crypto.getRandomValues(new Uint8Array(32)));
}

export async function openFriendsChat(token: string) {
  if (!/^[0-9a-f]{64}$/.test(token)) throw new Error('Invalid friends invite');
  const secret = bytes(token);
  const [key, handle] = await Promise.all([
    crypto.subtle.importKey('raw', secret, 'AES-GCM', false, ['encrypt', 'decrypt']),
    fingerprint(secret),
  ]);
  return { key, room: 'friends-' + handle };
}

export async function createChatIdentity() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  const publicKey = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  return { id: await fingerprint(publicKey), chatKey: hex(publicKey), privateKey: pair.privateKey };
}

export async function directChatKey(privateKey: CryptoKey, peerId: string, peerKey: string, room: string) {
  if (!isChatKey(peerKey)) throw new Error('Invalid chat key');
  const raw = bytes(peerKey);
  if (await fingerprint(raw) !== peerId) throw new Error('Chat key does not match the guest');
  const publicKey = await crypto.subtle.importKey('raw', raw, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = await crypto.subtle.deriveBits({ name: 'ECDH', public: publicKey }, privateKey, 256);
  const baseKey = await crypto.subtle.importKey('raw', shared, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: encoder.encode('bullslife-direct-chat-v1'), info: encoder.encode(room) },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export interface ChatEnvelope {
  id: string;
  to: string; // guest id for a DM, empty string for a friends room message
  mid: string;
  iv: string;
  body: string;
}

export function parseChatEnvelope(raw: Record<string, unknown>): ChatEnvelope | null {
  const { id, to, mid, iv, body } = raw;
  if (typeof id !== 'string' || !/^[0-9a-f]{32}$/.test(id) ||
      typeof to !== 'string' || (to !== '' && !/^[0-9a-f]{32}$/.test(to)) ||
      typeof mid !== 'string' || !/^[a-z0-9]{10}$/.test(mid) ||
      typeof iv !== 'string' || !/^[0-9a-f]{24}$/.test(iv) ||
      typeof body !== 'string' || !/^(?:[0-9a-f]{2}){17,450}$/.test(body)) return null;
  return { id, to, mid, iv, body };
}

function context(room: string, { id, to, mid }: Pick<ChatEnvelope, 'id' | 'to' | 'mid'>) {
  return encoder.encode(JSON.stringify(['bullslife-chat-v1', room, id, to, mid]));
}

export async function sealChat(key: CryptoKey, room: string, address: Pick<ChatEnvelope, 'id' | 'to' | 'mid'>, text: string): Promise<ChatEnvelope> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: context(room, address) }, key, encoder.encode(text),
  );
  return { ...address, iv: hex(iv), body: hex(new Uint8Array(encrypted)) };
}

export async function openChat(key: CryptoKey, room: string, packet: ChatEnvelope): Promise<string> {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes(packet.iv), additionalData: context(room, packet) }, key, bytes(packet.body),
  );
  return decoder.decode(plaintext);
}
