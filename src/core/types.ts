export type CurrentLevel = 'high' | 'mid' | 'low';
export type AttackButton = CurrentLevel;
export type Direction = 'left' | 'down' | 'right';

export type CurrentCharacterId = 'moguzo' | 'pisuke' | 'godan';
export type PlannedCharacterId = 'himalaya' | 'bobak' | 'grappler_tbd' | 'counter_tbd' | 'charge_tbd';
export type BossCharacterId = 'dark_moguzo';
export type CharacterId = CurrentCharacterId | PlannedCharacterId | BossCharacterId;

export type ProvisionalArchetypeId =
  | 'standard'
  | 'rush'
  | 'power'
  | 'defense'
  | 'tricky'
  | 'grappler'
  | 'counter'
  | 'charge';

export type CurrentFighterPhase =
  | 'idle'
  | 'attack'
  | 'cmdAtk'
  | 'cmdStance'
  | 'guard'
  | 'blockstun'
  | 'hitstun'
  | 'mikiriRec'
  | 'dodge'
  | 'grab'
  | 'grabrec'
  | 'grabHit'
  | 'grabbed'
  | 'down'
  | 'wake'
  | 'roar'
  | 'dizzy'
  | 'ultAtk'
  | 'ko'
  | 'win';

export type ProvisionalFighterPhase =
  | 'mikiri'
  | 'dodgeCrouch'
  | 'dodgeSway'
  | 'dodgeStep'
  | 'getup'
  | 'ult';

export type LegacyFighterPhase = 'crouch' | 'justGuard' | 'regap';
export type FighterPhase = CurrentFighterPhase | ProvisionalFighterPhase | LegacyFighterPhase;

export type CurrentBattleFlow = 'intro' | 'fight' | 'clash' | 'ultCine' | 'ko' | 'roundEnd' | 'matchEnd';
export type ProvisionalBattleFlow =
  | 'gyuiinIntro'
  | 'gyuiinSelect'
  | 'gyuiinPlay'
  | 'gyuiinResult'
  | 'ultActivation'
  | 'ultCinema'
  | 'koCinema'
  | 'roundResult';
export type BattleFlow = CurrentBattleFlow | ProvisionalBattleFlow;

export type CurrentCharacterSpec = Readonly<{
  id: CurrentCharacterId;
  name: string;
  type: string;
  ult: string;
  dMul: number;
  sMul: number;
  sOfs: number;
  gMax: number;
  pips: Readonly<Record<'p' | 's' | 'g', number>>;
  stats5: Readonly<Record<'atk' | 'spd' | 'def' | 'tech' | 'brk', number>>;
  usability: number;
}>;

export type BattleInput = Readonly<{
  frame: number;
  player: 0 | 1;
  kind: 'attack' | 'guard' | 'mikiri' | 'direction' | 'grab' | 'roar' | 'ult' | 'none';
  level?: CurrentLevel;
  direction?: Direction;
}>;

export type FighterState = Readonly<{
  characterId: CurrentCharacterId;
  phase: CurrentFighterPhase;
  hp: number;
  guard: number;
  s: number;
  ult: number;
  focus: number;
  combo: number;
  phaseFrame: number;
}>;

export type BattleState = Readonly<{
  version: string;
  frame: number;
  flow: CurrentBattleFlow;
  timer: number;
  seed: number;
  aiSeed: number;
  fighters: readonly [FighterState, FighterState];
  lastHash: string;
}>;

export type HashableBattleState = Omit<BattleState, 'lastHash'>;
