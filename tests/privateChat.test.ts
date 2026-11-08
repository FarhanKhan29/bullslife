import { expect, it } from 'vitest';
import { createChatIdentity, directChatKey, makeFriendsInvite, openChat, openFriendsChat, parseChatEnvelope, readFriendsInvite, sealChat } from '../src/social/privateChat';

it('only the intended guest can decrypt a DM, even if other guests see the packet', async () => {
  const [alice, bob, outsider] = await Promise.all([createChatIdentity(), createChatIdentity(), createChatIdentity()]);
  const room = 'test-campus';
  const [senderKey, recipientKey, outsiderKey] = await Promise.all([
    directChatKey(alice.privateKey, bob.id, bob.chatKey, room),
    directChatKey(bob.privateKey, alice.id, alice.chatKey, room),
    directChatKey(outsider.privateKey, alice.id, alice.chatKey, room),
  ]);
  const packet = await sealChat(senderKey, room, { id: alice.id, to: bob.id, mid: 'test000001' }, 'hello 🔒');
  expect(parseChatEnvelope({ ...packet })).toEqual(packet);
  expect(JSON.stringify(packet)).not.toContain('hello');
  expect(await openChat(recipientKey, room, packet)).toBe('hello 🔒');
  await expect(openChat(outsiderKey, room, packet)).rejects.toThrow();
  await expect(openChat(recipientKey, room, { ...packet, to: outsider.id })).rejects.toThrow();
  await expect(directChatKey(alice.privateKey, bob.id, outsider.chatKey, room)).rejects.toThrow();
});

it('derives a separate room and chat key from each friends invite', async () => {
  const token = makeFriendsInvite();
  expect(readFriendsInvite('#friends=' + token)).toBe(token);
  expect(readFriendsInvite('#friends=guessable')).toBeNull();
  const [host, friend, otherRoom] = await Promise.all([
    openFriendsChat(token),
    openFriendsChat(token),
    openFriendsChat(makeFriendsInvite()),
  ]);
  const guest = await createChatIdentity();
  const packet = await sealChat(host.key, host.room, { id: guest.id, to: '', mid: 'test000002' }, 'friends only');
  expect(friend.room).toBe(host.room);
  expect(otherRoom.room).not.toBe(host.room);
  expect(host.room).not.toContain(token);
  expect(await openChat(friend.key, friend.room, packet)).toBe('friends only');
  await expect(openChat(otherRoom.key, host.room, packet)).rejects.toThrow();
  await expect(openChat(friend.key, otherRoom.room, packet)).rejects.toThrow();
});
