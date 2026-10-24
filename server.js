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
const ROLES = ['Sentinel', 'Copycat', 'Doppelganger', 'Vampire', 'Master', 'Count', 'Renfield', 'Diseased', 'Cupid', 'Instigator', 'Priest', 'Assassin', 'Apprentice Assassin', 'Werewolf', 'Mystic Wolf', 'Alpha Wolf', 'Dream Wolf', 'Minion', 'Mason', 'Seer', 'Apprentice Seer', 'Marksman', 'Robber', 'Witch', 'Paranormal Investigator', 'Pickpocket', 'Troublemaker', 'Village Idiot', 'Gremlin', 'Drunk', 'Insomniac', 'Revealer', 'Curator', 'Hunter', 'Tanner', 'Villager', 'Bodyguard'];
const DUSK_ORDER = ['Count', 'Renfield', 'Diseased', 'Cupid', 'Instigator', 'Priest', 'Assassin'];
const NIGHT_ORDER = ['Sentinel', 'Werewolf', 'Mystic Wolf', 'Alpha Wolf', 'Dream Wolf', 'Minion', 'Mason', 'Seer', 'Apprentice Seer', 'Marksman', 'Robber', 'Witch', 'Paranormal Investigator', 'Pickpocket', 'Troublemaker', 'Village Idiot', 'Gremlin', 'Drunk', 'Insomniac', 'Revealer', 'Curator', 'Hunter', 'Tanner', 'Villager', 'Bodyguard'];
const MARKS = ['Clarity', 'Vampire', 'Fear', 'Bat', 'Disease', 'Love', 'Traitor', 'Assassin'];
const MARK_LABELS = Object.fromEntries(MARKS.map((mark) => [mark, `Mark of ${mark}`]));
const COPY_ROLES = new Set(['Copycat', 'Doppelganger']);
const NIGHT_ACTIVE_ROLES = new Set(['Werewolf', 'Mystic Wolf', 'Alpha Wolf', 'Seer', 'Apprentice Seer', 'Robber', 'Witch', 'Paranormal Investigator', 'Pickpocket', 'Troublemaker', 'Village Idiot', 'Gremlin', 'Drunk', 'Revealer', 'Curator']);
const NIGHT_QUESTION_ROLES = new Set(['Sentinel', 'Marksman', 'Hunter', 'Tanner', 'Villager', 'Bodyguard']);
const VAMPIRE_ROLES = new Set(['Vampire', 'Master', 'Count', 'Renfield']);
const ICONS = ['🦊', '🐺', '🦉', '🦇', '🐈', '🦌', '🐸', '🦝', '🐻', '🐝', '🦚', '🦔', '🐿️', '🦓', '🐙', '🪲', '🦋', '🐢', '🐬', '🦈', '🐧', '🐼', '🦩', '🦜', '🐊', '🦦', '🦥', '🦭', '🌲', '🍂', '🌻', '🪷', '🌵', '🌊', '🍄', '🌿', '🌼', '🌹', '🪻', '🌱', '🌙', '🌘', '☀️', '⚡', '❄️', '🌈', '🪐', '✨', '🌟', '☄️', '🌑', '🌕', '🔮', '🗝️', '🧿', '🪬', '🛡️', '⚔️', '👑', '🧪', '👻', '🧙', '🧚', '🧜', '🧸', '🦖', '🦄', '🐉', '🤖', '🪼', '🦂', '🕷️', '🎭', '🪭', '🪄', '🎃'];
const ICON_THEMES = [
  { name: 'Woodland', count: 14, tiers: [['Common', 5], ['Uncommon', 4], ['Rare', 3], ['Epic', 2]] },
  { name: 'Wildlife', count: 14, tiers: [['Common', 4], ['Uncommon', 4], ['Rare', 4], ['Super Rare', 2]] },
  { name: 'Nature', count: 12, tiers: [['Common', 3], ['Uncommon', 4], ['Rare', 3], ['Epic', 2]] },
  { name: 'Sky & Space', count: 12, tiers: [['Uncommon', 4], ['Rare', 4], ['Super Rare', 3], ['Ultra', 1]] },
  { name: 'Mystic', count: 12, tiers: [['Uncommon', 3], ['Rare', 3], ['Super Rare', 3], ['Epic', 2], ['Ultra', 1]] },
  { name: 'Oddities', count: 12, tiers: [['Uncommon', 2], ['Rare', 2], ['Super Rare', 2], ['Epic', 2], ['Ultra', 1], ['Legendary', 1], ['Mythical', 1], ['Ancient', 1]] },
];
const RARITY_COSTS = { Common: 0, Uncommon: 100, Rare: 250, 'Super Rare': 500, Epic: 1000, Ultra: 2500, Legendary: null, Mythical: null, Ancient: null };
const ICON_CATALOG = (() => {
  const catalog = [];
  let themeOffset = 0;
  for (const theme of ICON_THEMES) {
    const themeIcons = ICONS.slice(themeOffset, themeOffset + theme.count);
    themeOffset += theme.count;
    let iconOffset = 0;
    for (const [rarity, count] of theme.tiers) {
      for (const icon of themeIcons.slice(iconOffset, iconOffset + count)) catalog.push({ icon, theme: theme.name, rarity, cost: RARITY_COSTS[rarity] });
      iconOffset += count;
    }
  }
  return catalog;
})();
const ARTIFACTS = ['Claw of the Werewolf', 'Brand of the Villager', 'Cudgel of the Tanner', 'Mask of Muting', 'Shroud of Shame', 'Void of Nothingness', 'Bow of the Hunter', 'Sword of the Bodyguard', 'Cloak of the Prince', 'Mist of the Vampire', 'Dagger of the Traitor', 'Alien Artifact'];
const UNAVAILABLE_ARTIFACTS = new Set(['Mist of the Vampire', 'Dagger of the Traitor', 'Alien Artifact']);
const ARTIFACT_ROLES = { 'Claw of the Werewolf': 'Werewolf', 'Brand of the Villager': 'Villager', 'Cudgel of the Tanner': 'Tanner', 'Bow of the Hunter': 'Hunter', 'Sword of the Bodyguard': 'Bodyguard', 'Cloak of the Prince': 'Prince', 'Mist of the Vampire': 'Vampire', 'Dagger of the Traitor': 'Traitor', 'Alien Artifact': 'Alien' };
const QUESTIONS = [
  'Who would be the last person you would trust with a secret?',
  'Who is most likely to make it through a night in the woods?',
  'Who would you want beside you in a suspiciously quiet village?',
  'Who has the most convincing poker face?',
];
const BOT_PERSONALITIES = ['Friendly', 'Analytical', 'Bold', 'Quiet'];
const BOT_TALKATIVENESS = ['Quiet', 'Balanced', 'Chatty'];
const BOT_DIFFICULTIES = ['Casual', 'Balanced', 'Sharp'];
const rooms = new Map();
const savedVillages = new Map();
const accounts = new Map();
const timers = new Map();
const savedVillagesFile = path.join(dataDir, 'saved-villages.json');
const accountsFile = path.join(dataDir, 'accounts.enc');
const accountKeyFile = path.join(dataDir, 'accounts.key');
let accountEncryptionKey;
const rateLimits = new Map();
const adminChallenges = new Map();
const adminSessions = new Map();

function randomToken() { return crypto.randomBytes(24).toString('base64url'); }
function shortKey(length = 8) { return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toUpperCase(); }
function newAiCode(room) {
  let code;
  do { code = `AI-${shortKey(6)}`; } while (room.players.some((player) => player.aiCode === code));
  return code;
}
function normalizeKey(value) { return String(value || '').trim().toUpperCase(); }
function tokenHash(token) { return crypto.createHash('sha256').update(String(token || '')).digest('hex'); }
function getAccountEncryptionKey() {
  if (process.env.ACCOUNT_ENCRYPTION_KEY) {
    const key = Buffer.from(process.env.ACCOUNT_ENCRYPTION_KEY, 'base64');
    if (key.length !== 32) throw new Error('ACCOUNT_ENCRYPTION_KEY must be a 32-byte base64 value.');
    return key;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('Set ACCOUNT_ENCRYPTION_KEY from a secure secret manager in production.');
  fs.mkdirSync(dataDir, { recursive: true });
  try { return fs.readFileSync(accountKeyFile); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const key = crypto.randomBytes(32);
    fs.writeFileSync(accountKeyFile, key, { mode: 0o600, flag: 'wx' });
    return key;
  }
}
function persistAccounts() {
  fs.mkdirSync(dataDir, { recursive: true });
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', accountEncryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify([...accounts.values()])), cipher.final()]);
  const payload = JSON.stringify({ iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: encrypted.toString('base64') });
  const temporary = `${accountsFile}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, payload, { mode: 0o600 });
  fs.renameSync(temporary, accountsFile);
}
function loadAccounts() {
  accountEncryptionKey = getAccountEncryptionKey();
  try {
    const payload = JSON.parse(fs.readFileSync(accountsFile, 'utf8'));
    const decipher = crypto.createDecipheriv('aes-256-gcm', accountEncryptionKey, Buffer.from(payload.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
    const data = Buffer.concat([decipher.update(Buffer.from(payload.data, 'base64')), decipher.final()]);
    for (const account of JSON.parse(data.toString('utf8'))) accounts.set(account.id, account);
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error(`Unable to decrypt account store: ${error.message}`);
  }
}
function passwordHash(password, salt) {
  return crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
}
function writeEncryptedStore(file, value) {
  fs.mkdirSync(dataDir, { recursive: true });
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', accountEncryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  const payload = JSON.stringify({ version: 1, algorithm: 'AES-256-GCM', iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: encrypted.toString('base64') });
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, payload, { mode: 0o600 });
  fs.renameSync(temporary, file);
}
function readEncryptedStore(file) {
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (payload.version === 1 && payload.algorithm === 'AES-256-GCM') {
    const decipher = crypto.createDecipheriv('aes-256-gcm', accountEncryptionKey, Buffer.from(payload.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
    return JSON.parse(Buffer.concat([decipher.update(Buffer.from(payload.data, 'base64')), decipher.final()]).toString('utf8'));
  }
  writeEncryptedStore(file, payload);
  return payload;
}
function accountFromToken(token) {
  if (!token) return null;
  const digest = tokenHash(token);
  const now = Date.now();
  return [...accounts.values()].find((account) => account.sessions?.some((session) => session.hash === digest && session.expiresAt > now)) || null;
}
function publicAccount(account) {
  const linkedPlayers = [];
  for (const room of rooms.values()) {
    for (const player of room.players) {
      if (player.accountId === account.id) linkedPlayers.push({ code: room.code, name: player.name, key: player.key, stage: room.stage });
    }
  }
  return { id: account.id, email: account.email, name: account.name, coins: account.coins, icons: account.icons, stats: account.stats, linkedPlayers, villages: [...savedVillages.values()].filter((village) => village.ownerAccountId === account.id).map(({ id, code, savedAt, hostKey, players, roles }) => ({ id, code, savedAt, hostKey, players: players.length, roles })) };
}
function recordAccountActivity(accountId, action, detail = '') {
  const account = accounts.get(accountId);
  if (!account) return;
  account.activityLog ||= [];
  account.activityLog.unshift({ at: timestamp(), action, detail: String(detail).slice(0, 180) });
  account.activityLog.length = Math.min(account.activityLog.length, 200);
  persistAccounts();
}
function adminAccountDetails(account) {
  const playerSeats = [];
  for (const room of rooms.values()) {
    for (const player of room.players) {
      if (player.accountId === account.id) playerSeats.push({ code: room.code, name: player.name, icon: player.icon, connected: Boolean(player.connected), stage: room.stage });
    }
  }
  const villages = [...savedVillages.values()].filter((village) => village.ownerAccountId === account.id).map((village) => ({
    code: village.code,
    savedAt: village.savedAt,
    players: village.players.map(({ name, icon, connected }) => ({ name, icon, connected: Boolean(connected) })),
    roles: village.roles,
  }));
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    createdAt: account.createdAt,
    coins: account.coins,
    icons: account.icons.map((icon) => ({ icon, ...(ICON_CATALOG.find((item) => item.icon === icon) || {}) })),
    stats: account.stats,
    sessionCount: (account.sessions || []).filter((session) => session.expiresAt > Date.now()).length,
    playerSeats,
    villages,
    activityLog: account.activityLog || [],
  };
}
function issueAccountSession(account) {
  const token = randomToken();
  account.sessions ||= [];
  account.sessions = account.sessions.filter((session) => session.expiresAt > Date.now());
  account.sessions.push({ hash: tokenHash(token), expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  persistAccounts();
  return token;
}
function requestAccount(request) {
  const token = String(request.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return accountFromToken(token);
}
function accountResponse(account, token) {
  return { token, account: publicAccount(account) };
}
function limited(request, label, maximum, durationMs) {
  const key = `${label}:${request.ip}`;
  const now = Date.now();
  const state = rateLimits.get(key);
  if (!state || state.until <= now) rateLimits.set(key, { count: 1, until: now + durationMs });
  else if (state.count >= maximum) return false;
  else state.count += 1;
  return true;
}
function secureEqual(left, right) {
  const first = Buffer.from(String(left));
  const second = Buffer.from(String(right));
  return first.length === second.length && crypto.timingSafeEqual(first, second);
}
function configuredAdminQuestions() {
  try {
    const questions = JSON.parse(process.env.ADMIN_SECURITY_QA || '[]');
    return Array.isArray(questions) && questions.length === 5 && questions.every((item) => item?.question && item?.answer)
      ? questions.map(({ question, answer }) => ({ question: String(question).slice(0, 180), answerHash: tokenHash(String(answer).trim().toLowerCase()) }))
      : [];
  } catch { return []; }
}
function validAdminSession(token) {
  const digest = tokenHash(token);
  const expiry = adminSessions.get(digest);
  if (!expiry || expiry <= Date.now()) {
    adminSessions.delete(digest);
    return false;
  }
  return true;
}
function newCode() {
  let code;
  do { code = String(crypto.randomInt(100000, 1000000)); } while (rooms.has(code));
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
function effectiveRole(player) { return COPY_ROLES.has(player.startCard) && player.effectiveRole ? player.effectiveRole : player.card; }
function trueRole(player) { return player.artifactRole || player.transformedRole || effectiveRole(player); }
function packRole(player) { return ['Werewolf', 'Mystic Wolf', 'Alpha Wolf'].includes(trueRole(player)); }
function wolfTeamRole(player) { return ['Werewolf', 'Mystic Wolf', 'Alpha Wolf', 'Dream Wolf', 'Minion'].includes(trueRole(player)); }
function vampireTeamRole(player) { return VAMPIRE_ROLES.has(trueRole(player)) || player.mark === 'Vampire'; }
function teamForPlayer(player) { return trueRole(player) === 'Tanner' ? 'tanner' : wolfTeamRole(player) ? 'wolves' : vampireTeamRole(player) ? 'vampires' : 'village'; }
function teamSize(room, team) { return room.players.filter((player) => teamForPlayer(player) === team).length; }
function playerById(room, id) { return room.players.find((player) => player.id === id); }
function playerOutcome(room, player) {
  if (!room || room.stage !== 'results' || !room.winnerTeam) return null;
  if ((room.votesForDiseased || []).includes(player.id)) return 'You lose';
  if (trueRole(player) === 'Assassin') return player.assassinTargetId && room.deadIds?.includes(player.assassinTargetId) ? 'You win' : 'You lose';
  if (trueRole(player) === 'Tanner') return room.winningTeams?.includes('tanner') ? 'You win' : 'You lose';
  let wins = room.winningTeams?.includes(teamForPlayer(player)) || teamForPlayer(player) === room.winnerTeam;
  if (player.mark === 'Traitor' && teamSize(room, teamForPlayer(player)) > 1) wins = !wins;
  return wins ? 'You win' : 'You lose';
}
function inspectablePlayer(room, id, viewerId, allowSelf = false) {
  const player = playerById(room, id);
  if (!player || (!allowSelf && player.id === viewerId) || player.shielded) return null;
  return player;
}
function recordCardView(player, target, role, label = 'Saw') {
  player.seenCards ||= [];
  player.seenCards.push({ id: target.id, name: target.name, role });
  player.events.push(`${label} ${target.name}’s card: ${role}.`);
}
function roleQuestion(action, room) {
  if (action.questionOnly) return true;
  const player = playerById(room, action.actorId);
  const fearedAction = player?.mark === 'Fear' && NIGHT_ACTIVE_ROLES.has(action.role);
  return fearedAction || ['Sentinel', 'Copycat', 'Doppelganger', 'Dream Wolf', 'Minion', 'Mason', 'Insomniac', 'Hunter', 'Tanner', 'Villager', 'Bodyguard', 'Marksman'].includes(action.role)
    || (action.role === 'Werewolf' && room.players.filter(packRole).length > 1);
}
function normalizeBotSettings(settings = {}) {
  return {
    personality: BOT_PERSONALITIES.includes(settings.personality) ? settings.personality : 'Friendly',
    talkativeness: BOT_TALKATIVENESS.includes(settings.talkativeness) ? settings.talkativeness : 'Balanced',
    difficulty: BOT_DIFFICULTIES.includes(settings.difficulty) ? settings.difficulty : 'Balanced',
  };
}
function botChatText(player, context) {
  const personality = player.botSettings?.personality || 'Friendly';
  const messages = {
    Friendly: {
      hello: ['Good to see everyone. I am still piecing things together.', 'That is an interesting point. I am keeping an open mind.'],
      discussion: ['I have a few clues, but I want to hear everyone first.', 'Let us compare notes before we settle on a suspect.'],
      result: ['Good game, everyone. That was fun.', 'Nice round. I would play another.'],
    },
    Analytical: {
      hello: ['I am comparing claims with the information available.', 'I will avoid jumping to conclusions until the votes make sense.'],
      discussion: ['We should separate what was observed from what is inferred.', 'The vote pattern may be more useful than a confident claim.'],
      result: ['Good game. The vote pattern was informative.', 'Round complete. I am ready to test another theory.'],
    },
    Bold: {
      hello: ['Someone is bluffing. I just have to work out who.', 'I have a suspect, but I want to hear the defense first.'],
      discussion: ['I am ready to make a call. Who has the clearest contradiction?', 'Let us hear one concrete reason before we vote.'],
      result: ['Good game. Rematch?', 'That was a close one. Another round.'],
    },
    Quiet: {
      hello: ['I am listening for now.', 'I will share what I know when it is useful.'],
      discussion: ['I am still listening.', 'I have nothing certain to add yet.'],
      result: ['Good game.', 'Another round sometime.'],
    },
  };
  const options = messages[personality]?.[context] || messages.Friendly.hello;
  return options[crypto.randomInt(options.length)];
}
function botDiscussionText(room, bot) {
  const personality = bot.botSettings?.personality || 'Friendly';
  bot.discussionReplies ||= [];
  bot.discussionEvidence ||= [];
  const latestMessage = [...(room.chat || [])].reverse().find((message) => message.scope === 'public' && message.fromId !== bot.id && !bot.discussionReplies.includes(message.id));
  const mentionedPlayers = latestMessage
    ? room.players.filter((player) => player.id !== bot.id && latestMessage.text.toLowerCase().includes(player.name.toLowerCase()))
    : [];
  const accusation = latestMessage && /\b(wolf|werewolf|vampire|suspect|suspicious|bluff|lying|lie|vote|voting|accus|threat)\b/i.test(latestMessage.text);
  const cardEvidence = (bot.seenCards || []).map((entry) => ({
    key: `card:${entry.id || entry.name}:${entry.role}`,
    text: entry.name?.startsWith('center card') ? `I saw ${entry.name}: ${entry.role}.` : `I saw ${entry.name}'s card as ${entry.role}.`,
  }));
  const markEvidence = (bot.seenMarks || []).filter((entry) => entry.mark && entry.mark !== 'Clarity').map((entry) => ({
    key: `mark:${entry.name}:${entry.mark}`,
    text: `I saw Mark of ${entry.mark} on ${entry.name}.`,
  }));
  const clue = [...cardEvidence, ...markEvidence].find((entry) => !bot.discussionEvidence.includes(entry.key));
  if (clue) bot.discussionEvidence.push(clue.key);
  if (latestMessage) bot.discussionReplies.push(latestMessage.id);
  if (mentionedPlayers.length && accusation) {
    const target = mentionedPlayers[0];
    const clueText = clue ? ` ${clue.text}` : '';
    const responses = {
      Friendly: `I hear the concern about ${target.name}. What did you see that points there?${clueText}`,
      Analytical: `That claim names ${target.name}; let's separate observation from inference.${clueText}`,
      Bold: `${target.name} is a serious lead now. I want a clear answer before we vote.${clueText}`,
      Quiet: `I heard the claim about ${target.name}. I'll keep it in mind.${clueText}`,
    };
    return responses[personality] || responses.Friendly;
  }
  if (clue) {
    const observations = {
      Friendly: `${clue.text} Does that fit with what you saw?`,
      Analytical: `${clue.text} That's a clue about the card I observed, not necessarily the player's final role.`,
      Bold: `${clue.text} We should ask them about that.`,
      Quiet: clue.text,
    };
    return observations[personality] || observations.Friendly;
  }
  const prompts = {
    Friendly: ['I do not have a confirmed suspect yet. What did everyone actually see?', 'Can someone explain how they reached their conclusion?'],
    Analytical: ["Let's compare direct observations separately from guesses before deciding.", 'Which claims have independent evidence behind them?'],
    Bold: ['I am ready to hear one concrete clue for each suspect before we vote.', 'Who has a clear answer to the claims against them?'],
    Quiet: ['I am listening for specific observations and contradictions.', 'Has anyone noticed a detail that does not fit?'],
  };
  bot.discussionTurn = (bot.discussionTurn || 0) + 1;
  const options = prompts[personality] || prompts.Friendly;
  const prompt = options[(bot.discussionTurn - 1) % options.length];
  if (latestMessage) return `${prompt} I am still thinking about ${latestMessage.fromName}'s point.`;
  return prompt;
}
function appendChat(room, message) {
  room.chat ||= [];
  room.chat.push({ id: crypto.randomUUID(), sentAt: timestamp(), ...message });
  room.chat = room.chat.slice(-100);
}
function botChatMessage(room, player, context) {
  const settings = room.chatSettings || { publicEnabled: true, whispersEnabled: true };
  if (!settings.publicEnabled) return;
  appendChat(room, {
    scope: 'public',
    fromId: player.id,
    fromName: player.name,
    text: context === 'discussion' ? botDiscussionText(room, player) : botChatText(player, context),
    isBot: true,
  });
}
function runBotDiscussion(room, trigger) {
  const bots = room.players.filter((player) => player.isBot);
  if (!bots.length || !(room.chatSettings || { publicEnabled: true }).publicEnabled) return;
  const chances = trigger === 'timer-start'
    ? { Quiet: 25, Balanced: 65, Chatty: 95 }
    : trigger === 'timer-tick'
      ? { Quiet: 8, Balanced: 35, Chatty: 70 }
      : { Quiet: 25, Balanced: 65, Chatty: 95 };
  let responders = bots.filter((bot) => crypto.randomInt(100) < (chances[bot.botSettings?.talkativeness] || 65));
  if (!responders.length) responders = [bots[crypto.randomInt(bots.length)]];
  if (trigger === 'timer-start') responders = responders.slice(0, 2);
  else responders = [responders[crypto.randomInt(responders.length)]];
  responders.forEach((bot) => botChatMessage(room, bot, 'discussion'));
}
function persist() {
  writeEncryptedStore(roomFile, [...rooms.values()]);
}
function persistSavedVillages() {
  writeEncryptedStore(savedVillagesFile, [...savedVillages.values()]);
}
function loadRooms() {
  try {
    const saved = readEncryptedStore(roomFile);
    for (const room of saved) {
      if (!/^\d{6}$/.test(room.code)) continue;
      room.players = room.players || [];
      room.players.forEach((player) => { player.connected = false; });
      room.players.filter((player) => player.isBot && !player.aiCode).forEach((player) => { player.aiCode = newAiCode(room); });
      room.chatSettings ||= { publicEnabled: true, whispersEnabled: true };
      if (room.players.some((player) => player.isBot)) room.chatSettings.publicEnabled = true;
      room.hostConnected = false;
      if (room.stage === 'discussion') room.timerRunning = false;
      rooms.set(room.code, room);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Unable to load saved rooms:', error.message);
  }
}
function loadSavedVillages() {
  try {
    const saved = readEncryptedStore(savedVillagesFile);
    for (const entry of saved) {
      savedVillages.set(entry.id, entry);
      if (!rooms.has(entry.code)) {
        const room = { ...entry, hostAccountId: entry.ownerAccountId || null, players: entry.players.map((player) => ({ ...player, tokenHash: tokenHash(player.key || randomToken()), key: player.key || shortKey(8), connected: Boolean(player.connected) })), hostConnected: false, stage: 'lobby' };
        room.players.filter((player) => player.isBot && !player.aiCode).forEach((player) => { player.aiCode = newAiCode(room); });
        rooms.set(entry.code, room);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Unable to load saved villages:', error.message);
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
  const action = room.stage === 'night' && user ? room.nightQueue.find((entry) => entry.actorId === user.id) : null;
  const duskAction = room.stage === 'dusk' && user ? activeDuskAction(room, user.id) : null;
  const setupAction = room.stage === 'setup' && user ? room.setupQueue?.find((entry) => entry.actorId === user.id) : null;
  const infoAction = room.stage === 'information' && user ? room.infoQueue.find((entry) => entry.actorId === user.id) : null;
  const privateNotes = user ? [...(user.events || [])] : [];
  const wolves = user && room.stage === 'night' && packRole(user)
    ? room.players.filter((player) => player.id !== user.id && wolfTeamRole(player)).map((player) => ({ id: player.id, name: player.name, icon: player.icon, dream: trueRole(player) === 'Dream Wolf' }))
    : [];
  const setupCounts = room.stage === 'information' || room.stage === 'discussion' || room.stage === 'voting' || room.stage === 'results'
    ? Object.fromEntries(room.players.map((player) => [player.id, room.players.filter((other) => other.setupTarget === player.setupTarget).length]))
    : {};
  const hostView = session.kind === 'host';
  return {
    code: room.code,
    stage: room.stage,
    roles: room.roles,
    duskUsed: room.duskUsed,
    question: room.question,
    duskQuestion: room.duskQuestion,
    nightQuestion: room.nightQuestion,
    artifactPool: session.kind === 'host' ? room.artifactPool : undefined,
    chatSettings: room.chatSettings || { publicEnabled: true, whispersEnabled: true },
    chat: (room.chat || []).filter((message) => message.scope === 'public' || session.kind === 'host' || session.kind === 'player' && (message.fromId === user?.id || message.toId === user?.id)).slice(-60),
    publicEvents: room.publicEvents || [],
    players: room.players.map((player) => ({ id: player.id, name: player.name, icon: player.icon, isBot: Boolean(player.isBot), aiCode: hostView && player.isBot ? player.aiCode : undefined, botSettings: hostView && player.isBot ? player.botSettings : undefined, rejoinKey: hostView ? player.key : undefined, connected: Boolean(player.isBot || player.activeTab && Date.now() - (player.lastPresenceAt || 0) < 7000), shielded: Boolean(player.shielded), artifact: Boolean(player.artifact), ready: Boolean(room.stage === 'roles' ? room.roleReady?.[player.id] : room.stage === 'dusk' ? room.duskActions?.[activeDuskAction(room, player.id)?.key] : room.stage === 'mark' ? room.markReady?.[player.id] : room.stage === 'night' ? room.nightActions?.[player.id] : room.stage === 'information' ? room.infoDone?.[player.id] : false), voted: Boolean(room.votes?.[player.id]), outcome: room.stage === 'results' ? playerOutcome(room, player) : null, ...(room.stage === 'results' ? { card: player.card, startCard: player.startCard, effectiveRole: player.effectiveRole || null, ...(room.duskUsed ? { mark: player.mark } : {}), artifactName: player.artifactName || null, artifactRole: player.artifactRole || null, transformedRole: player.transformedRole || null } : {}) })),
    viewer: { kind: session.kind, playerId: session.playerId || null, name: user?.name || 'Moderator' },
    action: room.stage === 'setup' ? {
      ...(session.kind === 'host' ? {} : setupAction ? { role: setupAction.role, questionOnly: Boolean(setupAction.questionOnly), submitted: Boolean(room.setupActions?.[user.id]) } : {}),
    } : room.stage === 'night' ? {
      ...(session.kind === 'host' ? {} : action ? { index: room.nightQueue.findIndex((entry) => entry.actorId === user.id) + 1, role: action.role, actorId: action.actorId, copied: Boolean(action.copied), questionOnly: Boolean(action.questionOnly), requiresQuestion: roleQuestion(action, room), targets: packRole(user) ? wolves : undefined, submitted: Boolean(room.nightActions?.[user.id]) } : {}),
    } : room.stage === 'dusk' ? {
      ...(session.kind === 'host' ? {} : duskAction ? { key: duskAction.key, role: duskAction.role || 'Question', actorId: duskAction.actorId, copied: Boolean(duskAction.copied), shared: Boolean(duskAction.actorIds), questionOnly: Boolean(duskAction.questionOnly), submitted: Boolean(room.duskActions?.[duskAction.key]) } : {}),
    } : room.stage === 'information' ? {
      ...(session.kind === 'host' ? {} : infoAction ? { role: infoAction.role, submitted: Boolean(room.infoActions?.[user.id]) } : {}),
    } : null,
    setupIndex: room.setupIndex,
    setupCount: room.players.length,
    informationDone: Object.keys(room.infoDone || {}).length,
    markDone: Object.keys(room.markReady || {}).length,
    markCount: room.players.length,
    discussionSeconds: room.discussionSeconds,
    timerRunning: Boolean(room.timerRunning),
    voteDone: Object.keys(room.votes || {}).length,
    results: room.stage === 'results' ? { voteCounts: room.voteCounts, deadIds: room.deadIds, winner: room.winner, winnerTeam: room.winnerTeam, winningTeams: room.winningTeams || [], marksUsed: Boolean(room.duskUsed), center: room.center, alphaReserves: Object.values(room.alphaReserves || {}) } : null,
    own: user ? {
      icon: user.icon,
      card: ['roles', 'setup'].includes(room.stage) || (room.stage === 'sentinel' && user.startCard === 'Sentinel') ? user.startCard : null,
      startCard: ['roles', 'setup'].includes(room.stage) || (room.stage === 'sentinel' && user.startCard === 'Sentinel') ? user.startCard : null,
      effectiveRole: ['roles', 'setup'].includes(room.stage) ? user.effectiveRole || null : room.stage === 'results' ? user.effectiveRole || null : null,
      setupTarget: user.setupTarget || null,
      nightAnswer: user.nightAnswer || null,
      originalRole: ['information', 'discussion', 'voting', 'results'].includes(room.stage) ? user.startCard : null,
      notes: privateNotes,
      seenCards: room.stage === 'information' ? user.seenCards || [] : [],
      seenMarks: room.stage === 'information' ? user.seenMarks || [] : [],
      mark: ['mark', 'results'].includes(room.stage) && (room.stage !== 'results' || room.duskUsed) ? user.mark || 'Clarity' : null,
      lovers: room.stage === 'mark' ? (room.lovers || []).find((pair) => pair.includes(user.id))?.filter((id) => id !== user.id).map((id) => playerById(room, id)).filter(Boolean).map(({ id, name, icon }) => ({ id, name, icon })) || [] : [],
      wolfPack: room.stage === 'information' || room.stage === 'discussion' || room.stage === 'voting' || room.stage === 'results'
        ? packRole(user)
          ? room.players.filter((player) => player.id !== user.id && wolfTeamRole(player)).map((player) => ({ id: player.id, name: player.name, icon: player.icon }))
          : []
        : [],
      artifact: ['information', 'discussion', 'voting'].includes(room.stage) ? user.artifactName || null : null,
      rejoinKey: user.key,
      shieldTarget: room.shields?.[user.id] || null,
      seerMode: user.seerMode || 'player',
      selectedIds: user.selectedIds || [],
      selectedCenter: user.selectedCenter || [],
      voteTarget: room.votes?.[user.id] || null,
      voteCounts: room.stage === 'results' ? room.voteCounts : null,
      deadIds: room.stage === 'results' ? room.deadIds : null,
      winner: room.stage === 'results' ? room.winner : null,
      outcome: room.stage === 'results' ? playerOutcome(room, user) : null,
      center: room.stage === 'results' ? room.center : null,
      alphaReserves: room.stage === 'results' ? room.alphaReserves : null,
      setupMatchCount: setupCounts[user.id] || 0,
    } : null,
    host: session.kind === 'host' ? { playerCount: room.players.length, totalCards: roleCount(room), cardsNeeded: room.players.length + 3, setupDone: Object.keys(room.setupActions || {}).length, roleReadyCount: Object.keys(room.roleReady || {}).length, sentinelDone: Object.keys(room.shields || {}).length, markDone: Object.keys(room.markReady || {}).length, informationDone: Object.keys(room.infoDone || {}).length, hostKey: room.hostKey } : null,
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
  const normalizedKey = normalizeKey(token);
  if (kind === 'host') {
    if (digest === room.hostTokenHash || normalizeKey(room.hostKey) === normalizedKey) {
      room.hostConnected = true;
      return { room, session: { code: room.code, kind: 'host' } };
    }
    throw new Error('This host session is not valid.');
  }
  const player = room.players.find((entry) => entry.tokenHash === digest || normalizeKey(entry.key) === normalizedKey);
  if (!player) throw new Error('This player session is not valid. Rejoin with the room code.');
  player.connected = true;
  player.activeTab = true;
  player.lastPresenceAt = Date.now();
  player.socketId = socket.id;
  return { room, session: { code: room.code, kind: 'player', playerId: player.id } };
}
function actorsForRole(room, role) {
  return room.players.filter((player) => effectiveRole(player) === role);
}
function activeDuskAction(room, playerId) {
  return room.duskQueue?.find((entry) => entry.actorId === playerId && !room.duskActions?.[entry.key]);
}
function duskQueue(room) {
  const copied = [];
  const regular = [];
  const vampires = room.players.filter((player) => VAMPIRE_ROLES.has(effectiveRole(player)) && effectiveRole(player) !== 'Renfield');
  if (vampires.length) {
    const copiedVampires = vampires.filter((player) => COPY_ROLES.has(player.startCard));
    const action = { key: 'vampire-mark', role: 'Vampire', actorId: (copiedVampires[0] || vampires[0]).id, actorIds: vampires.map((player) => player.id), copied: copiedVampires.length > 0 };
    (action.copied ? copied : regular).push(action);
  }
  for (const role of DUSK_ORDER) {
    for (const player of actorsForRole(room, role)) {
      if (COPY_ROLES.has(player.startCard) || player.startCard === role) {
        const action = { key: `${role}:${player.id}`, role, actorId: player.id, copied: COPY_ROLES.has(player.startCard) };
        if (action.copied) copied.push(action); else regular.push(action);
      }
    }
  }
  const roleActions = [...copied, ...regular];
  if (!roleActions.length) return [];
  const roleActorIds = new Set(roleActions.flatMap((entry) => entry.actorIds || [entry.actorId]));
  const questions = room.players.filter((player) => !roleActorIds.has(player.id)).map((player) => ({ key: `question:${player.id}`, role: 'Question', actorId: player.id, questionOnly: true }));
  return [...roleActions, ...questions];
}
function setupQueue(room) {
  const setupActors = room.players.filter((player) => COPY_ROLES.has(player.startCard));
  if (!setupActors.length) return [];
  return room.players.flatMap((player) => {
    if (COPY_ROLES.has(player.startCard)) return [{ actorId: player.id, role: player.startCard }];
    return [{ actorId: player.id, role: 'Question', questionOnly: true }];
  });
}
function nightQueue(room) {
  const copied = [];
  const regular = [];
  for (const role of NIGHT_ORDER) {
    const actors = actorsForRole(room, role);
    for (const player of actors) {
      if (NIGHT_QUESTION_ROLES.has(role)) continue;
      const action = { role, actorId: player.id, copied: COPY_ROLES.has(player.startCard) };
      if (action.copied) copied.push(action); else regular.push(action);
    }
  }
  const roleActions = [...copied, ...regular];
  const roleActorIds = new Set(roleActions.map((entry) => entry.actorId));
  const questions = room.players.filter((player) => !roleActorIds.has(player.id)).map((player) => ({ role: 'Question', actorId: player.id, questionOnly: true }));
  const queue = [...roleActions, ...questions];
  room.alphaReserves = Object.fromEntries(queue.filter((action) => action.role === 'Alpha Wolf').map((action) => [action.actorId, 'Werewolf']));
  return queue;
}
function randomBotTarget(room, bot, predicate = () => true) {
  const choices = room.players.filter((player) => player.id !== bot.id && predicate(player));
  return choices.length ? choices[crypto.randomInt(choices.length)] : null;
}
function botKnownAllies(room, bot) {
  const role = trueRole(bot);
  if (wolfTeamRole(bot) || role === 'Minion') return new Set(room.players.filter((player) => player.id !== bot.id && wolfTeamRole(player)).map((player) => player.id));
  if (VAMPIRE_ROLES.has(role) || bot.mark === 'Vampire') return new Set(room.players.filter((player) => player.id !== bot.id && vampireTeamRole(player)).map((player) => player.id));
  if (role === 'Mason') return new Set(room.players.filter((player) => player.id !== bot.id && trueRole(player) === 'Mason').map((player) => player.id));
  return new Set();
}
function botSuspicionScore(room, bot, target) {
  const personality = bot.botSettings?.personality || 'Friendly';
  const difficulty = bot.botSettings?.difficulty || 'Balanced';
  const observed = [...(bot.seenCards || [])].reverse().find((entry) => entry.id === target.id || entry.name === target.name);
  let score = 0;
  if (observed) {
    if (['Werewolf', 'Mystic Wolf', 'Alpha Wolf', 'Dream Wolf'].includes(observed.role)) score += 9;
    else if (['Vampire', 'Master', 'Count', 'Renfield'].includes(observed.role)) score += 7;
    else if (observed.role === 'Tanner') score += trueRole(bot) === 'Tanner' ? 7 : -3;
    else score -= 1;
  }
  const mark = [...(bot.seenMarks || [])].reverse().find((entry) => entry.id === target.id || entry.name === target.name);
  if (mark) {
    if (['Traitor', 'Assassin', 'Bat', 'Fear', 'Vampire'].includes(mark.mark)) score += mark.mark === 'Traitor' ? 2 : 1;
    else if (mark.mark === 'Clarity') score -= 0.5;
  }
  const latestBySpeaker = new Map();
  for (const message of room.chat || []) {
    if (message.scope !== 'public' || message.fromId === bot.id || !message.text.toLowerCase().includes(target.name.toLowerCase())) continue;
    latestBySpeaker.set(message.fromId, message);
  }
  const persuasion = ({ Friendly: 1.8, Analytical: 0.65, Bold: 1.4, Quiet: 0.9 })[personality];
  for (const message of latestBySpeaker.values()) {
    if (!/\b(wolf|werewolf|vampire|suspect|suspicious|bluff|lying|lie|vote|voting|accus|threat|innocent|clear|trust|defend)\b/i.test(message.text)) continue;
    const denial = /\b(not|isn't|isnt|innocent|clear|trust|defend|defending)\b/i.test(message.text);
    const evidence = /\b(saw|see|checked|check|looked|found|card|mark|confirmed|proof|evidence)\b/i.test(message.text);
    const evidenceWeight = difficulty === 'Sharp' ? 3 : difficulty === 'Balanced' ? 2 : 1;
    score += (denial ? -1 : 1) * (evidence ? evidenceWeight : 1) * persuasion;
  }
  return score;
}
function botStrategicTargets(room, bot, predicate = () => true, count = 1) {
  const allies = botKnownAllies(room, bot);
  const candidates = room.players.filter((player) => player.id !== bot.id && !allies.has(player.id) && predicate(player));
  candidates.sort((left, right) => botSuspicionScore(room, bot, right) - botSuspicionScore(room, bot, left));
  return candidates.slice(0, count);
}
function botStrategicTarget(room, bot, predicate = () => true) {
  return botStrategicTargets(room, bot, predicate, 1)[0] || randomBotTarget(room, bot, predicate);
}
function finishSentinel(room, bot, target) {
  if (!target) return;
  room.shields ||= {};
  target.shielded = true;
  room.shields[bot.id] = target.id;
  const sentinels = room.players.filter((player) => player.startCard === 'Sentinel');
  if (sentinels.every((player) => room.shields[player.id])) startSetup(room);
}
function runBotSentinels(room) {
  if (room.stage !== 'sentinel') return;
  for (const bot of room.players.filter((player) => player.isBot && player.startCard === 'Sentinel' && !room.shields?.[player.id])) {
    finishSentinel(room, bot, randomBotTarget(room));
    if (room.stage !== 'sentinel') return;
  }
}
function runBotSetup(room) {
  for (const action of room.setupQueue || []) {
    const bot = playerById(room, action.actorId);
    if (!bot?.isBot || room.setupActions?.[bot.id]) continue;
    if (action.role === 'Copycat') {
      const centerIndex = crypto.randomInt(room.center.length);
      bot.setupTarget = `center:${centerIndex}`;
      bot.effectiveRole = room.center[centerIndex];
      bot.seenCards ||= [];
      bot.seenCards.push({ name: `center card #${centerIndex + 1}`, role: room.center[centerIndex] });
      bot.events.push(`Copied center card #${centerIndex + 1}: ${room.center[centerIndex]}.`);
    } else if (action.role === 'Doppelganger') {
      const target = randomBotTarget(room, bot, (player) => !player.shielded);
      if (target) {
        bot.setupTarget = target.id;
        bot.effectiveRole = target.startCard;
        recordCardView(bot, target, target.startCard, 'Copied');
      }
    } else {
      const answer = randomBotTarget(room, bot);
      bot.events.push(`Because you don't have a Setup role, here is a question to keep you occupied: ${room.question} You chose ${answer?.name || 'no one'}.`);
    }
    finishSetupAction(room, bot.id);
    if (room.stage !== 'setup') return;
  }
}
function pendingVampireTarget(room) {
  return room.duskActions?.['vampire-mark']?.data?.targetId || null;
}
function botDuskData(room, action, bot) {
  if (action.questionOnly) {
    const answer = randomBotTarget(room, bot);
    bot.events.push(`Because you don't have a Dusk role, here is a question to keep you occupied: ${room.duskQuestion} You chose ${answer?.name || 'no one'}.`);
    return { targetId: answer?.id };
  }
  if (action.key === 'vampire-mark') {
    const target = botStrategicTarget(room, bot, (player) => !VAMPIRE_ROLES.has(effectiveRole(player)) && player.mark !== 'Vampire');
    return target ? { targetId: target.id } : { skip: true };
  }
  if (action.role === 'Count') {
    const vampireTargetId = pendingVampireTarget(room);
    const target = botStrategicTarget(room, bot, (player) => player.id !== vampireTargetId);
    return target ? { targetId: target.id } : { skip: true };
  }
  if (action.role === 'Diseased') {
    const index = room.players.findIndex((player) => player.id === bot.id);
    return { targetId: room.players[(index + (crypto.randomInt(2) ? 1 : room.players.length - 1)) % room.players.length].id };
  }
  if (action.role === 'Cupid') {
    const targets = botStrategicTargets(room, bot, () => true, 2);
    return targets.length === 2 ? { targetIds: targets.map((player) => player.id) } : { skip: true };
  }
  if (action.role === 'Renfield') return {};
  if (action.role === 'Priest') {
    const target = botStrategicTarget(room, bot);
    return target ? { targetId: target.id } : { skip: true };
  }
  if (['Instigator', 'Assassin'].includes(action.role)) {
    const target = botStrategicTarget(room, bot);
    return target ? { targetId: target.id } : { skip: true };
  }
  return { skip: true };
}
function runBotDusk(room) {
  for (const action of room.duskQueue || []) {
    const bot = playerById(room, action.actorId);
    if (!bot?.isBot || room.duskActions[action.key]) continue;
    room.duskActions[action.key] = { data: botDuskData(room, action, bot) };
  }
  if (room.duskQueue?.length && Object.keys(room.duskActions).length === room.duskQueue.length) resolveDusk(room);
}
function botNightData(room, action, bot) {
  if (roleQuestion(action, room)) {
    const target = botStrategicTarget(room, bot);
    return { targetId: target?.id };
  }
  const target = botStrategicTarget(room, bot, (player) => !player.shielded);
  const twoTargets = botStrategicTargets(room, bot, (player) => !player.shielded, 2);
  switch (action.role) {
    case 'Werewolf': return { centerIndex: crypto.randomInt(room.center.length) };
    case 'Mystic Wolf':
    case 'Alpha Wolf':
    case 'Revealer':
    case 'Curator': return target ? { targetId: target.id } : { pass: true };
    case 'Seer': return target ? { mode: 'player', targetId: target.id } : { mode: 'center', centerIndices: [0, 1] };
    case 'Apprentice Seer':
    case 'Drunk': return { centerIndex: crypto.randomInt(room.center.length) };
    case 'Robber':
    case 'Pickpocket': return target ? { targetId: target.id } : { pass: true };
    case 'Witch': return target ? { centerIndex: crypto.randomInt(room.center.length), targetId: target.id } : { pass: true };
    case 'Paranormal Investigator':
    case 'Troublemaker': return twoTargets.length === 2 ? { targetIds: twoTargets.map((player) => player.id) } : { pass: true };
    case 'Gremlin': return twoTargets.length === 2 ? { mode: crypto.randomInt(2) ? 'marks' : 'cards', targetIds: twoTargets.map((player) => player.id) } : { mode: 'marks', targetIds: room.players.filter((player) => player.id !== bot.id).slice(0, 2).map((player) => player.id) };
    case 'Village Idiot': return { direction: crypto.randomInt(2) ? 'left' : 'right' };
    default: return { pass: true };
  }
}
function runBotNight(room) {
  for (const action of room.nightQueue || []) {
    const bot = playerById(room, action.actorId);
    if (!bot?.isBot || room.nightActions[bot.id]) continue;
    const data = botNightData(room, action, bot);
    if (action.questionOnly || roleQuestion(action, room)) room.nightActions[bot.id] = { targetId: data.targetId };
    else room.nightActions[bot.id] = { data };
  }
  if (room.nightQueue?.length && Object.keys(room.nightActions).length === room.nightQueue.length) resolveNight(room);
}
function startDiscussion(room) {
  room.stage = 'discussion';
  room.discussionSeconds = 300;
  room.timerRunning = false;
  delete room.nextBotChatAt;
}
function runBotInformation(room) {
  for (const bot of room.players.filter((player) => player.isBot)) {
    const action = room.infoQueue?.find((entry) => entry.actorId === bot.id);
    if (action) {
      const markTarget = randomBotTarget(room, bot);
      const roleTarget = randomBotTarget(room, bot, (player) => player.id !== markTarget?.id);
      if (markTarget && roleTarget) {
        bot.seenMarks ||= [];
        bot.seenMarks.push({ id: markTarget.id, name: markTarget.name, mark: markTarget.mark });
        recordCardView(bot, roleTarget, trueRole(roleTarget));
        room.infoActions[bot.id] = true;
      }
    }
    room.infoDone[bot.id] = true;
  }
  if (room.players.every((player) => room.infoDone[player.id])) startDiscussion(room);
}
function botVoteTarget(room, bot) {
  const knownAllies = botKnownAllies(room, bot);
  const candidates = room.players.filter((player) => player.id !== bot.id);
  const difficulty = bot.botSettings?.difficulty || 'Balanced';
  const uncertainty = ({ Casual: 1.8, Balanced: 1, Sharp: 0.55 })[difficulty];
  const scores = new Map(candidates.map((player) => [player.id, knownAllies.has(player.id) ? -100 : botSuspicionScore(room, bot, player) + crypto.randomInt(100) / 100 * uncertainty]));
  candidates.sort((left, right) => scores.get(right.id) - scores.get(left.id));
  return candidates[0];
}
function runBotVotes(room) {
  for (const bot of room.players.filter((player) => player.isBot && !room.votes?.[player.id])) {
    const target = botVoteTarget(room, bot);
    if (target) room.votes[bot.id] = target.id;
  }
  if (Object.keys(room.votes || {}).length === room.players.length) finishVotes(room);
}
function startSetup(room) {
  room.setupQueue = setupQueue(room);
  room.setupActions = {};
  room.stage = 'setup';
  if (!room.setupQueue.length) startDusk(room);
  else runBotSetup(room);
}
function finishSetupAction(room, playerId) {
  room.setupActions[playerId] = true;
  if (room.setupQueue.every((entry) => room.setupActions[entry.actorId])) startDusk(room);
}
function startMark(room) {
  room.stage = 'mark';
  room.markReady = Object.fromEntries(room.players.filter((player) => player.isBot).map((player) => [player.id, true]));
  if (room.players.every((player) => room.markReady[player.id])) startNight(room);
}
function startDusk(room) {
  room.duskQueue = duskQueue(room);
  room.duskActions = {};
  room.duskUsed = room.duskQueue.length > 0;
  if (!room.duskUsed) return startNight(room);
  room.stage = 'dusk';
  runBotDusk(room);
}
function startNight(room) {
  room.nightQueue = nightQueue(room);
  room.nightActions = {};
  room.stage = 'night';
  room.players.forEach((player) => { player.nightAnswer = null; player.selectedIds = []; player.selectedCenter = []; });
  if (!room.nightQueue.length) resolveNight(room);
  else runBotNight(room);
}
function resolveDusk(room) {
  for (const action of room.duskQueue) {
    if (action.questionOnly) continue;
    const data = room.duskActions[action.key]?.data || {};
    if (data.skip) continue;
    const actor = playerById(room, action.actorId);
    if (action.key === 'vampire-mark') {
      playerById(room, data.targetId).mark = 'Vampire';
    } else if (action.role === 'Count') {
      playerById(room, data.targetId).mark = 'Fear';
    } else if (action.role === 'Renfield') {
      actor.mark = 'Bat';
      const vampireRoles = room.players.filter((entry) => VAMPIRE_ROLES.has(effectiveRole(entry)) && effectiveRole(entry) !== 'Renfield');
      const vampireMark = room.players.find((entry) => entry.mark === 'Vampire');
      actor.events.push(`Vampires: ${vampireRoles.map((entry) => entry.name).join(', ') || 'none'}. Mark of Vampire: ${vampireMark?.name || 'no one'}.`);
    } else if (action.role === 'Diseased') {
      playerById(room, data.targetId).mark = 'Disease';
    } else if (action.role === 'Cupid') {
      const [first, second] = data.targetIds;
      playerById(room, first).mark = 'Love';
      playerById(room, second).mark = 'Love';
      room.lovers ||= [];
      room.lovers.push([first, second]);
    } else if (action.role === 'Instigator') {
      playerById(room, data.targetId).mark = 'Traitor';
    } else if (action.role === 'Priest') {
      actor.mark = 'Clarity';
      playerById(room, data.targetId).mark = 'Clarity';
    } else if (action.role === 'Assassin') {
      playerById(room, data.targetId).mark = 'Assassin';
      actor.assassinTargetId = data.targetId;
    }
  }
  startMark(room);
}
function resolveNight(room) {
  room.publicEvents = [];
  for (const action of room.nightQueue) {
    const player = playerById(room, action.actorId);
    const submission = room.nightActions[player.id];
    if (roleQuestion(action, room)) {
      const answer = playerById(room, submission.targetId);
      if (action.questionOnly) player.events.push(`Because you don't have a Night role, here is a question to keep you occupied: ${room.nightQuestion} You chose ${answer.name}.`);
      else player.events.push(`Night question: chose ${answer.name}.`);
      if (action.role === 'Minion') {
        const wolves = room.players.filter(wolfTeamRole);
        player.events.push(wolves.length ? `The werewolves are: ${wolves.map((entry) => entry.name).join(', ')}.` : 'There are no werewolves in the village.');
      } else if (action.role === 'Mason') {
        const masons = room.players.filter((entry) => entry.id !== player.id && trueRole(entry) === 'Mason');
        player.events.push(masons.length ? `Other Masons: ${masons.map((entry) => entry.name).join(', ')}.` : 'You saw no other Masons.');
      } else if (action.role === 'Insomniac') {
        if (player.mark === 'Fear') player.events.push('Mark of Fear stopped your Insomniac action.');
        else if (player.shielded) player.events.push('Your card was shielded by the Sentinel and could not be switched.');
        else player.events.push(`Your card is now: ${player.card}.`);
      }
      continue;
    }
    const data = submission.data || {};
    if (action.role === 'Werewolf') {
      player.events.push(`Looked at center card ${data.centerIndex + 1}: ${room.center[data.centerIndex]}.`);
    } else if (action.role === 'Mystic Wolf') {
      recordCardView(player, playerById(room, data.targetId), trueRole(playerById(room, data.targetId)));
    } else if (action.role === 'Alpha Wolf') {
      const target = playerById(room, data.targetId);
      const reserve = room.alphaReserves[player.id];
      room.alphaReserves[player.id] = target.card;
      target.card = reserve;
      player.events.push(`Exchanged ${target.name}’s card with the hidden Werewolf card.`);
    } else if (action.role === 'Seer') {
      if (data.mode === 'player') {
        const target = playerById(room, data.targetId);
        recordCardView(player, target, trueRole(target));
      } else {
        for (const index of data.centerIndices) {
          const card = { name: `center card #${index + 1}` };
          player.seenCards ||= [];
          player.seenCards.push({ name: card.name, role: room.center[index] });
          player.events.push(`Saw ${card.name}: ${room.center[index]}.`);
        }
      }
    } else if (action.role === 'Apprentice Seer') {
      const index = data.centerIndex;
      player.seenCards ||= [];
      player.seenCards.push({ name: `center card #${index + 1}`, role: room.center[index] });
      player.events.push(`Saw center card #${index + 1}: ${room.center[index]}.`);
    } else if (action.role === 'Robber') {
      if (data.pass) player.events.push('Chose not to swap cards.');
      else {
        const target = playerById(room, data.targetId);
        [player.card, target.card] = [target.card, player.card];
        player.events.push(`Swapped cards with ${target.name}. Your new card is ${player.card}.`);
        player.seenCards ||= [];
        player.seenCards.push({ name: 'your new card', role: player.card });
      }
    } else if (action.role === 'Witch') {
      if (data.pass) player.events.push('Chose not to use the Witch ability.');
      else {
        const centerRole = room.center[data.centerIndex];
        const target = playerById(room, data.targetId);
        player.seenCards ||= [];
        player.seenCards.push({ name: `center card #${data.centerIndex + 1}`, role: centerRole });
        [room.center[data.centerIndex], target.card] = [target.card, room.center[data.centerIndex]];
        player.events.push(`Saw center card #${data.centerIndex + 1}: ${centerRole}, then swapped it with ${target.name}’s card.`);
      }
    } else if (action.role === 'Paranormal Investigator') {
      if (data.pass) player.events.push('Could not inspect two unshielded cards and passed.');
      else {
        for (const targetId of data.targetIds) {
          const target = playerById(room, targetId);
          const role = trueRole(target);
          recordCardView(player, target, role);
          if (['Werewolf', 'Mystic Wolf', 'Alpha Wolf', 'Dream Wolf', 'Tanner'].includes(role)) {
            player.transformedRole = role;
            player.events.push(`You became ${role} after your investigation.`);
            break;
          }
        }
      }
    } else if (action.role === 'Pickpocket') {
      if (data.pass) player.events.push('Chose not to swap marks.');
      else {
        const target = playerById(room, data.targetId);
        [player.mark, target.mark] = [target.mark, player.mark];
        player.seenMarks ||= [];
        player.seenMarks.push({ name: 'your new mark', mark: player.mark });
        player.events.push(`Swapped marks with ${target.name}. Your new mark is ${MARK_LABELS[player.mark] || 'Mark of Clarity'}.`);
      }
    } else if (action.role === 'Troublemaker') {
      if (data.pass) player.events.push('Could not swap two unshielded cards and passed.');
      else {
        const targets = data.targetIds.map((id) => playerById(room, id));
        [targets[0].card, targets[1].card] = [targets[1].card, targets[0].card];
        player.events.push(`Swapped ${targets[0].name}’s and ${targets[1].name}’s cards.`);
      }
    } else if (action.role === 'Gremlin') {
      if (data.mode === 'marks') {
        const targets = data.targetIds.map((id) => playerById(room, id));
        [targets[0].mark, targets[1].mark] = [targets[1].mark, targets[0].mark];
        player.events.push(`Swapped ${targets[0].name}’s and ${targets[1].name}’s marks.`);
      } else {
        const targets = data.targetIds.map((id) => playerById(room, id));
        [targets[0].card, targets[1].card] = [targets[1].card, targets[0].card];
        player.events.push(`Swapped ${targets[0].name}’s and ${targets[1].name}’s cards.`);
      }
    } else if (action.role === 'Village Idiot') {
      const ring = room.players.filter((entry) => entry.id !== player.id && !entry.shielded);
      const before = ring.map((entry) => entry.card);
      ring.forEach((entry, index) => {
        const shift = data.direction === 'left' ? 1 : ring.length - 1;
        entry.card = before[(index + shift) % ring.length];
      });
      player.events.push(`Moved the unshielded cards one seat to the ${data.direction}.`);
    } else if (action.role === 'Drunk') {
      [player.card, room.center[data.centerIndex]] = [room.center[data.centerIndex], player.card];
      player.events.push('Swapped your card with a center card. You do not know which role you now hold.');
    } else if (action.role === 'Insomniac') {
      if (player.shielded) player.events.push('Your card was shielded by the Sentinel and could not be switched.');
      else player.events.push(`Your card is now: ${player.card}.`);
      player.seenCards ||= [];
      if (!player.shielded) player.seenCards.push({ name: 'your card', role: player.card });
    } else if (action.role === 'Revealer') {
      const target = playerById(room, data.targetId);
      const role = trueRole(target);
      if (['Werewolf', 'Mystic Wolf', 'Alpha Wolf', 'Dream Wolf', 'Tanner'].includes(role)) {
        player.events.push(`Privately revealed ${target.name}’s card: ${role}.`);
        player.seenCards ||= [];
        player.seenCards.push({ id: target.id, name: target.name, role });
      } else {
        room.publicEvents.push(`${player.name} revealed ${target.name}’s card: ${role}.`);
      }
    } else if (action.role === 'Curator') {
      const target = playerById(room, data.targetId);
      const artifact = room.artifactPool[crypto.randomInt(room.artifactPool.length)];
      target.artifact = true;
      target.artifactName = artifact;
      target.artifactRole = ARTIFACT_ROLES[artifact] || null;
      player.events.push(`Placed a random artifact on ${target.name}.`);
      target.events.push('A hidden artifact was placed on you. Check your private information.');
      room.publicEvents.push(`${target.name} received a mysterious artifact.`);
    }
  }
  room.stage = 'information';
  room.infoDone = {};
  room.infoActions = {};
  room.infoQueue = actorsForRole(room, 'Marksman').map((player) => ({ actorId: player.id, role: 'Marksman' }));
  runBotInformation(room);
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
  const protectedIds = new Set(room.players.filter((player) => trueRole(player) === 'Bodyguard').map((player) => room.votes[player.id]).filter(Boolean));
  const eligible = room.players.filter((player) => !protectedIds.has(player.id));
  const highest = Math.max(0, ...eligible.map((player) => counts[player.id]));
  const dead = highest > 1 ? eligible.filter((player) => counts[player.id] === highest) : [];
  const deadIds = new Set(dead.map((player) => player.id));
  room.votesForDiseased = Object.entries(room.votes).filter(([, targetId]) => playerById(room, targetId)?.mark === 'Disease').map(([voterId]) => voterId);
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const pair of room.lovers || []) {
      if (pair.some((id) => deadIds.has(id))) {
        for (const id of pair) if (!deadIds.has(id)) { deadIds.add(id); expanded = true; }
      }
    }
    for (const player of room.players.filter((entry) => deadIds.has(entry.id) && trueRole(entry) === 'Hunter')) {
      const targetId = room.votes[player.id];
      if (targetId && !deadIds.has(targetId)) { deadIds.add(targetId); expanded = true; }
    }
  }
  const finalDead = room.players.filter((player) => deadIds.has(player.id));
  room.assassinTargetId = room.players.find((player) => player.mark === 'Assassin')?.id || null;
  const tanner = finalDead.find((player) => trueRole(player) === 'Tanner');
  const wolvesAlive = room.players.some((player) => !deadIds.has(player.id) && wolfTeamRole(player));
  const vampiresAlive = room.players.some((player) => !deadIds.has(player.id) && vampireTeamRole(player));
  room.voteCounts = counts;
  room.deadIds = finalDead.map((player) => player.id);
  room.winningTeams = [];
  if (wolvesAlive) room.winningTeams.push('wolves');
  if (vampiresAlive) room.winningTeams.push('vampires');
  if (tanner) room.winningTeams.push('tanner');
  if (!wolvesAlive && !vampiresAlive && !tanner) room.winningTeams.push('village');
  room.winnerTeam = room.winningTeams[0] || 'village';
  const factionWins = room.winningTeams.filter((team) => team !== 'tanner').map((team) => ({
    wolves: 'The werewolf team also wins.',
    vampires: 'The vampire team also wins.',
    village: 'The village wins.',
  })[team]);
  room.winner = tanner
    ? `${tanner.name} was voted out as the Tanner. The village loses.${factionWins.length ? ` ${factionWins.join(' ')}` : ''}`
    : wolvesAlive
      ? dead.length
        ? 'The werewolf team wins. The village missed.'
        : 'The werewolf team wins. Nobody was voted out and wolves remain.'
      : vampiresAlive
        ? 'The vampire team wins. A vampire remains among the players.'
        : 'The village wins. No werewolves remain among the players.';
  room.stage = 'results';
  for (const bot of room.players.filter((player) => player.isBot)) botChatMessage(room, bot, 'result');
  const rewardedAccounts = new Set();
  for (const player of room.players) {
    if (!player.accountId || rewardedAccounts.has(player.accountId)) continue;
    const account = accounts.get(player.accountId);
    if (!account) continue;
    rewardedAccounts.add(player.accountId);
    account.stats.games += 1;
    const won = playerOutcome(room, player) === 'You win';
    if (won) account.stats.wins += 1;
    const coinsEarned = 25 + (won ? 15 : 0);
    account.coins += coinsEarned;
    account.activityLog ||= [];
    account.activityLog.unshift({ at: timestamp(), action: 'Game completed', detail: `${won ? 'Won' : 'Played'} · ${coinsEarned} coins` });
    account.activityLog.length = Math.min(account.activityLog.length, 200);
  }
  if (rewardedAccounts.size) persistAccounts();
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
    let acknowledged = false;
    const respond = (response) => {
      acknowledged = true;
      if (typeof ack === 'function') ack(response);
    };
    try {
      handler(payload, respond);
      if (!acknowledged) respond({ ok: true });
    }
    catch (error) { ackError(ack, error.message); }
  };
}

loadAccounts();
loadRooms();
loadSavedVillages();
app.set('trust proxy', 1);
app.use(express.json({ limit: '16kb' }));
app.get('/', (_request, response) => response.sendFile(path.join(__dirname, 'index.html')));
app.get(['/styles.css', '/online.js', '/app.js'], (request, response) => response.sendFile(path.join(__dirname, path.basename(request.path))));
app.get('/health', (_request, response) => response.json({ status: 'ok', rooms: rooms.size }));
app.get('/api/villages', (request, response) => {
  const account = requestAccount(request);
  if (!account) return response.status(401).json({ error: 'Sign in to view saved villages.' });
  const villages = [...savedVillages.values()].filter((entry) => entry.ownerAccountId === account.id).map(({ id, code, savedAt, hostKey, players, roles }) => ({ id, code, savedAt, hostKey, players: players.length, roles }));
  return response.json({ villages });
});
app.post('/api/account/signup', (request, response) => {
  if (!limited(request, 'signup', 20, 60 * 60 * 1000)) return response.status(429).json({ error: 'Too many attempts. Try again later.' });
  const email = String(request.body.email || '').trim().toLowerCase();
  const name = String(request.body.name || '').trim().slice(0, 32);
  const password = String(request.body.password || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return response.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 12 || password.length > 128) return response.status(400).json({ error: 'Password must be 12 to 128 characters.' });
  if ([...accounts.values()].some((account) => account.email === email)) return response.status(409).json({ error: 'An account with that email already exists.' });
  const salt = crypto.randomBytes(16).toString('hex');
  const starterIcons = ICON_CATALOG.filter((item) => item.rarity === 'Common').map((item) => item.icon);
  const account = { id: crypto.randomUUID(), email, name: name || email.split('@')[0].slice(0, 32), salt, passwordHash: passwordHash(password, salt), coins: 0, icons: starterIcons, stats: { games: 0, wins: 0 }, sessions: [], createdAt: timestamp() };
  accounts.set(account.id, account);
  recordAccountActivity(account.id, 'Account created');
  const token = issueAccountSession(account);
  return response.status(201).json(accountResponse(account, token));
});
app.post('/api/account/login', (request, response) => {
  if (!limited(request, 'login', 10, 15 * 60 * 1000)) return response.status(429).json({ error: 'Too many attempts. Try again later.' });
  const email = String(request.body.email || '').trim().toLowerCase();
  const password = String(request.body.password || '');
  if (password.length > 128) return response.status(401).json({ error: 'Email or password is incorrect.' });
  const account = [...accounts.values()].find((entry) => entry.email === email);
  const salt = account?.salt || '00000000000000000000000000000000';
  const candidate = Buffer.from(passwordHash(password, salt), 'hex');
  const expected = Buffer.from(account?.passwordHash || '0'.repeat(128), 'hex');
  if (!account || !crypto.timingSafeEqual(candidate, expected)) return response.status(401).json({ error: 'Email or password is incorrect.' });
  recordAccountActivity(account.id, 'Signed in');
  return response.json(accountResponse(account, issueAccountSession(account)));
});
app.get('/api/account/me', (request, response) => {
  const account = requestAccount(request);
  return account ? response.json({ account: publicAccount(account) }) : response.status(401).json({ error: 'Sign in to continue.' });
});
app.get('/api/account/catalog', (_request, response) => response.json({ icons: ICON_CATALOG }));
app.post('/api/account/purchase-icon', (request, response) => {
  const account = requestAccount(request);
  if (!account) return response.status(401).json({ error: 'Sign in to continue.' });
  const item = ICON_CATALOG.find((entry) => entry.icon === request.body.icon);
  if (!item) return response.status(400).json({ error: 'That icon is not in the catalog.' });
  if (account.icons.includes(item.icon)) return response.status(409).json({ error: 'You already own that icon.' });
  if (item.cost === null) return response.status(403).json({ error: 'This rarity is available only through special events.' });
  if (account.coins < item.cost) return response.status(400).json({ error: 'You do not have enough coins.' });
  account.coins -= item.cost;
  account.icons.push(item.icon);
  recordAccountActivity(account.id, 'Icon purchased', `${item.rarity} · ${item.theme}`);
  persistAccounts();
  return response.json({ account: publicAccount(account) });
});
app.post('/api/account/logout', (request, response) => {
  const account = requestAccount(request);
  if (account) {
    const token = String(request.get('authorization') || '').replace(/^Bearer\s+/i, '');
    account.sessions = account.sessions.filter((session) => session.hash !== tokenHash(token));
    persistAccounts();
  }
  return response.json({ ok: true });
});
app.post('/api/admin/challenge', (request, response) => {
  const key = String(process.env.ADMIN_KEY || '');
  const questions = configuredAdminQuestions();
  if (!/^\d{15}$/.test(process.env.ADMIN_PATH || '') || !/^\d{15}$/.test(key) || questions.length !== 5) return response.status(404).json({ error: 'Not found.' });
  if (!limited(request, 'admin-key', 5, 15 * 60 * 1000)) return response.status(429).json({ error: 'Too many attempts. Try again later.' });
  if (!secureEqual(String(request.body.key || ''), key)) return response.status(401).json({ error: 'Access denied.' });
  const challengeId = randomToken();
  adminChallenges.set(tokenHash(challengeId), { questions, expiresAt: Date.now() + 10 * 60 * 1000 });
  return response.json({ challengeId, questions: questions.map(({ question }) => question) });
});
app.post('/api/admin/verify', (request, response) => {
  if (!limited(request, 'admin-verify', 5, 15 * 60 * 1000)) return response.status(429).json({ error: 'Too many attempts. Try again later.' });
  const challengeHash = tokenHash(String(request.body.challengeId || ''));
  const challenge = adminChallenges.get(challengeHash);
  if (!challenge || challenge.expiresAt <= Date.now()) return response.status(401).json({ error: 'Challenge expired. Start again.' });
  adminChallenges.delete(challengeHash);
  const answers = Array.isArray(request.body.answers) ? request.body.answers : [];
  const valid = answers.length === 5 && challenge.questions.every((item, index) => secureEqual(tokenHash(String(answers[index] || '').trim().toLowerCase()), item.answerHash));
  if (!valid) return response.status(401).json({ error: 'One or more answers were incorrect.' });
  const token = randomToken();
  adminSessions.set(tokenHash(token), Date.now() + 15 * 60 * 1000);
  return response.json({ token });
});
app.get('/api/admin/data', (request, response) => {
  const token = String(request.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!validAdminSession(token)) return response.status(401).json({ error: 'Administrator session expired.' });
  const entries = [...accounts.values()].map((account) => ({ id: account.id, email: account.email, name: account.name, createdAt: account.createdAt, games: account.stats?.games || 0, wins: account.stats?.wins || 0, coins: account.coins, collectedIcons: account.icons.length }));
  return response.json({ analytics: { accounts: entries.length, activeRooms: [...rooms.values()].filter((room) => room.stage !== 'results').length, completedGames: entries.reduce((sum, account) => sum + account.games, 0), coinsHeld: entries.reduce((sum, account) => sum + account.coins, 0) }, accounts: entries });
});
app.get('/api/admin/accounts/:id', (request, response) => {
  const token = String(request.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!validAdminSession(token)) return response.status(401).json({ error: 'Administrator session expired.' });
  const account = accounts.get(request.params.id);
  return account ? response.json({ account: adminAccountDetails(account) }) : response.status(404).json({ error: 'Account not found.' });
});
app.post('/api/admin/logout', (request, response) => {
  const token = String(request.get('authorization') || '').replace(/^Bearer\s+/i, '');
  adminSessions.delete(tokenHash(token));
  return response.json({ ok: true });
});
if (/^\d{15}$/.test(process.env.ADMIN_PATH || '')) app.get(`/${process.env.ADMIN_PATH}`, (_request, response) => response.sendFile(path.join(__dirname, 'index.html')));
app.get(['/join', '/join/:code', '/join/:code/:key', '/moderator', '/moderator/:code/:key', '/villages', '/account'], (_request, response) => response.sendFile(path.join(__dirname, 'index.html')));

io.on('connection', (socket) => {
  socket.on('room:create', acked((payload, ack) => {
    const code = newCode();
    const account = accountFromToken(payload.accountToken);
    const hostToken = randomToken();
    const hostKey = shortKey(10);
    const [question, duskQuestion, nightQuestion] = shuffle(QUESTIONS);
    const roles = Object.fromEntries(ROLES.map((role) => [role, 0]));
    roles.Werewolf = 1;
    roles.Seer = 1;
    roles.Villager = 2;
    const room = { code, hostTokenHash: tokenHash(hostToken), hostKey, hostAccountId: account?.id || null, players: [], roles, artifactPool: ARTIFACTS.filter((artifact) => !UNAVAILABLE_ARTIFACTS.has(artifact)).slice(0, 3), chatSettings: { publicEnabled: true, whispersEnabled: true }, chat: [], stage: 'lobby', question, duskQuestion, nightQuestion, createdAt: timestamp(), updatedAt: timestamp(), hostConnected: true };
    rooms.set(code, room);
    persist();
    if (account) recordAccountActivity(account.id, 'Moderator room created');
    sendSnapshot(socket, room, { code, kind: 'host' }, () => ack?.({ room: snapshot(room, { code, kind: 'host' }), token: hostToken, hostKey }));
  }));

  socket.on('room:join', acked((payload, ack) => {
    const room = rooms.get(String(payload.code || '').trim().toUpperCase());
    const name = String(payload.name || '').trim().slice(0, 18);
    const icon = String(payload.icon || '');
    const playerKey = normalizeKey(payload.playerKey || payload.key || '');
    const account = accountFromToken(payload.accountToken);
    if (!/^\d{6}$/.test(String(payload.code || '')) || !room || room.stage !== 'lobby') throw new Error('No open lobby found with that six-digit code.');
    const existingPlayer = playerKey ? room.players.find((player) => normalizeKey(player.key) === playerKey) : undefined;
    if (existingPlayer) {
      existingPlayer.connected = true;
      existingPlayer.activeTab = true;
      existingPlayer.lastPresenceAt = Date.now();
      existingPlayer.socketId = socket.id;
      if (account) existingPlayer.accountId = account.id;
      existingPlayer.name = existingPlayer.name || name || existingPlayer.name;
      updateRoom(room);
      if (account) recordAccountActivity(account.id, 'Player seat rejoined');
      sendSnapshot(socket, room, { code: room.code, kind: 'player', playerId: existingPlayer.id }, () => ack?.({ room: snapshot(room, { code: room.code, kind: 'player', playerId: existingPlayer.id }), token: existingPlayer.key, playerKey: existingPlayer.key }));
      return;
    }
    if (!name) throw new Error('Enter a player name.');
    if (room.players.length >= 24) throw new Error('This room is full.');
    if (!ICONS.includes(icon) || room.players.some((player) => player.icon === icon)) throw new Error('Choose an available icon.');
    const token = randomToken();
    if (account && !account.icons.includes(icon)) throw new Error('That icon is not in your collection yet.');
    const player = { id: crypto.randomUUID(), tokenHash: tokenHash(token), key: shortKey(8), name, icon, accountId: account?.id || null, connected: true, activeTab: true, lastPresenceAt: Date.now(), socketId: socket.id };
    room.players.push(player);
    const fixedCards = roleCount(room) - room.roles.Villager;
    room.roles.Villager = Math.max(0, room.players.length + 3 - fixedCards);
    updateRoom(room);
    if (account) recordAccountActivity(account.id, 'Player seat joined', name);
    sendSnapshot(socket, room, { code: room.code, kind: 'player', playerId: player.id }, () => ack?.({ room: snapshot(room, { code: room.code, kind: 'player', playerId: player.id }), token, playerKey: player.key }));
  }));

  socket.on('room:preview', acked((payload, ack) => {
    const room = rooms.get(String(payload.code || '').trim());
    if (!/^\d{6}$/.test(String(payload.code || '')) || !room || room.stage !== 'lobby') throw new Error('No open lobby found with that six-digit code.');
    ack?.({ preview: { code: room.code, players: room.players.map(({ name, icon }) => ({ name, icon })) } });
  }));

  socket.on('player:change-icon', acked((payload) => {
    const { room, player } = requirePlayer(socket);
    if (room.stage !== 'lobby') throw new Error('Icons are locked after the cards are dealt.');
    const account = accounts.get(player.accountId);
    if (account && !account.icons.includes(payload.icon)) throw new Error('That icon is not in your collection yet.');
    if (!ICONS.includes(payload.icon) || room.players.some((entry) => entry.id !== player.id && entry.icon === payload.icon)) throw new Error('That icon is already in use. Choose another.');
    player.icon = payload.icon;
    updateRoom(room);
    if (account) recordAccountActivity(account.id, 'Player icon changed');
  }));

  socket.on('room:resume', acked((payload, ack) => {
    const { room, session } = authorize(socket, payload.code, payload.token, payload.kind);
    const account = accountFromToken(payload.accountToken);
    if (account) {
      if (session.kind === 'host') {
        if (room.hostAccountId && room.hostAccountId !== account.id) throw new Error('This moderator room belongs to another account.');
        room.hostAccountId = account.id;
      } else {
        const player = playerById(room, session.playerId);
        if (player.accountId && player.accountId !== account.id) throw new Error('This player seat belongs to another account.');
        player.accountId = account.id;
        if (!account.icons.includes(player.icon)) {
          account.icons.push(player.icon);
          persistAccounts();
        }
      }
      const savedVillage = savedVillages.get(room.code);
      if (session.kind === 'host' && savedVillage && !savedVillage.ownerAccountId) {
        savedVillage.ownerAccountId = account.id;
        persistSavedVillages();
      }
      recordAccountActivity(account.id, session.kind === 'host' ? 'Moderator room resumed' : 'Player seat resumed');
    }
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
        if (player) { player.connected = false; player.activeTab = false; }
      }
      socket.leave(session.code);
      delete socket.data.session;
      updateRoom(room);
    }
  }));

  socket.on('player:presence', acked((payload) => {
    const { room, player } = requirePlayer(socket);
    if (player.socketId !== socket.id) return;
    const active = payload.active === true;
    const changed = player.activeTab !== active;
    player.activeTab = active;
    player.connected = player.activeTab;
    player.lastPresenceAt = Date.now();
    if (changed) updateRoom(room);
  }));

  socket.on('host:add-bot', acked((payload) => {
    const room = requireHost(socket);
    if (room.stage !== 'lobby') throw new Error('AI players can only be added in the lobby.');
    if (room.players.length >= 12) throw new Error('A village can have at most 12 players.');
    const icon = ICONS.find((candidate) => !room.players.some((player) => player.icon === candidate));
    if (!icon) throw new Error('No player icons are available for another AI player.');
    const botSettings = normalizeBotSettings(payload.settings);
    const name = String(payload.name || '').trim().slice(0, 18) || `${botSettings.personality} AI ${room.players.filter((player) => player.isBot).length + 1}`;
    room.players.push({ id: crypto.randomUUID(), aiCode: newAiCode(room), name, icon, isBot: true, botSettings, connected: true, activeTab: false });
    room.chatSettings ||= { publicEnabled: true, whispersEnabled: true };
    room.chatSettings.publicEnabled = true;
    const fixedCards = roleCount(room) - room.roles.Villager;
    room.roles.Villager = Math.max(0, room.players.length + 3 - fixedCards);
    updateRoom(room);
  }));

  socket.on('host:bot-icon', acked((payload) => {
    const room = requireHost(socket);
    if (room.stage !== 'lobby') throw new Error('AI icons are locked after the cards are dealt.');
    const player = playerById(room, String(payload.playerId || ''));
    if (!player?.isBot) throw new Error('Choose an AI player to change its icon.');
    if (!ICONS.includes(payload.icon) || room.players.some((entry) => entry.id !== player.id && entry.icon === payload.icon)) throw new Error('Choose an available icon.');
    player.icon = payload.icon;
    updateRoom(room);
  }));

  socket.on('host:remove-bot', acked((payload) => {
    const room = requireHost(socket);
    if (room.stage !== 'lobby') throw new Error('AI players can only be removed in the lobby.');
    const player = playerById(room, String(payload.playerId || ''));
    if (!player?.isBot) throw new Error('Choose an AI player to remove.');
    room.players = room.players.filter((entry) => entry.id !== player.id);
    const fixedCards = roleCount(room) - room.roles.Villager;
    room.roles.Villager = Math.max(0, room.players.length + 3 - fixedCards);
    updateRoom(room);
  }));

  socket.on('host:bot-settings', acked((payload) => {
    const room = requireHost(socket);
    if (room.stage !== 'lobby') throw new Error('AI settings are locked after the cards are dealt.');
    const player = playerById(room, String(payload.playerId || ''));
    if (!player?.isBot) throw new Error('Choose an AI player to configure.');
    if (!['personality', 'talkativeness', 'difficulty'].includes(payload.setting)) throw new Error('Choose a valid AI setting.');
    const normalized = normalizeBotSettings({ ...player.botSettings, [payload.setting]: payload.value });
    if (normalized[payload.setting] !== payload.value) throw new Error('Choose a valid AI setting value.');
    player.botSettings = normalized;
    updateRoom(room);
  }));

  socket.on('host:chat-settings', acked((payload) => {
    const room = requireHost(socket);
    if (!['publicEnabled', 'whispersEnabled'].includes(payload.setting) || typeof payload.enabled !== 'boolean') throw new Error('Choose a valid chat setting.');
    if (payload.setting === 'publicEnabled' && !payload.enabled && room.players.some((player) => player.isBot)) throw new Error('Public chat must stay enabled while AI players are in the room.');
    room.chatSettings ||= { publicEnabled: true, whispersEnabled: true };
    room.chatSettings[payload.setting] = payload.enabled;
    updateRoom(room);
  }));

  socket.on('host:chat-remove', acked((payload) => {
    const room = requireHost(socket);
    const messageId = String(payload.messageId || '');
    const messageIndex = (room.chat || []).findIndex((message) => message.id === messageId);
    if (messageIndex < 0) throw new Error('That chat message is no longer available.');
    room.chat.splice(messageIndex, 1);
    updateRoom(room);
  }));

  socket.on('chat:send', acked((payload) => {
    const session = socket.data.session;
    if (!session) throw new Error('Join a room before chatting.');
    const room = rooms.get(session.code);
    if (!room) throw new Error('Room no longer exists.');
    const sender = session.kind === 'player' ? playerById(room, session.playerId) : null;
    const scope = payload.scope === 'whisper' ? 'whisper' : 'public';
    const settings = room.chatSettings || { publicEnabled: true, whispersEnabled: true };
    if (scope === 'public' && !settings.publicEnabled) throw new Error('Public chat is disabled by the moderator.');
    if (scope === 'whisper' && !settings.whispersEnabled) throw new Error('Whispers are disabled by the moderator.');
    const text = String(payload.text || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, 240);
    if (!text) throw new Error('Write a message before sending.');
    const senderId = sender?.id || 'moderator';
    room.chatRate ||= {};
    const now = Date.now();
    if (now - (room.chatRate[senderId] || 0) < 450) throw new Error('Wait a moment before sending another message.');
    let recipient = null;
    if (scope === 'whisper') {
      if (!sender) throw new Error('Only players can whisper to another player.');
      recipient = playerById(room, String(payload.targetId || ''));
      if (!recipient || recipient.id === sender.id) throw new Error('Choose another player to whisper to.');
      if (recipient.isBot) throw new Error('AI players do not receive whispers. Use public chat to talk to them.');
    }
    room.chatRate[senderId] = now;
    appendChat(room, { scope, fromId: senderId, fromName: sender?.name || 'Moderator', toId: recipient?.id || null, text, isBot: false });
    if (scope === 'public') runBotDiscussion(room, 'human-message');
    updateRoom(room);
  }));

  socket.on('host:kick-player', acked((payload) => {
    const room = requireHost(socket);
    if (room.stage !== 'lobby') throw new Error('Players can only be removed from the lobby.');
    const player = playerById(room, String(payload.playerId || ''));
    if (!player) throw new Error('Player not found in this room.');
    const playerId = player.id;
    room.players = room.players.filter((entry) => entry.id !== playerId);
    const fixedCards = roleCount(room) - room.roles.Villager;
    room.roles.Villager = Math.max(0, room.players.length + 3 - fixedCards);
    for (const client of io.sockets.sockets.values()) {
      if (client.data.session?.code !== room.code || client.data.session?.playerId !== playerId) continue;
      client.emit('room:kicked');
      client.leave(room.code);
      delete client.data.session;
    }
    updateRoom(room);
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

  socket.on('host:artifact-pool', acked((payload) => {
    const room = requireHost(socket);
    if (room.stage !== 'lobby') throw new Error('Artifacts are locked after the game starts.');
    const selected = [...new Set(payload.artifacts || [])];
    if (selected.some((artifact) => !ARTIFACTS.includes(artifact) || UNAVAILABLE_ARTIFACTS.has(artifact))) throw new Error('Choose only available artifacts.');
    if (room.roles.Curator > 0 && selected.length < 3) throw new Error('Curator needs at least three selected artifacts.');
    room.artifactPool = selected;
    updateRoom(room);
  }));

  socket.on('host:start', acked(() => {
    const room = requireHost(socket);
    if (room.stage !== 'lobby') throw new Error('This game has already started.');
    const activePlayers = room.players.filter((player) => player.isBot || player.activeTab && Date.now() - (player.lastPresenceAt || 0) < 7000);
    if (activePlayers.length < 3 || activePlayers.length > 12) throw new Error('At least 3 online players are needed, and no more than 12 can play.');
    if (roleCount(room) !== activePlayers.length + 3) throw new Error('Choose exactly one card per online player, plus three center cards.');
    if (room.roles.Curator > 0 && room.artifactPool.length < 3) throw new Error('Select at least three available artifacts for the Curator.');
    const deck = ROLES.flatMap((role) => Array(room.roles[role]).fill(role));
    const nonVillagers = shuffle(deck.filter((role) => role !== 'Villager'));
    const villagers = shuffle(deck.filter((role) => role === 'Villager'));
    const orderedDeck = [...nonVillagers, ...villagers];
    const playerCards = orderedDeck.slice(0, activePlayers.length);
    const centerCards = orderedDeck.slice(activePlayers.length);
    activePlayers.forEach((player, index) => Object.assign(player, { card: playerCards[index], startCard: playerCards[index], mark: 'Clarity', events: [], seenCards: [], seenMarks: [], setupTarget: null, effectiveRole: null, artifactRole: null, transformedRole: null, artifactName: null, artifact: false, shielded: false, nightAnswer: null }));
    room.players = activePlayers;
    room.center = centerCards;
    room.setupIndex = 0;
    room.stage = 'roles';
    room.roleReady = Object.fromEntries(activePlayers.filter((player) => player.isBot).map((player) => [player.id, true]));
    room.shields = {};
    room.publicEvents = [];
    if (activePlayers.every((player) => player.isBot)) {
      if (activePlayers.some((player) => player.startCard === 'Sentinel')) {
        room.stage = 'sentinel';
        runBotSentinels(room);
      } else startSetup(room);
      room.setupIndex = 0;
    }
    updateRoom(room);
  }));

  socket.on('player:setup', acked((payload) => {
    const { room, player } = requirePlayer(socket);
    if (room.stage !== 'setup') throw new Error('Setup is not open now.');
    const action = room.setupQueue?.find((entry) => entry.actorId === player.id && entry.role === 'Doppelganger');
    if (!action || room.setupActions?.[player.id]) throw new Error('Doppelganger setup is not available now.');
    const target = playerById(room, payload.targetId);
    if (!target || target.id === player.id) throw new Error('Choose another player.');
    if (player.startCard === 'Copycat') throw new Error('Choose a center card for Copycat.');
    if (target.shielded) throw new Error('That card is shielded from being viewed.');
    player.setupTarget = target.id;
    player.effectiveRole = target.startCard;
    recordCardView(player, target, target.startCard, 'Copied');
    finishSetupAction(room, player.id);
    updateRoom(room);
  }));

  socket.on('player:copycat-setup', acked((payload) => {
    const { room, player } = requirePlayer(socket);
    if (room.stage !== 'setup' || player.startCard !== 'Copycat' || player.setupTarget) throw new Error('Copycat setup is not available now.');
    if (!room.setupQueue?.some((entry) => entry.actorId === player.id && entry.role === 'Copycat') || room.setupActions?.[player.id]) throw new Error('Copycat setup is not available now.');
    const index = Number(payload.centerIndex);
    if (!Number.isInteger(index) || index < 0 || index > 2) throw new Error('Choose a center card.');
    player.setupTarget = `center:${index}`;
    player.effectiveRole = room.center[index];
    player.seenCards ||= [];
    player.seenCards.push({ name: `center card #${index + 1}`, role: room.center[index] });
    player.events.push(`Copied center card #${index + 1}: ${room.center[index]}.`);
    finishSetupAction(room, player.id);
    updateRoom(room);
  }));

  socket.on('player:phase-question', acked((payload) => {
    const { room, player } = requirePlayer(socket);
    const answer = playerById(room, payload.targetId);
    if (!answer || answer.id === player.id) throw new Error('Choose another player.');
    if (room.stage === 'setup') {
      const action = room.setupQueue?.find((entry) => entry.actorId === player.id && entry.questionOnly);
      if (!action || room.setupActions?.[player.id]) throw new Error('You have no Setup question now.');
      player.events.push(`Because you don't have a Setup role, here is a question to keep you occupied: ${room.question} You chose ${answer.name}.`);
      finishSetupAction(room, player.id);
    } else if (room.stage === 'dusk') {
      const action = activeDuskAction(room, player.id);
      if (!action?.questionOnly || room.duskActions?.[action.key]) throw new Error('You have no Dusk question now.');
      player.events.push(`Because you don't have a Dusk role, here is a question to keep you occupied: ${room.duskQuestion} You chose ${answer.name}.`);
      room.duskActions[action.key] = { data: { targetId: answer.id } };
      if (Object.keys(room.duskActions).length === room.duskQueue.length) resolveDusk(room);
    } else throw new Error('There is no phase question now.');
    updateRoom(room);
  }));

  socket.on('player:role-ready', acked(() => {
    const { room, player } = requirePlayer(socket);
    if (room.stage !== 'roles') throw new Error('The role reveal is not active now.');
    room.roleReady ||= {};
    room.roleReady[player.id] = true;
    if (room.players.every((entry) => room.roleReady[entry.id])) {
      if (room.players.some((entry) => entry.startCard === 'Sentinel')) {
        room.stage = 'sentinel';
        runBotSentinels(room);
      }
      else startSetup(room);
      room.setupIndex = 0;
    }
    updateRoom(room);
  }));

  socket.on('player:sentinel-shield', acked((payload) => {
    const { room, player } = requirePlayer(socket);
    if (room.stage !== 'sentinel' || player.startCard !== 'Sentinel') throw new Error('You are not choosing a Sentinel shield now.');
    const target = playerById(room, payload.targetId);
    if (!target) throw new Error('Choose a player to shield.');
    if (room.shields?.[player.id]) throw new Error('Your shield is already placed.');
    finishSentinel(room, player, target);
    updateRoom(room);
  }));

  socket.on('player:dusk-action', acked((payload) => {
    const { room, player } = requirePlayer(socket);
    const action = activeDuskAction(room, player.id);
    if (room.stage !== 'dusk' || !action) throw new Error('You have no Dusk action now.');
    if (room.duskActions[action.key]) throw new Error('This Dusk action is already locked.');
    const data = {};
    if (action.key === 'vampire-mark') {
      if (player.id !== action.actorId) throw new Error('Only one vampire chooses the shared mark.');
      const target = playerById(room, payload.targetId);
      if (!target || VAMPIRE_ROLES.has(effectiveRole(target)) || target.mark === 'Vampire') throw new Error('Choose one non-vampire player.');
      data.targetId = target.id;
    } else if (action.role === 'Count' || action.role === 'Instigator' || action.role === 'Assassin') {
      const target = playerById(room, payload.targetId);
      if (!target || target.id === player.id && action.role !== 'Count') throw new Error('Choose another player.');
      if (action.role === 'Count' && target.mark === 'Vampire') throw new Error('Choose a different player from the Mark of Vampire.');
      data.targetId = target.id;
    } else if (action.role === 'Diseased') {
      const current = room.players.findIndex((entry) => entry.id === player.id);
      const neighborIds = [room.players[(current + 1) % room.players.length].id, room.players[(current + room.players.length - 1) % room.players.length].id];
      if (!neighborIds.includes(payload.targetId)) throw new Error('Choose the player on your left or right.');
      data.targetId = payload.targetId;
    } else if (action.role === 'Cupid') {
      const ids = [...new Set(payload.targetIds || [])];
      if (ids.length !== 2 || ids.some((id) => !playerById(room, id))) throw new Error('Choose two different players to love.');
      data.targetIds = ids;
    } else if (action.role === 'Priest') {
      const target = playerById(room, payload.targetId);
      if (!target || target.id === player.id) throw new Error('Choose one other player to receive Mark of Clarity.');
      data.targetId = target.id;
    } else if (action.role !== 'Renfield') throw new Error('This role does not have a Dusk action.');
    room.duskActions[action.key] = { data };
    if (Object.keys(room.duskActions).length === room.duskQueue.length) resolveDusk(room);
    updateRoom(room);
  }));

  socket.on('player:mark-done', acked(() => {
    const { room, player } = requirePlayer(socket);
    if (room.stage !== 'mark') throw new Error('The Mark phase is not open now.');
    room.markReady ||= {};
    room.markReady[player.id] = true;
    if (room.players.every((entry) => room.markReady[entry.id])) startNight(room);
    updateRoom(room);
  }));

  socket.on('player:night-answer', acked((payload) => {
    const { room, player } = requirePlayer(socket);
    const action = room.nightQueue.find((entry) => entry.actorId === player.id);
    if (room.stage !== 'night' || !action || !roleQuestion(action, room)) throw new Error('There is no night question for you now.');
    if (room.nightActions[player.id]) throw new Error('Your night action is already locked.');
    const answer = playerById(room, payload.targetId);
    if (!answer || answer.id === player.id) throw new Error('Choose another player.');
    player.nightAnswer = answer.id;
    room.nightActions[player.id] = { targetId: answer.id };
    if (Object.keys(room.nightActions).length === room.nightQueue.length) resolveNight(room);
    updateRoom(room);
  }));

  socket.on('player:night-action', acked((payload) => {
    const { room, player } = requirePlayer(socket);
    const action = room.nightQueue.find((entry) => entry.actorId === player.id);
    if (room.stage !== 'night' || !action) throw new Error('You have no night action to submit.');
    if (room.nightActions[player.id]) throw new Error('Your night action is already locked.');
    const role = action.role;
    if (roleQuestion(action, room)) throw new Error('Answer your night question first.');
    const data = {};
    if (role === 'Werewolf') {
      const wolves = room.players.filter((entry) => effectiveRole(entry) === 'Werewolf');
      if (wolves.length !== 1) throw new Error('Werewolves act together and do not peek at the center.');
      const index = Number(payload.centerIndex);
      if (!Number.isInteger(index) || index < 0 || index > 2) throw new Error('Choose a center card.');
      data.centerIndex = index;
    } else if (role === 'Mystic Wolf' || role === 'Alpha Wolf') {
      const target = inspectablePlayer(room, payload.targetId, player.id);
      if (!target) throw new Error('Choose another unshielded player.');
      data.targetId = target.id;
    } else if (role === 'Seer') {
      if (payload.mode === 'player') {
        const target = inspectablePlayer(room, payload.targetId, player.id);
        if (!target) throw new Error('Choose another unshielded player.');
        data.mode = 'player';
        data.targetId = target.id;
      } else if (payload.mode === 'center') {
        const indices = [...new Set((payload.centerIndices || []).map(Number))];
        if (indices.length !== 2 || indices.some((index) => !Number.isInteger(index) || index < 0 || index > 2)) throw new Error('Choose two different center cards.');
        data.mode = 'center';
        data.centerIndices = indices;
      } else throw new Error('Choose a player or two center cards.');
    } else if (role === 'Apprentice Seer') {
      const index = Number(payload.centerIndex);
      if (!Number.isInteger(index) || index < 0 || index > 2) throw new Error('Choose a center card.');
      data.centerIndex = index;
    } else if (role === 'Robber' || role === 'Pickpocket') {
      if (payload.pass) data.pass = true;
      else {
        const target = role === 'Pickpocket' ? playerById(room, payload.targetId) : inspectablePlayer(room, payload.targetId, player.id);
        if (!target || target.id === player.id || role === 'Robber' && target.shielded) throw new Error('Choose another available player, or pass.');
        data.targetId = target.id;
      }
    } else if (role === 'Witch') {
      if (payload.pass) data.pass = true;
      else {
        const index = Number(payload.centerIndex);
        const target = inspectablePlayer(room, payload.targetId, player.id, true);
        if (!Number.isInteger(index) || index < 0 || index > 2 || !target) throw new Error('Choose a center card and an unshielded player card to exchange.');
        data.centerIndex = index;
        data.targetId = target.id;
      }
    } else if (role === 'Paranormal Investigator') {
      if (payload.pass) { data.pass = true; room.nightActions[player.id] = { data }; if (Object.keys(room.nightActions).length === room.nightQueue.length) resolveNight(room); updateRoom(room); return; }
      const ids = [...new Set(payload.targetIds || [])];
      const targets = ids.map((id) => inspectablePlayer(room, id, player.id));
      if (ids.length !== 2 || targets.some((target) => !target)) throw new Error('Choose two different unshielded players.');
      data.targetIds = ids;
    } else if (role === 'Troublemaker') {
      if (payload.pass) { data.pass = true; room.nightActions[player.id] = { data }; if (Object.keys(room.nightActions).length === room.nightQueue.length) resolveNight(room); updateRoom(room); return; }
      const ids = [...new Set(payload.targetIds || [])];
      const targets = ids.map((id) => inspectablePlayer(room, id, player.id));
      if (targets.length !== 2 || targets.some((target) => !target)) throw new Error('Choose two different unshielded players other than yourself.');
      data.targetIds = ids;
    } else if (role === 'Gremlin') {
      if (!['marks', 'cards'].includes(payload.mode)) throw new Error('Choose whether to switch marks or cards.');
      const ids = [...new Set(payload.targetIds || [])];
      if (ids.length !== 2 || ids.some((id) => id === player.id)) throw new Error('Choose two other players.');
      const targets = ids.map((id) => playerById(room, id));
      if (targets.some((target) => !target || payload.mode === 'cards' && target.shielded)) throw new Error('Choose two available players.');
      data.mode = payload.mode;
      data.targetIds = ids;
    } else if (role === 'Village Idiot') {
      if (!['left', 'right'].includes(payload.direction)) throw new Error('Choose left or right.');
      data.direction = payload.direction;
    } else if (role === 'Drunk') {
      const index = Number(payload.centerIndex);
      if (!Number.isInteger(index) || index < 0 || index > 2) throw new Error('Choose a center card.');
      data.centerIndex = index;
    } else if (role === 'Revealer' || role === 'Curator') {
      const target = inspectablePlayer(room, payload.targetId, player.id);
      if (!target) throw new Error('Choose another unshielded player.');
      data.targetId = target.id;
    } else throw new Error('This role does not have a night action.');
    room.nightActions[player.id] = { data };
    if (Object.keys(room.nightActions).length === room.nightQueue.length) resolveNight(room);
    updateRoom(room);
  }));

  socket.on('player:information-done', acked(() => {
    const { room, player } = requirePlayer(socket);
    if (room.stage !== 'information') throw new Error('Information is not available now.');
    if (room.infoQueue?.some((entry) => entry.actorId === player.id) && !room.infoActions?.[player.id]) throw new Error('Complete your Marksman information action first.');
    room.infoDone ||= {};
    room.infoDone[player.id] = true;
    if (room.players.every((entry) => room.infoDone[entry.id])) {
      startDiscussion(room);
    }
    updateRoom(room);
  }));

  socket.on('player:information-action', acked((payload) => {
    const { room, player } = requirePlayer(socket);
    const action = room.infoQueue?.find((entry) => entry.actorId === player.id);
    if (room.stage !== 'information' || !action || action.role !== 'Marksman') throw new Error('You have no information action now.');
    if (room.infoActions?.[player.id]) throw new Error('Your information action is already locked.');
    const markTarget = playerById(room, payload.markTargetId);
    const roleTarget = playerById(room, payload.roleTargetId);
    if (!markTarget || !roleTarget || markTarget.id === roleTarget.id) throw new Error('Choose two different players, one for a mark and one for a role.');
    player.seenMarks ||= [];
    player.seenMarks.push({ id: markTarget.id, name: markTarget.name, mark: markTarget.mark });
    recordCardView(player, roleTarget, trueRole(roleTarget));
    room.infoActions ||= {};
    room.infoActions[player.id] = true;
    updateRoom(room);
  }));

  socket.on('host:timer', acked((payload) => {
    const room = requireHost(socket);
    if (room.stage !== 'discussion') throw new Error('The discussion timer is not active now.');
    if (payload.running) {
      room.timerRunning = true;
      runBotDiscussion(room, 'timer-start');
      room.nextBotChatAt = Date.now() + 20000 + crypto.randomInt(15000);
      if (!timers.has(room.code)) {
        timers.set(room.code, setInterval(() => {
          if (!room.timerRunning || room.stage !== 'discussion') return stopTimer(room.code);
          room.discussionSeconds = Math.max(0, room.discussionSeconds - 1);
          if (room.discussionSeconds === 0) { room.timerRunning = false; stopTimer(room.code); }
          if (room.timerRunning && Date.now() >= (room.nextBotChatAt || 0)) {
            runBotDiscussion(room, 'timer-tick');
            room.nextBotChatAt = Date.now() + 18000 + crypto.randomInt(18000);
          }
          updateRoom(room);
        }, 1000));
      }
    } else {
      room.timerRunning = false;
      delete room.nextBotChatAt;
      stopTimer(room.code);
    }
    updateRoom(room);
  }));

  socket.on('host:begin-voting', acked(() => {
    const room = requireHost(socket);
    if (room.stage !== 'discussion') throw new Error('Voting can only start after discussion.');
    room.timerRunning = false;
    delete room.nextBotChatAt;
    stopTimer(room.code);
    room.votes = {};
    room.stage = 'voting';
    runBotVotes(room);
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
      for (const key of ['card', 'startCard', 'mark', 'events', 'seenCards', 'seenMarks', 'setupTarget', 'effectiveRole', 'transformedRole', 'nightAnswer', 'voteTarget', 'shielded', 'artifact', 'artifactName', 'artifactRole', 'assassinTargetId']) delete player[key];
      for (const key of ['discussionReplies', 'discussionEvidence', 'discussionTurn']) delete player[key];
    }
    for (const key of ['center', 'duskQueue', 'duskActions', 'markReady', 'lovers', 'nightQueue', 'nightActions', 'alphaReserves', 'nightIndex', 'setupIndex', 'roleReady', 'shields', 'infoDone', 'infoQueue', 'infoActions', 'votes', 'votesForDiseased', 'voteCounts', 'deadIds', 'assassinTargetId', 'winner', 'winnerTeam', 'publicEvents']) delete room[key];
    const question = QUESTIONS[crypto.randomInt(QUESTIONS.length)];
    room.question = question;
    room.nightQuestion = QUESTIONS.filter((entry) => entry !== question)[crypto.randomInt(QUESTIONS.length - 1)];
    room.stage = 'lobby';
    updateRoom(room);
  }));

  socket.on('host:stop-game', acked(() => {
    const room = requireHost(socket);
    if (room.stage === 'lobby') throw new Error('The lobby is already open.');
    for (const player of room.players) {
      for (const key of ['card', 'startCard', 'mark', 'events', 'seenCards', 'seenMarks', 'setupTarget', 'effectiveRole', 'transformedRole', 'nightAnswer', 'voteTarget', 'shielded', 'artifact', 'artifactName', 'artifactRole', 'assassinTargetId']) delete player[key];
      for (const key of ['discussionReplies', 'discussionEvidence', 'discussionTurn']) delete player[key];
    }
    for (const key of ['center', 'duskQueue', 'duskActions', 'markReady', 'lovers', 'nightQueue', 'nightActions', 'alphaReserves', 'nightIndex', 'setupIndex', 'roleReady', 'shields', 'infoDone', 'infoQueue', 'infoActions', 'votes', 'votesForDiseased', 'voteCounts', 'deadIds', 'assassinTargetId', 'winner', 'winnerTeam', 'publicEvents']) delete room[key];
    room.discussionSeconds = 0;
    room.timerRunning = false;
    stopTimer(room.code);
    room.stage = 'lobby';
    updateRoom(room);
  }));

  socket.on('host:save-village', acked((_payload, ack) => {
    const room = requireHost(socket);
    if (!room.hostAccountId) throw new Error('Sign in to an account before saving this village.');
    const entry = {
      id: room.code,
      code: room.code,
      ownerAccountId: room.hostAccountId || null,
      savedAt: timestamp(),
      hostKey: room.hostKey,
      roles: { ...room.roles },
      players: room.players.map((player) => ({ id: player.id, name: player.name, icon: player.icon, key: player.key, connected: player.connected, isBot: Boolean(player.isBot), aiCode: player.isBot ? player.aiCode : undefined, botSettings: player.isBot ? player.botSettings : undefined })),
      artifactPool: [...(room.artifactPool || [])],
      question: room.question,
      nightQuestion: room.nightQuestion,
      stage: room.stage === 'lobby' ? 'lobby' : 'paused'
    };
    savedVillages.set(entry.id, entry);
    persistSavedVillages();
    recordAccountActivity(room.hostAccountId, 'Village saved', room.code);
    ack?.({ villages: [...savedVillages.values()] });
  }));

  socket.on('host:get-saved-villages', acked((_payload, ack) => {
    const room = requireHost(socket);
    const villages = [...savedVillages.values()].filter((entry) => room.hostAccountId && entry.ownerAccountId === room.hostAccountId).map((entry) => ({ id: entry.id, code: entry.code, savedAt: entry.savedAt, players: entry.players.length, roles: entry.roles }));
    ack?.({ villages });
  }));

  socket.on('disconnect', () => {
    const session = socket.data.session;
    if (!session) return;
    const room = rooms.get(session.code);
    if (!room) return;
    if (session.kind === 'host') room.hostConnected = false;
    else {
      const player = playerById(room, session.playerId);
      if (player) { player.connected = false; player.activeTab = false; }
    }
    updateRoom(room);
  });
});

httpServer.listen(port, '0.0.0.0', () => console.log(`Nightshift listening on ${port}`));