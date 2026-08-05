export type Level = 'high' | 'mid' | 'low';
export type AttackButton = Level;
export type Direction = 'left' | 'down' | 'right';

export type ArchetypeId =
  | 'standard'
  | 'rush'
  | 'power'
  | 'defense'
  | 'tricky'
  | 'grappler'
  | 'counter'
  | 'charge';

export type CharacterId =
  | 'moguzo'
  | 'pisuke'
  | 'godan'
  | 'himalaya'
  | 'bobak'
  | 'grappler_tbd'
  | 'counter_tbd'
  | 'charge_tbd'
  | 'dark_moguzo';

export type FighterPhase =
  | 'idle'
  | 'attack'
  | 'guard'
  | 'blockstun'
  | 'hitstun'
  | 'mikiri'
  | 'dodgeCrouch'
  | 'dodgeSway'
  | 'dodgeStep'
  | 'grab'
  | 'grabHit'
  | 'grabbed'
  | 'down'
  | 'getup'
  | 'roar'
  | 'dizzy'
  | 'clash'
  | 'ult'
  | 'ko'
  | 'win';

export type BattleFlow =
  | 'intro'
  | 'fight'
  | 'gyuiinIntro'
  | 'gyuiinSelect'
  | 'gyuiinPlay'
  | 'gyuiinResult'
  | 'ultActivation'
  | 'ultCinema'
  | 'koCinema'
  | 'roundResult'
  | 'matchEnd';

export type MoveSpec = Readonly<{
  s: number;
  a: number;
  r: number;
  d: number;
  y?: number;
  w?: number;
  down?: boolean;
}>;

export type BattleInput = Readonly<{
  frame: number;
  player: 0 | 1;
  kind: 'attack' | 'guard' | 'mikiri' | 'direction' | 'grab' | 'roar' | 'ult' | 'none';
  level?: Level;
  direction?: Direction;
}>;

export type FighterState = Readonly<{
  characterId: CharacterId;
  phase: FighterPhase;
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
  flow: BattleFlow;
  timer: number;
  seed: number;
  aiSeed: number;
  fighters: readonly [FighterState, FighterState];
  lastHash: string;
}>;
