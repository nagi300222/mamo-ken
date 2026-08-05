export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export type CurrentLevel = 'high' | 'mid' | 'low';
export type CurrentMoveKey = CurrentLevel | 'crouch';
export type AttackButton = CurrentLevel;
export type Direction = 'left' | 'down' | 'right';

export type CurrentArchetypeId = 'standard' | 'rush' | 'power';
export type PlannedArchetypeId = 'defense' | 'tricky' | 'grappler' | 'counter' | 'charge';
export type ArchetypeId = CurrentArchetypeId | PlannedArchetypeId;

export type CurrentCharacterId = 'moguzo' | 'pisuke' | 'godan';
export type PlannedCharacterId = 'himalaya' | 'bobak' | 'grappler_tbd' | 'counter_tbd' | 'charge_tbd';
export type BossCharacterId = 'dark_moguzo';
export type CharacterId = CurrentCharacterId | PlannedCharacterId | BossCharacterId;

export type CurrentFighterPhase =
  | 'attack'
  | 'blockstun'
  | 'clash'
  | 'cmdAtk'
  | 'cmdStance'
  | 'dizzy'
  | 'dodge'
  | 'down'
  | 'grab'
  | 'grabbed'
  | 'grabHit'
  | 'grabrec'
  | 'guard'
  | 'hitstun'
  | 'idle'
  | 'in'
  | 'ko'
  | 'mikiriRec'
  | 'reveal'
  | 'roar'
  | 'select'
  | 'ultAtk'
  | 'wake'
  | 'win';

export type ProvisionalFighterPhase = 'mikiri' | 'dodgeCrouch' | 'dodgeSway' | 'dodgeStep' | 'getup' | 'ult';
export type LegacyFighterPhase = 'crouch' | 'justGuard' | 'regap';
export type FighterPhase = CurrentFighterPhase | ProvisionalFighterPhase | LegacyFighterPhase;

export type CurrentBattleFlow = 'clash' | 'fight' | 'intro' | 'ko' | 'matchEnd' | 'roundEnd' | 'ultCine';
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

export type MoveSpec = Readonly<{
  s: number;
  a: number;
  r: number;
  d: number;
  y: number;
  w: number;
  down?: boolean;
}>;

export type CommandMoveSpec = Readonly<{
  name: string;
  seq: readonly Direction[];
  trigger: CurrentLevel | 'grab';
  type: 'atk' | 'grab' | 'stance';
  lv?: CurrentMoveKey;
  s?: number;
  d?: number;
  note?: string;
  [key: string]: JsonValue | undefined;
}>;

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

export type CharacterCombatSpec = Pick<CurrentCharacterSpec, 'id' | 'dMul' | 'sMul' | 'sOfs' | 'gMax'>;

export type CurrentImplementationContract = Readonly<{
  source: string;
  bal: Readonly<Record<string, JsonValue>> & { readonly HP: number; readonly TIME: number; readonly SMAX: number; readonly ATK: Readonly<Record<CurrentMoveKey, MoveSpec>>; readonly CMD: { readonly bufF: number; readonly buffer: number; readonly moves: Readonly<Record<CurrentCharacterId, readonly CommandMoveSpec[]>> } };
  characters: readonly CurrentCharacterSpec[];
  characterIds: readonly CurrentCharacterId[];
  levels: readonly CurrentLevel[];
  choices: readonly string[];
  commandMoves: Readonly<Record<CurrentCharacterId, readonly string[]>>;
  inputTiming: JsonValue;
  roar: JsonValue;
  sGauge: JsonValue;
  clash: JsonValue;
  down: JsonValue;
  ult: JsonValue;
  net: JsonValue;
  aiDifficulty: JsonValue;
  sprites: JsonValue;
}>;

export type CurrentPhaseReport = Readonly<{
  source: string;
  fighterPhases: readonly { readonly value: CurrentFighterPhase; readonly line: number }[];
  battleFlows: readonly { readonly value: CurrentBattleFlow; readonly line: number }[];
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
