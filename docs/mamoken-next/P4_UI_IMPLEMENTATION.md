# P4 UI implementation — mountain tournament / journey notebook

Issue #213, direction PR #214. This is a trial interpretation of direction A for competition and B for the editor/journey, not a claim of the user's visual approval. Base PR #209 `8ab89722`; runtime dependency: P0's shared HUD/input/native viewport work. No P2 model generation, body-part expansion or skill compatibility change is included.

## Implemented UI

- The five-mode entry keeps all existing routes. Main match is the dominant illustrated section; the journey is a broad pale travel slip; Arcade, Practice and Survival have smaller distinct roles. The player sees 8-match, practice and HP-carry intentions without opening another menu. Original marmot model portraits provide the character art.
- `shared-ui/design-tokens.css` defines color, typography, spacing, 44px target minimum, focus and motion timings. `mountain-ui.css` skins the original/shared HUD, inputs, selection, VS, intro, results, Practice and run screens. Colors remain secondary to labels, outlines and the low-HP stripe pattern.
- Character selection pairs qualitative strengths and weaknesses, keeps full source names, and exposes selected button state to screen readers. No win-rate or unmeasured frame claim is introduced.
- Editor controls are divided into four keyboard-operable tabs without replacing the original form, preview, validation, input IDs or save logic. Name/base remain immediately available. The final tab summarizes name, body and combat style. Existing incompatibility messages and disabled choices remain owned by the original editor.
- Story uses the same HUD/control classes as P0/dojo and a notebook visual layer for editing, dialogue, exploration and results. P0 owns camera, controls, movement, save and return behavior.
- Lobby personalization reads only the saved name. It never writes, clears, migrates or overwrites a save. Storage denial/malformed JSON cannot block the menu.

The mountain/ridge geometry currently uses light CSS shapes, the existing original portraits and typography. Claude-authored original P4 art is being made in a separate production lane; once delivered, it should be integrated with its source/manifest/proof rather than attributed to this implementation. This code alone does not satisfy the Claude-art acceptance gate.

## Verification

`npm --prefix exp/fable-3d/dojo test` checks original behavior and P4 readable color contrasts/routes/save isolation. Built Pages must include `shared-ui/`, lobby JS, dojo profile JS and the Story tab module.

`node exp/fable-3d/dojo/acceptance/p4-ui-browser.mjs` targets the built site (default `/exp/fable-3d/_pages/`, override `MAMOKEN_UI_URL`). It captures five-mode layouts at 720×320, 852×393 and portrait-locked 393×852; measures 44px targets; opens all four dojo modes; starts real WebGL Practice; tests paired profiles and the four-tab editor through saving and entering the actual village; verifies menu entry preserves the save. Evidence is written beneath `MAMOKEN_EVIDENCE/ui`.

Original Story acceptance scripts have optional P4 tab navigation so that the same real gameplay regression can run before and after the visual enhancement. No collision/result test has been weakened.

Actual WebGL screenshot inspection, the full integrated regression and Claude art review are required before marking P4 complete. No physical iPhone touch, heat, battery or hardware-FPS measurement has been performed by this implementation lane. P1 remains a separate native-device gate; P2 remains blocked until that user confirmation.
