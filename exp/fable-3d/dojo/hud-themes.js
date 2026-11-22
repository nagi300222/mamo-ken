// Astra HUD lane: display semantics only. No move/CPU/stat mutations.
export const HUD_THEMES=Object.freeze({
  moguzo:{mark:'地',word:'土煙',tone:'earth'},
  pisuke:{mark:'風',word:'疾走',tone:'wind'},
  godan:{mark:'岩',word:'重圧',tone:'stone'},
  hakuma:{mark:'雪',word:'不動',tone:'snow'},
  chirka:{mark:'幻',word:'陽動',tone:'illusion'},
  takimaru:{mark:'掴',word:'豪腕',tone:'grapple'},
  yomikage:{mark:'月',word:'見切',tone:'moon'},
  bullet:{mark:'弾',word:'装填',tone:'amber'},
  dark_moguzo:{mark:'雷',word:'暗連',tone:'dark'}
});
export const hudTheme=id=>HUD_THEMES[id]||HUD_THEMES.moguzo;
export const isSuperReady=n=>Number(n)>=100;
export const chargePips=n=>[0,1,2].map(i=>i<Math.max(0,Math.min(3,Number(n)||0)));
