export type HairStyle = 'long' | 'short' | 'twintails' | 'ponytail' | 'bob';
export type EyeStyle = 'round' | 'almond' | 'sleepy';
export type Expression = 'neutral' | 'happy' | 'sad' | 'surprised' | 'angry' | 'blushing' | 'wink';
export type Accessory = 'cat_ears' | 'bunny_ears' | 'glasses' | 'bow' | 'horns';

export interface AvatarConfig {
  // Appearance
  skinColor: string;
  hairColor: string;
  hairHighlightColor: string;
  hairStyle: HairStyle;
  eyeColor: string;
  eyeStyle: EyeStyle;
  accessories: Accessory[];
  outfitColor: string;
  outfitStyle: 'casual' | 'school' | 'fantasy' | 'idol';
  accentColor: string;
  blushColor: string;
  eyebrowColor: string;
  // Lip color
  lipColor: string;
}

export interface AvatarLiveState {
  expression: Expression;
  mouthOpen: number;      // 0–1 driven by mic
  blinkLeft: number;      // 0 open, 1 closed
  blinkRight: number;
  eyeGazeX: number;       // –1 to 1
  eyeGazeY: number;
  headTilt: number;       // radians
  breathPhase: number;    // 0–2π for idle breathing
  isMicActive: boolean;
}

export const DEFAULT_CONFIG: AvatarConfig = {
  skinColor: '#fde8d0',
  hairColor: '#7c3aed',
  hairHighlightColor: '#a78bfa',
  hairStyle: 'long',
  eyeColor: '#6366f1',
  eyeStyle: 'round',
  accessories: ['cat_ears'],
  outfitColor: '#1e1b4b',
  outfitStyle: 'idol',
  accentColor: '#ec4899',
  blushColor: '#f9a8d4',
  eyebrowColor: '#5b21b6',
  lipColor: '#f472b6',
};

export const DEFAULT_LIVE_STATE: AvatarLiveState = {
  expression: 'neutral',
  mouthOpen: 0,
  blinkLeft: 0,
  blinkRight: 0,
  eyeGazeX: 0,
  eyeGazeY: 0,
  headTilt: 0,
  breathPhase: 0,
  isMicActive: false,
};
