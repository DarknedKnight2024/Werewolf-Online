# Werewolf-Online

Nightshift is a cross-device One Night Werewolf game. The moderator creates a room and chooses the deck; they are not a player. The moderator uses `/moderator`; players join at `/join` or directly through `/join/123456` with the six-digit room code.

## Run locally

```sh
npm install
npm start
```

Open `http://localhost:3000/join` for players or `http://localhost:3000/moderator` to host. Other devices on the same network can use the host machine's LAN address and the same route.

Players see a private role reveal before setup. If a Sentinel is dealt, the Sentinel privately places a public shield before Doppelganger setup. Players then submit night actions independently; the server applies card changes in role order after everyone is ready. Shielded cards cannot be viewed or swapped. The information phase shows only what a player saw or did, plus role-card previews for cards they observed, not their final card by default.

The moderator can choose the role deck in the listed night-action order and select the Curator's artifact pool. Role icons are grouped by category and can be changed while the lobby is open. Rematches keep the roster and role settings but clear temporary game state. Each player casts one vote; only an unprotected player with more than one vote can be eliminated. Bodyguard vote protection can move elimination to the next-highest eligible player.

## Deploy

The included `render.yaml` deploys the Node server with a persistent disk for saved rooms. Push this repository to a Git provider, create a Render Blueprint from it, and use the public URL Render provides. The server stores room state in `DATA_DIR`; if deploying elsewhere, configure that variable to a persistent mounted directory. Without persistent storage, live multiplayer still works, but rooms do not survive server restarts.

Private role cards, action details, observed cards, and artifact identities are sent only to the relevant player's session. Room codes are six-digit numbers. Active rooms are persisted by the server when `DATA_DIR` points to durable storage.

## Accounts and security

Accounts use email and a password of at least 12 characters. Passwords are stored as scrypt hashes; account records are encrypted with AES-256-GCM. Production requires `ACCOUNT_ENCRYPTION_KEY`, a base64-encoded 32-byte key kept in the hosting provider's secret manager and separate from the persistent disk. Generate one with `openssl rand -base64 32`. Losing this key makes the encrypted account store unrecoverable. Email verification and password reset are not configured, so account recovery is not currently available.

Common starter icons are distributed across the Woodland, Wildlife, and Nature themes; Sky & Space, Mystic, and Oddities have no common tier. Uncommon through ultra icons can be bought with coins; completed games award 25 coins and wins award a 15-coin bonus. Legendary, mythical, and ancient icons are reserved for events. These prices and rewards are initial balancing values.