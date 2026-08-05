export const REQUIRED_POSE_IDS = [
  'idle', 'guard', 'flinch', 'victory',
  'high_telegraph', 'mid_telegraph', 'low_telegraph', 'mid_attack',
  'high_attack', 'low_attack', 'mikiri', 'roar_inhale',
  'roar_release', 'grab', 'grab_lift', 'grabbed',
  'down', 'getup', 'ko', 'ult_charge',
  'crouch', 'sway', 'lunge', 'crouch_atk',
] as const;

export type PoseId = (typeof REQUIRED_POSE_IDS)[number];
export type PoseOrientation = 'standing' | 'horizontal';

export type RgbaImage = Readonly<{
  width: number;
  height: number;
  data: readonly number[];
}>;

export type PixelRect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type SpritePlacement = Readonly<{
  scale: number;
  x: number;
  y: number;
  groundY: number;
  normalizedHeadHeight: number;
}>;

export type SpritePoseEntry = Readonly<{
  poseId: PoseId;
  sourceRect: PixelRect;
  bounds: PixelRect;
  orientation: PoseOrientation;
  placement: SpritePlacement;
}>;

export type SpriteSheetManifest = Readonly<{
  version: 'sprite-sheet-v1';
  canvas: Readonly<{ width: number; height: number; groundY: number }>;
  poses: readonly SpritePoseEntry[];
  overrides: Readonly<Record<string, Readonly<Partial<SpritePlacement>>>>;
}>;

export type SpritePipelineConfig = Readonly<{
  whiteThreshold: number;
  targetHeadHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  groundY: number;
}>;
