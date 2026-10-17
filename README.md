# Werewolf-Online

Nightshift is a cross-device One Night Werewolf game. The moderator creates a room and chooses the deck; they are not a player. Players join from their own devices using the room code.

## Run locally

```sh
npm install
npm start
```

Open `http://localhost:3000`. Other devices on the same network can join using the host machine's LAN address and port 3000.

## Deploy

The included `render.yaml` deploys the Node server with a persistent disk for saved rooms. Push this repository to a Git provider, create a Render Blueprint from it, and use the public URL Render provides. The server stores room state in `DATA_DIR`; if deploying elsewhere, configure that variable to a persistent mounted directory. Without persistent storage, live multiplayer still works, but rooms do not survive server restarts.

Private role cards and night information are sent only to the relevant player's connected session. Room codes are four characters and active rooms are stored on the server.