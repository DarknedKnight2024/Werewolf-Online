const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const http = require('node:http');
const { Server } = require('socket.io');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: false } });
const port = Number(process.env.PORT || 3000);
const dataDir = process.env.DATA_DIR || path.join(__dirname, '.data');
const roomFile = path.join(dataDir, 'rooms.json');
const ROLES = ['Doppelganger', 'Werewolf', 'Minion', 'Mason', 'Seer', 'Robber', 'Troublemaker', 'Drunk', 'Insomniac', 'Hunter', 'Tanner', 'Villager'];
const ROLE_ORDER = ['Werewolf', 'Minion', 'Mason', 'Seer', 'Robber', 'Troublemaker', 'Drunk', 'Insomniac', 'Hunter', 'Tanner', 'Villager'];
const ICONS = ['🌙', '🦊', '🐺', '🦉', '🦇', '🐈', '🦌', '🐸', '🦝', '🐻', '🕯️', '🍄'];
const QUESTIONS = [
  'Who would be the last person you would trust with a secret?',
  'Who is most likely to make it through a night in the woods?',
  'Who would you want beside you in a suspiciously quiet village?',
  'Who has the most convincing poker face?',
];
const rooms = new Map();
const timers = new Map();

function randomToken() { return crypto.randomBytes(24).toString('base64url'); }
function tokenHash(token) { return crypto.createHash('sha256').update(String(token || '')).digest('hex'); }
function newCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do { code = Array.from(crypto.randomBytes(4), (byte) => chars[byte % chars.length]).join(''); } while (rooms.has(code));
  return code;
}
function shuffle(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = crypto.randomInt(index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
function timestamp() { return new Date().toISOString(); }
function roleCount(room) { return Object.values(room.roles).reduce((sum, count) => sum + count, 0); }
function effectiveRole(player) { return player.startCard === 'Doppelganger' ? player.effectiveRole : player.card; }
function playerById(room, id) { return room.players.find((player) => player.id === id); }
function roleQuestion(action, room) {
  return ['Minion', 'Mason', 'Insomniac', 'Hunter', 'Tanner', 'Villager'].includes(action.role)
    || (action.role === 'Werewolf' && room.players.filter((player) => effectiveRole(player) === 'Werewolf').length > 1);
}
function persist() {
  fs.mkdirSync(dataDir, { recursive: true });
  const data = JSON.stringify([...rooms.values()]);
  const temporary = `${roomFile}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, data, { mode: 0o600 });
  fs.renameSync(temporary, roomFile);
}
function loadRooms() {
  try {
    const saved = JSON.parse(fs.readFileSync(roomFile, 'utf8'));
    for (const room of saved) {
      room.players = room.players || [];
      room.players.forEach((player) => { player.connected = false; });
      room.hostConnected = false;
      if (room.stage === 'discussion') room.timerRunning = false;
      rooms.set(room.code, room);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Unable to load saved rooms:', error.message);
  }
}
function updateRoom(room) {
  room.updatedAt = timestamp();
  persist();
  for (const client of io.sockets.sockets.values()) {
    const session = client.data.session;
    if (session?.code === room.code) client.emit('room:update', snapshot(room, session));
  }
}
function snapshot(room, session) {
  const user = session.kind === 'player' ? playerById(room, session.playerId) : null;
  const action = room.stage === 'night' ? room.nightQueue[room.nightIndex] : null;
  const privateNotes = user ? [...(user.events || [])] : [];
  if (user && room.stage === 'information' && effectiveRole(user) === 'Insomniac') privateNotes.push(`Your card is now: ${user.card}.`);
  const wolves = user && room.stage === 'night' && effectiveRole(user) === 'Werewolf'
    ? room.players.filter((player) => player.id !== user.id && effectiveRole(player) === 'Werewolf').map(({ id, name, icon }) => ({ id, name, icon }))
    : [];
  const setupCounts = room.stage === 'information' || room.stage === 'discussion' || room.stage === 'voting' || room.stage === 'results'
    ? Object.fromEntries(room.players.map((player) => [player.id, room.players.filter((other) => other.setupTarget === player.setupTarget).length]))
    : {};
  return {
    code: room.code,
    stage: room.stage,
    roles: room.roles,
    question: room.question,
    nightQuestion: room.nightQuestion,
    players: room.players.map((player) => ({ id: player.id, name: player.name, icon: player.icon, connected: Boolean(player.connected), ready: Boolean(room.infoDone?.[player.id]), voted: Boolean(room.votes?.[player.id]), ...(room.stage === 'results' ? { card: player.card, startCard: player.startCard, effectiveRole: player.effectiveRole || null } : {}) })),
    viewer: { kind: session.kind, playerId: session.playerId || null, name: user?.name || 'Moderator' },
    action: action ? { index: room.nightIndex + 1, total: room.nightQueue.length, ...(session.kind === 'host' || user?.id === action.actorId ? { role: action.role, actorId: action.actorId, actorName: playerById(room, action.actorId)?.name, copied: Boolean(action.copied), requiresQuestion: roleQuestion(action, room), targets: action.role === 'Werewolf' ? wolves : undefined } : {}) } : null,
    setupIndex: room.setupIndex,
    setupCount: room.players.length,
    informationDone: Object.keys(room.infoDone || {}).length,
    discussionSeconds: room.discussionSeconds,
    timerRunning: Boolean(room.timerRunning),
    voteDone: Object.keys(room.votes || {}).length,
    results: room.stage === 'results' ? { voteCounts: room.voteCounts, deadIds: room.deadIds, winner: room.winner, center: room.center } : null,
    own: user ? {
      card: room.stage === 'lobby' ? null : user.card,
      startCard: room.stage === 'lobby' ? null : user.startCard,
      effectiveRole: user.effectiveRole || null,
      setupTarget: user.setupTarget || null,
      nightAnswer: user.nightAnswer || null,
      notes: privateNotes,
      seerMode: user.seerMode || 'player',
      selectedIds: user.selectedIds || [],
      selectedCenter: user.selectedCenter || [],
      voteTarget: room.votes?.[user.id] || null,
      voteCounts: room.stage === 'results' ? room.voteCounts : null,
      deadIds: room.stage === 'results' ? room.deadIds : null,
      winner: room.stage === 'results' ? room.winner : null,
      center: room.stage === 'results' ? room.center : null,
      setupMatchCount: setupCounts[user.id] || 0,
    } : null,
    host: session.kind === 'host' ? { playerCount: room.players.length, totalCards: roleCount(room), cardsNeeded: room.players.length + 3, setupDone: room.setupIndex || 0, informationDone: Object.keys(room.infoDone || {}).length } : null,
  };
}
function ackError(ack, message) { if (typeof ack === 'function') ack({ error: message }); }
function sendSnapshot(socket, room, session, ack) {
  socket.data.session = session;
  socket.join(room.code);
  if (typeof ack === 'function') ack({ room: snapshot(room, session) });
}
function authorize(socket, code, token, kind) {
  const room = rooms.get(String(code || '').trim().toUpperCase());
  if (!room) throw new Error('No room found with that code.');
  const digest = tokenHash(token);
  if (kind === 'host') {
    if (digest !== room.hostTokenHash) throw new Error('This host session is not valid.');
    return { room, session: { code: room.code, kind: 'host' } };
  }
  const player = room.players.find((entry) => entry.tokenHash === digest);
  if (!player) throw new Error('This player session is not valid. Rejoin with the room code.');
  player.connected = true;
  player.socketId = socket.id;
  return { room, session: { code: room.code, kind: 'player', playerId: player.id } };
}
function roleQueue(room) {
  const queue = [];
  const doppelPlayers = room.players.filter((player) => player.startCard === 'Doppelganger');
  for (const player of doppelPlayers) queue.push({ role: player.effectiveRole, actorId: player.id, copied: true });
  for (const role of ROLE_ORDER) {
    for (const player of room.players.filter((entry) => entry.startCard === role)) {
      if (role === 'Werewolf' && doppelPlayers.some((entry) => entry.effectiveRole === 'Werewolf')) continue;
      queue.push({ role, actorId: player.id, copied: false });
    }
  }
  return queue;
}
function startNight(room) {
  room.nightQueue = roleQueue(room);
  room.nightIndex = 0;
  room.stage = 'night';
  room.players.forEach((player) => { player.nightAnswer = null; player.selectedIds = []; player.selectedCenter = []; });
}
function advanceNight(room) {
  room.nightIndex += 1;
  if (room.nightIndex >= room.nightQueue.length) {
    room.stage = 'information';
    room.infoDone = {};
  }
}
function currentActor(room) {
  const action = room.nightQueue[room.nightIndex];
  return action ? playerById(room, action.actorId) : null;
}
function validatePlayerTurn(room, playerId, stage) {
  if (room.stage !== stage) throw new Error('That action is not available now.');
  const player = playerById(room, playerId);
  if (!player) throw new Error('Player not found in this room.');
  return player;
}
function requireHost(socket) {
  const session = socket.data.session;
  if (!session || session.kind !== 'host') throw new Error('Only the moderator can do that.');
  const room = rooms.get(session.code);
  if (!room) throw new Error('Room no longer exists.');
  return room;
}
function requirePlayer(socket) {
  const session = socket.data.session;
  if (!session || session.kind !== 'player') throw new Error('Join the room as a player first.');
  const room = rooms.get(session.code);
  if (!room) throw new Error('Room no longer exists.');
  return { room, player: playerById(room, session.playerId) };
}
function finishVotes(room) {
  const counts = Object.fromEntries(room.players.map((player) => [player.id, 0]));
  Object.values(room.votes).forEach((targetId) => { counts[targetId] += 1; });
  const highest = Math.max(0, ...Object.values(counts));
  const dead = highest ? room.players.filter((player) => counts[player.id] === highest) : [];
  const hunter = dead.find((player) => effectiveRole(player) === 'Hunter');
  if (hunter && room.votes[hunter.id]) {
    const hunterTarget = playerById(room, room.votes[hunter.id]);
    if (hunterTarget && !dead.some((player) => player.id === hunterTarget.id)) dead.push(hunterTarget);
  }
  const tanner = dead.find((player) => effectiveRole(player) === 'Tanner');
  const wolfVoted = dead.some((player) => effectiveRole(player) === 'Werewolf');
  const wolvesRemain = room.players.some((player) => effectiveRole(player) === 'Werewolf' && !dead.some((entry) => entry.id === player.id));
  room.voteCounts = counts;
  room.deadIds = dead.map((player) => player.id);
  room.winner = tanner ? `${tanner.name} wins as the Tanner.` : wolfVoted ? 'The village wins. A werewolf was voted out.' : !wolvesRemain ? 'The village wins. No werewolves remain among the players.' : 'The werewolves win. The village missed.';
  room.stage = 'results';
  room.timerRunning = false;
  stopTimer(room.code);
}
function stopTimer(code) {
  const timer = timers.get(code);
  if (timer) clearInterval(timer);
  timers.delete(code);
}
function acked(handler) {
  return (payload = {}, ack) => {
    try { handler(payload, ack); }
    catch (error) { ackError(ack, error.message); }
  };
}

loadRooms();
app.use(express.static(__dirname));
app.get('/health', (_request, response) => response.json({ status: 'ok', rooms: rooms.size }));

io.on('connection', (socket) => {
  socket.on('room:create', acked((_payload, ack) => {
    const code = newCode();
    const hostToken = randomToken();
    const question = QUESTIONS[crypto.randomInt(QUESTIONS.length)];
    const nightQuestion = QUESTIONS.filter((entry) => entry !== question)[crypto.randomInt(QUESTIONS.length - 1)];
    const roles = Object.fromEntries(ROLES.map((role) => [role, 0]));
    roles.Werewolf = 1;
    roles.Seer = 1;
    roles.Villager = 2;
    const room = { code, hostTokenHash: tokenHash(hostToken), players: [], roles, stage: 'lobby', question, nightQuestion, createdAt: timestamp(), updatedAt: timestamp(), hostConnected: true };
    rooms.set(code, room);
    persist();
    sendSnapshot(socket, room, { code, kind: 'host' }, () => ack?.({ room: snapshot(room, { code, kind: 'host' }), token: hostToken }));
  }));

  socket.on('room:join', acked((payload, ack) => {
    const room = rooms.get(String(payload.code || '').trim().toUpperCase());
    const name = String(payload.name || '').trim().slice(0, 18);
    const icon = String(payload.icon || '');
    if (!room || room.stage !== 'lobby') throw new Error('No open lobby found with that code.');
    if (!name) throw new Error('Enter a player name.');
    if (room.players.length >= 12) throw new Error('This room is full.');
    if (!ICONS.includes(icon) || room.players.some((player) => player.icon === icon)) throw new Error('Choose an available icon.');
    const token = randomToken();
    const player = { id: crypto.randomUUID(), tokenHash: tokenHash(token), name, icon, connected: true, socketId: socket.id };
    room.players.push(player);
    const fixedCards = roleCount(room) - room.roles.Villager;
    room.roles.Villager = Math.max(0, room.players.length + 3 - fixedCards);
    updateRoom(room);
    sendSnapshot(socket, room, { code: room.code, kind: 'player', playerId: player.id }, () => ack?.({ room: snapshot(room, { code: room.code, kind: 'player', playerId: player.id }), token }));
  }));

  socket.on('room:resume', acked((payload, ack) => {
    const { room, session } = authorize(socket, payload.code, payload.token, payload.kind);
    if (session.kind === 'host') room.hostConnected = true;
    updateRoom(room);
    sendSnapshot(socket, room, session, ack);
  }));

  socket.on('room:leave', acked(() => {
    const session = socket.data.session;
    if (!session) return;
    const room = rooms.get(session.code);
    if (room) {
      if (session.kind === 'host') room.hostConnected = false;
      else {
        const player = playerById(room, session.playerId);
        if (player) player.connected = false;
      }
      socket.leave(session.code);
      delete socket.data.session;
      updateRoom(room);
    }
  }));

  socket.on('host:deck', acked((payload) => {
    const room = requireHost(socket);
    if (room.stage !== 'lobby') throw new Error('The role deck is locked after the game starts.');
    for (const role of ROLES) {
      const amount = Number(payload.roles?.[role]);
      if (!Number.isInteger(amount) || amount < 0 || amount > 12) throw new Error('Role counts must be whole numbers from 0 to 12.');
      room.roles[role] = amount;
    }
    updateRoom(room);
  }));

  socket.on('host:adjust-role', acked((payload) => {
    const room = requireHost(socket);
    if (room.stage !== 'lobby') throw new Error('The role deck is locked after the game starts.');
    if (!ROLES.includes(payload.role) || ![-1, 1].includes(Number(payload.delta))) throw new Error('Invalid role change.');
    room.roles[payload.role] = Math.max(0, Math.min(12, room.roles[payload.role] + Number(payload.delta)));
    updateRoom(room);
  }));

  socket.on('host:start', acked(() => {
    const room = requireHost(socket);
    if (room.stage !== 'lobby') throw new Error('This game has already started.');
    if (room.players.length < 3 || room.players.length > 12) throw new Error('At least 3 players are needed.');
    if (roleCount(room) !== room.players.length + 3) throw new Error('Choose exactly one card per player, plus three center cards.');
    const deck = shuffle(ROLES.flatMap((role) => Array(room.roles[role]).fill(role)));
    room.players.forEach((player, index) => Object.assign(player, { card: deck[index], startCard: deck[index], events: [], setupTarget: null, effectiveRole: null, nightAnswer: null }));
    room.center = deck.slice(room.players.length);
    room.setupIndex = 0;
    room.stage = 'setup';
    updateRoom(room);
  }));

  socket.on('player:setup', acked((payload) => {
    const { room, player } = requirePlayer(socket);
    validatePlayerTurn(room, player.id, 'setup');
    if (room.players[room.setupIndex]?.id !== player.id) throw new Error('Wait for your setup turn.');
    const target = playerById(room, payload.targetId);
    if (!target || target.id === player.id) throw new Error('Choose another player.');
    player.setupTarget = target.id;
    if (player.startCard === 'Doppelganger') player.effectiveRole = target.startCard;
    room.setupIndex += 1;
    if (room.setupIndex >= room.players.length) startNight(room);
    updateRoom(room);
  }));

  socket.on('player:night-answer', acked((payload) => {
    const { room, player } = requirePlayer(socket);
    const action = room.nightQueue[room.nightIndex];
    if (room.stage !== 'night' || action?.actorId !== player.id || !roleQuestion(action, room)) throw new Error('There is no night question for you now.');
    const answer = playerById(room, payload.targetId);
    if (!answer || answer.id === player.id) throw new Error('Choose another player.');
    player.nightAnswer = answer.id;
    player.events.push(`Night question: chose ${answer.name}.`);
    if (action.role === 'Minion') {
      const wolves = room.players.filter((entry) => effectiveRole(entry) === 'Werewolf');
      player.events.push(wolves.length ? `The werewolves are: ${wolves.map((entry) => entry.name).join(', ')}.` : 'There are no werewolves in the village.');
    }
    if (action.role === 'Mason') {
      const masons = room.players.filter((entry) => entry.id !== player.id && effectiveRole(entry) === 'Mason');
      player.events.push(masons.length ? `Other Masons: ${masons.map((entry) => entry.name).join(', ')}.` : 'You saw no other Masons.');
    }
    advanceNight(room);
    updateRoom(room);
  }));

  socket.on('player:night-action', acked((payload) => {
    const { room, player } = requirePlayer(socket);
    const action = room.nightQueue[room.nightIndex];
    if (room.stage !== 'night' || action?.actorId !== player.id) throw new Error('Wait for your night turn.');
    const role = action.role;
    if (roleQuestion(action, room)) throw new Error('Answer your night question first.');
    if (role === 'Werewolf') {
      const wolves = room.players.filter((entry) => effectiveRole(entry) === 'Werewolf');
      if (wolves.length !== 1) throw new Error('Werewolves act together and do not peek at the center.');
      const index = Number(payload.centerIndex);
      if (!Number.isInteger(index) || index < 0 || index > 2) throw new Error('Choose a center card.');
      player.events.push(`Looked at center card ${index + 1}: ${room.center[index]}.`);
    } else if (role === 'Seer') {
      if (payload.mode === 'player') {
        const target = playerById(room, payload.targetId);
        if (!target || target.id === player.id) throw new Error('Choose another player.');
        player.events.push(`Saw ${target.name}’s card: ${target.card}.`);
      } else if (payload.mode === 'center') {
        const indices = [...new Set((payload.centerIndices || []).map(Number))];
        if (indices.length !== 2 || indices.some((index) => !Number.isInteger(index) || index < 0 || index > 2)) throw new Error('Choose two different center cards.');
        player.events.push(`Saw center cards ${indices.map((index) => `#${index + 1} ${room.center[index]}`).join(' and ')}.`);
      } else throw new Error('Choose a player or two center cards.');
    } else if (role === 'Robber') {
      const target = playerById(room, payload.targetId);
      if (!target || target.id === player.id) throw new Error('Choose another player.');
      [player.card, target.card] = [target.card, player.card];
      player.events.push(`Swapped cards with ${target.name}. Your new card is ${player.card}.`);
    } else if (role === 'Troublemaker') {
      const targets = [...new Set(payload.targetIds || [])].map((id) => playerById(room, id));
      if (targets.length !== 2 || targets.some((target) => !target || target.id === player.id)) throw new Error('Choose two different players other than yourself.');
      [targets[0].card, targets[1].card] = [targets[1].card, targets[0].card];
      player.events.push(`Swapped ${targets[0].name}’s and ${targets[1].name}’s cards.`);
    } else if (role === 'Drunk') {
      const index = Number(payload.centerIndex);
      if (!Number.isInteger(index) || index < 0 || index > 2) throw new Error('Choose a center card.');
      [player.card, room.center[index]] = [room.center[index], player.card];
      player.events.push('Swapped your card with a center card. You do not know which role you now hold.');
    } else throw new Error('This role does not have a night action.');
    advanceNight(room);
    updateRoom(room);
  }));

  socket.on('player:information-done', acked(() => {
    const { room, player } = requirePlayer(socket);
    if (room.stage !== 'information') throw new Error('Information is not available now.');
    room.infoDone ||= {};
    room.infoDone[player.id] = true;
    if (room.players.every((entry) => room.infoDone[entry.id])) {
      room.stage = 'discussion';
      room.discussionSeconds = 300;
      room.timerRunning = false;
    }
    updateRoom(room);
  }));

  socket.on('host:timer', acked((payload) => {
    const room = requireHost(socket);
    if (room.stage !== 'discussion') throw new Error('The discussion timer is not active now.');
    if (payload.running) {
      room.timerRunning = true;
      if (!timers.has(room.code)) {
        timers.set(room.code, setInterval(() => {
          if (!room.timerRunning || room.stage !== 'discussion') return stopTimer(room.code);
          room.discussionSeconds = Math.max(0, room.discussionSeconds - 1);
          if (room.discussionSeconds === 0) { room.timerRunning = false; stopTimer(room.code); }
          updateRoom(room);
        }, 1000));
      }
    } else {
      room.timerRunning = false;
      stopTimer(room.code);
    }
    updateRoom(room);
  }));

  socket.on('host:begin-voting', acked(() => {
    const room = requireHost(socket);
    if (room.stage !== 'discussion') throw new Error('Voting can only start after discussion.');
    room.timerRunning = false;
    stopTimer(room.code);
    room.votes = {};
    room.stage = 'voting';
    updateRoom(room);
  }));

  socket.on('player:vote', acked((payload) => {
    const { room, player } = requirePlayer(socket);
    if (room.stage !== 'voting') throw new Error('Voting is not open.');
    const target = playerById(room, payload.targetId);
    if (!target || target.id === player.id) throw new Error('Vote for another player.');
    if (room.votes[player.id]) throw new Error('Your vote is already locked.');
    room.votes[player.id] = target.id;
    if (Object.keys(room.votes).length === room.players.length) finishVotes(room);
    updateRoom(room);
  }));

  socket.on('host:play-again', acked(() => {
    const room = requireHost(socket);
    if (room.stage !== 'results') throw new Error('This game has not finished.');
    for (const player of room.players) {
      for (const key of ['card', 'startCard', 'events', 'setupTarget', 'effectiveRole', 'nightAnswer', 'voteTarget']) delete player[key];
    }
    for (const key of ['center', 'nightQueue', 'nightIndex', 'setupIndex', 'infoDone', 'votes', 'voteCounts', 'deadIds', 'winner']) delete room[key];
    const question = QUESTIONS[crypto.randomInt(QUESTIONS.length)];
    room.question = question;
    room.nightQuestion = QUESTIONS.filter((entry) => entry !== question)[crypto.randomInt(QUESTIONS.length - 1)];
    room.stage = 'lobby';
    updateRoom(room);
  }));

  socket.on('disconnect', () => {
    const session = socket.data.session;
    if (!session) return;
    const room = rooms.get(session.code);
    if (!room) return;
    if (session.kind === 'host') room.hostConnected = false;
    else {
      const player = playerById(room, session.playerId);
      if (player) player.connected = false;
    }
    updateRoom(room);
  });
});

httpServer.listen(port, '0.0.0.0', () => console.log(`Nightshift listening on ${port}`));