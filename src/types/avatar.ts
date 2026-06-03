export type HairStyle = 'long' | 'short' | 'twintails' | 'ponytail' | 'bob';
export type EyeStyle = 'round' | 'almond' | 'sleepy';
export type Expression = 'neutral' | 'happy' | 'sad' | 'surprised' | 'angry' | 'blushing' | 'wink' | 'cry' | 'smug' | 'love' | 'sleepy' | 'laugh';
export type Accessory = 'cat_ears' | 'bunny_ears' | 'glasses' | 'bow' | 'horns';
export type BonusAccessory = 'wings' | 'tail' | 'flower_crown' | 'headphones';
export type SkinMarking = 'freckles' | 'beauty_mark' | 'blush_lines';
export type EyeDecoration = 'normal' | 'star' | 'heart' | 'sparkle';
export type BackgroundStyle = 'none' | 'stars' | 'sakura' | 'gradient' | 'holographic' | 'rain';
export type Viseme = 'rest' | 'aa' | 'oh' | 'ee' | 'oo' | 'mm';

export interface AvatarConfig {
  skinColor: string;
  hairColor: string;
  hairHighlightColor: string;
  hairStyle: HairStyle;
  eyeColor: string;
  eyeStyle: EyeStyle;
  eyeDecoration: EyeDecoration;
  accessories: Accessory[];
  bonusAccessories: BonusAccessory[];
  skinMarkings: SkinMarking[];
  outfitColor: string;
  outfitStyle: 'casual' | 'school' | 'fantasy' | 'idol';
  accentColor: string;
  blushColor: string;
  eyebrowColor: string;
  lipColor: string;
}

export interface AvatarLiveState {
  expression: Expression;
  prevExpression: Expression;
  expressionBlend: number; // 0 = prevExpression, 1 = expression
  mouthOpen: number;
  viseme: Viseme;
  blinkLeft: number;
  blinkRight: number;
  eyeGazeX: number;
  eyeGazeY: number;
  headTilt: number;
  tongueOut: number;  // 0-1, how much tongue is visible
  headRotX: number;   // pitch in radians (head nod up/down)
  headRotY: number;   // yaw in radians (head turn left/right)
  breathPhase: number;
  isMicActive: boolean;
  isWebcamActive: boolean;
}

export const DEFAULT_CONFIG: AvatarConfig = {
  skinColor: '#fde8d0',
  hairColor: '#7c3aed',
  hairHighlightColor: '#a78bfa',
  hairStyle: 'long',
  eyeColor: '#6366f1',
  eyeStyle: 'round',
  eyeDecoration: 'sparkle',
  accessories: ['cat_ears'],
  bonusAccessories: [],
  skinMarkings: [],
  outfitColor: '#1e1b4b',
  outfitStyle: 'idol',
  accentColor: '#ec4899',
  blushColor: '#f9a8d4',
  eyebrowColor: '#5b21b6',
  lipColor: '#f472b6',
};

export const DEFAULT_LIVE_STATE: AvatarLiveState = {
  expression: 'neutral',
  prevExpression: 'neutral',
  expressionBlend: 1,
  mouthOpen: 0,
  viseme: 'rest',
  blinkLeft: 0,
  blinkRight: 0,
  eyeGazeX: 0,
  eyeGazeY: 0,
  headTilt: 0,
  tongueOut: 0,
  headRotX: 0,
  headRotY: 0,
  breathPhase: 0,
  isMicActive: false,
  isWebcamActive: false,
};
