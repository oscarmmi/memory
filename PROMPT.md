Build a memory matching game in THIS folder: C:\xampp\htdocs\memory

A recruiter-ready browser memory game. Playable, polished, no backend.

## Game
- Call it "Pairlight". Original neon glyphs, no licensed characters.
- 4×4 board, 8 unique glyph pairs (16 cards). Shuffle on each new game.
- Click/tap a card to flip it. Flip a second card. Match stays face-up. Mismatch flips both back after ~700ms. Ignore extra clicks while two unmatched cards are showing.
- Moves increment once per pair attempt. Live timer from first flip. R restarts.
- Keyboard: arrow keys move a highlight, Enter/Space flips. Pointer and touch on the card.
- Local best (fewest moves, then fastest time) in localStorage.

## UI
- Deep charcoal table, glowing glyph cards, flip animation. Not a default Vite page. No Vue logo.
- 390px phone and 1280px desktop.

## Tests
- Vitest (pure logic): a new board has eight unique pairs; a matching pair stays revealed; a mismatch is not a win; completing all eight pairs is a win.
- `npm test` and `npm run build` must pass.

## GitHub
- Repo: https://github.com/oscarmmi/memory
- Pages: https://oscarmmi.github.io/memory/
- vite base `/memory/`
- Commit: feat: add memory
- First commit must `git add -A` so package.json, vite.config.ts, tsconfigs, src/main.ts, index.html, .gitignore, and .github/workflows/pages.yml ship with the game.
- gh repo edit --description "Pairlight memory matching in Vue 3 + TypeScript, playable on GitHub Pages." --add-topic vue --add-topic typescript --add-topic game --add-topic memory --add-topic puzzle
- Stop. Print the repo URL and Pages URL.
