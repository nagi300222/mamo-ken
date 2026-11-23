// Claude-authored P4 revision. Original assets and manifest remain unchanged.
// These module-resolved URLs work at the source path, Pages root and native root.
export const P4_POLISH_ART_VERSION='v18-p4-ui-polish-r1';
export const P4_POLISH_ART_SOURCE=Object.freeze({
  author:'Claude Code',
  commit:'21aa1ef4120eed6f2f33e6e1874056dbb3b4c0cf',
  manifest:new URL('../ui-art/v18/manifest.json',import.meta.url).href
});
export const P4_POLISH_ART=Object.freeze({
 'mode-vs':new URL('../ui-art/v18/png/mode-vs.webp',import.meta.url).href,
 'mode-vs-large':new URL('../ui-art/v18/png/mode-vs-large.webp',import.meta.url).href,
 'mode-practice':new URL('../ui-art/v18/png/mode-practice.webp',import.meta.url).href,
 'mode-arcade':new URL('../ui-art/v18/png/mode-arcade.webp',import.meta.url).href,
 'mode-survival':new URL('../ui-art/v18/png/mode-survival.webp',import.meta.url).href,
 'mode-story':new URL('../ui-art/v18/png/mode-story.webp',import.meta.url).href,
 'state-focus':new URL('../ui-art/v18/svg/state-focus.svg',import.meta.url).href,
 'state-selected':new URL('../ui-art/v18/svg/state-selected.svg',import.meta.url).href,
 'state-pressed':new URL('../ui-art/v18/svg/state-pressed.svg',import.meta.url).href,
 'state-disabled':new URL('../ui-art/v18/svg/state-disabled.svg',import.meta.url).href,
 'state-saved':new URL('../ui-art/v18/svg/state-saved.svg',import.meta.url).href,
 'sym-select':new URL('../ui-art/v18/svg/sym-select.svg',import.meta.url).href,
 'sym-confirm':new URL('../ui-art/v18/svg/sym-confirm.svg',import.meta.url).href,
 'sym-back':new URL('../ui-art/v18/svg/sym-back.svg',import.meta.url).href,
 'sym-disabled':new URL('../ui-art/v18/svg/sym-disabled.svg',import.meta.url).href,
 'sym-save':new URL('../ui-art/v18/svg/sym-save.svg',import.meta.url).href,
 'sym-paw':new URL('../ui-art/v18/svg/sym-paw.svg',import.meta.url).href
});
export function markP4Polish(root=globalThis.document?.documentElement){
 if(!root)return;
 for(const [key,url] of Object.entries(P4_POLISH_ART))root.style.setProperty('--p4-polish-'+key,`url("${url}")`);
 root.dataset.uiPolish=P4_POLISH_ART_VERSION;
 // The separate v17 uiArt marker deliberately stays intact for provenance.
}
markP4Polish();
