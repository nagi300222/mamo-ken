// Per-fighter combat feel; explicitly independent of 3D visual asset and ultimate movies.
// Initial v15 numbers are tuning candidates, reviewed via simulations before merging main.
export const FIGHT_STYLE=Object.freeze({
  moguzo:     {airSpeed:.034,airAccel:.018,airFriction:.72,dashFrames:17,dashRecovery:2,weakChainMax:2,weakStartup:0,heavyStartup:0,weakRecovery:0,heavyRecovery:0},
  pisuke:     {airSpeed:.042,airAccel:.024,airFriction:.84,dashFrames:14,dashRecovery:1,weakChainMax:3,weakStartup:-1,heavyStartup:0,weakRecovery:-1,heavyRecovery:0},
  godan:      {airSpeed:.026,airAccel:.014,airFriction:.62,dashFrames:22,dashRecovery:6,weakChainMax:1,weakStartup:0,heavyStartup:2,weakRecovery:3,heavyRecovery:4},
  hakuma:     {airSpeed:.028,airAccel:.014,airFriction:.66,dashFrames:20,dashRecovery:4,weakChainMax:2,weakStartup:0,heavyStartup:1,weakRecovery:1,heavyRecovery:2},
  chirka:     {airSpeed:.040,airAccel:.023,airFriction:.87,dashFrames:15,dashRecovery:2,weakChainMax:2,weakStartup:-1,heavyStartup:0,weakRecovery:-1,heavyRecovery:0},
  takimaru:   {airSpeed:.030,airAccel:.016,airFriction:.70,dashFrames:20,dashRecovery:5,weakChainMax:2,weakStartup:0,heavyStartup:1,weakRecovery:1,heavyRecovery:3},
  yomikage:   {airSpeed:.036,airAccel:.022,airFriction:.82,dashFrames:15,dashRecovery:2,weakChainMax:2,weakStartup:0,heavyStartup:0,weakRecovery:0,heavyRecovery:1},
  bullet:     {airSpeed:.029,airAccel:.015,airFriction:.62,dashFrames:21,dashRecovery:5,weakChainMax:2,weakStartup:0,heavyStartup:1,weakRecovery:1,heavyRecovery:4},
  dark_moguzo:{airSpeed:.044,airAccel:.026,airFriction:.88,dashFrames:14,dashRecovery:2,weakChainMax:3,weakStartup:-1,heavyStartup:-1,weakRecovery:-1,heavyRecovery:0}
});
export const fighterStyle=id=>FIGHT_STYLE[id]||FIGHT_STYLE.moguzo;
export const isChainNormal=id=>/^(stand|crouch)_(weak|heavy)$/.test(id||'');
export const isChainWeak=id=>/^(stand|crouch)_weak$/.test(id||'');
