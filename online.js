const ROLES = [
  ['Doppelganger', '#4167d5'], ['Werewolf', '#202b28'], ['Minion', '#8172b2'], ['Mason', '#45988c'],
  ['Seer', '#4c77d7'], ['Robber', '#d09134'], ['Troublemaker', '#e27859'], ['Drunk', '#ba668b'],
  ['Insomniac', '#5599b5'], ['Hunter', '#d35c49'], ['Tanner', '#a87854'], ['Villager', '#65915d'],
];
const ICONS = ['🌙', '🦊', '🐺', '🦉', '🦇', '🐈', '🦌', '🐸', '🦝', '🐻', '🕯️', '🍄'];
const PHASES = ['Lobby', 'Roles', 'Night', 'Information', 'Discuss', 'Vote', 'Reveal'];
const app = document.querySelector('#app');
const socket = io();
let room = null;
let session = null;
let pendingCode = new URLSearchParams(location.search).get('room')?.toUpperCase() || '';
let selectedIds = [];
let selectedCenter = [];
let seerMode = 'player';
let toastTimer;

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
  localStorage.setItem('nightshift-session', JSON.stringify(next));
}
function clearSession() {
  localStorage.removeItem('nightshift-session'); session = null; room = null; pendingCode = '';
  history.replaceState({}, '', location.pathname); render();
}
function connectSession() {
  if (!session || !socket.connected) return;
  emit('room:resume', session).then(({ room: snapshot }) => { room = snapshot; render(); }).catch(() => clearSession());
}
socket.on('connect', connectSession);
socket.on('disconnect', () => { if (room) render(); });
socket.on('room:update', (snapshot) => { room = snapshot; render(); });
socket.on('connect_error', () => toast('Cannot reach the game server. Retrying…'));

function header() {
  const right = room ? `<span class="top-note">${room.viewer.kind === 'host' ? 'Moderator' : `${esc(room.viewer.name)} · ${room.code}`}</span>` : '<span class="top-note">One night. One village. No alibis.</span>';
  return `<header class="topbar"><a class="brand" href="#" data-action="home"><span class="brand-mark">✳</span><span class="brand-name">night<span>shift</span></span></a>${right}</header>`;
}
function render() {
  app.innerHTML = `<div class="shell">${header()}<main class="page">${room ? renderRoom() : renderHome()}</main></div>`;
}
function renderHome() {
  const joining = Boolean(pendingCode);
  return `<section class="intro"><div class="intro-copy"><div class="eyebrow">A social deduction game</div><h1>Night falls.<br>Trust nobody.</h1><p>Deal the cards, close your eyes, and figure out who changed what before the village wakes.</p></div><div class="night-stamp" aria-hidden="true">☾</div></section><section class="home-grid"><div class="host-panel panel"><div class="eyebrow">Gather your people</div><h2>Start a game<br>around the table.</h2><p>Choose the roles, share a join code, and guide everyone through one wonderfully suspicious night. The moderator does not play a card.</p><button class="btn btn-lime" data-action="create-room">Host a game <span aria-hidden="true">→</span></button></div><div class="join-panel panel"><div class="eyebrow">Have a code?</div><h2>${joining ? 'Join the village.' : 'Take your seat.'}</h2>${joining ? joinIdentityForm() : `<p>Enter your host’s room code. Each person plays on their own device.</p><form class="join-form" data-form="join-code"><div class="field"><label for="join-code">ROOM CODE</label><input class="input" id="join-code" name="code" maxlength="4" placeholder="e.g. M7QK" value="${esc(pendingCode)}" autocomplete="off" required></div><button class="btn" type="submit">Continue <span aria-hidden="true">→</span></button></form>`}</div></section><div class="how-row"><div class="how-chip"><b>01</b> Host sets the deck</div><div class="how-chip"><b>02</b> Everyone joins</div><div class="how-chip"><b>03</b> Find the wolf</div></div>`;
}
function joinIdentityForm() {
  const reserved = room?.players?.map((player) => player.icon) || [];
  return `<p>Room <strong>${esc(pendingCode)}</strong>. Choose your name and a free icon.</p><form data-form="join-player"><div class="field"><label for="player-name">YOUR NAME</label><input class="input" id="player-name" name="name" maxlength="18" placeholder="Name" autocomplete="nickname" required></div><div class="field" style="margin-top:13px"><span class="field-label">CHOOSE AN ICON</span><div class="choice-grid icon-grid">${ICONS.map((icon) => `<button type="button" class="choice-btn ${reserved.includes(icon) ? 'selected' : ''}" data-action="choose-icon" data-icon="${icon}" ${reserved.includes(icon) ? 'disabled' : ''} aria-label="Choose ${icon}">${icon}${reserved.includes(icon) ? ' In use' : ''}</button>`).join('')}</div><input type="hidden" name="icon" value=""></div><div class="action-footer"><button type="button" class="btn btn-quiet" data-action="back-home">Back</button><button class="btn" type="submit">Join room →</button></div></form>`;
}
function playerList() {
  if (!room.players.length) return '<div class="empty">No players yet. Copy the invite link to bring your village together.</div>';
  return `<div class="player-list">${room.players.map((player) => `<div class="player-row"><span class="player-icon">${player.icon}</span><span class="player-name">${esc(player.name)}</span><span class="connection-dot ${player.connected ? 'online' : ''}" title="${player.connected ? 'Connected' : 'Offline'}"></span>${player.ready ? '<span class="host-tag">Ready</span>' : ''}${player.voted ? '<span class="host-tag">Voted</span>' : ''}</div>`).join('')}</div>`;
}
function renderLobby() {
  if (room.viewer.kind !== 'host') return `<div class="room-head"><div><div class="eyebrow">Room lobby</div><h1>You’re in.</h1><p>Waiting for the moderator to set the roles and deal the cards.</p></div><div class="code-box"><div><small>Room code</small><strong>${room.code}</strong></div></div></div><section class="section-panel panel"><div class="section-head"><h2>Players</h2><span class="count-label">${room.players.length} / 12</span></div>${playerList()}<div class="lobby-foot">You’ll play on this device. Your role and night information are private.</div></section>`;
  const valid = room.host.totalCards === room.host.cardsNeeded && room.host.playerCount >= 3;
  return `<div class="room-head"><div><div class="eyebrow">Moderator lobby · You are not a player</div><h1>Build your village.</h1><p>${room.host.cardsNeeded - 3} players · choose exactly ${room.host.cardsNeeded} cards, including three center cards.</p></div><div class="code-box"><div><small>Join code</small><strong>${room.code}</strong></div><button class="btn btn-quiet" data-action="copy-link" aria-label="Copy invite link">▣</button></div></div><div class="room-layout"><section class="section-panel panel"><div class="section-head"><h2>Players</h2><span class="count-label">${room.players.length} / 12</span></div>${playerList()}<button class="btn btn-quiet" style="margin-top:15px;width:100%" data-action="copy-link">Copy invite link</button><div class="lobby-foot">Players join from their own devices. Your moderator screen never receives a player card.</div></section><aside class="deck-panel panel"><div class="eyebrow">The cards</div><h2>Choose your roles.</h2><p class="deck-help">One card per player, plus three in the center.</p><div class="deck-total"><span>Cards selected</span><strong>${room.host.totalCards} / ${room.host.cardsNeeded}</strong></div><div class="role-list">${ROLES.map(([name, color]) => `<div class="role-row"><span class="role-title"><i class="role-dot" style="--role-color:${color}"></i>${name}</span><button data-action="role-change" data-role="${name}" data-delta="-1" aria-label="Remove ${name}">−</button><span class="role-qty">${room.roles[name]}</span><button data-action="role-change" data-role="${name}" data-delta="1" aria-label="Add ${name}">+</button></div>`).join('')}</div><div class="deck-status ${valid ? '' : 'invalid'}">${valid ? 'Deck is ready to deal.' : room.host.totalCards < room.host.cardsNeeded ? `${room.host.cardsNeeded - room.host.totalCards} more cards needed.` : room.host.totalCards > room.host.cardsNeeded ? 'Remove cards to match the player count.' : 'At least 3 players are needed.'}</div><div class="room-actions"><button class="btn" data-action="start-game" ${valid ? '' : 'disabled'}>Deal the cards →</button><button class="btn btn-quiet" data-action="leave">Leave room</button></div></aside></div>`;
}
function phaseIndex() {
  return ({ lobby: -1, setup: 1, night: 2, information: 3, discussion: 4, voting: 5, results: 6 })[room.stage] ?? 0;
}
function phaseBar() {
  const current = phaseIndex();
  return `<div class="phase-bar">${PHASES.map((label, index) => `<div class="phase-item ${index === current ? 'active' : index < current ? 'done' : ''}"><span class="phase-n">0${index + 1}</span>${label}</div>`).join('')}</div>`;
}
function playerChoices(excluded = [], amount = 1, event = 'select-player') {
  return `<div class="choice-grid" style="margin-top:13px">${room.players.filter((player) => !excluded.includes(player.id)).map((player) => `<button class="choice-btn ${selectedIds.includes(player.id) ? 'selected' : ''}" data-action="${event}" data-id="${player.id}" ${!selectedIds.includes(player.id) && selectedIds.length >= amount ? 'disabled' : ''}><span class="player-icon">${player.icon}</span>${esc(player.name)}</button>`).join('')}</div>`;
}
function centerChoices(amount = 1) {
  return `<div class="center-cards">${[0, 1, 2].map((index) => `<button class="center-card ${selectedCenter.includes(index) ? 'selected' : ''}" data-action="select-center" data-index="${index}" ${!selectedCenter.includes(index) && selectedCenter.length >= amount ? 'disabled' : ''}>CENTER ${index + 1}</button>`).join('')}</div>`;
}
function renderSetup() {
  if (room.viewer.kind !== 'player') return `<div class="eyebrow">Phase 01 · Setup</div><h2>Players are choosing.</h2><p>${room.setupIndex} of ${room.setupCount} setup choices locked. Player roles are private, including from the moderator.</p>${playerList()}`;
  const own = room.own;
  const active = room.players[room.setupIndex]?.id === room.viewer.playerId;
  const doppel = own.startCard === 'Doppelganger';
  return `<div class="eyebrow">Phase 01 · Setup</div><h2>${doppel ? 'Choose a card to copy.' : 'One last question.'}</h2><p>${doppel ? 'Look at one player’s card. You become that role and perform its night action first.' : 'Choose a player for the group question. Keep your choice to yourself.'}</p><div class="result-banner role-private"><span style="font-size:26px">✦</span><div><strong>Your card: ${esc(own.card)}</strong><span>${doppel && own.effectiveRole ? `Copied role: ${esc(own.effectiveRole)}` : 'Only you can see this.'}</span></div></div>${doppel ? '' : `<div class="question-prompt">${esc(room.question)}</div>`}<div class="action-box"><h3>${active ? 'Your choice' : 'Waiting for setup'}</h3>${active ? playerChoices([room.viewer.playerId]) : `<p class="note">Waiting for ${esc(room.players[room.setupIndex]?.name || 'players')} to finish choosing.</p>`}<div class="action-footer"><span class="note">${doppel ? 'Your copied role stays private.' : `${room.setupIndex + 1} of ${room.setupCount}`}</span>${active ? `<button class="btn" data-action="submit-setup" ${!selectedIds.length ? 'disabled' : ''}>Lock answer →</button>` : ''}</div></div>`;
}
function renderNight() {
  const action = room.action;
  if (!action) return `<div class="eyebrow">Phase 02 · Night</div><h2>Eyes closed.</h2><p>Night actions are underway. Your screen will update when it’s your turn.</p><div class="empty">${room.viewer.kind === 'host' ? `Action ${room.host.setupDone || 0} · ${room.host.playerCount} players` : 'Keep your role private.'}</div>`;
  if (room.viewer.kind === 'host') return `<div class="eyebrow">Phase 02 · Night</div><h2>Night action in progress.</h2><p>${esc(action.actorName)} is taking a private turn. Players only see their own role and action.</p><div class="empty">Turn ${action.index} of ${action.total}</div>`;
  if (action.actorId !== room.viewer.playerId) return `<div class="eyebrow">Phase 02 · Night</div><h2>Eyes closed.</h2><p>Someone is taking their turn. Your device will update when it’s your move.</p><div class="empty">Night action ${action.index} of ${action.total}</div>`;
  const role = action.role;
  let controls = '';
  let intro = '';
  if (action.requiresQuestion) {
    intro = `<div class="action-box"><h3>Night question</h3><div class="question-prompt">${esc(room.nightQuestion)}</div>${role === 'Werewolf' ? `<div class="empty" style="margin-top:10px">Your fellow werewolves: ${(action.targets || []).map((player) => `${player.icon} ${esc(player.name)}`).join(' · ') || 'No one else is awake with you.'}</div>` : ''}${playerChoices([room.viewer.playerId], 1, 'night-answer')}<div class="action-footer"><span class="note">This is your only action tonight.</span><button class="btn" data-action="submit-night-answer" ${!room.own.nightAnswer && !selectedIds.length ? 'disabled' : ''}>Lock answer →</button></div></div>`;
    controls = `<div class="empty">${role === 'Minion' ? 'You will see the werewolves in your information.' : role === 'Mason' ? 'You will see the other Masons in your information.' : 'No role action tonight.'}</div>`;
  } else if (role === 'Werewolf') {
    const wolves = action.targets || [];
    intro = `<div class="empty">You are alone. Choose one center card to look at.</div>`;
    controls = `${centerChoices(1)}<div class="action-footer"><span class="note">The order is the same for everyone.</span><button class="btn" data-action="night-action" data-role="Werewolf" ${selectedCenter.length !== 1 ? 'disabled' : ''}>Look at card →</button></div>`;
  } else if (role === 'Seer') {
    intro = `<div class="button-row"><button class="btn btn-quiet" data-action="seer-mode" data-mode="player">One player</button><button class="btn btn-quiet" data-action="seer-mode" data-mode="center">Two center cards</button></div>`;
    controls = seerMode === 'player' ? `${playerChoices([room.viewer.playerId])}<div class="action-footer"><span class="note">Look at one player’s current card.</span><button class="btn" data-action="night-action" data-role="Seer" ${selectedIds.length !== 1 ? 'disabled' : ''}>Look at card →</button></div>` : `${centerChoices(2)}<div class="action-footer"><span class="note">Choose two different cards.</span><button class="btn" data-action="night-action" data-role="Seer" ${selectedCenter.length !== 2 ? 'disabled' : ''}>Look at cards →</button></div>`;
  } else if (role === 'Robber') {
    intro = '<p>Swap your card with another player and privately see your new card.</p>';
    controls = `${playerChoices([room.viewer.playerId])}<div class="action-footer"><span class="note">Choose one player.</span><button class="btn" data-action="night-action" data-role="Robber" ${selectedIds.length !== 1 ? 'disabled' : ''}>Swap cards →</button></div>`;
  } else if (role === 'Troublemaker') {
    intro = '<p>Swap two other players’ cards. You will not see either card.</p>';
    controls = `${playerChoices([room.viewer.playerId], 2)}<div class="action-footer"><span class="note">Choose two different players.</span><button class="btn" data-action="night-action" data-role="Troublemaker" ${selectedIds.length !== 2 ? 'disabled' : ''}>Swap their cards →</button></div>`;
  } else if (role === 'Drunk') {
    intro = '<p>Swap your card with one center card. You will not see the new role.</p>';
    controls = `${centerChoices(1)}<div class="action-footer"><span class="note">Choose one center card.</span><button class="btn" data-action="night-action" data-role="Drunk" ${selectedCenter.length !== 1 ? 'disabled' : ''}>Swap cards →</button></div>`;
  } else {
    intro = '<p>This role has no night action.</p>';
    controls = '<div class="empty">There is nothing to do. Your role is safe on this device.</div>';
  }
  return `<div class="eyebrow">Phase 02 · Night action ${action.index} of ${action.total}</div><h2>${esc(action.copied ? `Doppelganger → ${role}` : role)}.</h2><p>${esc(action.copied ? 'You copied this role. Complete its action now.' : 'Complete your private action, then the next player will wake.')}</p>${intro}<div class="action-box"><h3>${esc(role)} action</h3>${controls}</div>`;
}
function renderInformation() {
  if (room.viewer.kind !== 'player') return `<div class="eyebrow">Phase 03 · Information</div><h2>Players are checking their notes.</h2><p>${room.informationDone} of ${room.players.length} players are ready. No private notes are sent to the moderator.</p>${playerList()}`;
  const own = room.own;
  return `<div class="eyebrow">Phase 03 · Private information</div><h2>Your night, in private.</h2><div class="result-banner role-private"><span style="font-size:26px">✦</span><div><strong>${esc(own.startCard === 'Doppelganger' ? `Doppelganger → ${own.effectiveRole || 'Doppelganger'}` : own.startCard)}</strong><span>Final card after swaps: ${esc(own.card)}</span></div></div>${own.notes.length ? `<div class="info-list">${own.notes.map((note) => `<div class="info-line"><span class="player-icon">✦</span><div>${esc(note)}</div></div>`).join('')}</div>` : '<div class="empty" style="margin-top:14px">Nothing to see tonight. Keep your poker face ready.</div>'}<div class="divider"></div><h3>Setup question</h3><div class="question-prompt">${esc(room.question)}</div><p class="muted-small" style="margin:8px 0 0">You chose <strong>${esc(room.players.find((p) => p.id === own.setupTarget)?.name || 'No one')}</strong>. ${Math.round(own.setupMatchCount / Math.max(1, room.players.length) * 100)}% of players chose the same person.</p><div class="action-footer"><span class="note">${room.informationDone} of ${room.players.length} ready</span><button class="btn" data-action="information-done">Hide my notes →</button></div>`;
}
function renderDiscussion() {
  const mins = String(Math.floor(room.discussionSeconds / 60)).padStart(2, '0');
  const secs = String(room.discussionSeconds % 60).padStart(2, '0');
  if (room.viewer.kind === 'host') return `<div class="eyebrow">Phase 04 · Moderator</div><h2>Give them five minutes.</h2><p>The players have finished checking their private information. Start the timer when discussion begins.</p><div class="discussion-time ${room.discussionSeconds <= 30 ? 'warning' : ''}">${mins}:${secs}</div><div class="meter"><span style="width:${room.discussionSeconds / 300 * 100}%"></span></div><div class="action-footer"><span class="note">${room.timerRunning ? 'Timer running' : 'Timer paused'}</span><div class="button-row"><button class="btn btn-quiet" data-action="timer">${room.timerRunning ? 'Pause timer' : 'Start timer'}</button><button class="btn" data-action="begin-voting">Begin vote →</button></div></div>`;
  return `<div class="eyebrow">Phase 04 · Discussion</div><h2>Make your case.</h2><p>Compare notes, bluff, and decide who to vote out. The moderator controls when voting starts.</p><div class="discussion-time ${room.discussionSeconds <= 30 ? 'warning' : ''}">${mins}:${secs}</div><div class="meter"><span style="width:${room.discussionSeconds / 300 * 100}%"></span></div><div class="side-rule">${room.timerRunning ? 'Discussion timer is running.' : 'Waiting for the moderator to start voting.'}</div>`;
}
function renderVoting() {
  if (room.viewer.kind !== 'player') return `<div class="eyebrow">Phase 05 · Voting</div><h2>Votes are sealed.</h2><p>${room.voteDone} of ${room.players.length} players have locked a vote. Your player seat is empty, moderator.</p>${playerList()}`;
  const own = room.own;
  return `<div class="eyebrow">Phase 05 · Vote</div><h2>Point to the wolf.</h2><p>Choose one person. Your vote is private and cannot be changed.</p>${own.voteTarget ? `<div class="result-banner"><span style="font-size:25px">✓</span><div><strong>Vote locked</strong><span>You voted for ${esc(room.players.find((player) => player.id === own.voteTarget)?.name)}.</span></div></div>` : `<div class="vote-target">${room.players.filter((player) => player.id !== room.viewer.playerId).map((player) => `<button class="choice-btn ${selectedIds.includes(player.id) ? 'selected' : ''}" data-action="select-vote" data-id="${player.id}"><span class="player-icon">${player.icon}</span>${esc(player.name)}</button>`).join('')}</div><div class="action-footer"><span class="note">${room.voteDone} of ${room.players.length} votes locked</span><button class="btn" data-action="submit-vote" ${!selectedIds.length ? 'disabled' : ''}>Lock my vote →</button></div>`}`;
}
function renderResults() {
  const results = room.results;
  return `<div class="eyebrow">Phase 06 · Reveal</div><h2>The village decides.</h2><div class="result-banner"><span style="font-size:25px">${results?.deadIds?.length ? '☠' : '✦'}</span><div><strong>${esc(results?.winner)}</strong><span>${results?.deadIds?.length ? `Voted out: ${room.players.filter((player) => results.deadIds.includes(player.id)).map((player) => player.name).join(', ')}.` : 'No one received a vote.'}</span></div></div><p>Here’s what everyone was holding after the night’s swaps.</p><div class="reveal-grid">${room.players.map((player) => `<div class="reveal-card"><div class="reveal-card-top"><span class="player-icon">${player.icon}</span>${esc(player.name)}${results?.deadIds?.includes(player.id) ? ' · VOTED OUT' : ''}</div><div class="reveal-role"><span>Dealt</span><strong>${esc(player.startCard)}</strong></div>${player.startCard === 'Doppelganger' ? `<div class="reveal-role"><span>Copied</span><strong>${esc(player.effectiveRole || 'Doppelganger')}</strong></div>` : ''}<div class="reveal-role"><span>Final card</span><strong>${esc(player.card)}</strong></div><div class="reveal-role"><span>Votes</span><strong>${results?.voteCounts?.[player.id] || 0}</strong></div></div>`).join('')}</div><div class="action-footer"><span class="note">Center cards: ${results?.center?.map((card, index) => `#${index + 1} ${esc(card)}`).join(' · ')}</span>${room.viewer.kind === 'host' ? '<button class="btn" data-action="play-again">Back to lobby →</button>' : ''}</div>`;
}
function renderGame() {
  const body = ({ setup: renderSetup, night: renderNight, information: renderInformation, discussion: renderDiscussion, voting: renderVoting, results: renderResults })[room.stage]?.() || '<div class="empty">Waiting for the moderator.</div>';
  return `${phaseBar()}<div class="game-grid"><section class="main-card panel">${body}</section><aside class="side-card panel"><h3>${room.viewer.kind === 'host' ? 'Players in this room' : 'Village'}</h3>${playerList()}${room.viewer.kind === 'player' && room.own?.card ? `<div class="side-rule">Your role card is private to this device.</div>` : ''}</aside></div>`;
}
function renderRoom() {
  return room.stage === 'lobby' ? renderLobby() : renderGame();
}

app.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action } = button.dataset;
  if (action === 'create-room') {
    try {
      const response = await emit('room:create');
      saveSession({ code: response.room.code, kind: 'host', token: response.token }); room = response.room; render();
    } catch (error) { toast(error.message); }
  } else if (action === 'choose-icon') {
    const form = button.closest('form');
    form.querySelector('[name="icon"]').value = button.dataset.icon;
    form.querySelectorAll('[data-action="choose-icon"]').forEach((item) => item.classList.toggle('selected', item === button));
  } else if (action === 'copy-link') {
    const url = `${location.origin}${location.pathname}?room=${room.code}`;
    navigator.clipboard?.writeText(url).then(() => toast('Invite link copied.')).catch(() => toast(url));
  } else if (action === 'role-change') {
    await act('host:adjust-role', { role: button.dataset.role, delta: Number(button.dataset.delta) });
  } else if (action === 'start-game') {
    await act('host:start');
  } else if (action === 'select-player' || action === 'night-answer' || action === 'select-vote') {
    if (action === 'night-answer') { selectedIds = [button.dataset.id]; room.own.nightAnswer = button.dataset.id; }
    else if (action === 'select-vote') selectedIds = [button.dataset.id];
    else if (selectedIds.includes(button.dataset.id)) selectedIds = selectedIds.filter((id) => id !== button.dataset.id);
    else if (room.stage === 'night' && room.action?.role === 'Troublemaker' && selectedIds.length < 2) selectedIds.push(button.dataset.id);
    else selectedIds = [button.dataset.id];
    render();
  } else if (action === 'select-center') {
    const index = Number(button.dataset.index);
    if (selectedCenter.includes(index)) selectedCenter = selectedCenter.filter((item) => item !== index);
    else {
      const amount = room.action?.role === 'Seer' && seerMode === 'center' ? 2 : 1;
      if (selectedCenter.length < amount) selectedCenter.push(index);
    }
    render();
  } else if (action === 'seer-mode') {
    seerMode = button.dataset.mode; selectedIds = []; selectedCenter = []; render();
  } else if (action === 'submit-setup') {
    const targetId = selectedIds[0]; selectedIds = []; await act('player:setup', { targetId });
  } else if (action === 'submit-night-answer') {
    const targetId = selectedIds[0] || room.own.nightAnswer; selectedIds = []; await act('player:night-answer', { targetId });
  } else if (action === 'night-action') {
    const payload = {};
    if (button.dataset.role === 'Werewolf' || button.dataset.role === 'Drunk') payload.centerIndex = selectedCenter[0];
    if (button.dataset.role === 'Robber') payload.targetId = selectedIds[0];
    if (button.dataset.role === 'Troublemaker') payload.targetIds = [...selectedIds];
    if (button.dataset.role === 'Seer') Object.assign(payload, seerMode === 'player' ? { mode: 'player', targetId: selectedIds[0] } : { mode: 'center', centerIndices: [...selectedCenter] });
    selectedIds = []; selectedCenter = []; await act('player:night-action', payload);
  } else if (action === 'information-done') {
    await act('player:information-done');
  } else if (action === 'timer') {
    await act('host:timer', { running: !room.timerRunning });
  } else if (action === 'begin-voting') {
    await act('host:begin-voting');
  } else if (action === 'submit-vote') {
    await act('player:vote', { targetId: selectedIds[0] }); selectedIds = [];
  } else if (action === 'play-again') {
    await act('host:play-again');
  } else if (action === 'leave' || action === 'back-home' || action === 'home') {
    await act('room:leave'); clearSession();
  }
});

app.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);
  if (form.dataset.form === 'join-code') {
    pendingCode = String(data.get('code') || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(pendingCode)) return toast('Enter the four-character room code.');
    history.replaceState({}, '', `${location.pathname}?room=${pendingCode}`); render();
  } else if (form.dataset.form === 'join-player') {
    const name = String(data.get('name') || '').trim();
    const icon = String(data.get('icon') || '');
    if (!icon) return toast('Choose an available icon.');
    try {
      const response = await emit('room:join', { code: pendingCode, name, icon });
      saveSession({ code: response.room.code, kind: 'player', token: response.token }); room = response.room; pendingCode = ''; render();
    } catch (error) { toast(error.message); }
  }
});

try { session = JSON.parse(localStorage.getItem('nightshift-session') || 'null'); } catch { session = null; }
render();