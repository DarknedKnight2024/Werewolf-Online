const ROLES = [
  ['Sentinel', '#3f8b75', '🛡️', 'During setup, shield one player’s card from being seen or switched.'],
  ['Copycat', '#397b9b', '🎭', 'During setup, copy a center card. Perform its action in its normal phase.'],
  ['Doppelganger', '#4167d5', '🪞', 'During setup, copy one player’s card. Perform its action in its normal phase.'],
  ['Vampire', '#a33e5b', '🧛', 'Join the other Vampires to place one Mark of Vampire on a non-vampire.'],
  ['Master', '#8e3e69', '🦇', 'Join the other Vampires to place one Mark of Vampire on a non-vampire.'],
  ['Count', '#66448f', '🩸', 'Join the Vampires, then place Mark of Fear on one player.'],
  ['Renfield', '#765d83', '🦇', 'See the Vampires and Mark of Vampire, then take Mark of the Bat. You are on their team.'],
  ['Diseased', '#71834a', '🦠', 'Place Mark of Disease on the player to your left or right.'],
  ['Cupid', '#d36b8e', '💘', 'Place Marks of Love on two players. If one dies, so does the other.'],
  ['Instigator', '#bc683f', '🗡️', 'Place Mark of Traitor on one player.'],
  ['Priest', '#4f8d83', '🕯️', 'Place Mark of Clarity on yourself and one other player.'],
  ['Assassin', '#a34c3f', '🗡️', 'Mark one player. You win if that player is voted out.'],
  ['Apprentice Assassin', '#bd6e54', '🗡️', 'Your apprentice ability is not active yet.'],
  ['Werewolf', '#202b28', '🐺', 'Find the pack. If you are the only awake wolf, peek at one center card.'],
  ['Mystic Wolf', '#6949a5', '🔮', 'Wake with the pack, then look at one unshielded player’s card.'],
  ['Alpha Wolf', '#9b4b3c', '🐺', 'Wake with the pack, then exchange a player’s card with the hidden Wolf card.'],
  ['Dream Wolf', '#6c739c', '💤', 'You do not wake with the pack. The other wolves know you are one of them.'],
  ['Minion', '#8172b2', '🗡️', 'Learn who the werewolf team is. They do not learn who you are.'],
  ['Mason', '#45988c', '🧱', 'Find the other Masons, if there are any.'],
  ['Seer', '#4c77d7', '🔮', 'Look at one unshielded player’s card or two center cards.'],
  ['Apprentice Seer', '#6d8bd8', '🌟', 'Look at one card in the center.'],
  ['Marksman', '#358c94', '🏹', 'During information, inspect one player’s mark and another player’s role.'],
  ['Robber', '#d09134', '🦝', 'Optionally swap with an unshielded player and look at your new card.'],
  ['Witch', '#8a578e', '🧙', 'Optionally look at a center card and exchange it with an unshielded player card.'],
  ['Paranormal Investigator', '#536ea7', '🕵️', 'Look at two unshielded player cards in order, stopping at a Wolf or Tanner.'],
  ['Pickpocket', '#ba8a39', '🤏', 'Optionally exchange your mark with another player’s mark and see your new mark.'],
  ['Troublemaker', '#e27859', '🔀', 'Swap two other unshielded players’ cards.'],
  ['Village Idiot', '#b3783f', '🌀', 'Move the other unshielded players’ cards one seat left or right.'],
  ['Gremlin', '#4c8f78', '👺', 'Swap either two other players’ marks or their cards, but not both.'],
  ['Drunk', '#ba668b', '🍷', 'Swap your card with one center card without looking at it.'],
  ['Insomniac', '#5599b5', '🌙', 'Look at your card at the end of the night, unless it is shielded.'],
  ['Revealer', '#66836d', '🪞', 'Reveal one unshielded player’s card. Wolves and Tanners stay private.'],
  ['Curator', '#b68e3b', '🗝️', 'Give one unshielded player a random artifact from the selected pool.'],
  ['Hunter', '#d35c49', '🏹', 'If voted out, the person you voted for is also out.'],
  ['Tanner', '#a87854', '🪵', 'Win if you are voted out.'],
  ['Villager', '#65915d', '🌾', 'No night action. Help the village find a wolf.'],
  ['Bodyguard', '#4b9b99', '🛡️', 'Your vote protects its target; the next-highest target can still be voted out.'],
];
const ICON_CATEGORIES = [
  { name: 'Woodland', icons: ['🦊', '🐺', '🦉', '🦇', '🐈', '🦌', '🐸', '🦝', '🐻', '🐝', '🦚', '🦔', '🐿️', '🦓'] },
  { name: 'Wildlife', icons: ['🐙', '🪲', '🦋', '🐢', '🐬', '🦈', '🐧', '🐼', '🦩', '🦜', '🐊', '🦦', '🦥', '🦭'] },
  { name: 'Nature', icons: ['🌲', '🍂', '🌻', '🪷', '🌵', '🌊', '🍄', '🌿', '🌼', '🌹', '🪻', '🌱'] },
  { name: 'Sky & Space', icons: ['🌙', '🌘', '☀️', '⚡', '❄️', '🌈', '🪐', '✨', '🌟', '☄️', '🌑', '🌕'] },
  { name: 'Mystic', icons: ['🔮', '🗝️', '🧿', '🪬', '🛡️', '⚔️', '👑', '🧪', '👻', '🧙', '🧚', '🧜'] },
  { name: 'Oddities', icons: ['🧸', '🦖', '🦄', '🐉', '🤖', '🪼', '🦂', '🕷️', '🎭', '🪭', '🪄', '🎃'] },
];
const ICONS = ICON_CATEGORIES.flatMap((category) => category.icons);
const ARTIFACTS = [
  ['Claw of the Werewolf', '🐺', true], ['Brand of the Villager', '🌾', true], ['Cudgel of the Tanner', '🪵', true],
  ['Mask of Muting', '🎭', true], ['Shroud of Shame', '🌫️', true], ['Void of Nothingness', '⚫', true],
  ['Bow of the Hunter', '🏹', true], ['Sword of the Bodyguard', '🛡️', true], ['Cloak of the Prince', '👑', true],
  ['Mist of the Vampire', '🧛', false], ['Dagger of the Traitor', '🗡️', false], ['Alien Artifact', '👽', false],
];
const PHASES = ['Lobby', 'Roles', 'Sentinel', 'Setup', 'Dusk', 'Mark', 'Night', 'Information', 'Discuss', 'Vote', 'Reveal'];
const RARITY_COLORS = { Common: '#71816f', Uncommon: '#3f8d73', Rare: '#397eb4', 'Super Rare': '#7655ad', Epic: '#bd7040', Ultra: '#bd9a36', Legendary: '#c34d54', Mythical: '#d05b9d', Ancient: '#6e5b50' };
const app = document.querySelector('#app');
const socket = io();
let room = null;
let roomPreview = null;
let session = null;
let account = null;
let accountToken = localStorage.getItem('nightshift-account-token') || '';
let accountMode = 'login';
let accountCatalog = [];
let savedVillages = [];
let pendingCode = '';
let pendingKey = '';
let selectedIds = [];
let selectedCenter = [];
let seerMode = 'player';
let changingIcon = false;
let villageDirection = 'left';
let gremlinMode = 'cards';
let infoMarkTarget = '';
let infoRoleTarget = '';
let chatDraft = '';
let chatScope = 'public';
let chatTargetId = '';
let chatScrollTop = 0;
let chatStickToBottom = true;
let toastTimer;
let adminChallenge = null;
let adminToken = '';
let adminDashboard = null;
let adminAccountDetail = null;

function esc(value) { return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function toast(message) {
  document.querySelector('.toast')?.remove();
  const node = document.createElement('div');
  node.className = 'toast'; node.textContent = message; document.body.append(node);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => node.remove(), 3000);
}
function emit(event, payload = {}) {
  return new Promise((resolve, reject) => {
    if (!socket.connected) return reject(new Error('Connection lost. Reconnecting…'));
    socket.emit(event, payload, (response) => response?.error ? reject(new Error(response.error)) : resolve(response));
  });
}
async function act(event, payload) {
  try { await emit(event, payload); }
  catch (error) { toast(error.message); }
}
function saveSession(next) {
  session = next;
}
function accountHeaders() {
  return accountToken ? { Authorization: `Bearer ${accountToken}` } : {};
}
async function refreshAccount() {
  if (!accountToken) return;
  try {
    const response = await fetch('/api/account/me', { headers: accountHeaders() });
    if (!response.ok) throw new Error('Your account session expired.');
    account = (await response.json()).account;
    render();
  } catch {
    localStorage.removeItem('nightshift-account-token'); accountToken = ''; account = null;
  }
}
function clearSession() {
  session = null; room = null; pendingCode = '';
  history.replaceState({}, '', location.pathname); render();
}
function updatePresence(active = !document.hidden) {
  if (!session || session.kind !== 'player' || !socket.connected) return;
  emit('player:presence', { active }).catch(() => {});
}
function connectSession() {
  if (!session || !socket.connected) return;
  emit('room:resume', { ...session, accountToken }).then(({ room: snapshot }) => { room = snapshot; render(); updatePresence(); }).catch(() => clearSession());
}
socket.on('connect', connectSession);
document.addEventListener('visibilitychange', () => updatePresence());
setInterval(() => updatePresence(), 2000);
socket.on('disconnect', () => { if (room) render(); });
socket.on('room:update', (snapshot) => { room = snapshot; render(); });
socket.on('room:kicked', () => {
  clearSession();
  toast("You've been kicked by the moderator.");
});
socket.on('connect_error', () => toast('Cannot reach the game server. Retrying…'));

function header() {
  const right = room ? `<span class="top-note">${room.viewer.kind === 'host' ? 'Moderator' : `${esc(room.viewer.name)} · ${room.code}`}</span>` : '<span class="top-note">One night. One village. No alibis.</span>';
  const routeLink = !room ? location.pathname === '/moderator' ? '<a class="top-note route-link" href="/join">Player join</a>' : '<a class="top-note route-link" href="/moderator">Moderator desk</a>' : '';
  const accountLink = /^\d{15}$/.test(location.pathname.slice(1)) ? '' : `<a class="top-note route-link" href="/account">${account ? esc(account.name) : 'Sign in'}</a>`;
  return `<header class="topbar"><a class="brand" href="${room?.viewer.kind === 'host' ? '/moderator' : '/join'}" data-action="home"><span class="brand-mark">✳</span><span class="brand-name">Werewolf<span>Online</span></span></a>${routeLink}${accountLink}${right}</header>`;
}
function parseRoute() {
  const match = location.pathname.match(/^\/(join|moderator)\/(\d{6})(?:\/([A-Z0-9]+))?\/?$/);
  if (match) {
    pendingCode = match[2];
    pendingKey = match[3] || '';
    return;
  }
  pendingCode = '';
  pendingKey = '';
}
function render() {
  parseRoute();
  const chatInput = app.querySelector('#chat-message');
  if (chatInput) chatDraft = chatInput.value;
  const chatLog = app.querySelector('#chat-log');
  if (chatLog) {
    chatStickToBottom = chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 28;
    chatScrollTop = chatLog.scrollTop;
  }
  const scrollY = window.scrollY;
  const roleScrollTop = app.querySelector('.role-list')?.scrollTop || 0;
  const focusedRoleControl = app.contains(document.activeElement) && document.activeElement.matches('[data-action="role-change"]')
    ? { role: document.activeElement.dataset.role, delta: document.activeElement.dataset.delta }
    : null;
  const page = location.pathname === '/account' ? renderAccount() : /^\/\d{15}\/?$/.test(location.pathname) ? renderAdmin() : room ? renderRoom() : renderHome();
  app.innerHTML = `<div class="shell">${header()}<main class="page">${page}</main></div>`;
  requestAnimationFrame(() => {
    window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
    const roleList = app.querySelector('.role-list');
    if (roleList) roleList.scrollTop = roleScrollTop;
    const nextChatInput = app.querySelector('#chat-message');
    if (nextChatInput) nextChatInput.value = chatDraft;
    const nextChatLog = app.querySelector('#chat-log');
    if (nextChatLog) nextChatLog.scrollTop = chatStickToBottom ? nextChatLog.scrollHeight : chatScrollTop;
    if (focusedRoleControl) app.querySelector(`[data-action="role-change"][data-role="${CSS.escape(focusedRoleControl.role)}"][data-delta="${focusedRoleControl.delta}"]`)?.focus({ preventScroll: true });
  });
}
async function loadSavedVillagesList() {
  try {
    const response = await fetch('/api/villages', { headers: accountHeaders() });
    if (!response.ok) throw new Error('Sign in to view your villages.');
    const payload = await response.json();
    savedVillages = payload.villages || [];
    render();
  } catch (error) {
    toast('Unable to load saved villages.');
  }
}
function renderHome() {
  const moderatorPage = location.pathname === '/moderator';
  const villagesPage = location.pathname === '/villages';
  const joining = Boolean(pendingCode);
  if (villagesPage) {
    if (!account) return `<section class="intro"><div class="intro-copy"><div class="eyebrow">Your villages</div><h1>Sign in to continue.</h1><p>Saved villages belong to your moderator account and are private to you.</p></div></section><section class="panel join-panel"><button class="btn" data-action="go-account">Sign in or sign up →</button></section>`;
    return `<section class="intro"><div class="intro-copy"><div class="eyebrow">Your villages</div><h1>Saved rooms.</h1><p>Resume a room later, or keep the village in the list for a quick restart.</p></div><div class="night-stamp" aria-hidden="true">✦</div></section><section class="panel join-panel"><div class="section-head"><h2>Saved villages</h2><button class="btn btn-quiet" data-action="reload-villages">Refresh</button></div>${savedVillages.length ? `<div class="player-list">${savedVillages.map((village) => `<div class="player-row"><div class="player-icon">🏡</div><div class="player-name">${esc(village.code)} · ${esc(village.players || 0)} players</div><button class="btn btn-quiet" data-action="resume-village" data-code="${village.code}" data-key="${village.hostKey}">Resume</button></div>`).join('')}</div>` : '<div class="empty">No saved villages yet. Create a room and choose Save village from the moderator lobby.</div>'}</section>`;
  }
  if (moderatorPage) return `<section class="intro"><div class="intro-copy"><div class="eyebrow">Moderator desk</div><h1>Run the village.</h1><p>Create a room, set the cards, watch readiness, and control discussion. The moderator never gets a player card.</p></div><div class="night-stamp" aria-hidden="true">✳</div></section><section class="home-grid"><section class="host-panel panel"><div class="eyebrow">Host a game</div><h2>Your table starts here.</h2><p>After creating a room, share its six-digit link with your players.</p><div class="room-actions"><button class="btn btn-lime" data-action="create-room">Create room <span aria-hidden="true">→</span></button><button class="btn btn-quiet" data-action="open-villages">Your Villages</button></div></section><section class="join-panel panel"><div class="eyebrow">Rejoin</div><h2>Come back to a room.</h2><p>Use your saved host key to resume an existing room.</p><div class="field"><label for="resume-room-code">ROOM CODE</label><input class="input" id="resume-room-code" name="resume-room-code" maxlength="6" placeholder="123456"></div><div class="field" style="margin-top:10px"><label for="resume-room-key">HOST KEY</label><input class="input" id="resume-room-key" name="resume-room-key" maxlength="20" placeholder="ABCD1234"></div><div class="room-actions" style="margin-top:12px"><button class="btn" data-action="resume-moderator">Resume host →</button></div></section></section>`;
  return `<section class="intro"><div class="intro-copy"><div class="eyebrow">A social deduction game</div><h1>Night falls.<br>Trust nobody.</h1><p>Join the village from your own device. Pick your icon, keep your role private, and find out who changed what.</p></div><div class="night-stamp" aria-hidden="true">☾</div></section><section class="join-panel panel"><div class="eyebrow">Player entrance</div><h2>${joining ? 'Join the village.' : 'Take your seat.'}</h2>${joining ? joinIdentityForm() : `<p>Enter the six-digit room code your moderator shared.</p><form class="join-form" data-form="join-code"><div class="field"><label for="join-code">ROOM CODE</label><input class="input" id="join-code" name="code" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="e.g. 482731" autocomplete="off" required></div><button class="btn" type="submit">Continue <span aria-hidden="true">→</span></button></form>`}</section><div class="how-row"><div class="how-chip"><b>01</b> Enter your code</div><div class="how-chip"><b>02</b> Choose your icon</div><div class="how-chip"><b>03</b> Find the wolf</div></div><div class="room-actions" style="margin-top:18px"><button class="btn btn-quiet" data-action="open-villages">Your Villages</button></div>`;
}
function renderAccount() {
  if (!account) return `<section class="intro"><div class="intro-copy"><div class="eyebrow">Nightshift account</div><h1>${accountMode === 'signup' ? 'Join the village.' : 'Your progress, anywhere.'}</h1><p>Keep your player seats, icon collection, coins, and saved villages connected across devices.</p></div><div class="night-stamp" aria-hidden="true">✧</div></section><section class="panel join-panel"><div class="button-row"><button class="btn ${accountMode === 'login' ? '' : 'btn-quiet'}" data-action="account-mode" data-mode="login">Sign in</button><button class="btn ${accountMode === 'signup' ? '' : 'btn-quiet'}" data-action="account-mode" data-mode="signup">Sign up</button></div><form class="account-form" data-form="account-auth">${accountMode === 'signup' ? '<div class="field"><label for="account-name">DISPLAY NAME</label><input class="input" id="account-name" name="name" maxlength="32" autocomplete="name" placeholder="Your name"></div>' : ''}<div class="field"><label for="account-email">EMAIL</label><input class="input" id="account-email" name="email" type="email" maxlength="254" autocomplete="email" required></div><div class="field"><label for="account-password">PASSWORD</label><input class="input" id="account-password" name="password" type="password" minlength="12" maxlength="128" autocomplete="${accountMode === 'signup' ? 'new-password' : 'current-password'}" required><small>Use at least 12 characters.</small></div><button class="btn" type="submit">${accountMode === 'signup' ? 'Create account' : 'Sign in'} →</button></form><p class="muted-small">Password reset by email is not available until an email provider is configured. Use a password manager and keep your password safe.</p></section>`;
  const shop = `<div class="icon-shop-grid">${accountCatalog.map((item) => {
    const owned = account.icons.includes(item.icon);
    return `<div class="icon-shop-item"><span class="shop-icon">${item.icon}<small class="shop-rarity" style="--rarity-color:${RARITY_COLORS[item.rarity] || '#71816f'}">${esc(item.rarity)}</small></span><small class="shop-theme">${esc(item.theme)}</small>${owned ? '<span class="host-tag">Owned</span>' : item.cost === null ? '<span class="note">Event only</span>' : `<button class="btn btn-quiet" data-action="purchase-icon" data-icon="${item.icon}">${item.cost} coins</button>`}</div>`;
  }).join('')}</div>`;
  return `<section class="intro"><div class="intro-copy"><div class="eyebrow">Your account</div><h1>${esc(account.name)}.</h1><p>${esc(account.email)} · Your account travels with you.</p></div><div class="coin-balance"><span>Coins</span><strong>✦ ${account.coins}</strong></div></section><section class="account-stats"><div><span>Games</span><strong>${account.stats.games}</strong></div><div><span>Wins</span><strong>${account.stats.wins}</strong></div><div><span>Icons</span><strong>${account.icons.length}</strong></div><div><span>Villages</span><strong>${account.villages.length}</strong></div></section><section class="panel account-section"><div class="section-head"><h2>Continue playing</h2><span class="note">Player seats and villages are private to your account</span></div>${account.linkedPlayers.length ? `<div class="player-list">${account.linkedPlayers.map((player) => `<div class="player-row"><span class="player-icon">✦</span><span class="player-name">Room ${esc(player.code)} · ${esc(player.name)}</span><span class="host-tag">${esc(player.stage)}</span><button class="btn btn-quiet" data-action="resume-player" data-code="${esc(player.code)}" data-key="${esc(player.key)}">Resume</button></div>`).join('')}</div>` : '<div class="empty">Player seats you join while signed in will appear here.</div>'}</section><section class="panel account-section"><div class="section-head"><h2>Your villages</h2><button class="btn btn-quiet" data-action="open-villages">Open villages</button></div>${account.villages.length ? `<div class="player-list">${account.villages.map((village) => `<div class="player-row"><span class="player-icon">🏡</span><span class="player-name">${esc(village.code)} · ${village.players} players</span><button class="btn btn-quiet" data-action="resume-village" data-code="${esc(village.code)}">Resume</button></div>`).join('')}</div>` : '<div class="empty">Villages you save while signed in will appear here.</div>'}</section><section class="panel account-section"><div class="section-head"><h2>Icon collection</h2><span class="count-label">${account.coins} coins</span></div><p>Finish a game to earn 25 coins. Win for a 15-coin bonus.</p>${shop}</section><div class="action-footer"><button class="btn btn-quiet" data-action="account-logout">Sign out</button></div>`;
}
function renderAdminDetails() {
  const selected = adminAccountDetail;
  const entry = selected.account;
  return `<section class="intro"><div class="intro-copy"><div class="eyebrow">Restricted admin · Account detail</div><h1>${esc(entry.name)}.</h1><p>${esc(entry.email)} · Created ${esc(new Date(entry.createdAt).toLocaleString())}</p></div><button class="btn btn-quiet" data-action="admin-back">← Accounts</button></section><section class="account-stats"><div><span>Games</span><strong>${entry.stats.games}</strong></div><div><span>Wins</span><strong>${entry.stats.wins}</strong></div><div><span>Coins</span><strong>${entry.coins}</strong></div><div><span>Active sessions</span><strong>${entry.sessionCount}</strong></div></section><section class="panel account-section"><h2>Icon collection</h2><div class="icon-shop-grid">${entry.icons.map((item) => `<div class="icon-shop-item"><span class="shop-icon">${item.icon}</span><span>${esc(item.theme || '')}</span><span class="shop-rarity">${esc(item.rarity || '')}</span></div>`).join('')}</div></section><section class="panel account-section"><h2>Player seats</h2>${entry.playerSeats.length ? `<div class="admin-table"><div class="admin-row admin-seat-heading"><span>Room</span><span>Name</span><span>Icon</span><span>Stage</span><span>Connection</span></div>${entry.playerSeats.map((seat) => `<div class="admin-row admin-seat-row"><span>${esc(seat.code)}</span><span>${esc(seat.name)}</span><span>${seat.icon}</span><span>${esc(seat.stage)}</span><span>${seat.connected ? 'Online' : 'Offline'}</span></div>`).join('')}</div>` : '<div class="empty">No linked player seats.</div>'}</section><section class="panel account-section"><h2>Saved villages</h2>${entry.villages.length ? entry.villages.map((village) => `<div class="admin-village"><h3>Room ${esc(village.code)}</h3><p>Saved ${esc(new Date(village.savedAt).toLocaleString())} · ${village.players.length} players</p><div class="admin-roster">${village.players.map((player) => `<span>${player.icon} ${esc(player.name)} · ${player.connected ? 'Online' : 'Offline'}</span>`).join('')}</div><div class="admin-role-counts">${Object.entries(village.roles).map(([role, count]) => `<span>${esc(role)}: ${count}</span>`).join('')}</div></div>`).join('') : '<div class="empty">No saved villages.</div>'}</section><section class="panel account-section"><h2>Activity log</h2>${entry.activityLog.length ? `<div class="activity-log">${entry.activityLog.map((item) => `<div class="activity-row"><time>${esc(new Date(item.at).toLocaleString())}</time><strong>${esc(item.action)}</strong><span>${esc(item.detail || '')}</span></div>`).join('')}</div>` : '<div class="empty">No account activity recorded.</div>'}</section>`;
}
function renderAdminOverview() {
  return `<section class="intro"><div class="intro-copy"><div class="eyebrow">Restricted admin</div><h1>Accounts & activity.</h1><p>Account identity and aggregate progression metrics.</p></div><div class="night-stamp" aria-hidden="true">✧</div></section><section class="account-stats"><div><span>Accounts</span><strong>${adminDashboard.analytics.accounts}</strong></div><div><span>Active rooms</span><strong>${adminDashboard.analytics.activeRooms}</strong></div><div><span>Completed games</span><strong>${adminDashboard.analytics.completedGames}</strong></div><div><span>Coins held</span><strong>${adminDashboard.analytics.coinsHeld}</strong></div></section><section class="panel account-section"><div class="section-head"><h2>Registered accounts</h2><button class="btn btn-quiet" data-action="admin-logout">Lock dashboard</button></div><div class="admin-table"><div class="admin-row admin-heading"><span>Email</span><span>Name</span><span>Games</span><span>Wins</span><span>Coins</span><span>Icons</span></div>${adminDashboard.accounts.map((entry) => `<button class="admin-row admin-account-row" data-action="admin-account" data-id="${esc(entry.id)}"><span>${esc(entry.email)}</span><span>${esc(entry.name)}</span><span>${entry.games}</span><span>${entry.wins}</span><span>${entry.coins}</span><span>${entry.collectedIcons}</span></button>`).join('')}</div></section>`;
}
function renderAdmin() {
  if (adminAccountDetail) return renderAdminDetails();
  if (adminDashboard) return renderAdminOverview();
  if (adminChallenge) return `<section class="intro"><div class="intro-copy"><div class="eyebrow">Restricted admin · Final check</div><h1>Verify access.</h1><p>Answer all five configured security questions.</p></div></section><form class="panel join-panel account-form" data-form="admin-answers">${adminChallenge.questions.map((question, index) => `<div class="field"><label for="admin-answer-${index}">${esc(question)}</label><input class="input" id="admin-answer-${index}" name="answer" maxlength="180" autocomplete="off" required></div>`).join('')}<button class="btn" type="submit">Unlock dashboard</button></form>`;
  return `<section class="intro"><div class="intro-copy"><div class="eyebrow">Restricted admin</div><h1>Private access.</h1><p>Enter the deployment-configured 15-digit admin key.</p></div><div class="night-stamp" aria-hidden="true">✧</div></section><form class="panel join-panel account-form" data-form="admin-key"><div class="field"><label for="admin-key">15-DIGIT ADMIN KEY</label><input class="input" id="admin-key" name="key" inputmode="numeric" pattern="[0-9]{15}" maxlength="15" autocomplete="off" required></div><button class="btn" type="submit">Continue →</button></form>`;
}
function joinIdentityForm() {
  const reserved = (room?.players || roomPreview?.players || []).map((player) => player.icon);
  return `<p>Room <strong>${esc(pendingCode)}</strong>. Choose your name and an available icon, or rejoin yourself with a saved player key.</p><form data-form="join-player"><div class="field"><label for="player-name">YOUR NAME</label><input class="input" id="player-name" name="name" maxlength="18" placeholder="Name" autocomplete="nickname" required></div><div class="field" style="margin-top:10px"><label for="player-key">PLAYER KEY (optional)</label><input class="input" id="player-key" name="playerKey" maxlength="20" placeholder="AB12CD34" autocomplete="off"></div><div class="field" style="margin-top:13px"><span class="field-label">CHOOSE AN ICON</span><div class="icon-categories">${renderIconCategories(reserved)}</div><input type="hidden" name="icon" value=""></div><div class="action-footer"><button type="button" class="btn btn-quiet" data-action="back-home">Back</button><button class="btn" type="submit">Join room →</button></div></form>`;
}
function renderIconCategories(reserved = [], current = '') {
  return ICON_CATEGORIES.map((category, index) => {
    const icons = category.icons.filter((icon) => !account || account.icons.includes(icon));
    if (!icons.length) return '';
    return `<details class="icon-category" ${index === 0 ? 'open' : ''}><summary>${category.name}</summary><div class="choice-grid icon-grid">${icons.map((icon) => `<button type="button" class="choice-btn ${icon === current ? 'selected' : ''}" data-action="choose-icon" data-icon="${icon}" ${reserved.includes(icon) && icon !== current ? 'disabled' : ''} aria-label="Choose ${icon}">${icon}${reserved.includes(icon) && icon !== current ? ' In use' : ''}</button>`).join('')}</div></details>`;
  }).join('');
}
function playerList() {
  if (!room.players.length) return '<div class="empty">No players yet. Copy the invite link to bring your village together.</div>';
  return `<div class="player-list">${room.players.map((player) => `<div class="player-row"><span class="player-icon">${player.icon}</span><span class="player-name">${esc(player.name)}</span>${player.isBot ? `<span class="ai-beta-badge" title="AI player beta"><span aria-hidden="true">β</span> AI BETA</span>${room.viewer.kind === 'host' ? `<span class="host-tag">${esc(player.aiCode || 'AI')}</span>` : ''}` : ''}${room.viewer.kind === 'host' && player.rejoinKey ? `<span class="host-tag">${esc(player.rejoinKey)}</span>` : ''}${player.shielded ? '<span class="shield-tag" title="Sentinel shield">🛡</span>' : ''}${player.artifact ? '<span class="artifact-tag" title="Has a hidden artifact">✦</span>' : ''}<span class="connection-dot ${player.connected ? 'online' : ''}" title="${player.isBot ? 'AI player' : player.connected ? 'Online' : 'Offline'}"></span><span class="connection-status ${player.isBot ? 'ai' : player.connected ? 'online' : 'offline'}">${player.isBot ? 'AI' : player.connected ? 'Online' : 'Offline'}</span>${player.ready ? '<span class="host-tag">Ready</span>' : ''}${player.voted ? '<span class="host-tag">Voted</span>' : ''}${room.viewer.kind === 'host' && room.stage === 'lobby' ? player.isBot ? `<button class="kick-btn" data-action="remove-bot" data-id="${esc(player.id)}" aria-label="Remove AI ${esc(player.name)}" title="Remove AI player">×</button>` : `<button class="kick-btn" data-action="kick-player" data-id="${esc(player.id)}" aria-label="Remove ${esc(player.name)}" title="Remove player">×</button>` : ''}</div>`).join('')}</div>`;
}
function renderBotIconSelect(bot) {
  const reservedIcons = room.players.filter((player) => player.id !== bot.id).map((player) => player.icon);
  const options = ICON_CATEGORIES.map((category) => `<optgroup label="${category.name}">${category.icons.map((icon) => `<option value="${esc(icon)}" ${icon === bot.icon ? 'selected' : ''} ${reservedIcons.includes(icon) ? 'disabled' : ''}>${esc(icon)}</option>`).join('')}</optgroup>`).join('');
  return `<select class="bot-setting" data-bot-icon data-player-id="${esc(bot.id)}" aria-label="Icon for AI ${esc(bot.name)}">${options}</select>`;
}
function renderBotControls() {
  if (room.viewer.kind !== 'host' || room.stage !== 'lobby') return '';
  const bots = room.players.filter((player) => player.isBot);
  if (!bots.length) return '';
  const options = (values, current, playerId, setting) => `<select class="bot-setting" data-bot-setting data-player-id="${esc(playerId)}" data-setting="${setting}" aria-label="${esc(setting)} for AI player">${values.map((value) => `<option value="${value}" ${current === value ? 'selected' : ''}>${value}</option>`).join('')}</select>`;
  return `<div class="bot-settings"><h3>AI settings</h3>${bots.map((bot) => `<div class="bot-settings-row"><div class="bot-settings-identity"><strong>${esc(bot.name)}</strong><span class="host-tag">${esc(bot.aiCode || 'AI')}</span></div>${renderBotIconSelect(bot)}${options(['Friendly', 'Analytical', 'Bold', 'Quiet'], bot.botSettings?.personality || 'Friendly', bot.id, 'personality')}${options(['Casual', 'Balanced', 'Sharp'], bot.botSettings?.difficulty || 'Balanced', bot.id, 'difficulty')}${options(['Quiet', 'Balanced', 'Chatty'], bot.botSettings?.talkativeness || 'Balanced', bot.id, 'talkativeness')}</div>`).join('')}</div>`;
}
function renderChat() {
  const settings = room.chatSettings || { publicEnabled: true, whispersEnabled: true };
  const ownId = room.viewer.kind === 'player' ? room.viewer.playerId : null;
  const botsPresent = room.players.some((player) => player.isBot);
  const whisperTargets = room.players.filter((player) => player.id !== ownId && !player.isBot);
  const messages = room.chat || [];
  const messageMarkup = messages.map((message) => {
    const whisper = message.scope === 'whisper';
    const sender = room.players.find((player) => player.id === message.fromId);
    const recipient = whisper ? room.players.find((player) => player.id === message.toId) : null;
    const label = whisper ? room.viewer.kind === 'host'
      ? `Whisper · ${sender?.name || message.fromName} → ${recipient?.name || 'player'}`
      : `Whisper ${message.fromId === ownId ? 'to' : 'from'} ${(message.fromId === ownId ? recipient : sender)?.name || 'AI player'}` : 'Everyone';
    const removeButton = room.viewer.kind === 'host' ? `<button class="btn btn-quiet" data-action="chat-remove" data-id="${esc(message.id)}" aria-label="Remove chat message">Remove</button>` : '';
    const botBadge = message.isBot ? '<span class="ai-beta-badge" title="AI player beta"><span aria-hidden="true">β</span> AI BETA</span>' : '';
    return `<div class="chat-message ${whisper ? 'whisper' : ''} ${message.isBot ? 'bot-message' : ''}"><div class="chat-message-meta"><strong>${esc(message.fromName)}</strong>${botBadge}<span>${label}</span><time>${new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>${removeButton}</div><p>${esc(message.text)}</p></div>`;
  }).join('');
  const publicControl = botsPresent
    ? '<span>Public chat required for AI</span>'
    : `<span>Public chat ${settings.publicEnabled ? 'on' : 'off'}</span><button class="btn btn-quiet" data-action="chat-toggle" data-setting="publicEnabled">${settings.publicEnabled ? 'Disable' : 'Enable'}</button>`;
  const hostControls = room.viewer.kind === 'host' ? `<div class="chat-moderation">${publicControl}<span>Whispers ${settings.whispersEnabled ? 'on' : 'off'}</span><button class="btn btn-quiet" data-action="chat-toggle" data-setting="whispersEnabled">${settings.whispersEnabled ? 'Disable' : 'Enable'}</button></div>` : '';
  const canSendPublic = settings.publicEnabled;
  const canWhisper = room.viewer.kind === 'player' && settings.whispersEnabled && whisperTargets.length > 0;
  if (chatScope === 'whisper' && !canWhisper) chatScope = canSendPublic ? 'public' : 'whisper';
  if (!canSendPublic && canWhisper) chatScope = 'whisper';
  if (canWhisper && !whisperTargets.some((player) => player.id === chatTargetId)) chatTargetId = whisperTargets[0].id;
  const composer = canSendPublic || canWhisper ? `<form class="chat-form" data-form="chat"><select name="scope" id="chat-scope" aria-label="Message audience" ${!canWhisper ? 'disabled' : ''}><option value="public" ${chatScope === 'public' ? 'selected' : ''} ${!canSendPublic ? 'disabled' : ''}>Everyone</option>${canWhisper ? `<option value="whisper" ${chatScope === 'whisper' ? 'selected' : ''}>Whisper</option>` : ''}</select>${canWhisper ? `<select name="targetId" id="chat-target" aria-label="Whisper recipient" ${chatScope !== 'whisper' ? 'hidden' : ''}>${whisperTargets.map((player) => `<option value="${esc(player.id)}" ${chatTargetId === player.id ? 'selected' : ''}>${esc(player.name)}</option>`).join('')}</select>` : ''}<textarea id="chat-message" name="text" maxlength="240" rows="2" placeholder="${chatScope === 'whisper' ? 'Write a private message…' : 'Write a message…'}" required></textarea><button class="btn" type="submit" ${!chatDraft.trim() ? 'disabled' : ''}>Send</button></form>` : `<p class="chat-disabled">Chat and whispers are disabled by the moderator.</p>`;
  return `<section class="chat-panel panel"><div class="section-head"><div class="chat-title"><h2>Chat</h2>${botsPresent ? '<span class="ai-beta-badge" title="AI chat beta"><span aria-hidden="true">β</span> AI BETA</span>' : ''}</div><span class="count-label">${messages.length} / 60</span></div>${hostControls}<div class="chat-log" id="chat-log">${messageMarkup || '<div class="empty">No messages yet.</div>'}</div>${composer}</section>`;
}
function renderArtifactPool() {
  if (room.roles.Curator < 1) return '';
  const selected = room.artifactPool || [];
  return `<form class="artifact-picker" data-form="artifact-pool"><div class="section-head"><h3>Curator artifact pool</h3><span class="count-label">${selected.length} selected</span></div><p class="deck-help">Choose at least three available artifacts. Unavailable role artifacts are locked.</p><div class="artifact-grid">${ARTIFACTS.map(([name, icon, available]) => `<label class="artifact-choice ${available ? '' : 'unavailable'}"><input type="checkbox" name="artifact" value="${esc(name)}" ${selected.includes(name) ? 'checked' : ''} ${available ? '' : 'disabled'}><span>${icon}</span><span>${name}${available ? '' : '<small>Unavailable</small>'}</span></label>`).join('')}</div><button class="btn btn-quiet" type="submit">Save artifact pool</button></form>`;
}
function renderLobby() {
  if (room.viewer.kind !== 'host') {
    const own = room.players.find((player) => player.id === room.viewer.playerId);
    const reserved = room.players.filter((player) => player.id !== room.viewer.playerId).map((player) => player.icon);
    return `<div class="room-head"><div><div class="eyebrow">Room lobby</div><h1>You’re in.</h1><p>Waiting for the moderator to set the roles and deal the cards.</p></div><div class="code-box"><div><small>Room code</small><strong>${room.code}</strong></div></div></div><section class="section-panel panel"><div class="section-head"><h2>Players</h2><span class="count-label">${room.players.length} / 12</span></div>${playerList()}<div class="action-footer"><span class="note">Your icon</span><button class="btn btn-quiet" data-action="toggle-icon-picker">${own?.icon || ''} Change icon</button></div>${changingIcon ? `<form class="action-box" data-form="change-icon"><div class="field"><span class="field-label">CHOOSE AN AVAILABLE ICON</span><div class="icon-categories">${renderIconCategories(reserved, own?.icon)}</div><input type="hidden" name="icon" value="${own?.icon || ''}"></div><div class="action-footer"><button class="btn btn-quiet" type="button" data-action="toggle-icon-picker">Cancel</button><button class="btn" type="submit">Save icon</button></div></form>` : ''}<div class="lobby-foot">You’ll play on this device. Your role and night information are private.</div></section>`;
  }
  const valid = room.host.totalCards === room.host.cardsNeeded && room.host.playerCount >= 3;
  return `<div class="room-head"><div><div class="eyebrow">Moderator lobby · You are not a player</div><h1>Build your village.</h1><p>${room.host.cardsNeeded - 3} players · choose exactly ${room.host.cardsNeeded} cards, including three center cards.</p></div><div class="code-box"><div><small>Join code</small><strong>${room.code}</strong></div><button class="btn btn-quiet" data-action="copy-link" aria-label="Copy invite link">▣</button></div></div><div class="room-layout"><section class="section-panel panel"><div class="section-head"><h2>Players</h2><span class="count-label">${room.players.length} / 12</span></div>${playerList()}<button class="btn btn-quiet" style="margin-top:15px;width:100%" data-action="copy-link">Copy invite link</button><div class="lobby-foot">Players join from their own devices. Your moderator screen never receives a player card.</div></section><aside class="deck-panel panel"><div class="eyebrow">The cards</div><h2>Choose your roles.</h2><p class="deck-help">One card per player, plus three in the center.</p><div class="deck-total"><span>Cards selected</span><strong>${room.host.totalCards} / ${room.host.cardsNeeded}</strong></div><div class="role-list">${ROLES.map(([name, color]) => `<div class="role-row"><span class="role-title"><i class="role-dot" style="--role-color:${color}"></i>${name}</span><button data-action="role-change" data-role="${name}" data-delta="-1" aria-label="Remove ${name}">−</button><span class="role-qty">${room.roles[name]}</span><button data-action="role-change" data-role="${name}" data-delta="1" aria-label="Add ${name}">+</button></div>`).join('')}</div><div class="deck-status ${valid ? '' : 'invalid'}">${valid ? 'Deck is ready to deal.' : room.host.totalCards < room.host.cardsNeeded ? `${room.host.cardsNeeded - room.host.totalCards} more cards needed.` : room.host.totalCards > room.host.cardsNeeded ? 'Remove cards to match the player count.' : 'At least 3 players are needed.'}</div><div class="room-actions"><button class="btn" data-action="start-game" ${valid ? '' : 'disabled'}>Deal the cards →</button><button class="btn btn-quiet" data-action="leave">Leave room</button></div></aside></div>`;
  return `<div class="room-head"><div><div class="eyebrow">Moderator lobby · You are not a player</div><h1>Build your village.</h1><p>${room.host.cardsNeeded - 3} players · choose exactly ${room.host.cardsNeeded} cards, including three center cards.</p></div><div class="code-box"><div><small>Room code</small><strong>${room.code}</strong></div><button class="btn btn-quiet" data-action="copy-link" aria-label="Copy invite link">▣</button></div></div><div class="room-layout"><section class="section-panel panel"><div class="section-head"><h2>Players</h2><span class="count-label">${room.players.length} / 12</span></div>${playerList()}<button class="btn btn-quiet" style="margin-top:15px;width:100%" data-action="copy-link">Copy invite link</button><div class="lobby-foot">Players join from their own devices. Your moderator screen never receives a player card.</div></section><aside class="deck-panel panel"><div class="eyebrow">The cards</div><h2>Choose your roles.</h2><p class="deck-help">One card per player, plus three in the center. The deck order is the night action order.</p><div class="deck-total"><span>Cards selected</span><strong>${room.host.totalCards} / ${room.host.cardsNeeded}</strong></div><div class="role-list">${ROLES.map(([name, color, icon]) => `<div class="role-row"><span class="role-title"><i class="role-dot" style="--role-color:${color}"></i><span>${icon}</span>${name}</span><button data-action="role-change" data-role="${name}" data-delta="-1" aria-label="Remove ${name}">−</button><span class="role-qty">${room.roles[name]}</span><button data-action="role-change" data-role="${name}" data-delta="1" aria-label="Add ${name}">+</button></div>`).join('')}</div>${renderArtifactPool()}<div class="deck-status ${valid ? '' : 'invalid'}">${valid ? 'Deck is ready to deal.' : room.host.totalCards < room.host.cardsNeeded ? `${room.host.cardsNeeded - room.host.totalCards} more cards needed.` : room.host.totalCards > room.host.cardsNeeded ? 'Remove cards to match the player count.' : 'At least 3 players are needed.'}</div><div class="room-actions"><button class="btn" data-action="start-game" ${valid ? '' : 'disabled'}>Deal the cards →</button><button class="btn btn-quiet" data-action="leave">Leave room</button></div></aside></div>`;
}
function phaseIndex() {
  return ({ lobby: -1, roles: 1, sentinel: 2, setup: 3, dusk: 4, mark: 5, night: 6, information: 7, discussion: 8, voting: 9, results: 10 })[room.stage] ?? 0;
}
function phaseBar() {
  const current = phaseIndex();
  const omitMarks = room.duskUsed === false && ['night', 'information', 'discussion', 'voting', 'results'].includes(room.stage);
  const phases = omitMarks ? PHASES.filter((label) => !['Dusk', 'Mark'].includes(label)) : PHASES;
  const visibleIndex = phases.findIndex((label) => label === PHASES[current]);
  return `<div class="phase-bar">${phases.map((label, index) => `<div class="phase-item ${index === visibleIndex ? 'active' : index < visibleIndex ? 'done' : ''}"><span class="phase-n">0${index + 1}</span>${label}</div>`).join('')}</div>`;
}
function playerChoices(excluded = [], amount = 1, event = 'select-player', excludeShielded = false) {
  return `<div class="choice-grid" style="margin-top:13px">${room.players.filter((player) => !excluded.includes(player.id)).map((player) => `<button class="choice-btn ${selectedIds.includes(player.id) ? 'selected' : ''}" data-action="${event}" data-id="${player.id}" ${player.shielded && excludeShielded ? 'disabled' : ''}><span class="player-icon">${player.icon}</span>${esc(player.name)}${player.shielded ? ' 🛡' : ''}</button>`).join('')}</div>`;
}
function centerChoices(amount = 1) {
  return `<div class="center-cards">${[0, 1, 2].map((index) => `<button class="center-card ${selectedCenter.includes(index) ? 'selected' : ''}" data-action="select-center" data-index="${index}">CENTER ${index + 1}</button>`).join('')}</div>`;
}
function renderRoleReveal() {
  if (room.viewer.kind !== 'player') return `<div class="eyebrow">Phase 01 · Role reveal</div><h2>Players are checking their cards.</h2><p>${room.host.roleReadyCount} of ${room.players.length} players are ready. The moderator cannot see anyone’s role.</p>${playerList()}`;
  const own = room.own;
  const role = ROLES.find(([name]) => name === own.startCard) || ROLES.at(-1);
  const ready = room.players.find((player) => player.id === room.viewer.playerId)?.ready;
  return `<div class="role-reveal"><div class="eyebrow">Phase 01 · Your private role</div><div class="role-glyph" style="--role-color:${role[1]}">${role[2]}</div><div class="role-name">${esc(role[0])}</div><p class="role-description">${esc(role[3])}</p>${ready ? '<div class="role-ready-state">✓ Role locked · Waiting for the village</div>' : '<p class="muted-small">Only you can see this card. Look carefully, then hide it.</p><button class="btn" data-action="role-ready">Hide role & continue →</button>'}</div>`;
}
function renderSentinel() {
  if (room.viewer.kind === 'host') return `<div class="eyebrow">Phase 02 · Setup</div><h2>The Sentinel is placing a shield.</h2><p>${room.host.sentinelDone} of ${room.roles.Sentinel} Sentinel choices complete. Shielded seats are marked below without exposing roles.</p>${playerList()}`;
  const own = room.own;
  if (own.startCard !== 'Sentinel') return `<div class="eyebrow">Phase 02 · Setup</div><h2>Sentinel setup.</h2><p>The Sentinel is choosing a card to protect. Your role stays private.</p>${playerList()}`;
  if (own.shieldTarget) return `<div class="eyebrow">Phase 02 · Setup</div><h2>Shield placed.</h2><div class="result-banner"><span style="font-size:25px">🛡</span><div><strong>${esc(room.players.find((player) => player.id === own.shieldTarget)?.name || 'Player')} is protected</strong><span>Waiting for the other Sentinels, if any.</span></div></div>`;
  return `<div class="eyebrow">Phase 02 · Setup</div><h2>Place your shield.</h2><p>Choose one player whose card cannot be viewed or switched tonight. Their card will be marked as protected.</p><div class="result-banner role-private"><span style="font-size:26px">🛡</span><div><strong>Your role: Sentinel</strong><span>Choose any player, including yourself.</span></div></div>${playerChoices([], 1, 'select-shield')}<div class="action-footer"><span class="note">The shield is visible; the protected role is not.</span><button class="btn" data-action="submit-shield" ${!selectedIds.length ? 'disabled' : ''}>Place shield →</button></div>`;
}
function renderSetup() {
  if (room.viewer.kind !== 'player') return `<div class="eyebrow">Phase 03 · Setup</div><h2>Players are choosing.</h2><p>${room.setupIndex} of ${room.setupCount} setup choices locked. Player roles are private, including from the moderator.</p>${playerList()}`;
  const own = room.own;
  const action = room.action;
  if (action?.questionOnly) return `<div class="eyebrow">Phase 03 · Setup</div><h2>A question while others set up.</h2><p>Because you don't have a Setup role, here is a question to keep you occupied.</p><div class="question-prompt">${esc(room.question)}</div>${playerChoices([room.viewer.playerId], 1, 'phase-question-select')}<div class="action-footer"><span class="note">Your answer stays private.</span><button class="btn" data-action="submit-phase-question" data-phase="setup" ${!selectedIds.length ? 'disabled' : ''}>Submit answer →</button></div>`;
  if (action?.submitted) return `<div class="eyebrow">Phase 03 · Setup</div><h2>Choice locked.</h2><p>Your setup choice is private while the others finish.</p>`;
  const active = !own.setupTarget;
  const doppel = own.startCard === 'Doppelganger';
  const copycat = own.startCard === 'Copycat';
  if (!doppel && !copycat) return `<div class="eyebrow">Phase 03 · Setup</div><h2>Copycat setup.</h2><p>A Copycat is choosing a center card. Your role stays private.</p><div class="result-banner role-private"><span style="font-size:26px">✦</span><div><strong>Your card: ${esc(own.card)}</strong><span>Only you can see this.</span></div></div>`;
  const selected = active ? copycat ? centerChoices(1) : playerChoices([room.viewer.playerId], 1, 'select-player', true) : `<p class="note">Your choice is locked in.</p>`;
  return `<div class="eyebrow">Phase 03 · Setup</div><h2>${copycat ? 'Choose a center card to copy.' : 'Choose a player to copy.'}</h2><p>${copycat ? 'Look at one center card. You become that role and act in its normal phase.' : 'Look at one player’s card. You become that role and act in its normal phase.'}</p><div class="result-banner role-private"><span style="font-size:26px">✦</span><div><strong>Your card: ${esc(own.card)}</strong><span>${own.effectiveRole ? `Copied role: ${esc(own.effectiveRole)}` : 'Only you can see this.'}</span></div></div><div class="action-box"><h3>${active ? 'Your choice' : 'Locked in'}</h3>${selected}<div class="action-footer"><span class="note">Your copied role stays private.</span>${active ? `<button class="btn" data-action="${copycat ? 'submit-copycat' : 'submit-setup'}" ${(copycat ? selectedCenter.length !== 1 : selectedIds.length !== 1) ? 'disabled' : ''}>Lock choice →</button>` : ''}</div></div>`;
}
function renderDusk() {
  const action = room.action;
  if (room.viewer.kind === 'host') return `<div class="eyebrow">Phase 04 · Dusk</div><h2>Dusk marks are being placed.</h2><p>Roles resolve in order. Mark choices stay hidden until each player sees their own mark.</p>${playerList()}`;
  if (!action?.role) return `<div class="eyebrow">Phase 04 · Dusk</div><h2>Dusk actions are underway.</h2><p>Your card stays private while the Dusk actions finish.</p>`;
  if (action.submitted) return `<div class="eyebrow">Phase 04 · Dusk</div><h2>Action locked.</h2><p>Your choice is private. Dusk actions resolve in role order.</p><div class="result-banner"><span>✓</span><div><strong>${esc(action.copied ? `Copycat → ${action.role}` : action.role)}</strong><span>Waiting for the other Dusk actions.</span></div></div>`;
  if (action.questionOnly) return `<div class="eyebrow">Phase 04 · Dusk</div><h2>A question while marks are placed.</h2><p>Because you don't have a Dusk role, here is a question to keep you occupied.</p><div class="question-prompt">${esc(room.duskQuestion)}</div>${playerChoices([room.viewer.playerId], 1, 'phase-question-select')}<div class="action-footer"><span class="note">Your answer stays private.</span><button class="btn" data-action="submit-phase-question" data-phase="dusk" ${!selectedIds.length ? 'disabled' : ''}>Submit answer →</button></div>`;
  let choices = '';
  let title = '';
  if (action.role === 'Vampire') {
    title = 'Choose one non-vampire for Mark of Vampire.';
    choices = playerChoices([], 1, 'dusk-select');
  } else if (action.role === 'Count' || action.role === 'Instigator' || action.role === 'Assassin') {
    title = action.role === 'Count' ? 'Place Mark of Fear on one player.' : action.role === 'Instigator' ? 'Place Mark of Traitor on one player.' : 'Place Mark of Assassin on one player.';
    choices = playerChoices([], 1, 'dusk-select');
  } else if (action.role === 'Diseased') {
    const position = room.players.findIndex((player) => player.id === room.viewer.playerId);
    const neighbors = [room.players[(position + 1) % room.players.length], room.players[(position + room.players.length - 1) % room.players.length]];
    title = 'Place Mark of Disease on your left or right neighbor.';
    choices = `<div class="choice-grid">${neighbors.map((player) => `<button class="choice-btn ${selectedIds.includes(player.id) ? 'selected' : ''}" data-action="dusk-select" data-id="${player.id}"><span class="player-icon">${player.icon}</span>${esc(player.name)}</button>`).join('')}</div>`;
  } else if (action.role === 'Cupid') {
    title = 'Choose two players to receive Mark of Love.';
    choices = `<div class="choice-grid">${room.players.map((player) => `<button class="choice-btn ${selectedIds.includes(player.id) ? 'selected' : ''}" data-action="dusk-select" data-id="${player.id}" data-max="2"><span class="player-icon">${player.icon}</span>${esc(player.name)}</button>`).join('')}</div>`;
  } else if (action.role === 'Priest') {
    title = 'Mark yourself and one other player with Clarity.';
    choices = playerChoices([room.viewer.playerId], 1, 'dusk-select');
  } else {
    title = 'See the vampire team and the Vampire mark, then take Mark of the Bat.';
  }
  return `<div class="eyebrow">Phase 04 · Dusk</div><h2>${esc(action.copied ? `Copycat → ${action.role}` : action.role)}.</h2><p>${esc(title)}</p><div class="action-box"><h3>${esc(action.role)} action</h3>${choices}<div class="action-footer"><span class="note">${action.shared ? 'Vampires act together. Only one mark is placed.' : 'Your mark is private until the Mark phase.'}</span><button class="btn" data-action="submit-dusk" ${action.role === 'Renfield' ? '' : action.role === 'Cupid' ? selectedIds.length !== 2 ? 'disabled' : '' : !selectedIds.length ? 'disabled' : ''}>${action.role === 'Renfield' ? 'Confirm' : 'Place mark'} →</button></div></div>`;
}
function renderMark() {
  if (room.viewer.kind === 'host') return `<div class="eyebrow">Phase 05 · Mark</div><h2>Players are checking their marks.</h2><p>${room.markDone} of ${room.markCount} players are ready. Marks remain private to their holder.</p>${playerList()}`;
  const own = room.own;
  const mark = own.mark || 'Clarity';
  const lover = own.lovers?.[0];
  return `<div class="eyebrow">Phase 05 · Mark</div><h2>Your mark is ${esc(mark)}.</h2><p>You see your mark, not your role card. Keep it private, then hide it before Night.</p><div class="result-banner role-private"><span style="font-size:26px">${mark === 'Love' ? '♡' : mark === 'Vampire' ? '🦇' : mark === 'Fear' ? '☽' : '✦'}</span><div><strong>Mark of ${esc(mark)}</strong><span>${mark === 'Bat' ? 'You are not a vampire, but you are on the vampire team.' : mark === 'Love' ? lover ? `Your lover is ${lover.icon} ${esc(lover.name)}.` : 'Your lover will be revealed here.' : 'Only you can see this mark.'}</span></div></div>${lover ? `<div class="info-banner"><strong>Your lover</strong><span>${lover.icon} ${esc(lover.name)}</span></div>` : ''}<div class="action-footer"><span class="note">${room.markDone} of ${room.markCount} players ready</span><button class="btn" data-action="mark-done">Hide mark & continue →</button></div>`;
}
function renderNight() {
  const action = room.action;
  if (room.viewer.kind === 'host') return `<div class="eyebrow">Phase 06 · Moderator</div><h2>Night actions are underway.</h2><p>Everyone acts at once on their own device. The server resolves actions in role order once all players are ready.</p>${playerList()}`;
  if (!action) return `<div class="eyebrow">Phase 06 · Night</div><h2>Night actions are underway.</h2><p>Your card stays private while the Night actions finish.</p>`;
  if (action.submitted) return `<div class="eyebrow">Phase 06 · Night</div><h2>Action locked.</h2><p>Your choice is private. The server resolves actions in role order after the whole village is ready.</p><div class="result-banner"><span style="font-size:25px">✓</span><div><strong>${esc(action.copied ? `${room.own.startCard} → ${action.role}` : action.role)}</strong><span>Your action is locked.</span></div></div>`;
  const role = action.role;
  if (action.questionOnly) return `<div class="eyebrow">Phase 06 · Night</div><h2>A question while the village sleeps.</h2><p>Because you don't have a Night role, here is a question to keep you occupied.</p><div class="question-prompt">${esc(room.nightQuestion)}</div>${playerChoices([room.viewer.playerId], 1, 'night-answer')}<div class="action-footer"><span class="note">Your answer stays private.</span><button class="btn" data-action="submit-night-answer" ${!selectedIds.length ? 'disabled' : ''}>Submit answer →</button></div>`;
  let controls = '';
  let intro = '';
  if (action.requiresQuestion) {
    intro = `<div class="action-box"><h3>Night question</h3><div class="question-prompt">${esc(room.nightQuestion)}</div>${['Werewolf', 'Dream Wolf'].includes(role) ? `<div class="empty" style="margin-top:10px">The wolf pack: ${(action.targets || []).map((player) => `${player.icon} ${esc(player.name)}${player.dream ? ' · Dream Wolf' : ''}`).join(' · ') || 'No other wolves are awake with you.'}</div>` : ''}${playerChoices([room.viewer.playerId], 1, 'night-answer')}<div class="action-footer"><span class="note">Everyone acts at once. Lock your answer privately.</span><button class="btn" data-action="submit-night-answer" ${!selectedIds.length ? 'disabled' : ''}>Lock answer →</button></div></div>`;
    controls = `<div class="empty">${role === 'Minion' ? 'You will see the werewolves in your information.' : role === 'Mason' ? 'You will see the other Masons in your information.' : 'No role action tonight.'}</div>`;
  } else if (role === 'Werewolf') {
    const wolves = action.targets || [];
    intro = `<div class="empty">You are alone. Choose one center card to look at.</div>`;
    controls = `${centerChoices(1)}<div class="action-footer"><span class="note">The order is the same for everyone.</span><button class="btn" data-action="night-action" data-role="Werewolf" ${selectedCenter.length !== 1 ? 'disabled' : ''}>Look at card →</button></div>`;
  } else if (role === 'Seer') {
    intro = `<div class="button-row"><button class="btn btn-quiet" data-action="seer-mode" data-mode="player">One player</button><button class="btn btn-quiet" data-action="seer-mode" data-mode="center">Two center cards</button></div>`;
    controls = seerMode === 'player' ? `${playerChoices([room.viewer.playerId], 1, 'select-player', true)}<div class="action-footer"><span class="note">Look at one unshielded player’s card.</span><button class="btn" data-action="night-action" data-role="Seer" ${selectedIds.length !== 1 ? 'disabled' : ''}>Look at card →</button></div>` : `${centerChoices(2)}<div class="action-footer"><span class="note">Choose two different cards.</span><button class="btn" data-action="night-action" data-role="Seer" ${selectedCenter.length !== 2 ? 'disabled' : ''}>Look at cards →</button></div>`;
  } else if (role === 'Mystic Wolf' || role === 'Alpha Wolf') {
    intro = `<div class="empty">The wolf pack: ${(action.targets || []).map((player) => `${player.icon} ${esc(player.name)}${player.dream ? ' · Dream Wolf' : ''}`).join(' · ') || 'No other wolves are awake with you.'}</div><p>${role === 'Mystic Wolf' ? 'Choose an unshielded player, including another wolf, to inspect.' : 'Choose an unshielded player to exchange with the hidden Wolf card.'}</p>`;
    controls = `${playerChoices([room.viewer.playerId], 1, 'select-player', true)}<div class="action-footer"><button class="btn" data-action="night-action" data-role="${role}" ${!selectedIds.length ? 'disabled' : ''}>${role === 'Mystic Wolf' ? 'Look at card →' : 'Exchange card →'}</button></div>`;
  } else if (role === 'Apprentice Seer') {
    intro = '<p>Choose one of the three center cards.</p>';
    controls = `${centerChoices(1)}<div class="action-footer"><button class="btn" data-action="night-action" data-role="Apprentice Seer" ${selectedCenter.length !== 1 ? 'disabled' : ''}>Look at card →</button></div>`;
  } else if (role === 'Pickpocket') {
    intro = '<p>Optionally swap your mark with another player’s mark. You will see your new mark during Information.</p>';
    controls = `${playerChoices([room.viewer.playerId], 1, 'select-player')}<div class="action-footer"><button class="btn btn-quiet" data-action="night-action" data-role="Pickpocket" data-pass="true">Do nothing</button><button class="btn" data-action="night-action" data-role="Pickpocket" ${selectedIds.length !== 1 ? 'disabled' : ''}>Swap marks →</button></div>`;
  } else if (role === 'Gremlin') {
    intro = '<p>Choose two other players, then switch either their marks or their cards. Cards protected by the Sentinel cannot be switched.</p>';
    controls = `<div class="button-row"><button class="btn ${gremlinMode === 'marks' ? '' : 'btn-quiet'}" data-action="gremlin-mode" data-mode="marks">Marks</button><button class="btn ${gremlinMode === 'cards' ? '' : 'btn-quiet'}" data-action="gremlin-mode" data-mode="cards">Cards</button></div>${playerChoices([room.viewer.playerId], 2, 'select-player', gremlinMode === 'cards')}<div class="action-footer"><button class="btn" data-action="night-action" data-role="Gremlin" ${selectedIds.length !== 2 ? 'disabled' : ''}>Switch ${gremlinMode} →</button></div>`;
  } else if (role === 'Robber') {
    intro = '<p>Optionally swap your card with an unshielded player. You will see the new card you took.</p>';
    controls = `${playerChoices([room.viewer.playerId], 1, 'select-player', true)}<div class="action-footer"><button class="btn btn-quiet" data-action="night-action" data-role="Robber" data-pass="true">Do nothing</button><button class="btn" data-action="night-action" data-role="Robber" ${selectedIds.length !== 1 ? 'disabled' : ''}>Swap cards →</button></div>`;
  } else if (role === 'Witch') {
    intro = '<p>Optionally look at a center card and exchange it with an unshielded player card. You may target yourself only if you are not shielded.</p>';
    controls = `${centerChoices(1)}${playerChoices([], 1, 'select-player', true)}<div class="action-footer"><button class="btn btn-quiet" data-action="night-action" data-role="Witch" data-pass="true">Do nothing</button><button class="btn" data-action="night-action" data-role="Witch" ${selectedCenter.length !== 1 || selectedIds.length !== 1 ? 'disabled' : ''}>Exchange cards →</button></div>`;
  } else if (role === 'Paranormal Investigator') {
    const available = room.players.filter((player) => player.id !== room.viewer.playerId && !player.shielded).length;
    intro = '<p>Choose two unshielded players in the order you want to inspect them.</p>';
    controls = `${playerChoices([room.viewer.playerId], 2, 'select-player', true)}<div class="action-footer">${available < 2 ? '<span class="note">Not enough unshielded targets.</span><button class="btn btn-quiet" data-action="night-action" data-role="Paranormal Investigator" data-pass="true">Pass</button>' : `<button class="btn" data-action="night-action" data-role="Paranormal Investigator" ${selectedIds.length !== 2 ? 'disabled' : ''}>Investigate →</button>`}</div>`;
  } else if (role === 'Troublemaker') {
    const available = room.players.filter((player) => player.id !== room.viewer.playerId && !player.shielded).length;
    intro = '<p>Swap two other unshielded players’ cards. You will not see either card.</p>';
    controls = `${playerChoices([room.viewer.playerId], 2, 'select-player', true)}<div class="action-footer"><span class="note">${available < 2 ? 'Not enough unshielded targets.' : 'Choose two different unshielded players.'}</span>${available < 2 ? '<button class="btn btn-quiet" data-action="night-action" data-role="Troublemaker" data-pass="true">Pass</button>' : `<button class="btn" data-action="night-action" data-role="Troublemaker" ${selectedIds.length !== 2 ? 'disabled' : ''}>Swap their cards →</button>`}</div>`;
  } else if (role === 'Village Idiot') {
    intro = '<p>Move every other unshielded player’s card one place around the circle.</p>';
    controls = `<div class="button-row"><button class="btn ${villageDirection === 'left' ? '' : 'btn-quiet'}" data-action="idiot-direction" data-direction="left">← Left</button><button class="btn ${villageDirection === 'right' ? '' : 'btn-quiet'}" data-action="idiot-direction" data-direction="right">Right →</button></div><div class="action-footer"><button class="btn" data-action="night-action" data-role="Village Idiot">Move cards →</button></div>`;
  } else if (role === 'Revealer' || role === 'Curator') {
    intro = role === 'Revealer' ? '<p>Choose one unshielded player. Werewolves and Tanners are privately revealed only to you.</p>' : '<p>Choose one unshielded player to receive a random artifact from the moderator’s pool.</p>';
    controls = `${playerChoices([room.viewer.playerId], 1, 'select-player', true)}<div class="action-footer"><button class="btn" data-action="night-action" data-role="${role}" ${!selectedIds.length ? 'disabled' : ''}>${role === 'Revealer' ? 'Reveal card →' : 'Place artifact →'}</button></div>`;
  } else if (role === 'Drunk') {
    intro = '<p>Swap your card with one center card. You will not see the new role.</p>';
    controls = `${centerChoices(1)}<div class="action-footer"><span class="note">Choose one center card.</span><button class="btn" data-action="night-action" data-role="Drunk" ${selectedCenter.length !== 1 ? 'disabled' : ''}>Swap cards →</button></div>`;
  } else {
    intro = '<p>This role has no night action.</p>';
    controls = '<div class="empty">There is nothing to do. Your role is safe on this device.</div>';
  }
  return `<div class="eyebrow">Phase 06 · Night</div><h2>${esc(action.copied ? `${room.own.startCard} → ${role}` : role)}.</h2><p>${esc(action.copied ? 'You copied this role. Complete its action now.' : 'Complete your private action. Everyone is acting at once.')}</p>${intro}<div class="action-box"><h3>${esc(role)} action</h3>${controls}</div>`;
}
function renderCardViews(cards = []) {
  if (!cards.length) return '';
  return `<div class="observed-cards">${cards.map((card) => {
    const data = ROLES.find(([name]) => name === card.role);
    return `<div class="observed-card" style="--role-color:${data?.[1] || '#67766d'}"><span class="observed-glyph">${data?.[2] || '✦'}</span><strong>${esc(card.role)}</strong><small>${esc(card.name)}</small></div>`;
  }).join('')}</div>`;
}
function artifactGuidance(artifact) {
  return ({
    'Claw of the Werewolf': 'Your artifact changes your vote role to Werewolf.',
    'Brand of the Villager': 'Your artifact makes you a plain Villager and replaces your special vote ability.',
    'Cudgel of the Tanner': 'Your artifact changes your vote role to Tanner.',
    'Mask of Muting': 'Stay silent until after the vote.',
    'Shroud of Shame': 'Face away from the table during discussion.',
    'Void of Nothingness': 'This artifact has no effect.',
    'Bow of the Hunter': 'Your artifact grants the Hunter vote ability.',
    'Sword of the Bodyguard': 'Your vote protects its target from elimination.',
    'Cloak of the Prince': 'Your artifact changes your vote role to Prince.',
    'Mist of the Vampire': 'Unavailable role artifact; no effect in this version.',
    'Dagger of the Traitor': 'Unavailable role artifact; no effect in this version.',
    'Alien Artifact': 'Unavailable role artifact; no effect in this version.',
  })[artifact] || '';
}
function renderPrivateNotes() {
  const notes = room.own?.notes || [];
  const originalRole = room.own?.originalRole;
  if (!notes.length && !originalRole) return '';
  return `<div class="private-notes"><h3>Your private notes</h3><div class="info-list">${originalRole ? `<div class="info-line"><span class="player-icon">✦</span><div><strong>Original role</strong><small>${esc(originalRole)}</small></div></div>` : ''}${notes.map((note) => `<div class="info-line"><span class="player-icon">✦</span><div>${esc(note)}</div></div>`).join('')}</div></div>`;
}
function renderInformation() {
  if (room.viewer.kind !== 'player') return `<div class="eyebrow">Phase 05 · Information</div><h2>Players are checking their notes.</h2><p>${room.informationDone} of ${room.players.length} players are ready. No private notes are sent to the moderator.</p>${room.publicEvents?.length ? `<div class="info-list">${room.publicEvents.map((event) => `<div class="info-line"><span class="player-icon">✦</span><div>${esc(event)}</div></div>`).join('')}</div>` : ''}${playerList()}`;
  const own = room.own;
  const marksman = room.action?.role === 'Marksman' ? `<div class="action-box"><h3>Marksman information</h3><p>Choose different players to inspect one mark and one role.</p><div class="field"><span class="field-label">PLAYER MARK</span>${playerChoices([room.viewer.playerId], 1, 'info-mark-select')}</div><div class="field" style="margin-top:10px"><span class="field-label">PLAYER ROLE</span>${playerChoices([room.viewer.playerId], 1, 'info-role-select')}</div><div class="action-footer"><button class="btn" data-action="information-action" ${!infoMarkTarget || !infoRoleTarget || infoMarkTarget === infoRoleTarget ? 'disabled' : ''}>Inspect both →</button></div></div>` : '';
  const artifact = own.artifact ? `<div class="artifact-reveal"><span>✦</span><div><strong>${esc(own.artifact)}</strong><small>${esc(artifactGuidance(own.artifact))}</small></div></div>` : '';
  const wolfPack = own.wolfPack?.length ? `<div class="info-banner success"><strong>Wolf pack</strong><span>${own.wolfPack.map((player) => `${player.icon} ${esc(player.name)}`).join(' · ')}</span></div>` : '';
  const evidence = own.seenCards?.length ? `<div class="info-banner"><strong>Role evidence</strong><div class="fact-grid">${own.seenCards.map((card) => `<div class="fact-item"><span class="fact-role">${esc(card.role)}</span><small>${esc(card.name)}</small></div>`).join('')}</div></div>` : `<div class="info-banner muted"><strong>Role evidence</strong><span>You did not see any private cards this night.</span></div>`;
  const markEvidence = own.seenMarks?.length ? `<div class="info-banner"><strong>Mark evidence</strong><div class="fact-grid">${own.seenMarks.map((entry) => `<div class="fact-item"><span class="fact-role">Mark of ${esc(entry.mark)}</span><small>${esc(entry.name)}</small></div>`).join('')}</div></div>` : '';
  return `<div class="eyebrow">Phase 07 · Private information</div><h2>What did you learn?</h2><p>${wolfPack ? 'This is the information that matters most to your role.' : 'Your own role card is not shown here. Only private information you actually received appears below.'}</p>${marksman}${wolfPack}${evidence}${markEvidence}${artifact}${renderPrivateNotes()}${room.publicEvents?.length ? `<div class="divider"></div><h3>Public reveals</h3><div class="info-list">${room.publicEvents.map((event) => `<div class="info-line"><span class="player-icon">✦</span><div>${esc(event)}</div></div>`).join('')}</div>` : ''}<div class="divider"></div><h3>Setup question</h3><div class="question-prompt">${esc(room.question)}</div><p class="muted-small" style="margin:8px 0 0">You chose <strong>${esc(room.players.find((p) => p.id === own.setupTarget)?.name || 'No one')}</strong>. ${Math.round(own.setupMatchCount / Math.max(1, room.players.length) * 100)}% of players chose the same person.</p><div class="action-footer"><span class="note">${room.informationDone} of ${room.players.length} ready</span><button class="btn" data-action="information-done" ${room.action?.role === 'Marksman' && !room.action.submitted ? 'disabled' : ''}>Hide my notes →</button></div>`;
}
function renderDiscussion() {
  const mins = String(Math.floor(room.discussionSeconds / 60)).padStart(2, '0');
  const secs = String(room.discussionSeconds % 60).padStart(2, '0');
  if (room.viewer.kind === 'host') return `<div class="eyebrow">Phase 06 · Moderator</div><h2>Give them five minutes.</h2><p>The players have finished checking their private information. Start the timer when discussion begins.</p><div class="discussion-time ${room.discussionSeconds <= 30 ? 'warning' : ''}">${mins}:${secs}</div><div class="meter"><span style="width:${room.discussionSeconds / 300 * 100}%"></span></div><div class="action-footer"><span class="note">${room.timerRunning ? 'Timer running' : 'Timer paused'}</span><div class="button-row"><button class="btn btn-quiet" data-action="timer">${room.timerRunning ? 'Pause timer' : 'Start timer'}</button><button class="btn" data-action="begin-voting">Begin vote →</button></div></div>`;
  const instruction = room.own?.artifact ? `<div class="artifact-instruction"><strong>${esc(room.own.artifact)}</strong><span>${esc(artifactGuidance(room.own.artifact))}</span></div>` : '';
  return `<div class="eyebrow">Phase 06 · Discussion</div><h2>Make your case.</h2><p>Compare notes, bluff, and decide who to vote out. The moderator controls when voting starts.</p>${renderPrivateNotes()}${instruction}<div class="discussion-time ${room.discussionSeconds <= 30 ? 'warning' : ''}">${mins}:${secs}</div><div class="meter"><span style="width:${room.discussionSeconds / 300 * 100}%"></span></div><div class="side-rule">${room.timerRunning ? 'Discussion timer is running.' : 'Waiting for the moderator to start voting.'}</div>`;
}
function renderVoting() {
  if (room.viewer.kind !== 'player') return `<div class="eyebrow">Phase 07 · Voting</div><h2>Votes are sealed.</h2><p>${room.voteDone} of ${room.players.length} players have locked a vote. Your player seat is empty, moderator.</p>${playerList()}`;
  const own = room.own;
  return `<div class="eyebrow">Phase 07 · Vote</div><h2>Point to the wolf.</h2><p>Choose one person. Your vote is private and cannot be changed.</p>${renderPrivateNotes()}${own.voteTarget ? `<div class="result-banner"><span style="font-size:25px">✓</span><div><strong>Vote locked</strong><span>You voted for ${esc(room.players.find((player) => player.id === own.voteTarget)?.name)}.</span></div></div>` : `<div class="vote-target">${room.players.filter((player) => player.id !== room.viewer.playerId).map((player) => `<button class="choice-btn ${selectedIds.includes(player.id) ? 'selected' : ''}" data-action="select-vote" data-id="${player.id}"><span class="player-icon">${player.icon}</span>${esc(player.name)}</button>`).join('')}</div><div class="action-footer"><span class="note">${room.voteDone} of ${room.players.length} votes locked</span><button class="btn" data-action="submit-vote" ${!selectedIds.length ? 'disabled' : ''}>Lock my vote →</button></div>`}`;
}
function renderResults() {
  const results = room.results;
  const myOutcome = room.own?.outcome || 'Unclear';
  return `<div class="eyebrow">Phase 08 · Reveal</div><h2>The village decides.</h2><div class="result-banner"><span style="font-size:25px">${results?.deadIds?.length ? '☠' : '✦'}</span><div><strong>${esc(results?.winner)}</strong><span>${results?.deadIds?.length ? `Voted out: ${room.players.filter((player) => results.deadIds.includes(player.id)).map((player) => player.name).join(', ')}.` : 'No one received enough votes to be eliminated.'}</span></div></div><div class="info-banner success" style="margin-top:18px"><strong>Your outcome</strong><span>${esc(myOutcome)}</span></div><p>Final cards after all swaps.</p><div class="reveal-grid">${room.players.map((player) => `<div class="reveal-card"><div class="reveal-card-top"><span class="player-icon">${player.icon}</span>${esc(player.name)}${results?.deadIds?.includes(player.id) ? ' · VOTED OUT' : ''}</div><div class="reveal-role"><span>Dealt</span><strong>${esc(player.startCard)}</strong></div>${player.startCard === 'Doppelganger' || player.startCard === 'Copycat' ? `<div class="reveal-role"><span>Copied</span><strong>${esc(player.effectiveRole || player.startCard)}</strong></div>` : ''}<div class="reveal-role"><span>Final card</span><strong>${esc(player.card)}</strong></div>${results?.marksUsed ? `<div class="reveal-role"><span>Final mark</span><strong>${esc(player.mark)}</strong></div>` : ''}${player.artifactName ? `<div class="reveal-role"><span>Artifact</span><strong>${esc(player.artifactName)}</strong></div>` : ''}${player.artifactRole || player.transformedRole ? `<div class="reveal-role"><span>Vote role</span><strong>${esc(player.artifactRole || player.transformedRole)}</strong></div>` : ''}<div class="reveal-role"><span>Outcome</span><strong>${esc(player.outcome || 'Pending')}</strong></div><div class="reveal-role"><span>Votes</span><strong>${results?.voteCounts?.[player.id] || 0}</strong></div></div>`).join('')}</div>${results?.alphaReserves?.length ? `<div class="side-rule">Hidden Alpha Wolf card${results.alphaReserves.length > 1 ? 's' : ''}: ${results.alphaReserves.map(esc).join(', ')}</div>` : ''}<div class="action-footer"><span class="note">Center cards: ${results?.center?.map((card, index) => `#${index + 1} ${esc(card)}`).join(' · ')}</span>${room.viewer.kind === 'host' ? '<button class="btn" data-action="play-again">Play again with this village →</button>' : ''}</div>`;
}
function renderGame() {
  if (room.stage === 'roles') return `${phaseBar()}${renderRoleReveal()}`;
  if (room.stage === 'sentinel') return `${phaseBar()}${renderSentinel()}`;
  const body = ({ setup: renderSetup, dusk: renderDusk, mark: renderMark, night: renderNight, information: renderInformation, discussion: renderDiscussion, voting: renderVoting, results: renderResults })[room.stage]?.() || '<div class="empty">Waiting for the moderator.</div>';
  const hostFooter = room.viewer.kind === 'host' ? `<div class="action-footer" style="margin-top:18px"><button class="btn btn-danger" data-action="stop-game">Stop game</button></div>` : '';
  return `${phaseBar()}<div class="game-grid"><section class="main-card panel">${body}${hostFooter}</section><aside class="side-card panel"><h3>${room.viewer.kind === 'host' ? 'Players in this room' : 'Village'}</h3>${playerList()}${room.viewer.kind === 'player' && room.own?.card ? `<div class="side-rule">Your role card is private to this device.</div>` : ''}</aside></div>`;
}
function renderHostLobby() {
  const valid = room.host.totalCards === room.host.cardsNeeded && room.host.playerCount >= 3;
  const dayRoles = new Set(['Hunter', 'Tanner', 'Villager', 'Bodyguard']);
  const duskRoles = new Set(['Copycat', 'Doppelganger', 'Vampire', 'Master', 'Count', 'Renfield', 'Diseased', 'Cupid', 'Instigator', 'Priest', 'Assassin', 'Apprentice Assassin']);
  const renderRoleRows = (roles) => roles.map(([name, color, icon]) => `<div class="role-row"><span class="role-title"><i class="role-dot" style="--role-color:${color}"></i><span>${icon}</span>${esc(name)}</span><button data-action="role-change" data-role="${esc(name)}" data-delta="-1" aria-label="Remove ${esc(name)}">−</button><span class="role-qty">${room.roles[name]}</span><button data-action="role-change" data-role="${esc(name)}" data-delta="1" aria-label="Add ${esc(name)}">+</button></div>`).join('');
  const renderRoleGroup = (label, roles) => label === 'Night'
    ? `<section class="role-phase"><h3>Dusk</h3>${renderRoleRows(ROLES.filter(([name]) => duskRoles.has(name)))}</section><section class="role-phase"><h3>Night</h3>${renderRoleRows(roles)}</section>`
    : `<section class="role-phase"><h3>${label}</h3>${renderRoleRows(roles)}</section>`;
  const nightRoles = ROLES.filter(([name]) => !dayRoles.has(name) && !duskRoles.has(name));
  const dayRoleList = ROLES.filter(([name]) => dayRoles.has(name));
  return `<div class="room-head"><div><div class="eyebrow">Moderator lobby · You are not a player</div><h1>Build your village.</h1><p>${room.host.cardsNeeded - 3} players · choose exactly ${room.host.cardsNeeded} cards, including three center cards.</p></div><div class="code-box"><div><small>Join code</small><strong>${room.code}</strong></div><button class="btn btn-quiet" data-action="copy-link" aria-label="Copy invite link">▣</button></div></div><div class="room-layout"><section class="section-panel panel"><div class="section-head"><h2>Players</h2><span class="count-label">${room.players.length} / 12</span></div>${playerList()}<button class="btn btn-quiet" style="margin-top:15px;width:100%" data-action="copy-link">Copy invite link</button>${renderBotControls()}<form class="bot-form" data-form="add-bot"><h3>Add an AI player</h3><input class="input" name="name" maxlength="18" placeholder="AI name (optional)"><div class="bot-form-options"><select name="personality" aria-label="AI personality"><option>Friendly</option><option>Analytical</option><option>Bold</option><option>Quiet</option></select><select name="difficulty" aria-label="AI decision difficulty"><option>Casual</option><option selected>Balanced</option><option>Sharp</option></select><select name="talkativeness" aria-label="AI chat frequency"><option>Quiet</option><option selected>Balanced</option><option>Chatty</option></select></div><button class="btn btn-quiet" type="submit" ${room.players.length >= 12 ? 'disabled' : ''}>Add AI player</button></form><div class="lobby-foot">AI players receive private roles, act, vote, and chat like other seats. Your moderator screen never receives a player card.</div></section><aside class="deck-panel panel"><div class="eyebrow">The cards</div><h2>Choose your roles.</h2><p class="deck-help">One card per player, plus three in the center.</p><div class="deck-total"><span>Cards selected</span><strong>${room.host.totalCards} / ${room.host.cardsNeeded}</strong></div><div class="role-list">${renderRoleGroup('Night', nightRoles)}${renderRoleGroup('Day', dayRoleList)}</div>${renderArtifactPool()}<div class="deck-status ${valid ? '' : 'invalid'}">${valid ? 'Deck is ready to deal.' : room.host.totalCards < room.host.cardsNeeded ? `${room.host.cardsNeeded - room.host.totalCards} more cards needed.` : room.host.totalCards > room.host.cardsNeeded ? 'Remove cards to match the player count.' : 'At least 3 players are needed.'}</div><div class="room-actions"><button class="btn" data-action="start-game" ${valid ? '' : 'disabled'}>Deal the cards →</button><button class="btn btn-quiet" data-action="save-village">Save village</button><button class="btn btn-quiet" data-action="leave">Leave room</button></div></aside></div>`;
}
function renderRoom() {
  const page = room.stage === 'lobby' ? room.viewer.kind === 'host' ? renderHostLobby() : renderLobby() : renderGame();
  return `${page}${renderChat()}`;
}

app.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action } = button.dataset;
  if (action === 'create-room') {
    try {
      const response = await emit('room:create', { accountToken });
      saveSession({ code: response.room.code, kind: 'host', token: response.hostKey });
      history.replaceState({}, '', `/moderator/${response.room.code}/${response.hostKey}`);
      room = response.room; render();
    } catch (error) { toast(error.message); }
  } else if (action === 'choose-icon') {
    const form = button.closest('form');
    form.querySelector('[name="icon"]').value = button.dataset.icon;
    form.querySelectorAll('[data-action="choose-icon"]').forEach((item) => item.classList.toggle('selected', item === button));
  } else if (action === 'copy-link') {
    const url = `${location.origin}/join/${room.code}`;
    navigator.clipboard?.writeText(url).then(() => toast('Invite link copied.')).catch(() => toast(url));
  } else if (action === 'open-villages') {
    history.replaceState({}, '', '/villages');
    if (!savedVillages.length) loadSavedVillagesList();
    render();
  } else if (action === 'go-account') {
    history.replaceState({}, '', '/account');
    render();
  } else if (action === 'reload-villages') {
    loadSavedVillagesList();
  } else if (action === 'resume-village') {
    const code = button.dataset.code;
    const key = button.dataset.key || account?.villages.find((village) => village.code === code)?.hostKey;
    if (!key) return toast('This village is not linked to your account yet.');
    saveSession({ code, kind: 'host', token: key });
    history.replaceState({}, '', `/moderator/${code}/${key}`);
    connectSession();
  } else if (action === 'resume-player') {
    const { code, key } = button.dataset;
    saveSession({ code, kind: 'player', token: key });
    history.replaceState({}, '', `/join/${code}/${key}`);
    connectSession();
  } else if (action === 'account-mode') {
    accountMode = button.dataset.mode;
    render();
  } else if (action === 'account-logout') {
    await fetch('/api/account/logout', { method: 'POST', headers: accountHeaders() });
    localStorage.removeItem('nightshift-account-token'); accountToken = ''; account = null;
    history.replaceState({}, '', '/account'); render();
  } else if (action === 'purchase-icon') {
    try {
      const response = await fetch('/api/account/purchase-icon', { method: 'POST', headers: { ...accountHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ icon: button.dataset.icon }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to purchase icon.');
      account = payload.account; render(); toast('Icon added to your collection.');
    } catch (error) { toast(error.message); }
  } else if (action === 'admin-logout') {
    await fetch('/api/admin/logout', { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } });
    adminToken = ''; adminDashboard = null; adminAccountDetail = null; render();
  } else if (action === 'admin-account') {
    try {
      const response = await fetch(`/api/admin/accounts/${encodeURIComponent(button.dataset.id)}`, { headers: { Authorization: `Bearer ${adminToken}` } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to load account details.');
      adminAccountDetail = payload; render();
    } catch (error) { toast(error.message); }
  } else if (action === 'admin-back') {
    adminAccountDetail = null; render();
  } else if (action === 'resume-moderator') {
    const codeInput = document.getElementById('resume-room-code');
    const keyInput = document.getElementById('resume-room-key');
    const code = (codeInput?.value || '').trim();
    const key = (keyInput?.value || '').trim();
    if (!/^\d{6}$/.test(code)) return toast('Enter the six-digit room code.');
    if (!key) return toast('Enter the moderator key.');
    saveSession({ code, kind: 'host', token: key });
    history.replaceState({}, '', `/moderator/${code}/${key}`);
    connectSession();
  } else if (action === 'role-change') {
    await act('host:adjust-role', { role: button.dataset.role, delta: Number(button.dataset.delta) });
  } else if (action === 'remove-bot') {
    await act('host:remove-bot', { playerId: button.dataset.id });
  } else if (action === 'chat-toggle') {
    const setting = button.dataset.setting;
    await act('host:chat-settings', { setting, enabled: !room.chatSettings?.[setting] });
  } else if (action === 'chat-remove') {
    await act('host:chat-remove', { messageId: button.dataset.id });
  } else if (action === 'kick-player') {
    await act('host:kick-player', { playerId: button.dataset.id });
  } else if (action === 'toggle-icon-picker') {
    changingIcon = !changingIcon;
    render();
  } else if (action === 'start-game') {
    await act('host:start');
  } else if (action === 'role-ready') {
    await act('player:role-ready');
  } else if (action === 'dusk-select') {
    const max = button.dataset.max === '2' ? 2 : 1;
    if (selectedIds.includes(button.dataset.id)) selectedIds = selectedIds.filter((id) => id !== button.dataset.id);
    else if (selectedIds.length < max) selectedIds.push(button.dataset.id);
    else selectedIds[selectedIds.length - 1] = button.dataset.id;
    render();
  } else if (action === 'phase-question-select') {
    selectedIds = [button.dataset.id];
    render();
  } else if (action === 'info-mark-select' || action === 'info-role-select') {
    if (action === 'info-mark-select') infoMarkTarget = button.dataset.id;
    else infoRoleTarget = button.dataset.id;
    render();
  } else if (action === 'select-player' || action === 'night-answer' || action === 'select-vote' || action === 'select-shield') {
    if (action === 'night-answer') { selectedIds = [button.dataset.id]; room.own.nightAnswer = button.dataset.id; }
    else if (action === 'select-vote') selectedIds = [button.dataset.id];
    else if (selectedIds.includes(button.dataset.id)) selectedIds = selectedIds.filter((id) => id !== button.dataset.id);
    else if (room.stage === 'night' && ['Troublemaker', 'Gremlin', 'Paranormal Investigator'].includes(room.action?.role) && selectedIds.length < 2) selectedIds.push(button.dataset.id);
    else if (room.stage === 'night' && ['Troublemaker', 'Gremlin', 'Paranormal Investigator'].includes(room.action?.role)) selectedIds[selectedIds.length - 1] = button.dataset.id;
    else selectedIds = [button.dataset.id];
    render();
  } else if (action === 'select-center') {
    const index = Number(button.dataset.index);
    if (selectedCenter.includes(index)) selectedCenter = selectedCenter.filter((item) => item !== index);
    else {
      const amount = room.action?.role === 'Seer' && seerMode === 'center' ? 2 : 1;
      if (selectedCenter.length < amount) selectedCenter.push(index);
      else selectedCenter[selectedCenter.length - 1] = index;
    }
    render();
  } else if (action === 'seer-mode') {
    seerMode = button.dataset.mode; selectedIds = []; selectedCenter = []; render();
  } else if (action === 'idiot-direction') {
    villageDirection = button.dataset.direction; render();
  } else if (action === 'gremlin-mode') {
    gremlinMode = button.dataset.mode; selectedIds = []; render();
  } else if (action === 'submit-setup') {
    const targetId = selectedIds[0]; selectedIds = []; await act('player:setup', { targetId });
  } else if (action === 'submit-copycat') {
    const centerIndex = selectedCenter[0]; selectedCenter = []; await act('player:copycat-setup', { centerIndex });
  } else if (action === 'submit-phase-question') {
    const targetId = selectedIds[0];
    await act('player:phase-question', { targetId });
    selectedIds = [];
  } else if (action === 'submit-dusk') {
    const payload = room.action?.role === 'Cupid' ? { targetIds: [...selectedIds] } : { targetId: selectedIds[0] };
    selectedIds = []; await act('player:dusk-action', payload);
  } else if (action === 'mark-done') {
    await act('player:mark-done');
  } else if (action === 'submit-shield') {
    const targetId = selectedIds[0]; selectedIds = []; await act('player:sentinel-shield', { targetId });
  } else if (action === 'submit-night-answer') {
    const targetId = selectedIds[0] || room.own.nightAnswer; selectedIds = []; await act('player:night-answer', { targetId });
  } else if (action === 'night-action') {
    const payload = { pass: button.dataset.pass === 'true' };
    if (button.dataset.role === 'Werewolf' || button.dataset.role === 'Drunk') payload.centerIndex = selectedCenter[0];
    if (['Mystic Wolf', 'Alpha Wolf', 'Robber', 'Pickpocket', 'Revealer', 'Curator'].includes(button.dataset.role)) payload.targetId = selectedIds[0];
    if (button.dataset.role === 'Apprentice Seer') payload.centerIndex = selectedCenter[0];
    if (button.dataset.role === 'Witch') { payload.targetId = selectedIds[0]; payload.centerIndex = selectedCenter[0]; }
    if (['Troublemaker', 'Paranormal Investigator', 'Gremlin'].includes(button.dataset.role)) payload.targetIds = [...selectedIds];
    if (button.dataset.role === 'Gremlin') payload.mode = gremlinMode;
    if (button.dataset.role === 'Village Idiot') payload.direction = villageDirection;
    if (button.dataset.role === 'Seer') Object.assign(payload, seerMode === 'player' ? { mode: 'player', targetId: selectedIds[0] } : { mode: 'center', centerIndices: [...selectedCenter] });
    selectedIds = []; selectedCenter = []; await act('player:night-action', payload);
  } else if (action === 'information-done') {
    await act('player:information-done');
  } else if (action === 'information-action') {
    await act('player:information-action', { markTargetId: infoMarkTarget, roleTargetId: infoRoleTarget });
    infoMarkTarget = ''; infoRoleTarget = '';
  } else if (action === 'timer') {
    await act('host:timer', { running: !room.timerRunning });
  } else if (action === 'begin-voting') {
    await act('host:begin-voting');
  } else if (action === 'submit-vote') {
    await act('player:vote', { targetId: selectedIds[0] }); selectedIds = [];
  } else if (action === 'play-again') {
    await act('host:play-again');
  } else if (action === 'stop-game') {
    await act('host:stop-game');
  } else if (action === 'save-village') {
    try {
      await emit('host:save-village');
      toast('Village saved to Your Villages.');
    } catch (error) { toast(error.message); }
  } else if (action === 'leave' || action === 'back-home' || action === 'home') {
    const destination = session?.kind === 'host' ? '/moderator' : '/join';
    await act('room:leave'); clearSession(); history.replaceState({}, '', destination); render();
  }
});

app.addEventListener('input', (event) => {
  if (event.target.id !== 'chat-message') return;
  chatDraft = event.target.value;
  const sendButton = event.target.form?.querySelector('[type="submit"]');
  if (sendButton) sendButton.disabled = !chatDraft.trim();
});

app.addEventListener('change', async (event) => {
  const botIcon = event.target.closest('[data-bot-icon]');
  if (botIcon) {
    await act('host:bot-icon', { playerId: botIcon.dataset.playerId, icon: botIcon.value });
    return;
  }
  const botSetting = event.target.closest('[data-bot-setting]');
  if (botSetting) {
    await act('host:bot-settings', { playerId: botSetting.dataset.playerId, setting: botSetting.dataset.setting, value: botSetting.value });
    return;
  }
  if (event.target.id === 'chat-scope') {
    chatScope = event.target.value;
    if (chatScope === 'whisper' && !chatTargetId) chatTargetId = room.players.find((player) => player.id !== room.viewer.playerId)?.id || '';
    render();
  } else if (event.target.id === 'chat-target') chatTargetId = event.target.value;
});

app.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  if (form.dataset.form === 'chat') {
    const scope = String(data.get('scope') || 'public');
    const text = String(data.get('text') || '').trim();
    const targetId = scope === 'whisper' ? String(data.get('targetId') || '') : '';
    if (!text) return;
    try {
      await emit('chat:send', { scope, text, targetId });
      chatDraft = '';
      const input = app.querySelector('#chat-message');
      if (input) input.value = '';
    } catch (error) {
      chatDraft = text;
      render();
      toast(error.message);
    }
  } else if (form.dataset.form === 'add-bot') {
    try {
      await emit('host:add-bot', { name: data.get('name'), settings: { personality: data.get('personality'), difficulty: data.get('difficulty'), talkativeness: data.get('talkativeness') } });
      form.reset();
    } catch (error) { toast(error.message); }
  } else if (form.dataset.form === 'account-auth') {
    try {
      const endpoint = accountMode === 'signup' ? '/api/account/signup' : '/api/account/login';
      const body = Object.fromEntries(data.entries());
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to sign in.');
      accountToken = payload.token; account = payload.account;
      localStorage.setItem('nightshift-account-token', accountToken);
      history.replaceState({}, '', '/account');
      if (accountCatalog.length === 0) accountCatalog = (await (await fetch('/api/account/catalog')).json()).icons || [];
      render();
      connectSession();
    } catch (error) { toast(error.message); }
  } else if (form.dataset.form === 'admin-key') {
    try {
      const response = await fetch('/api/admin/challenge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: data.get('key') }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Access denied.');
      adminChallenge = payload; render();
    } catch (error) { toast(error.message); }
  } else if (form.dataset.form === 'admin-answers') {
    try {
      const response = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeId: adminChallenge.challengeId, answers: data.getAll('answer') }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Access denied.');
      adminToken = payload.token; adminChallenge = null;
      const dataResponse = await fetch('/api/admin/data', { headers: { Authorization: `Bearer ${adminToken}` } });
      const dashboardPayload = await dataResponse.json();
      if (!dataResponse.ok) throw new Error(dashboardPayload.error || 'Unable to load dashboard.');
      adminDashboard = dashboardPayload; adminAccountDetail = null; render();
    } catch (error) { toast(error.message); }
  } else if (form.dataset.form === 'join-code') {
    pendingCode = String(data.get('code') || '').trim().toUpperCase();
    if (!/^\d{6}$/.test(pendingCode)) return toast('Enter the six-digit room code.');
    try {
      const response = await emit('room:preview', { code: pendingCode });
      roomPreview = response.preview;
      history.replaceState({}, '', `/join/${pendingCode}`); render();
    } catch (error) { toast(error.message); }
  } else if (form.dataset.form === 'join-player') {
    const name = String(data.get('name') || '').trim();
    const icon = String(data.get('icon') || '');
    const playerKey = String(data.get('playerKey') || '').trim();
    if (!icon) return toast('Choose an available icon.');
    try {
      const response = await emit('room:join', { code: pendingCode, name, icon, playerKey, accountToken });
      const key = response.playerKey || response.token;
      saveSession({ code: response.room.code, kind: 'player', token: key });
      history.replaceState({}, '', `/join/${response.room.code}/${key}`);
      room = response.room; pendingCode = ''; render();
    } catch (error) { toast(error.message); }
  } else if (form.dataset.form === 'change-icon') {
    const icon = String(data.get('icon') || '');
    try {
      await emit('player:change-icon', { icon });
      changingIcon = false;
      render();
    } catch (error) { toast(error.message); }
  } else if (form.dataset.form === 'artifact-pool') {
    try {
      await emit('host:artifact-pool', { artifacts: data.getAll('artifact').map(String) });
      toast('Artifact pool saved.');
    } catch (error) { toast(error.message); }
  }
});

const roomRoute = location.pathname.match(/^\/(join|moderator)\/(\d{6})\/([A-Z0-9]+)\/?$/);
if (roomRoute) session = { code: roomRoute[2], kind: roomRoute[1] === 'moderator' ? 'host' : 'player', token: roomRoute[3] };
render();
if (session) connectSession();
else if (/^\/join\/\d{6}\/?$/.test(location.pathname)) {
  pendingCode = location.pathname.match(/\d{6}/)?.[0] || '';
  emit('room:preview', { code: pendingCode }).then(({ preview }) => { roomPreview = preview; render(); }).catch((error) => toast(error.message));
}
if (accountToken) refreshAccount();
if (location.pathname === '/account') fetch('/api/account/catalog').then((response) => response.json()).then((payload) => { accountCatalog = payload.icons || []; render(); }).catch(() => {});