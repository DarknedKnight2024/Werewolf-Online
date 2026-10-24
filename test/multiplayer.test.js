const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { io } = require('socket.io-client');

let serverProcess;
let serverUrl;
let temporaryData;
const sockets = [];
const iconSet = ['🌙', '🦊', '🐺', '🦉', '🦇', '🐈', '🦌', '🐸', '🦝', '🐻', '🐝', '🦚'];
const roleOrder = ['Sentinel', 'Werewolf', 'Mystic Wolf', 'Alpha Wolf', 'Dream Wolf', 'Minion', 'Mason', 'Seer', 'Apprentice Seer', 'Marksman', 'Robber', 'Witch', 'Paranormal Investigator', 'Pickpocket', 'Troublemaker', 'Village Idiot', 'Gremlin', 'Drunk', 'Insomniac', 'Revealer', 'Curator', 'Hunter', 'Tanner', 'Villager', 'Bodyguard', 'Question'];

function pause(milliseconds) { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }
async function freePort() {
  const listener = net.createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const { port } = listener.address();
  await new Promise((resolve) => listener.close(resolve));
  return port;
}
async function until(predicate, description) {
  const deadline = Date.now() + 7000;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await pause(10);
  }
  throw new Error(`Timed out waiting for ${description}.`);
}
async function connectClient() {
  const client = io(serverUrl, { reconnection: false, transports: ['websocket'] });
  client.latestRoom = null;
  client.on('room:update', (room) => { client.latestRoom = room; });
  client.presenceTimer = setInterval(() => {
    if (client.latestRoom?.viewer.kind === 'player') client.emit('player:presence', { active: true });
  }, 2000);
  await once(client, 'connect');
  sockets.push(client);
  return client;
}
function request(client, event, payload = {}) {
  return new Promise((resolve, reject) => {
    client.emit(event, payload, (response) => response?.error ? reject(new Error(response.error)) : resolve(response));
  });
}
async function update(client, event, payload = {}) {
  const completion = until(() => client.latestRoom?.updatedAt !== payload._previousTimestamp, `${event} room update`);
  return Promise.all([request(client, event, payload), completion]);
}
async function waitForRoom(clients, predicate, description) {
  await until(() => clients.every((client) => client.latestRoom && predicate(client.latestRoom)), description);
}

async function beginRoom(clients) {
  const host = clients[0];
  const created = await request(host, 'room:create');
  host.latestRoom = created.room;
  const code = created.room.code;
  assert.match(code, /^\d{6}$/);
  for (let index = 1; index < clients.length; index += 1) {
    const joined = await request(clients[index], 'room:join', { code, name: `Player ${index}`, icon: iconSet[index - 1] });
    clients[index].latestRoom = joined.room;
  }
  return code;
}

async function configureDeck(host, roles) {
  for (const [role, current] of Object.entries(host.latestRoom.roles)) {
    for (let count = 0; count < current; count += 1) await request(host, 'host:adjust-role', { role, delta: -1 });
  }
  for (const [role, count] of Object.entries(roles)) {
    for (let index = 0; index < count; index += 1) await request(host, 'host:adjust-role', { role, delta: 1 });
  }
}

async function playToVoting(clients, roles) {
  const [host, ...players] = clients;
  await configureDeck(host, roles);
  await request(host, 'host:start');
  await waitForRoom(clients, (room) => room.stage === 'roles', 'role reveal phase');
  assert.equal(host.latestRoom.own, null, 'moderator must not receive a player card');
  assert.equal(host.latestRoom.players.length, players.length, 'moderator must not occupy a player seat');
  assert.ok(players.every((client) => client.latestRoom.own?.card), 'each player receives their private card');
  assert.ok(players.every((client) => client.latestRoom.players.every((player) => !('card' in player))), 'other players\' cards stay private');
  players.forEach((client) => { client.testRole = client.latestRoom.own.card; });
  await Promise.all(players.map((client) => request(client, 'player:role-ready')));
  await waitForRoom(clients, (room) => ['sentinel', 'setup', 'dusk', 'mark', 'night'].includes(room.stage), 'post-role-reveal setup or night');
  while (host.latestRoom.stage === 'sentinel') {
    const sentinel = players.find((client) => client.testRole === 'Sentinel' && !client.latestRoom.own.shieldTarget);
    const protectedPlayer = host.latestRoom.players.find((player) => player.id !== sentinel.latestRoom.viewer.playerId && !player.shielded);
    await request(sentinel, 'player:sentinel-shield', { targetId: protectedPlayer.id });
    await waitForRoom(clients, (room) => room.stage !== 'sentinel' || room.players.some((player) => player.shielded), 'Sentinel shield');
  }
  while (host.latestRoom.stage === 'setup') {
    const actor = players.find((client) => client.latestRoom.action?.role && !client.latestRoom.action.submitted);
    if (!actor) {
      await until(() => host.latestRoom.stage !== 'setup' || players.some((client) => client.latestRoom.action?.role && !client.latestRoom.action.submitted), 'pending Setup action');
      continue;
    }
    const room = host.latestRoom;
    const actorId = actor.latestRoom.viewer.playerId;
    if (actor.latestRoom.action.questionOnly) {
      const targetId = room.players.find((entry) => entry.id !== actorId).id;
      await request(actor, 'player:phase-question', { targetId });
    } else if (actor.testRole === 'Copycat') {
      await request(actor, 'player:copycat-setup', { centerIndex: 0 });
    } else {
      const target = room.players.find((entry) => entry.id !== actorId && !entry.shielded);
      try { await request(actor, 'player:setup', { targetId: target.id }); }
      catch (error) { throw new Error(`${actor.testRole} setup: ${error.message}`); }
    }
    await until(() => actor.latestRoom.stage !== 'setup' || actor.latestRoom.action?.submitted, 'Setup action submission');
  }

  while (host.latestRoom.stage === 'dusk') {
    const nextActor = () => {
      const pending = players.filter((client) => client.latestRoom.action?.role && !client.latestRoom.action.submitted);
      return pending.find((client) => client.latestRoom.action.role === 'Vampire')
        || pending.find((client) => client.latestRoom.action.role === 'Count')
        || pending[0];
    };
    let actor = nextActor();
    if (!actor) {
      await until(() => host.latestRoom.stage !== 'dusk' || players.some((client) => client.latestRoom.action?.role && !client.latestRoom.action.submitted), 'pending Dusk action');
      continue;
    }
    let vampireTargetId = null;
    while (actor) {
      const action = actor.latestRoom.action;
      const actorId = actor.latestRoom.viewer.playerId;
      const available = players.filter((client) => client.latestRoom.viewer.playerId !== actorId);
      let payload = {};
      if (action.questionOnly) {
        await request(actor, 'player:phase-question', { targetId: available[0].latestRoom.viewer.playerId });
        await until(() => actor.latestRoom.stage !== 'dusk' || actor.latestRoom.action?.key !== action.key, 'next private Dusk turn');
        actor = nextActor();
        continue;
      } else if (action.role === 'Vampire') {
        const target = available.find((client) => !['Vampire', 'Master', 'Count', 'Renfield'].includes(client.testRole));
        if (!target) throw new Error('No non-vampire target is available in the Dusk test deck.');
        vampireTargetId = target.latestRoom.viewer.playerId;
        payload = { targetId: vampireTargetId };
      } else if (action.role === 'Count') {
        const target = available.find((client) => client.latestRoom.viewer.playerId !== vampireTargetId);
        if (!target) throw new Error('Count needs a second target distinct from the Vampire mark.');
        payload = { targetId: target.latestRoom.viewer.playerId };
      } else if (action.role === 'Diseased') {
        const position = players.indexOf(actor);
        payload = { targetId: players[(position + 1) % players.length].latestRoom.viewer.playerId };
      } else if (action.role === 'Cupid') {
        payload = { targetIds: available.slice(0, 2).map((client) => client.latestRoom.viewer.playerId) };
      } else if (action.role === 'Priest') {
        payload = { targetId: available[0].latestRoom.viewer.playerId };
      } else if (['Instigator', 'Assassin'].includes(action.role)) {
        payload = { targetId: available[0].latestRoom.viewer.playerId };
      }
      try { await request(actor, 'player:dusk-action', payload); }
      catch (error) { throw new Error(`${action.role} for ${actor.latestRoom.viewer.name}: ${error.message}`); }
      await until(() => actor.latestRoom.stage !== 'dusk' || actor.latestRoom.action?.key !== action.key, 'next private Dusk turn');
      actor = nextActor();
    }
    if (host.latestRoom.stage === 'dusk') await until(() => host.latestRoom.stage !== 'dusk' || players.some((client) => client.latestRoom.action?.role && !client.latestRoom.action.submitted), 'Dusk action resolution');
  }

  if (host.latestRoom.stage === 'mark') {
    await waitForRoom(clients, (room) => room.stage === 'mark', 'private Mark phase');
    assert.ok(players.every((client) => client.latestRoom.own.mark), 'each player sees their own mark');
    assert.ok(players.every((client) => client.latestRoom.players.every((player) => !('mark' in player))), 'marks stay private during Mark');
    await Promise.all(players.map((client) => request(client, 'player:mark-done')));
  }

  await waitForRoom(clients, (room) => room.stage === 'night', 'night phase');
  const nightActionTotal = players.length;
  assert.equal(host.latestRoom.own, null, 'moderator receives no night action');
  assert.equal('total' in host.latestRoom.action, false, 'moderator does not receive a Night action count');
    assert.equal('nightDone' in host.latestRoom.host, false, 'moderator does not see Night readiness totals');
  assert.ok(players.every((client) => client.latestRoom.own.card === null && client.latestRoom.own.startCard === null), 'roles are hidden after the reveal phase');
    const actions = players.map((client) => client.latestRoom.action).filter((action) => action?.role);
    assert.equal(actions.length, nightActionTotal, 'each queued night role gets its own turn');
    assert.ok(players.every((client) => players.filter((other) => other !== client).every((other) => !other.latestRoom.action?.role || other.latestRoom.action.actorId === other.latestRoom.viewer.playerId)), 'players see only their own role action details');
    assert.ok(actions.filter((action) => ['Seer', 'Robber', 'Troublemaker', 'Drunk'].includes(action.role)).every((action) => !action.requiresQuestion), 'roles with an action do not receive a distractor question');
    const ordered = [...actions].sort((left, right) => left.index - right.index);
    const expected = [...actions].sort((left, right) => {
      const leftOrder = left.copied ? -1 : roleOrder.indexOf(left.role);
      const rightOrder = right.copied ? -1 : roleOrder.indexOf(right.role);
      return leftOrder - rightOrder;
    });
    assert.deepEqual(ordered.map((action) => action.actorId), expected.map((action) => action.actorId), 'actions resolve in Doppelganger-then-role order');
  const submissions = players.map(async (actor, actorIndex) => {
    const action = actor.latestRoom.action;
    if (!action?.role) return null;
    const others = actor.latestRoom.players.filter((player) => player.id !== actor.latestRoom.viewer.playerId);
    const protectedPlayer = actor.latestRoom.players.find((player) => player.shielded && player.id !== actor.latestRoom.viewer.playerId);
    if (protectedPlayer && !action.requiresQuestion && ['Mystic Wolf', 'Alpha Wolf', 'Seer', 'Robber', 'Witch', 'Paranormal Investigator', 'Troublemaker', 'Revealer', 'Curator'].includes(action.role)) {
      const forbidden = action.role === 'Witch' ? { centerIndex: 0, targetId: protectedPlayer.id } : action.role === 'Seer' ? { mode: 'player', targetId: protectedPlayer.id } : ['Troublemaker', 'Paranormal Investigator'].includes(action.role) ? { targetIds: [protectedPlayer.id, others.find((player) => player.id !== protectedPlayer.id).id] } : { targetId: protectedPlayer.id };
      await assert.rejects(request(actor, 'player:night-action', forbidden), /unshielded player|Choose another/);
    }
    if (action.requiresQuestion) return request(actor, 'player:night-answer', { targetId: others[0].id });
    if (action.role === 'Werewolf' || action.role === 'Drunk' || action.role === 'Apprentice Seer') return request(actor, 'player:night-action', { centerIndex: 0 });
    if (['Mystic Wolf', 'Alpha Wolf', 'Revealer', 'Curator'].includes(action.role)) return request(actor, 'player:night-action', { targetId: others.find((player) => !player.shielded)?.id });
    if (action.role === 'Witch') return request(actor, 'player:night-action', { centerIndex: 0, targetId: others.find((player) => !player.shielded)?.id });
    if (action.role === 'Village Idiot') return request(actor, 'player:night-action', { direction: 'left' });
    if (action.role === 'Seer') return request(actor, 'player:night-action', { mode: 'player', targetId: others.find((player) => !player.shielded)?.id });
    if (action.role === 'Robber' || action.role === 'Pickpocket') return request(actor, 'player:night-action', { targetId: others.find((player) => !player.shielded)?.id });
    if (action.role === 'Troublemaker' || action.role === 'Paranormal Investigator') {
      const targets = others.filter((player) => !player.shielded).map((player) => player.id).slice(0, 2);
      return request(actor, 'player:night-action', targets.length < 2 ? { pass: true } : { targetIds: targets });
    }
    if (action.role === 'Gremlin') {
      const targets = others.filter((player) => !player.shielded).map((player) => player.id).slice(0, 2);
      return request(actor, 'player:night-action', { mode: 'marks', targetIds: targets.length >= 2 ? targets : [others[0].id, others[1 % others.length].id] });
    }
    throw new Error(`Unexpected action without night question: ${action.role}`);
  });
  await Promise.all(submissions);
  await waitForRoom(clients, (room) => room.stage === 'information', 'all simultaneous night actions resolved');
  assert.ok(players.every((client) => client.latestRoom.own.card === null && client.latestRoom.own.startCard === null), 'information phase hides each player role and final card');

  assert.equal(host.latestRoom.stage, 'information');
  await Promise.all(players.map(async (client) => {
    if (client.latestRoom.action?.role === 'Marksman') {
      const ownId = client.latestRoom.viewer.playerId;
      const targets = client.latestRoom.players.filter((player) => player.id !== ownId);
      await request(client, 'player:information-action', { markTargetId: targets[0].id, roleTargetId: targets[1].id });
      await until(() => client.latestRoom.own.seenMarks?.length === 1 && client.latestRoom.own.seenCards?.length > 0, 'Marksman evidence');
    }
    await request(client, 'player:information-done');
  }));
  await waitForRoom(clients, (snapshot) => snapshot.stage === 'discussion', 'discussion phase');
  await request(host, 'host:begin-voting');
  await waitForRoom(clients, (snapshot) => snapshot.stage === 'voting', 'voting phase');
}

before(async () => {
  const port = await freePort();
  serverUrl = `http://127.0.0.1:${port}`;
  temporaryData = fs.mkdtempSync(path.join(os.tmpdir(), 'nightshift-test-'));
  serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(port),
      DATA_DIR: temporaryData,
      ACCOUNT_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
      ADMIN_PATH: '123456789012345',
      ADMIN_KEY: '543210987654321',
      ADMIN_SECURITY_QA: JSON.stringify(Array.from({ length: 5 }, (_, index) => ({ question: `Test question ${index + 1}?`, answer: `answer-${index + 1}` }))),
    },
    stdio: 'ignore',
  });
  await until(async () => {
    try { return (await fetch(`${serverUrl}/health`)).ok; } catch { return false; }
  }, 'server startup');
});

after(() => {
  for (const client of sockets) { clearInterval(client.presenceTimer); client.close(); }
  serverProcess?.kill('SIGTERM');
  if (temporaryData) fs.rmSync(temporaryData, { recursive: true, force: true });
});

test('moderator hosts without a seat; separate devices complete a private game', async () => {
  const clients = [await connectClient(), await connectClient(), await connectClient(), await connectClient()];
  const [host, ...players] = clients;
  const code = await beginRoom(clients);
  assert.equal((await fetch(`${serverUrl}/join`)).status, 200);
  assert.equal((await fetch(`${serverUrl}/join/${code}`)).status, 200);
  assert.equal((await fetch(`${serverUrl}/moderator`)).status, 200);
  assert.equal(host.latestRoom.players.length, 3);
  assert.equal(host.latestRoom.host.playerCount, 3);

  await playToVoting(clients, { Werewolf: 1, Seer: 1, Robber: 1, Troublemaker: 1, Drunk: 1, Villager: 1 });
  const voteTarget = players[1].latestRoom.players[0].id;
  await Promise.all(players.map((client, index) => request(client, 'player:vote', { targetId: index === 0 ? players[1].latestRoom.viewer.playerId : voteTarget })));
  await waitForRoom(clients, (snapshot) => snapshot.stage === 'results', 'results phase');
  assert.ok(host.latestRoom.results?.winner);
  assert.ok(host.latestRoom.players.every((player) => player.card), 'cards are revealed after voting');
  assert.equal(host.latestRoom.own, null);
  const roster = host.latestRoom.players.map(({ id, name, icon }) => ({ id, name, icon }));
  const deck = { ...host.latestRoom.roles };
  await request(host, 'host:play-again');
  await waitForRoom(clients, (snapshot) => snapshot.stage === 'lobby', 'same-room rematch lobby');
  assert.deepEqual(host.latestRoom.players.map(({ id, name, icon }) => ({ id, name, icon })), roster, 'same players remain in the room');
  assert.deepEqual(host.latestRoom.roles, deck, 'selected role counts carry into the rematch');
  assert.ok(host.latestRoom.players.every((player) => !player.shielded && !player.artifact), 'temporary round state is cleared');
});

test('players can preview occupied icons and change to a free icon in the lobby', async () => {
  const clients = await Promise.all(Array.from({ length: 3 }, () => connectClient()));
  await beginRoom(clients);
  const [host, first, second] = clients;
  const preview = await request(host, 'room:preview', { code: host.latestRoom.code });
  assert.equal(preview.preview.players.length, 2);
  assert.equal('key' in preview.preview.players[0], false, 'public room previews never expose player rejoin keys');
  await request(first, 'player:change-icon', { icon: '🦋' });
  await until(() => host.latestRoom.players.find((player) => player.id === first.latestRoom.viewer.playerId)?.icon === '🦋', 'updated player icon');
  await assert.rejects(request(second, 'player:change-icon', { icon: '🦋' }), /already in use/);
});

test('moderator can kick a player from the lobby and notify their device', async () => {
  const clients = await Promise.all(Array.from({ length: 3 }, () => connectClient()));
  const [host, player, otherPlayer] = clients;
  await beginRoom(clients);
  const playerId = player.latestRoom.viewer.playerId;
  const kicked = once(player, 'room:kicked');

  await assert.rejects(request(otherPlayer, 'host:kick-player', { playerId }), /Only the moderator/);
  await request(host, 'host:kick-player', { playerId });
  await kicked;

  assert.equal(host.latestRoom.players.some((entry) => entry.id === playerId), false);
  assert.equal(host.latestRoom.players.length, 1);
  assert.equal(host.latestRoom.host.cardsNeeded, 4);
});

test('moderator can independently disable public chat and whispers', async () => {
  const clients = await Promise.all(Array.from({ length: 4 }, () => connectClient()));
  const [host, first, second, third] = clients;
  await beginRoom(clients);
  await request(host, 'host:chat-settings', { setting: 'whispersEnabled', enabled: false });
  await assert.rejects(request(first, 'chat:send', { scope: 'whisper', targetId: second.latestRoom.viewer.playerId, text: 'Secret message' }), /Whispers are disabled/);
  await request(host, 'host:chat-settings', { setting: 'whispersEnabled', enabled: true });
  await request(first, 'chat:send', { scope: 'public', text: 'Hello village' });
  await waitForRoom(clients, (room) => room.chat?.some((message) => message.text === 'Hello village'), 'public chat delivery');
  await request(second, 'chat:send', { scope: 'whisper', targetId: third.latestRoom.viewer.playerId, text: 'Private clue' });
  await waitForRoom([second, third], (room) => room.chat?.some((message) => message.text === 'Private clue'), 'private whisper delivery');
  assert.ok(second.latestRoom.chat.some((message) => message.text === 'Private clue'));
  assert.ok(third.latestRoom.chat.some((message) => message.text === 'Private clue'));
  assert.equal(first.latestRoom.chat.some((message) => message.text === 'Private clue'), false);
  const moderatedWhisper = host.latestRoom.chat.find((message) => message.text === 'Private clue');
  assert.ok(moderatedWhisper, 'the moderator can review private whispers');
  assert.equal(moderatedWhisper.toId, third.latestRoom.viewer.playerId);
  await request(host, 'host:chat-remove', { messageId: moderatedWhisper.id });
  await waitForRoom(clients, (room) => !room.chat?.some((message) => message.id === moderatedWhisper.id), 'moderator message removal');
  await request(host, 'host:chat-settings', { setting: 'publicEnabled', enabled: false });
  await request(host, 'host:add-bot', { name: 'Friendly AI', settings: { personality: 'Friendly', talkativeness: 'Quiet' } });
  assert.equal(host.latestRoom.chatSettings.publicEnabled, true, 'adding an AI re-enables public chat');
  const bot = host.latestRoom.players.find((player) => player.isBot);
  await waitForRoom(clients, (room) => room.players.some((player) => player.id === bot.id), 'AI roster broadcast');
  assert.match(bot.aiCode, /^AI-[A-F0-9]{6}$/);
  assert.equal(third.latestRoom.players.find((player) => player.id === bot.id).aiCode, undefined, 'AI codes are moderator-only');
  await assert.rejects(request(first, 'host:bot-icon', { playerId: bot.id, icon: '🌲' }), /Only the moderator/);
  await request(host, 'host:bot-icon', { playerId: bot.id, icon: '🌲' });
  await waitForRoom(clients, (room) => room.players.find((player) => player.id === bot.id)?.icon === '🌲', 'moderator AI icon change');
  await assert.rejects(request(host, 'host:bot-icon', { playerId: bot.id, icon: third.latestRoom.players.find((player) => player.id === third.latestRoom.viewer.playerId).icon }), /available icon/);
  await assert.rejects(request(third, 'chat:send', { scope: 'whisper', targetId: bot.id, text: 'Any thoughts?' }), /AI players do not receive whispers/);
  assert.equal(third.latestRoom.chat.some((message) => message.isBot && message.scope === 'whisper'), false);
  await assert.rejects(request(host, 'host:chat-settings', { setting: 'publicEnabled', enabled: false }), /must stay enabled while AI players/);
  await request(host, 'host:remove-bot', { playerId: bot.id });
  await request(host, 'host:chat-settings', { setting: 'publicEnabled', enabled: false });
  await assert.rejects(request(third, 'chat:send', { scope: 'public', text: 'This should be blocked' }), /Public chat is disabled/);
});

test('AI players act, vote, and chat after the game', async () => {
  const [host] = await Promise.all([connectClient()]);
  await beginRoom([host]);
  const personalities = ['Friendly', 'Analytical', 'Bold'];
  for (const personality of personalities) {
    await request(host, 'host:add-bot', { settings: { personality, difficulty: 'Sharp', talkativeness: 'Chatty' } });
  }
  assert.equal(host.latestRoom.players.length, 3);
  assert.equal(host.latestRoom.host.totalCards, 6);
  assert.ok(host.latestRoom.players.every((player) => player.isBot && !('card' in player)), 'AI roles remain private during the lobby');
  await request(host, 'host:start');
  await waitForRoom([host], (room) => room.stage === 'discussion', 'AI players to finish role phases');
  await request(host, 'host:begin-voting');
  await waitForRoom([host], (room) => room.stage === 'results', 'AI players to vote');
  assert.ok(host.latestRoom.players.every((player) => player.isBot && player.startCard), 'each AI receives and reveals a role normally');
  assert.equal(Object.keys(host.latestRoom.results.voteCounts).length, 3);
  assert.ok(host.latestRoom.chat.some((message) => message.isBot && message.scope === 'public'), 'AI players post a personality-based postgame message');
  assert.equal(host.latestRoom.players[0].botSettings.difficulty, 'Sharp', 'the moderator can configure AI settings');
});

test('AI players complete Dusk marks and Night actions automatically', async () => {
  const [host] = await Promise.all([connectClient()]);
  await beginRoom([host]);
  for (let index = 0; index < 4; index += 1) await request(host, 'host:add-bot', { name: `Bot ${index + 1}`, settings: { personality: 'Analytical' } });
  await configureDeck(host, { Vampire: 1, Count: 1, Seer: 1, Villager: 4 });
  await request(host, 'host:start');
  await waitForRoom([host], (room) => room.stage === 'discussion', 'AI Dusk, Mark, Night, and Information phases');
  await request(host, 'host:begin-voting');
  await waitForRoom([host], (room) => room.stage === 'results', 'AI vote results');
  assert.equal(host.latestRoom.results.marksUsed, true);
  assert.ok(host.latestRoom.players.some((player) => player.mark === 'Vampire'));
  assert.ok(host.latestRoom.players.some((player) => player.mark === 'Fear'));
});

test('AI discussion uses private information with unique AI codes', async () => {
  const [host] = await Promise.all([connectClient()]);
  await beginRoom([host]);
  for (let index = 0; index < 3; index += 1) {
    await request(host, 'host:add-bot', { name: `Seer AI ${index + 1}`, settings: { personality: 'Analytical', talkativeness: 'Chatty' } });
  }
  const aiCodes = host.latestRoom.players.map((player) => player.aiCode);
  assert.equal(new Set(aiCodes).size, 3);
  await configureDeck(host, { Seer: 3, Villager: 3 });
  await request(host, 'host:start');
  await waitForRoom([host], (room) => room.stage === 'discussion', 'AI Seers to finish information phase');
  await request(host, 'host:timer', { running: true });
  await waitForRoom([host], (room) => room.chat.some((message) => message.isBot && message.text.includes("card as Seer")), 'AI to discuss a seen card');
  assert.ok(host.latestRoom.chat.every((message) => message.scope === 'public'), 'AI conversation is public');
});

test('AI players complete a full game alongside human players', async () => {
  const clients = await Promise.all(Array.from({ length: 3 }, () => connectClient()));
  const [host, ...players] = clients;
  await beginRoom(clients);
  await request(host, 'host:add-bot', { name: 'Village AI', settings: { difficulty: 'Sharp' } });
  await configureDeck(host, { Villager: 6 });
  await request(host, 'host:start');
  await waitForRoom(clients, (room) => room.stage === 'roles', 'mixed game role reveal');
  await Promise.all(players.map((client) => request(client, 'player:role-ready')));
  await waitForRoom(clients, (room) => room.stage === 'night', 'mixed game Night');
  await Promise.all(players.map((client) => {
    const targetId = client.latestRoom.players.find((player) => player.id !== client.latestRoom.viewer.playerId).id;
    return request(client, 'player:night-answer', { targetId });
  }));
  await waitForRoom(clients, (room) => room.stage === 'information', 'mixed game Information');
  await Promise.all(players.map((client) => request(client, 'player:information-done')));
  await waitForRoom(clients, (room) => room.stage === 'discussion', 'mixed game Discussion');
  const bot = host.latestRoom.players.find((player) => player.isBot);
  await request(host, 'host:timer', { running: true });
  await waitForRoom([host], (room) => room.chat.some((message) => message.isBot && message.scope === 'public'), 'AI timer-start discussion');
  const botMessagesBeforeClaim = host.latestRoom.chat.filter((message) => message.isBot && message.scope === 'public').length;
  await request(players[0], 'chat:send', { scope: 'public', text: 'I saw Player 1 as a werewolf on a card; vote Player 1.' });
  await waitForRoom([host], (room) => room.chat.filter((message) => message.isBot && message.scope === 'public').length > botMessagesBeforeClaim, 'AI reply to a public claim');
  assert.ok(host.latestRoom.chat.some((message) => message.isBot && message.text.includes('Player 1')), 'AI discussion responds to the named claim');
  await request(host, 'host:timer', { running: false });
  await request(host, 'host:begin-voting');
  await Promise.all(players.map((client) => {
    return request(client, 'player:vote', { targetId: bot.id });
  }));
  await waitForRoom(clients, (room) => room.stage === 'results', 'mixed human and AI votes');
  assert.ok(host.latestRoom.players.find((player) => player.isBot).voted, 'the AI casts its own vote');
  const namedSuspect = host.latestRoom.players.find((player) => player.name === 'Player 1');
  assert.ok(host.latestRoom.results.voteCounts[namedSuspect.id] > 0, 'public chat influences the AI vote');
  assert.equal(Object.values(host.latestRoom.results.voteCounts).reduce((sum, count) => sum + count, 0), 3);
});

test('accounts persist player seats and villages without exposing them publicly', async () => {
  const signup = (email) => fetch(`${serverUrl}/api/account/signup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name: email.split('@')[0], password: 'a-long-test-password' }),
  });
  const ownerResponse = await signup('owner@example.test');
  assert.equal(ownerResponse.status, 201);
  const ownerPayload = await ownerResponse.json();
  assert.equal('passwordHash' in ownerPayload.account, false);
  assert.equal(ownerPayload.account.icons.length, 12);
  const encryptedStore = JSON.parse(fs.readFileSync(path.join(temporaryData, 'accounts.enc'), 'utf8'));
  assert.equal(encryptedStore.data.includes('owner@example.test'), false, 'account data is encrypted at rest');
  const loginResponse = await fetch(`${serverUrl}/api/account/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@example.test', password: 'a-long-test-password' }),
  });
  assert.equal(loginResponse.status, 200, 'the account can sign in from another device');
  assert.equal((await fetch(`${serverUrl}/api/villages`)).status, 401);

  const otherResponse = await signup('other@example.test');
  const otherPayload = await otherResponse.json();
  const clients = [await connectClient(), await connectClient()];
  const [host, player] = clients;
  const created = await request(host, 'room:create', { accountToken: ownerPayload.token });
  host.latestRoom = created.room;
  const joined = await request(player, 'room:join', { code: created.room.code, name: 'Account Player', icon: '🦊', accountToken: otherPayload.token });
  player.latestRoom = joined.room;
  await request(host, 'host:save-village');
  const encryptedRooms = JSON.parse(fs.readFileSync(path.join(temporaryData, 'rooms.json'), 'utf8'));
  const encryptedVillages = JSON.parse(fs.readFileSync(path.join(temporaryData, 'saved-villages.json'), 'utf8'));
  assert.equal(encryptedRooms.data.includes(created.room.code), false, 'room state and player keys are encrypted at rest');
  assert.equal(encryptedVillages.data.includes(created.room.code), false, 'saved village keys are encrypted at rest');

  const ownerVillages = await fetch(`${serverUrl}/api/villages`, { headers: { Authorization: `Bearer ${ownerPayload.token}` } });
  const ownerVillageData = await ownerVillages.json();
  assert.equal(ownerVillageData.villages.length, 1);
  assert.equal(ownerVillageData.villages[0].code, created.room.code);
  assert.equal((await (await fetch(`${serverUrl}/api/villages`, { headers: { Authorization: `Bearer ${otherPayload.token}` } })).json()).villages.length, 0);
  const playerProfile = await fetch(`${serverUrl}/api/account/me`, { headers: { Authorization: `Bearer ${otherPayload.token}` } });
  assert.equal((await playerProfile.json()).account.linkedPlayers.length, 1);

  const catalog = await (await fetch(`${serverUrl}/api/account/catalog`)).json();
  assert.deepEqual([...new Set(catalog.icons.filter((item) => item.rarity === 'Common').map((item) => item.theme))], ['Woodland', 'Wildlife', 'Nature']);
  assert.equal(catalog.icons.some((item) => ['Sky & Space', 'Mystic', 'Oddities'].includes(item.theme) && item.rarity === 'Common'), false);
  const uncommon = catalog.icons.find((item) => item.rarity === 'Uncommon');
  const purchase = await fetch(`${serverUrl}/api/account/purchase-icon`, {
    method: 'POST', headers: { Authorization: `Bearer ${ownerPayload.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ icon: uncommon.icon }),
  });
  assert.equal(purchase.status, 400, 'coins are required before an icon can be purchased');
  assert.equal((await fetch(`${serverUrl}/server.js`)).status, 404, 'server source is not publicly served');
});

test('signed-in players earn persistent coins when a game resolves', async () => {
  const starterIcons = ['🦊', '🐺', '🦉'];
  const playerAccounts = await Promise.all(Array.from({ length: 3 }, async (_, index) => {
    const response = await fetch(`${serverUrl}/api/account/signup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `reward-${index}@example.test`, password: 'a-long-test-password' }),
    });
    return (await response.json()).token;
  }));
  const clients = await Promise.all(Array.from({ length: 4 }, () => connectClient()));
  const [host, ...players] = clients;
  const created = await request(host, 'room:create');
  host.latestRoom = created.room;
  for (let index = 0; index < players.length; index += 1) {
    const joined = await request(players[index], 'room:join', { code: created.room.code, name: `Reward ${index}`, icon: starterIcons[index], accountToken: playerAccounts[index] });
    players[index].latestRoom = joined.room;
  }
  await playToVoting(clients, { Werewolf: 1, Seer: 1, Villager: 4 });
  await Promise.all(players.map((client, index) => request(client, 'player:vote', { targetId: players[(index + 1) % players.length].latestRoom.viewer.playerId })));
  await waitForRoom(clients, (snapshot) => snapshot.stage === 'results', 'account reward results');
  for (let index = 0; index < playerAccounts.length; index += 1) {
    const profile = await fetch(`${serverUrl}/api/account/me`, { headers: { Authorization: `Bearer ${playerAccounts[index]}` } });
    const { account: savedAccount } = await profile.json();
    assert.equal(savedAccount.stats.games, 1);
    assert.ok([25, 40].includes(savedAccount.coins), 'completed game grants base coins and an optional win bonus');
  }
});

test('admin page requires configured key and all five answers', async () => {
  const accountResponse = await fetch(`${serverUrl}/api/account/signup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin-detail@example.test', password: 'a-long-test-password' }),
  });
  const accountToken = (await accountResponse.json()).token;
  const [host] = await Promise.all([connectClient()]);
  const created = await request(host, 'room:create', { accountToken });
  host.latestRoom = created.room;
  await request(host, 'host:save-village');
  assert.equal((await fetch(`${serverUrl}/123456789012345`)).status, 200);
  const challengeResponse = await fetch(`${serverUrl}/api/admin/challenge`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: '543210987654321' }),
  });
  assert.equal(challengeResponse.status, 200);
  const challenge = await challengeResponse.json();
  assert.equal(challenge.questions.length, 5);
  const verifyResponse = await fetch(`${serverUrl}/api/admin/verify`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId: challenge.challengeId, answers: Array.from({ length: 5 }, (_, index) => `answer-${index + 1}`) }),
  });
  assert.equal(verifyResponse.status, 200);
  const { token } = await verifyResponse.json();
  const dashboardResponse = await fetch(`${serverUrl}/api/admin/data`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(dashboardResponse.status, 200);
  const dashboard = await dashboardResponse.json();
  assert.ok(dashboard.accounts.some((entry) => entry.email === 'admin-detail@example.test'));
  assert.equal(JSON.stringify(dashboard).includes('passwordHash'), false);
  const owner = dashboard.accounts.find((entry) => entry.email === 'admin-detail@example.test');
  const detailResponse = await fetch(`${serverUrl}/api/admin/accounts/${owner.id}`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(detailResponse.status, 200);
  const detail = (await detailResponse.json()).account;
  assert.ok(detail.activityLog.some((entry) => entry.action === 'Account created'));
  assert.ok(detail.activityLog.some((entry) => entry.action === 'Village saved'));
  assert.equal(detail.villages.length, 1);
  assert.equal(JSON.stringify(detail).includes('passwordHash'), false);
  assert.equal(JSON.stringify(detail).includes('salt'), false);
  assert.equal(JSON.stringify(detail).includes('hostKey'), false);
  assert.equal((await fetch(`${serverUrl}/api/admin/accounts/${owner.id}`)).status, 401);
  assert.equal((await fetch(`${serverUrl}/api/admin/data`)).status, 401);
});

test('Sentinel shields block card actions', async () => {
  const clients = Array.from({ length: 6 }, () => connectClient());
  const connectedClients = await Promise.all(clients);
  const [host, ...players] = connectedClients;
  await beginRoom(connectedClients);
  await playToVoting(connectedClients, { Sentinel: 4, Seer: 4 });
  assert.ok(host.latestRoom.players.some((player) => player.shielded), 'moderator can see the shield marker');
  assert.ok(players.every((client) => client.latestRoom.own.card === null), 'information phase does not reveal a role');
  assert.ok(players.some((client) => client.testRole === 'Seer'), 'a Seer is dealt to a player');
});

test('Curator artifact identity is private to its holder', async () => {
  const clients = [await connectClient(), await connectClient(), await connectClient(), await connectClient()];
  const [host, ...players] = clients;
  await beginRoom(clients);
  await playToVoting(clients, { Curator: 4, Villager: 2 });
  const curator = players.find((client) => client.testRole === 'Curator');
  assert.ok(curator, 'Curator is guaranteed to be dealt to a player');
  const holders = players.filter((client) => client.latestRoom.own.artifact);
  assert.ok(holders.length, 'the selected pool assigned at least one artifact');
  for (const holder of holders) {
    for (const client of players) {
      const publicPlayer = client.latestRoom.players.find((player) => player.id === holder.latestRoom.viewer.playerId);
      assert.equal(publicPlayer.artifact, true, 'everyone can see who holds an artifact');
      assert.equal('artifactName' in publicPlayer, false, 'the public roster does not reveal artifact identity');
    }
  }
  assert.ok(players.every((client) => client.latestRoom.own.artifact === null || holders.includes(client)), 'players without artifacts do not learn another player’s artifact');
});

test('expanded night roles all submit and resolve in configured order', async () => {
  const clients = await Promise.all(Array.from({ length: 13 }, () => connectClient()));
  const [host, ...players] = clients;
  await beginRoom(clients);
  await playToVoting(clients, {
    Sentinel: 4,
    Doppelganger: 4,
    Werewolf: 1,
    'Mystic Wolf': 1,
    'Alpha Wolf': 1,
    'Dream Wolf': 1,
    Seer: 1,
    Robber: 1,
    'Paranormal Investigator': 1,
  });
  assert.equal(host.latestRoom.stage, 'voting');
  assert.equal('nightDone' in host.latestRoom.host, false, 'moderator does not receive Night readiness totals');
  assert.ok(players.every((client) => client.latestRoom.own.card === null), 'night results do not restore the dealt role');
});

test('Dusk marks resolve before Night and new mark roles complete their actions', async () => {
  const clients = await Promise.all(Array.from({ length: 7 }, () => connectClient()));
  const [host, ...players] = clients;
  await beginRoom(clients);
  await playToVoting(clients, {
    Vampire: 1, Count: 1, Assassin: 1, Marksman: 1, Pickpocket: 1, Gremlin: 1, Villager: 3,
  });
  assert.equal(host.latestRoom.stage, 'voting');
  assert.ok(players.some((client) => client.testRole === 'Vampire'));
  assert.ok(players.some((client) => client.testRole === 'Count'));
  assert.ok(players.some((client) => client.testRole === 'Marksman'));
  assert.ok(players.find((client) => client.testRole === 'Pickpocket').latestRoom.own.notes.some((note) => note.includes("Because you don't have a Dusk role")));
});

test('games without Dusk skip Mark and do not reveal marks', async () => {
  const clients = [await connectClient(), await connectClient(), await connectClient(), await connectClient()];
  const [host, ...players] = clients;
  await beginRoom(clients);
  await playToVoting(clients, { Werewolf: 1, Seer: 1, Villager: 4 });
  assert.equal(host.latestRoom.duskUsed, false);
  assert.ok(players.filter((client) => !['Werewolf', 'Seer'].includes(client.testRole)).every((client) => client.latestRoom.own.notes.some((note) => note.includes("Because you don't have a Night role"))));
  const target = players[0];
  await Promise.all(players.map((client) => request(client, 'player:vote', { targetId: client === target ? players[1].latestRoom.viewer.playerId : target.latestRoom.viewer.playerId })));
  await waitForRoom(clients, (snapshot) => snapshot.stage === 'results', 'no-Dusk reveal');
  assert.equal(host.latestRoom.results.marksUsed, false);
  assert.ok(host.latestRoom.players.every((player) => !('mark' in player)), 'the reveal omits marks when Dusk did not run');
});

test('Setup questions are recorded for players without a Setup role', async () => {
  const clients = await Promise.all(Array.from({ length: 13 }, () => connectClient()));
  const [host, ...players] = clients;
  await beginRoom(clients);
  await playToVoting(clients, {
    Sentinel: 4, Doppelganger: 4, Werewolf: 1, 'Mystic Wolf': 1, 'Alpha Wolf': 1,
    'Dream Wolf': 1, Seer: 1, Robber: 1, 'Paranormal Investigator': 1,
  });
  const questionPlayers = players.filter((client) => client.testRole !== 'Doppelganger');
  assert.ok(questionPlayers.every((client) => client.latestRoom.own.notes.some((note) => note.includes("Because you don't have a Setup role"))));
});

test('a voted-out Tanner does not override surviving wolves or vampires', async () => {
  const clients = [await connectClient(), await connectClient(), await connectClient(), await connectClient()];
  const [host] = clients;
  await beginRoom(clients);
  await playToVoting(clients, { Werewolf: 1, Tanner: 1, Villager: 4 });
  const wolfClient = playersWithRole(clients.slice(1), 'Werewolf')[0];
  const tannerClient = playersWithRole(clients.slice(1), 'Tanner')[0];
  const villagerClient = playersWithRole(clients.slice(1), 'Villager')[0];
  await Promise.all([
    request(wolfClient, 'player:vote', { targetId: tannerClient.latestRoom.viewer.playerId }),
    request(villagerClient, 'player:vote', { targetId: tannerClient.latestRoom.viewer.playerId }),
    request(tannerClient, 'player:vote', { targetId: villagerClient.latestRoom.viewer.playerId }),
  ]);
  await waitForRoom(clients, (snapshot) => snapshot.stage === 'results', 'Tanner elimination result');
  assert.equal(host.latestRoom.results.winnerTeam, 'wolves');
  assert.deepEqual(host.latestRoom.results.winningTeams, ['wolves', 'tanner']);
  assert.match(host.latestRoom.results.winner, /The village loses\. The werewolf team also wins\./);
  assert.equal(tannerClient.latestRoom.own.outcome, 'You win');
  assert.equal(wolfClient.latestRoom.own.outcome, 'You win');
  assert.equal(villagerClient.latestRoom.own.outcome, 'You lose');
});

function playersWithRole(clients, role) {
  return clients.filter((client) => client.testRole === role);
}

test('one vote per player with no repeated target eliminates nobody', async () => {
  const clients = [await connectClient(), await connectClient(), await connectClient(), await connectClient()];
  const [host, ...players] = clients;
  await beginRoom(clients);
  await playToVoting(clients, { Hunter: 6 });
  await Promise.all(players.map((client, index) => request(client, 'player:vote', {
    targetId: players[(index + 1) % players.length].latestRoom.viewer.playerId,
  })));
  await waitForRoom(clients, (snapshot) => snapshot.stage === 'results', 'no-consensus results');
  assert.deepEqual(host.latestRoom.results.deadIds, []);
  assert.ok(Object.values(host.latestRoom.results.voteCounts).every((count) => count === 1));
});

test('Bodyguard protects its vote target and selects the next eligible majority', async () => {
  const clients = await Promise.all(Array.from({ length: 6 }, () => connectClient()));
  const [host, ...players] = clients;
  await beginRoom(clients);
  await playToVoting(clients, { Bodyguard: 4, Villager: 4 });
  const bodyguards = players.filter((client) => client.testRole === 'Bodyguard');
  assert.ok(bodyguards.length > 0);
  const villagers = players.filter((client) => client.testRole !== 'Bodyguard');
  const protectedPlayer = villagers[0];
  const nextCandidate = players.find((client) => client !== protectedPlayer);
  await Promise.all(players.map((client) => {
    let target;
    if (client.testRole === 'Bodyguard') target = protectedPlayer;
    else if (client === protectedPlayer) target = nextCandidate;
    else if (client === nextCandidate) target = protectedPlayer;
    else target = nextCandidate;
    return request(client, 'player:vote', { targetId: target.latestRoom.viewer.playerId });
  }));
  await waitForRoom(clients, (snapshot) => snapshot.stage === 'results', 'Bodyguard vote results');
  const candidateVotes = host.latestRoom.results.voteCounts[nextCandidate.latestRoom.viewer.playerId];
  assert.equal(host.latestRoom.results.deadIds.includes(protectedPlayer.latestRoom.viewer.playerId), false, "Bodyguard's target cannot be eliminated");
  assert.equal(host.latestRoom.results.deadIds.includes(nextCandidate.latestRoom.viewer.playerId), candidateVotes > 1, 'the next eligible player is eliminated only with more than one vote');
});

test('a voted-out Hunter also eliminates the player they voted for', async () => {
  const clients = [await connectClient(), await connectClient(), await connectClient(), await connectClient()];
  const [host, ...players] = clients;
  await beginRoom(clients);
  await playToVoting(clients, { Hunter: 6 });
  const target = players[1].latestRoom.viewer.playerId;
  const other = players[2].latestRoom.viewer.playerId;
  await Promise.all([
    request(players[0], 'player:vote', { targetId: target }),
    request(players[1], 'player:vote', { targetId: other }),
    request(players[2], 'player:vote', { targetId: target }),
  ]);
  await waitForRoom(clients, (snapshot) => snapshot.stage === 'results', 'Hunter results');
  assert.ok(host.latestRoom.results.deadIds.includes(target), 'most-voted Hunter is eliminated');
  assert.ok(host.latestRoom.results.deadIds.includes(other), 'Hunter vote target is eliminated too');
  assert.equal(host.latestRoom.results.winner, 'The village wins. No werewolves remain among the players.');
});