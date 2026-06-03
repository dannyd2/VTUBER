export type HairStyle = 'long' | 'short' | 'bob' | 'twintails' | 'ponytail' | 'bun' | 'wavy';
export type EyeStyle = 'round' | 'almond' | 'sleepy';
export type EyebrowStyle = 'normal' | 'thin' | 'thick' | 'arched' | 'serious';
export type NoseStyle = 'none' | 'dot' | 'button';
export type BodyType = 'slim' | 'average' | 'curvy';
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
  eyeSize: number;        // 0.7 – 1.4
  eyeSpacing: number;     // 0.7 – 1.3
  eyebrowStyle: EyebrowStyle;
  eyebrowColor: string;
  noseStyle: NoseStyle;
  lipColor: string;
  mouthSize: number;      // 0.7 – 1.4
  blushColor: string;
  skinMarkings: SkinMarking[];
  accessories: Accessory[];
  bonusAccessories: BonusAccessory[];
  outfitColor: string;
  outfitStyle: 'casual' | 'school' | 'fantasy' | 'idol';
  accentColor: string;
  bodyType: BodyType;
  background: BackgroundStyle;
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
  tongueOut: number;
  headRotX: number;
  headRotY: number;
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
  eyeSize: 1.0,
  eyeSpacing: 1.0,
  eyebrowStyle: 'normal',
  eyebrowColor: '#5b21b6',
  noseStyle: 'dot',
  lipColor: '#f472b6',
  mouthSize: 1.0,
  blushColor: '#f9a8d4',
  skinMarkings: [],
  accessories: ['cat_ears'],
  bonusAccessories: [],
  outfitColor: '#1e1b4b',
  outfitStyle: 'idol',
  accentColor: '#ec4899',
  bodyType: 'average',
  background: 'none',
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
