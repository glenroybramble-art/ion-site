# Site music folder

Put the song you want to play when the site opens in this folder.

## How it works
- The home page (`index.html`) plays **`audio/ambient.mp3`** on a loop while someone is on the site.
- A small **♪ button** in the bottom-right corner lets visitors turn it on/off. Their choice is remembered.

## To set your music
1. Name your file **`ambient.mp3`** and drop it in this `audio/` folder (replace this README's neighbor — keep the file name exactly `ambient.mp3`).
2. Commit/upload it to the `ion-site` repo (same folder).
3. Done — it plays automatically.

To use a different file name, change `src="audio/ambient.mp3"` in `index.html` to match.

## Important note about autoplay
Web browsers **block audio with sound from playing until the visitor interacts with the page** (a click, key press, or scroll). This is a browser rule, not a site bug. So the music starts the instant the visitor does *anything* on the page — and there's a ♪ button so they can start/stop it themselves.

## Format tips
- Use **.mp3** (most compatible). Keep it reasonably small (a 3–5 MB file loads fast).
- You can add more tracks later and we can build a rotating playlist if you want.
