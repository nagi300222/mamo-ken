// Presentation only. These colors, trail targets, audio pitches and signatures
// never alter Battle's hitboxes, damage, frame timing, input, CPU or meters.
export const SHOWTIME_PROFILES = Object.freeze({
  moguzo:       { color:0xffc878, bone:'pawR',  tail:8, pitch:180, signature:'大地の衝撃', element:'earth' },
  pisuke:       { color:0x86dcff, bone:'footR', tail:11,pitch:320, signature:'風を裂く連脚', element:'wind' },
  godan:        { color:0xffa369, bone:'pawR',  tail:7, pitch:110, signature:'揺るがぬ一撃', element:'stone' },
  hakuma:       { color:0xb7f8d8, bone:'pawR',  tail:7, pitch:195, signature:'雪峰の突っ張り', element:'snow' },
  chirka:       { color:0xdd9aff, bone:'pawR',  tail:10,pitch:265, signature:'幻影の舞', element:'illusion' },
  takimaru:     { color:0xffd695, bone:'pawR',  tail:6, pitch:125, signature:'天地をつかむ', element:'grapple' },
  yomikage:     { color:0x9defff, bone:'pawR',  tail:9, pitch:240, signature:'月影の一閃', element:'moon' },
  bullet:       { color:0xffb045, bone:'tail_03',tail:12,pitch:220, signature:'弾丸の連射', element:'amber' },
  dark_moguzo:  { color:0xbe78ff, bone:'pawR',  tail:12,pitch:155, signature:'黒雷の連撃', element:'dark' }
});
export const SHOWTIME_IDS = Object.freeze(Object.keys(SHOWTIME_PROFILES));
export function showtimeFor(id){return SHOWTIME_PROFILES[id]||SHOWTIME_PROFILES.moguzo;}
export function showtimeHex(id){return '#'+showtimeFor(id).color.toString(16).padStart(6,'0');}
export function isShowtimeMove(action){return action==='ultimate'||/^s[123]$/.test(action||'');}
export function superCaption(id,moveName){return showtimeFor(id).signature+' · '+moveName;}
