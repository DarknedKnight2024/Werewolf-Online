const ROLES = [
  { name: 'Doppelganger', color: '#4167d5' },
  { name: 'Werewolf', color: '#202b28' },
  { name: 'Minion', color: '#8172b2' },
  { name: 'Mason', color: '#45988c' },
  { name: 'Seer', color: '#4c77d7' },
  { name: 'Robber', color: '#d09134' },
  { name: 'Troublemaker', color: '#e27859' },
  { name: 'Drunk', color: '#ba668b' },
  { name: 'Insomniac', color: '#5599b5' },
  { name: 'Hunter', color: '#d35c49' },
  { name: 'Tanner', color: '#a87854' },
  { name: 'Villager', color: '#65915d' },
];
const ICONS = ['🌙', '🦊', '🐺', '🦉', '🦇', '🐈', '🦌', '🐸', '🦝', '🐻', '🕯️', '🍄'];
const PHASES = ['Lobby', 'Roles', 'Night', 'Information', 'Discuss', 'Vote', 'Reveal'];
const ROLE_ORDERS = ['Werewolf', 'Minion', 'Mason', 'Seer', 'Robber', 'Troublemaker', 'Drunk', 'Insomniac', 'Hunter', 'Tanner', 'Villager'];
const QUESTIONS = [
  'Who would be the last person you would trust with a secret?',
  'Who is most likely to make it through a night in the woods?',
  'Who would you want beside you in a suspiciously quiet village?',
  'Who has the most convincing poker face?',
];
let state = null;
let toastTimer = null;
let clockInterval = null;
const app = document.querySelector('#app');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function shuffle(list) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}
function playerById(id) { return state.players.find((player) => player.id === id); }
function playerName(id) { return playerById(id)?.name || 'Unknown player'; }
function roleInfo(role) { return ROLES.find((item) => item.name === role) || ROLES.at(-1); }
function toast(message) {
  document.querySelector('.toast')?.remove();
  const element = document.createElement('div');
  element.className = 'toast';
  element.textContent = message;
  document.body.append(element);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.remove(), 2800);
}
function codeValue() { return Math.random().toString(36).slice(2, 6).toUpperCase(); }
function render() {
  app.innerHTML = `<div class="shell"><header class="topbar"><a class="brand" href="#" data-action="home"><span class="brand-mark">✳</span><span class="brand-name">werewolf<span>online</span></span></a><span class="top-note">One night. One village. No alibis.</span></header><main class="page">${state ? renderRoom() : renderHome()}</main></div>`;
}
function renderHome() {
  return `<section class="intro"><div class="intro-copy"><div class="eyebrow">A social deduction game</div><h1>Night falls.<br>Trust nobody.</h1><p>Deal the cards, close your eyes, and figure out who changed what before the village wakes.</p></div><div class="night-stamp" aria-hidden="true">☾</div></section>
    <section class="home-grid"><div class="host-panel panel"><div class="eyebrow">Gather your people</div><h2>Start a game<br>around the table.</h2><p>Choose the roles, share a join code, and guide everyone through one wonderfully suspicious night.</p><button class="btn btn-lime" data-action="create-room">Host a game <span aria-hidden="true">→</span></button></div>
    <div class="join-panel panel"><div class="eyebrow">Have a code?</div><h2>Join the village.</h2><p>Enter your host's room code and choose a name and icon. Every icon can only be claimed once.</p><form class="join-form" data-form="join"><div class="field"><label for="join-code">ROOM CODE</label><input class="input" id="join-code" name="code" maxlength="4" placeholder="e.g. M7QK" autocomplete="off" required></div><button class="btn" type="submit">Join <span aria-hidden="true">→</span></button></form></div></section>
    <div class="how-row"><div class="how-chip"><b>01</b> Set the deck</div><div class="how-chip"><b>02</b> Play the night</div><div class="how-chip"><b>03</b> Find the wolf</div></div>`;
}
function createRoom() {
  const host = { id: crypto.randomUUID(), name: 'Host', icon: ICONS[0], host: true };
  const roles = Object.fromEntries(ROLES.map((role) => [role.name, 0]));
  roles.Werewolf = 1;
  roles.Seer = 1;
  roles.Villager = 2;
  const question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  const nightQuestions = QUESTIONS.filter((item) => item !== question);
  state = { code: codeValue(), players: [host], roles, stage: 'lobby', question, nightQuestion: nightQuestions[Math.floor(Math.random() * nightQuestions.length)], addPlayer: false, roleCopies: {}, setupIndex: 0, nightQueue: [], nightIndex: 0, infoIndex: 0, votes: {}, voteIndex: 0, selection: [], nightAnswer: null, seerMode: 'player', discussionSeconds: 300, timerRunning: false, reveal: null };
  render();
}
function renderRoom() {
  if (state.stage === 'lobby') return renderLobby();
  return renderGame();
}
function playerRows() {
  return state.players.map((player) => `<div class="player-row"><span class="player-icon">${player.icon}</span><span class="player-name">${escapeHtml(player.name)}</span>${player.host ? '<span class="host-tag">Host</span>' : ''}</div>`).join('');
}
function roleCounts() { return Object.values(state.roles).reduce((sum, number) => sum + number, 0); }
function renderLobby() {
  const needed = state.players.length + 3;
  const total = roleCounts();
  const valid = total === needed;
  const roleRows = ROLES.map(({ name, color }) => `<div class="role-row"><span class="role-title"><i class="role-dot" style="--role-color:${color}"></i>${name}</span><button aria-label="Remove ${name}" data-action="role-minus" data-role="${name}">−</button><span class="role-qty">${state.roles[name]}</span><button aria-label="Add ${name}" data-action="role-plus" data-role="${name}">+</button></div>`).join('');
  return `<div class="room-head"><div><div class="eyebrow">Room lobby</div><h1>Build your village.</h1><p>Add players and choose ${needed} cards for this ${state.players.length}-player game.</p></div><div class="code-box"><div><small>Join code</small><strong>${state.code}</strong></div><button class="btn btn-quiet" data-action="copy-code" aria-label="Copy room code">▣</button></div></div>
    <div class="room-layout"><section class="section-panel panel"><div class="section-head"><h2>Players</h2><span class="count-label">${state.players.length} / 12</span></div><div class="player-list">${playerRows()}</div>${state.addPlayer ? renderAddPlayer() : `<button class="btn btn-quiet" style="margin-top:12px;width:100%" data-action="show-add-player">＋ Add local player</button>`}<div class="lobby-foot">This prototype passes the device between players. In an online game, each person would join from their own device.</div></section>
    <aside class="deck-panel panel"><div class="eyebrow">The cards</div><h2>Choose your roles.</h2><p class="deck-help">One card per player, plus three in the center. Deal 3–12 players.</p><div class="deck-total"><span>Cards selected</span><strong>${total} / ${needed}</strong></div><div class="role-list">${roleRows}</div><div class="deck-status ${valid ? '' : 'invalid'}">${valid ? 'Deck is ready to deal.' : `${total < needed ? `${needed - total} more` : `${total - needed} too many`} card${Math.abs(needed - total) === 1 ? '' : 's'} to match player count.`}</div><div class="room-actions"><button class="btn" data-action="start-game" ${!valid || state.players.length < 3 ? 'disabled' : ''}>Deal the cards <span aria-hidden="true">→</span></button><button class="btn btn-quiet" data-action="home">Leave room</button></div>${state.players.length < 3 ? '<p class="muted-small" style="margin:10px 0 0">At least 3 players are needed to start.</p>' : ''}</aside></div>`;
}
function renderAddPlayer() {
  const used = state.players.map((player) => player.icon);
  const iconChoices = ICONS.map((icon) => `<button type="button" class="choice-btn ${used.includes(icon) ? 'selected' : ''}" data-action="choose-icon" data-icon="${icon}" ${used.includes(icon) ? 'disabled' : ''} aria-label="Choose icon ${icon}">${icon}${used.includes(icon) ? ' In use' : ''}</button>`).join('');
  return `<form data-form="add-player" class="action-box"><h3>Join this table</h3><div class="field"><label for="player-name">PLAYER NAME</label><input class="input" id="player-name" name="name" maxlength="18" placeholder="Name" required></div><div class="field" style="margin-top:12px"><span class="field-label">CHOOSE AN ICON</span><div class="choice-grid">${iconChoices}</div><input type="hidden" name="icon" value=""></div><div class="action-footer"><span class="note">Icons already in use are unavailable.</span><button class="btn" type="submit">Join room</button></div></form>`;
}
function phaseIndex() {
  const phaseByStage = { lobby: -1, setup: 1, night: 2, info: 3, discussion: 4, voting: 5, results: 6 };
  return phaseByStage[state.stage] ?? 0;
}
function renderPhaseBar() {
  const current = phaseIndex();
  return `<div class="phase-bar">${PHASES.map((phase, index) => `<div class="phase-item ${index === current ? 'active' : index < current ? 'done' : ''}"><span class="phase-n">0${index + 1}</span>${phase}</div>`).join('')}</div>`;
}
function currentTurnPlayer() {
  if (state.stage === 'setup') return state.players[state.setupIndex];
  if (state.stage === 'night') return state.nightQueue[state.nightIndex]?.players?.[0];
  if (state.stage === 'info') return state.players[state.infoIndex];
  if (state.stage === 'voting') return state.players[state.voteIndex];
  return null;
}
function currentPlayerPanel() {
  const player = currentTurnPlayer();
  if (!player) return `<aside class="side-card panel"><h3>At the table</h3><div class="player-list">${playerRows()}</div></aside>`;
  const role = player.effectiveRole ? (player.card === 'Doppelganger' ? `Doppelganger → ${player.effectiveRole}` : player.effectiveRole) : 'Your role is secret';
  return `<aside class="side-card panel"><h3>Pass the device</h3><div class="current-player"><span class="player-icon">${player.icon}</span><div><div class="current-player-name">${escapeHtml(player.name)}</div><div class="current-player-role">${escapeHtml(role)}</div></div></div><div class="turn-list">${state.players.map((entry, index) => `<div class="turn-row ${entry.id === player.id ? 'active' : index < (state.stage === 'setup' ? state.setupIndex : state.stage === 'info' ? state.infoIndex : state.stage === 'voting' ? state.voteIndex : 0) ? 'done' : ''}"><i></i>${entry.icon} ${escapeHtml(entry.name)}</div>`).join('')}</div><div class="side-rule">Keep the screen private while the next player takes their turn.</div></aside>`;
}
function renderGame() {
  return `${renderPhaseBar()}<div class="game-grid"><section class="main-card panel">${state.stage === 'setup' ? renderSetup() : state.stage === 'night' ? renderNight() : state.stage === 'info' ? renderInfo() : state.stage === 'discussion' ? renderDiscussion() : state.stage === 'voting' ? renderVoting() : renderResults()}</section>${currentPlayerPanel()}</div>`;
}
function renderSetup() {
  const player = state.players[state.setupIndex];
  const isDoppel = player.card === 'Doppelganger';
  const targets = state.players.filter((other) => other.id !== player.id);
  const options = targets.map((target) => `<button class="choice-btn ${state.selection[0] === target.id ? 'selected' : ''}" data-action="select-player" data-id="${target.id}"><span class="player-icon">${target.icon}</span>${escapeHtml(target.name)}</button>`).join('');
  const percentage = player.setupTarget ? Math.round(state.players.filter((person) => person.setupTarget === player.setupTarget).length / state.players.filter((person) => person.setupTarget).length * 100) : null;
  return `<div class="eyebrow">Phase 01 · Setup</div><h2>${isDoppel ? 'Choose a card to copy.' : 'One last question.'}</h2><p>${isDoppel ? 'Look at one player’s card. You become that role and will perform its night action first.' : 'Everyone gets the same question. Pick a player, then keep your answer to yourself.'}</p>${isDoppel ? '' : `<div class="question-prompt">${escapeHtml(state.question)}</div>`}<div class="action-box"><h3>${player.icon} ${escapeHtml(player.name)}’s choice</h3><div class="choice-grid">${options}</div><div class="action-footer"><span class="note">${isDoppel ? 'Your copied role stays secret.' : 'Answers are revealed as a group after setup.'}</span><button class="btn" data-action="submit-setup" ${state.selection.length === 0 ? 'disabled' : ''}>${state.setupIndex === state.players.length - 1 ? 'Finish setup' : 'Lock answer & pass'} →</button></div></div>`;
}
function effectiveRole(player) { return player.startCard === 'Doppelganger' ? player.effectiveRole : player.card; }
function needsNightQuestion(action) {
  return ['Minion', 'Mason', 'Insomniac', 'Hunter', 'Tanner', 'Villager'].includes(action.role)
    || (action.role === 'Werewolf' && action.players.length > 1);
}
function setupNight() {
  const queue = [];
  const completed = new Set();
  const doppelPlayers = state.players.filter((player) => player.card === 'Doppelganger');
  const wolfGroup = state.players.filter((player) => effectiveRole(player) === 'Werewolf');
  for (const player of doppelPlayers) {
    const role = effectiveRole(player);
    if (role === 'Werewolf') {
      if (!completed.has('Werewolf')) queue.push({ role: 'Werewolf', players: wolfGroup, doppel: true });
      completed.add('Werewolf');
    } else {
      queue.push({ role, players: [player], doppel: true });
      if (role === 'Minion' || role === 'Mason') completed.add(`${role}:${player.id}`);
    }
  }
  for (const role of ROLE_ORDERS) {
    let players = state.players.filter((player) => player.card === role);
    if (role === 'Werewolf' && completed.has('Werewolf')) players = [];
    if (!players.length) continue;
    if (['Werewolf', 'Minion', 'Mason'].includes(role)) queue.push({ role, players });
    else players.forEach((player) => queue.push({ role, players: [player] }));
  }
  state.nightQueue = queue;
  state.nightIndex = 0;
  state.selection = [];
  state.stage = 'night';
}
function renderNight() {
  const action = state.nightQueue[state.nightIndex];
  if (!action) return `<div class="eyebrow">Phase 02 · Night</div><h2>The village wakes.</h2><p>All night actions are complete. Your observations are ready.</p><button class="btn" data-action="begin-info">Go to information →</button>`;
  const role = action.role;
  const actors = action.players;
  const player = actors[0];
  const doppelLabel = action.doppel ? `Doppelganger → ${role}` : role;
  let description = '';
  let controls = '';
  const actionName = action.doppel ? 'Doppelganger’s copied action' : `${role} action`;
  if (role === 'Werewolf') {
    const others = actors.slice(1);
    description = others.length ? `Wake together. The other werewolf${others.length > 1 ? 's are' : ' is'} ${others.map((item) => `${item.icon} ${escapeHtml(item.name)}`).join(', ')}.` : 'You are alone. Look at one of the three center cards.';
    controls = others.length ? `<div class="empty">Werewolves: ${actors.map((item) => `${item.icon} ${escapeHtml(item.name)}`).join(' · ')}</div><button class="btn" data-action="complete-action">Continue</button>` : renderCenterChoices(1);
  } else if (role === 'Minion') {
    description = 'See who the werewolves are. They will not learn who you are.';
    controls = `<div class="empty">This information will appear in your private information screen.</div><button class="btn" data-action="complete-action">Continue</button>`;
  } else if (role === 'Mason') {
    description = 'Wake and find any other Masons.';
    const others = state.players.filter((item) => item.id !== player.id && effectiveRole(item) === 'Mason');
    controls = `<div class="empty">${others.length ? `Other Mason${others.length > 1 ? 's' : ''}: ${others.map((item) => `${item.icon} ${escapeHtml(item.name)}`).join(', ')}` : 'You are the only Mason.'}</div><button class="btn" data-action="complete-action">Continue</button>`;
  } else if (role === 'Seer') {
    description = 'Look at one player’s card, or look at two cards in the center.';
    controls = `<div class="button-row"><button class="btn btn-quiet ${state.seerMode === 'player' ? 'selected' : ''}" data-action="seer-mode" data-mode="player">One player</button><button class="btn btn-quiet ${state.seerMode === 'center' ? 'selected' : ''}" data-action="seer-mode" data-mode="center">Two center cards</button></div>${state.seerMode === 'player' ? renderPlayerChoices(player.id, 1) : renderCenterChoices(2)}`;
  } else if (role === 'Robber') {
    description = 'Swap your card with another player’s card. You will privately see your new card.';
    controls = renderPlayerChoices(player.id, 1);
  } else if (role === 'Troublemaker') {
    description = 'Choose two other players and swap their cards. You will not see either card.';
    controls = renderPlayerChoices(player.id, 2);
  } else if (role === 'Drunk') {
    description = 'Swap your card with one of the three center cards. You will not look at the new card.';
    controls = renderCenterChoices(1);
  } else if (role === 'Insomniac') {
    description = 'At the end of the night, check whether your card changed.';
    controls = `<div class="empty">You’ll see your final card in the information phase.</div><button class="btn" data-action="complete-action">Continue</button>`;
  } else {
    description = 'Answer the question, then let the next player take their turn.';
    controls = `<div class="empty">No night action tonight. Answer the night question, then continue.</div><button class="btn" data-action="complete-action" ${state.nightAnswer ? '' : 'disabled'}>Continue</button>`;
  }
  const nightQuestion = needsNightQuestion(action) ? `<div class="action-box"><h3>Night question</h3><div class="question-prompt">${escapeHtml(state.nightQuestion)}</div><div class="choice-grid" style="margin-top:11px">${state.players.filter((item) => item.id !== player.id).map((item) => `<button class="choice-btn ${state.nightAnswer === item.id ? 'selected' : ''}" data-action="night-answer" data-id="${item.id}">${item.icon} ${escapeHtml(item.name)}</button>`).join('')}</div><div class="note" style="margin-top:8px">${actors.length > 1 ? 'Choose together as a group.' : 'Choose a player before continuing.'}</div></div>` : '';
  return `<div class="eyebrow">Phase 02 · Night action ${state.nightIndex + 1} of ${state.nightQueue.length}</div><h2>${escapeHtml(doppelLabel)}.</h2><p>${escapeHtml(description)}</p>${nightQuestion}<div class="action-box"><h3>${actionName}</h3><p style="margin-bottom:13px">${actors.map((item) => `${item.icon} ${escapeHtml(item.name)}`).join(' · ')}</p>${controls}${actors.length > 1 && role !== 'Werewolf' ? `<div class="action-footer"><span class="note">Passing to the first player in this group.</span></div>` : ''}</div>`;
}
function renderPlayerChoices(excludeId, amount) {
  const others = state.players.filter((player) => player.id !== excludeId);
  return `<div class="choice-grid" style="margin-top:13px">${others.map((player) => `<button class="choice-btn ${state.selection.includes(player.id) ? 'selected' : ''}" data-action="select-player" data-id="${player.id}" ${!state.selection.includes(player.id) && state.selection.length >= amount ? 'disabled' : ''}><span class="player-icon">${player.icon}</span>${escapeHtml(player.name)}</button>`).join('')}</div><div class="action-footer"><span class="note">Choose ${amount === 1 ? 'one player' : 'two players'}.</span><button class="btn" data-action="submit-night" ${state.selection.length !== amount ? 'disabled' : ''}>Confirm action</button></div>`;
}
function renderCenterChoices(amount) {
  return `<div class="center-cards">${[0, 1, 2].map((index) => `<button class="center-card ${state.selection.includes(`c${index}`) ? 'selected' : ''}" data-action="select-center" data-index="${index}" ${!state.selection.includes(`c${index}`) && state.selection.length >= amount ? 'disabled' : ''}>CENTER ${index + 1}</button>`).join('')}</div><div class="action-footer"><span class="note">Choose ${amount} center card${amount > 1 ? 's' : ''}.</span><button class="btn" data-action="submit-night" ${state.selection.length !== amount ? 'disabled' : ''}>Confirm action</button></div>`;
}
function completeNightAction() {
  const action = state.nightQueue[state.nightIndex];
  if (needsNightQuestion(action) && !state.nightAnswer) return toast('Answer the night question before continuing.');
  if (needsNightQuestion(action)) action.players.forEach((player) => player.events.push(`Night question: chose ${playerName(state.nightAnswer)}.`));
  if (action.role === 'Minion') {
    const wolves = state.players.filter((item) => effectiveRole(item) === 'Werewolf');
    const report = wolves.length ? `Saw the werewolves: ${wolves.map((item) => item.name).join(', ')}.` : 'Saw no werewolves.';
    action.players.forEach((player) => player.events.push(report));
  }
  if (action.role === 'Mason') {
    const others = state.players.filter((item) => item.id !== action.players[0].id && effectiveRole(item) === 'Mason');
    const report = others.length ? `Saw the other Mason${others.length > 1 ? 's' : ''}: ${others.map((item) => item.name).join(', ')}.` : 'Saw no other Masons.';
    action.players.forEach((player) => player.events.push(report));
  }
  state.nightIndex += 1;
  state.selection = [];
  state.nightAnswer = null;
  state.seerMode = 'player';
  if (state.nightIndex >= state.nightQueue.length) state.stage = 'info';
  render();
}
function submitNightAction() {
  const action = state.nightQueue[state.nightIndex];
  const actor = action.players[0];
  const role = action.role;
  if (role === 'Werewolf') {
    const centerIndex = Number(state.selection[0].slice(1));
    action.players.forEach((player) => player.events.push(`Looked at center card ${centerIndex + 1}: ${state.center[centerIndex]}.`));
  } else if (role === 'Seer') {
    if (state.seerMode === 'player') {
      const target = playerById(state.selection[0]);
      actor.events.push(`Saw ${target.name}’s card: ${target.card}.`);
    } else {
      const cards = state.selection.map((selected) => state.center[Number(selected.slice(1))]);
      actor.events.push(`Saw two center cards: ${cards.join(' and ')}.`);
    }
  } else if (role === 'Robber') {
    const target = playerById(state.selection[0]);
    [actor.card, target.card] = [target.card, actor.card];
    actor.events.push(`Swapped cards with ${target.name}. Your new card is ${actor.card}.`);
  } else if (role === 'Troublemaker') {
    const first = playerById(state.selection[0]);
    const second = playerById(state.selection[1]);
    [first.card, second.card] = [second.card, first.card];
    actor.events.push(`Swapped ${first.name}’s and ${second.name}’s cards.`);
  } else if (role === 'Drunk') {
    const index = Number(state.selection[0].slice(1));
    [actor.card, state.center[index]] = [state.center[index], actor.card];
    actor.events.push('Swapped your card with a center card. You do not know which role you now hold.');
  }
  completeNightAction();
}
function renderInfo() {
  const player = state.players[state.infoIndex];
  const lines = [...player.events];
  if (player.startCard === 'Doppelganger' && player.effectiveRole) lines.unshift(`You copied the ${player.effectiveRole}.`);
  if (effectiveRole(player) === 'Mason' && !lines.some((line) => line.includes('Mason'))) {
    const masons = state.players.filter((item) => item.id !== player.id && effectiveRole(item) === 'Mason');
    lines.push(masons.length ? `Other Mason${masons.length > 1 ? 's' : ''}: ${masons.map((item) => item.name).join(', ')}.` : 'You saw no other Masons.');
  }
  if (effectiveRole(player) === 'Insomniac') lines.push(`Your card is now: ${player.card}.`);
  const hasSetupAnswers = state.players.some((item) => item.setupTarget);
  const counts = hasSetupAnswers ? state.players.filter((item) => item.setupTarget === player.setupTarget).length : 0;
  const percent = hasSetupAnswers ? Math.round(counts / state.players.length * 100) : 0;
  return `<div class="eyebrow">Phase 03 · Private information</div><h2>What did you learn?</h2><p>Keep this screen to yourself. When you’re done, pass the device to the next player.</p><div class="current-player" style="margin-top:18px"><span class="player-icon">${player.icon}</span><div><div class="current-player-name">${escapeHtml(player.name)}</div><div class="current-player-role">Your private results</div></div></div>${lines.length ? `<div class="info-list">${lines.map((line) => `<div class="info-line"><span class="player-icon">✦</span><div>${escapeHtml(line)}</div></div>`).join('')}</div>` : '<div class="empty" style="margin-top:14px">Nothing to see tonight. Keep your poker face ready.</div>'}<div class="divider"></div><h3>Setup question</h3><div class="question-prompt">${escapeHtml(state.question)}</div><p class="muted-small" style="margin:8px 0 4px">You chose <strong>${escapeHtml(playerName(player.setupTarget))}</strong>. ${percent}% of players chose the same person.</p><div class="meter"><span style="width:${percent}%"></span></div><div class="action-footer"><span class="note">Player ${state.infoIndex + 1} of ${state.players.length}</span><button class="btn" data-action="next-info">${state.infoIndex === state.players.length - 1 ? 'Start discussion' : 'Hide & pass'} →</button></div>`;
}
function renderDiscussion() {
  const minutes = Math.floor(state.discussionSeconds / 60).toString().padStart(2, '0');
  const seconds = (state.discussionSeconds % 60).toString().padStart(2, '0');
  return `<div class="eyebrow">Phase 04 · Discussion</div><h2>Make your case.</h2><p>You have five minutes to compare notes, bluff, and decide who to vote out.</p><div class="discussion-time ${state.discussionSeconds <= 30 ? 'warning' : ''}">${minutes}:${seconds}</div><div class="meter"><span style="width:${state.discussionSeconds / 300 * 100}%"></span></div><div class="action-footer"><span class="note">${state.timerRunning ? 'Timer running' : 'Timer paused'}</span><div class="button-row"><button class="btn btn-quiet" data-action="timer-toggle">${state.timerRunning ? 'Pause timer' : 'Start timer'}</button><button class="btn" data-action="begin-voting">Begin vote →</button></div></div><div class="side-rule">When voting begins, each player picks one person privately. The player with the most votes is on the block.</div>`;
}
function renderVoting() {
  const player = state.players[state.voteIndex];
  const choices = state.players.filter((other) => other.id !== player.id).map((other) => `<button class="choice-btn ${state.votes[player.id] === other.id ? 'selected' : ''}" data-action="cast-vote" data-id="${other.id}"><span class="player-icon">${other.icon}</span>${escapeHtml(other.name)}</button>`).join('');
  return `<div class="eyebrow">Phase 05 · Vote</div><h2>Point to the wolf.</h2><p>Votes are sealed. Each player votes once; no one can change their choice after locking it.</p><div class="current-player" style="margin-top:18px"><span class="player-icon">${player.icon}</span><div><div class="current-player-name">${escapeHtml(player.name)}</div><div class="current-player-role">Choose one player to vote for</div></div></div><div class="vote-target">${choices}</div><div class="action-footer"><span class="note">Player ${state.voteIndex + 1} of ${state.players.length}</span><button class="btn" data-action="lock-vote" ${!state.votes[player.id] ? 'disabled' : ''}>${state.voteIndex === state.players.length - 1 ? 'Reveal votes' : 'Lock vote & pass'} →</button></div>`;
}
function countVotes() {
  const counts = Object.fromEntries(state.players.map((player) => [player.id, 0]));
  Object.values(state.votes).forEach((target) => { counts[target] = (counts[target] || 0) + 1; });
  const highest = Math.max(0, ...Object.values(counts));
  const dead = highest ? state.players.filter((player) => counts[player.id] === highest) : [];
  const hunter = dead.find((player) => effectiveRole(player) === 'Hunter');
  if (hunter && state.votes[hunter.id]) {
    const target = playerById(state.votes[hunter.id]);
    if (target && !dead.some((player) => player.id === target.id)) dead.push(target);
  }
  const tanner = dead.find((player) => effectiveRole(player) === 'Tanner');
  const wolfOut = dead.some((player) => effectiveRole(player) === 'Werewolf');
  const wolvesRemain = state.players.some((player) => effectiveRole(player) === 'Werewolf' && !dead.some((item) => item.id === player.id));
  const winner = tanner ? `${tanner.name} wins as the Tanner.` : wolfOut ? 'The village wins. A werewolf was voted out.' : !wolvesRemain ? 'The village wins. No werewolves remain among the players.' : 'The werewolves win. The village missed.';
  return { counts, dead, winner };
}
function renderResults() {
  const { counts, dead, winner } = countVotes();
  const deadIds = dead.map((player) => player.id);
  const cards = state.players.map((player) => `<div class="reveal-card"><div class="reveal-card-top"><span class="player-icon">${player.icon}</span>${escapeHtml(player.name)}${deadIds.includes(player.id) ? ' · VOTED OUT' : ''}</div><div class="reveal-role"><span>Dealt</span><strong>${escapeHtml(player.startCard)}</strong></div>${player.startCard === 'Doppelganger' ? `<div class="reveal-role"><span>Copied</span><strong>${escapeHtml(player.effectiveRole || 'Doppelganger')}</strong></div>` : ''}<div class="reveal-role"><span>Final card</span><strong>${escapeHtml(player.card)}</strong></div><div class="reveal-role"><span>Votes</span><strong>${counts[player.id]}</strong></div></div>`).join('');
  return `<div class="eyebrow">Phase 06 · Reveal</div><h2>The village decides.</h2><div class="result-banner"><span style="font-size:25px">${dead.length ? '☠' : '✦'}</span><div><strong>${escapeHtml(winner)}</strong><span>${dead.length ? `Voted out: ${dead.map((player) => player.name).join(', ')}.` : 'No one received a vote.'}</span></div></div><p>All votes are in. Here’s what everyone was holding after the night’s swaps.</p><div class="reveal-grid">${cards}</div><div class="action-footer"><span class="note">The three center cards stay hidden until now.</span><button class="btn" data-action="play-again">Back to lobby</button></div><div class="side-rule">Center cards: ${state.center.map((card, index) => `#${index + 1} ${escapeHtml(card)}`).join(' · ')}</div>`;
}
function dealCards() {
  if (state.players.length < 3 || roleCounts() !== state.players.length + 3) return;
  const deck = shuffle(ROLES.flatMap(({ name }) => Array(state.roles[name]).fill(name)));
  state.players.forEach((player, index) => {
    player.card = deck[index];
    player.startCard = deck[index];
    player.events = [];
    player.setupTarget = null;
    player.effectiveRole = null;
    player.voteTarget = null;
  });
  state.center = deck.slice(state.players.length);
  state.setupIndex = 0;
  state.selection = [];
  state.stage = 'setup';
  render();
}
function submitSetup() {
  const player = state.players[state.setupIndex];
  player.setupTarget = state.selection[0];
  if (player.card === 'Doppelganger') {
    const target = playerById(player.setupTarget);
    player.effectiveRole = target.card;
  }
  state.setupIndex += 1;
  state.selection = [];
  if (state.setupIndex >= state.players.length) setupNight();
  render();
}
function toggleSelection(value, amount) {
  if (state.selection.includes(value)) state.selection = state.selection.filter((item) => item !== value);
  else if (state.selection.length < amount) state.selection.push(value);
  render();
}
function beginInfo() { state.stage = 'info'; state.infoIndex = 0; render(); }
function nextInfo() {
  state.infoIndex += 1;
  if (state.infoIndex >= state.players.length) {
    state.stage = 'discussion';
    state.timerRunning = false;
    state.discussionSeconds = 300;
  }
  render();
}
function toggleTimer() {
  state.timerRunning = !state.timerRunning;
  if (state.timerRunning) {
    clearInterval(clockInterval);
    clockInterval = setInterval(() => {
      if (!state || state.stage !== 'discussion' || !state.timerRunning) return;
      state.discussionSeconds = Math.max(0, state.discussionSeconds - 1);
      if (!state.discussionSeconds) {
        state.timerRunning = false;
        clearInterval(clockInterval);
      }
      render();
    }, 1000);
  }
  render();
}
function beginVoting() { state.timerRunning = false; clearInterval(clockInterval); state.stage = 'voting'; state.voteIndex = 0; state.votes = {}; render(); }
function leaveToLobby() {
  clearInterval(clockInterval);
  state.stage = 'lobby';
  state.players.forEach((player) => { delete player.card; delete player.startCard; delete player.events; delete player.setupTarget; delete player.effectiveRole; });
  render();
}
function addPlayer(name, icon) {
  if (state.players.length >= 12) return toast('This table is full.');
  if (!ICONS.includes(icon) || state.players.some((player) => player.icon === icon)) return toast('Choose an available icon first.');
  state.players.push({ id: crypto.randomUUID(), name: name.trim(), icon, host: false });
  state.roles.Villager += 1;
  state.addPlayer = false;
  render();
}
function handleClick(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const { action } = target.dataset;
  if (action === 'home') { clearInterval(clockInterval); state = null; render(); }
  else if (action === 'create-room') createRoom();
  else if (action === 'show-add-player') { state.addPlayer = true; render(); }
  else if (action === 'choose-icon') {
    const form = target.closest('form');
    form.querySelector('[name="icon"]').value = target.dataset.icon;
    form.querySelectorAll('[data-action="choose-icon"]').forEach((button) => button.classList.toggle('selected', button === target));
  } else if (action === 'copy-code') navigator.clipboard?.writeText(state.code).then(() => toast('Room code copied.')).catch(() => toast(`Room code: ${state.code}`));
  else if (action === 'role-plus' || action === 'role-minus') {
    const role = target.dataset.role;
    state.roles[role] = Math.max(0, state.roles[role] + (action === 'role-plus' ? 1 : -1));
    render();
  } else if (action === 'start-game') dealCards();
  else if (action === 'select-player') toggleSelection(target.dataset.id, state.stage === 'night' && state.nightQueue[state.nightIndex]?.role === 'Troublemaker' ? 2 : 1);
  else if (action === 'select-center') toggleSelection(`c${target.dataset.index}`, state.stage === 'night' && state.nightQueue[state.nightIndex]?.role === 'Seer' && state.seerMode === 'center' ? 2 : 1);
  else if (action === 'submit-setup') submitSetup();
  else if (action === 'seer-mode') { state.seerMode = target.dataset.mode; state.selection = []; render(); }
  else if (action === 'submit-night') submitNightAction();
  else if (action === 'complete-action') completeNightAction();
  else if (action === 'begin-info') beginInfo();
  else if (action === 'next-info') nextInfo();
  else if (action === 'timer-toggle') toggleTimer();
  else if (action === 'begin-voting') beginVoting();
  else if (action === 'cast-vote') { state.votes[state.players[state.voteIndex].id] = target.dataset.id; render(); }
  else if (action === 'lock-vote') {
    state.voteIndex += 1;
    if (state.voteIndex >= state.players.length) state.stage = 'results';
    render();
  } else if (action === 'play-again') leaveToLobby();
}
app.addEventListener('click', handleClick);
app.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.target;
  if (form.dataset.form === 'join') {
    const code = new FormData(form).get('code').toString().trim().toUpperCase();
    if (!state || state.code !== code || state.stage !== 'lobby') return toast('No open room found with that code on this device.');
    state.addPlayer = true;
    render();
    document.querySelector('#player-name')?.focus();
  } else if (form.dataset.form === 'add-player') {
    const data = new FormData(form);
    if (!data.get('icon')) return toast('Choose an available icon.');
    if (!data.get('name').trim()) return toast('Enter a player name.');
    addPlayer(data.get('name'), data.get('icon'));
  }
});
render();