# T29 Completion Report — Real-Browser Portrait UI Visual Audit v1

## Scope

- Added a Playwright Chromium capture tool for the single-file mobile distribution.
- Replayed normal canvas tap paths instead of adding a debug screen-switch API.
- Captured title, character selection, Bullet selection, all three character-detail tabs, Hakuma trial selection, provisional battle, pause, provisional move list, and result.
- Audited three portrait viewport sizes: 320×568, 390×844, and 430×932.
- Preserved a manually triggered GitHub Actions workflow that uploads the screenshots and manifest as an artifact.
- Added lightweight normal-CI tests that protect the discovered visual fixes without downloading Chromium on every pull request.

## Capture result

- Viewports: 3
- States per viewport: 11
- Screenshots: 33
- Page errors: 0
- Console errors: 0
- First audit artifact: `8964767369`
- Corrected audit artifact: `8964962338`
- Corrected artifact digest: `sha256:ec1c6ecd3a5300cf304a14ff59bc3715936d3da9a619a6dc2e40f3b53cf97321`

## Defects found and fixed

### 1. Character-detail header displayed `undefined`

Cause: the browser character catalog exposes `nameJa`, while the detail renderer referenced `name`.

Fix: render `c.nameJa`.

### 2. Performance BRK row overlapped overall difficulty

Cause: the performance card was 190 logical pixels high and overall difficulty was positioned at `y + 174`, immediately after the fifth stat row.

Fix:

- Performance card height: 218 logical pixels
- Overall-difficulty position: `y + 198`
- Following-content offset: 230 logical pixels

## Visual review result

The corrected capture was reviewed at all three viewport sizes.

- Character names and styles remain separated from character art.
- The 2×5 roster grid remains aligned.
- The tenth mystery cell remains visible.
- Nose-centered face crops remain legible.
- Bullet remains scaled from the dedicated head/body crop instead of the tail extent.
- Character-detail header is correct.
- All five performance rows and overall difficulty are separated.
- The 320×568 detail view keeps the back button visible while lower cards remain intentionally scrollable.
- Planned-character selection, battle label, pause, move list, and result remain readable.
- No new clipping or control overlap was found in the captured states.

## Workflow policy

The Chromium screenshot workflow is manual (`workflow_dispatch`) because installing a browser for every UI-related pull request is expensive. Normal pull requests run a lightweight contract test covering:

- all three viewport definitions
- all eleven capture states
- browser-error collection
- the two visual fixes
- the manual workflow contract

## Non-goals

- No gameplay, input, balance, online protocol, server, roster authority, or asset changes.
- No visual-diff threshold or screenshot baseline approval system yet.
- No dedicated sprites for provisional characters.
