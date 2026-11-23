# P4 UI implementation — mountain tournament / journey notebook

Issue #213, direction PR #214. This is a trial interpretation of direction A for competition and B for the editor/journey, not a claim of the user's visual approval. Base PR #209 `8ab89722`; runtime dependency: P0's shared HUD/input/native viewport work. No P2 model generation, body-part expansion or skill compatibility change is included.

## Implemented UI

- The five-mode entry keeps all existing routes. Main match is the dominant illustrated section; the journey is a broad pale travel slip; Arcade, Practice and Survival have smaller distinct roles. The player sees 8-match, practice and HP-carry intentions without opening another menu. Original marmot model portraits provide the character art.
- `shared-ui/design-tokens.css` defines color, typography, spacing, 44px target minimum, focus and motion timings. `mountain-ui.css` skins the original/shared HUD, inputs, selection, VS, intro, results, Practice and run screens. Colors remain secondary to labels, outlines and the low-HP stripe pattern.
- Character selection pairs qualitative strengths and weaknesses, keeps full source names, and exposes selected button state to screen readers. No win-rate or unmeasured frame claim is introduced.
- Editor controls are divided into four keyboard-operable tabs without replacing the original form, preview, validation, input IDs or save logic. Name/base remain immediately available. The final tab summarizes name, body and combat style. Existing incompatibility messages and disabled choices remain owned by the original editor.
- Story uses the same HUD/control classes as P0/dojo and a notebook visual layer for editing, dialogue, exploration and results. P0 owns camera, controls, movement, save and return behavior.
- Lobby personalization reads only the saved name. It never writes, clears, migrates or overwrites a save. Storage denial/malformed JSON cannot block the menu.

Claude-authored original P4 artwork from Draft #218 `0ce87219762134d4d9adb8f3785aa4894e777343` is integrated into the real screens: three ridge layers, fist seal/mark, wood/paper/cloth/cut surfaces, five mode symbols, nine character crests, HP/sub/timer frames and attack button plates. All 27 authored SVGs, tokens, manifest and editable Python generator remain unchanged in `ui-art/v17`. Existing marmot portraits remain the source of the character images; no new portrait/model is claimed.

## Verification

`npm --prefix exp/fable-3d/dojo test` checks original behavior and P4 readable color contrasts/routes/save isolation. Built Pages must include `shared-ui/`, lobby JS, dojo profile JS and the Story tab module.

`node exp/fable-3d/dojo/acceptance/p4-ui-browser.mjs` serves the built `_pages` artifact at its own temporary HTTP origin root (or targets `MAMOKEN_UI_URL` when provided), matching Cloudflare/native resource resolution. It captures five-mode layouts at 720×320, 852×393 and portrait-locked 393×852; measures 44px targets; opens all four dojo modes; starts real WebGL Practice; tests paired profiles and the four-tab editor through saving and entering the actual village; verifies menu entry preserves the save. Evidence is written beneath `MAMOKEN_EVIDENCE/ui`.

Original Story acceptance scripts have optional P4 tab navigation so that the same real gameplay regression can run before and after the visual enhancement. No collision/result test has been weakened.

Actual WebGL screenshot inspection and the full integrated regression are still required before marking P4 complete. The source preview composites in #218 are not used as proof of this runtime integration. No physical iPhone touch, heat, battery or hardware-FPS measurement has been performed by this implementation lane. P1 remains a separate native-device gate; P2 remains blocked until that user confirmation.

CI correction: readiness checks now wait until the new match has finished loading, rather than accepting a previous run’s Battle frame while Practice resources are still loading. The 75→∞ expectation is unchanged. The custom combat browser also explicitly opens the selected editor tab.

## External SVG palette and runtime mapping

`shared-ui/build-p4-art.mjs` generates 37 external-image SVGs (27 base images plus explicit light-paper, dark-wood and six button variants), a source/hash manifest, CSS image variables and a JS manifest map. CSS custom properties/currentColor from a parent document do not enter an external SVG, so the adapter resolves all colors before publishing. Icons/crests preserve their own aspect ratios; background surfaces/HUD frames explicitly stretch to their existing slots to prevent letterboxing over readable text. The original SVGs are retained unchanged.

The lobby, dojo and Story include the same art stylesheet. Character cards bind the corresponding crest to the real roster, and HUD crests follow the existing semantic element attributes (including custom Story combat styles). Native viewport and saved data are untouched. Browser acceptance now checks computed art backgrounds, decoded nine-crest images and each of six real attack-button plates, in addition to the gameplay/UI flow.

Art URL correction: relative URLs inside custom properties resolve against the consuming stylesheet, not the token-definition stylesheet. The initial CSS token values are therefore `none`; `markUIArt()` resolves every image with `new URL(..., import.meta.url)` in the manifest-map module, sets absolute URL values on the root element, then marks the art version ready. Source-directory, deployed-root and Capacitor locations are covered by the URL contract test. This fixes the runtime 404s rather than changing test expectations.

## Short-screen visual review

The first integrated screenshots exposed two issues that a route/44px check alone did not catch: the lobby's lower row extends below a short viewport, and the original sticky selection footer covered the strength/weakness line when its controls wrapped. The lobby now owns a bounded viewport scroll area, including when the landscape UI is rotated in a portrait browser. All mode copy and touch sizes are retained. The selection footer follows the profile in ordinary document flow, so the player can read both roles and then scroll to the start controls without either layer covering the other.

Acceptance now performs real mouse-wheel scrolling at all three viewports, waits for the menu's bottom, verifies both complete lower cards and their actions are inside the screen and unobscured via hit testing, and captures `lobby-lower-*` evidence. Each selection mode separately captures the readable role pair and the reachable start action, checks their geometry does not overlap, and records the measurements. These new assertions need their own browser run; previous green CI did not establish these visual facts.
