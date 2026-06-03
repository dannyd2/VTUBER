# VTuber Avatar Studio

A browser-based VTuber avatar system with real-time face tracking, lip sync, and a fully customizable 3D character. No downloads or plugins required.

## Features

### 3D Avatar
- Anime-style 3D character rendered with Three.js
- Phong-shaded skin with warm rim/key/fill lighting and PCF soft shadows
- Anime ink outline via back-face expansion
- Full body: head, neck, torso, arms, and outfit
- Idle breathing animation and tail/ear sway

### Face Tracking
- Powered by MediaPipe FaceLandmarker (52 ARKit blend shapes)
- Blink, squint, wink, and eye gaze tracking
- Mouth open/jaw, tongue detection with 6× amplification
- Head pitch, yaw, and roll via facial transformation matrix
- GPU-accelerated inference with automatic CPU fallback
- Smooth exponential filter (α = 0.35) on all blend shape values

### Hand Tracking
- MediaPipe HandLandmarker — up to 2 hands simultaneously
- 21-joint 3D hand meshes with finger bones rendered in scene
- Skin-colored Phong spheres for joints, cylinders for bones
- Fingernail geometry at fingertips

### Lip Sync
- Microphone-based viseme classification (rest / aa / oh / ee / oo / mm)
- Web Audio API FFT analysis for formant-based vowel detection
- Volume envelope drives mouth-open amount in real time

### Expressions
12 expressions with smooth cross-fade blending:
`neutral` `happy` `sad` `surprised` `angry` `blushing` `wink` `cry` `smug` `love` `sleepy` `laugh`

Trigger via keyboard shortcuts (keys `1` through `=`) or on-screen buttons. Optional auto-detection from webcam data.

### Avatar Creator
Extensive customization across 9 sections:
- **Skin** — color picker
- **Hair** — 7 styles (long, short, bob, twintails, ponytail, bun, wavy), base color, highlight color
- **Eyes** — 3 styles, 4 decorations (normal, star, heart, sparkle), color, size slider, spacing slider
- **Eyebrows** — 5 styles (normal, thin, thick, arched, serious), color
- **Nose & Mouth** — 3 nose styles (none, dot, button), lip color, mouth size slider
- **Blush** — color picker
- **Outfit & Body** — 4 outfit styles, 3 body types (slim, average, curvy), outfit/accent colors
- **Background** — 6 options (none, stars, sakura, gradient, holographic, rain)
- **Accessories** — cat ears, bunny ears, glasses, bow, horns, wings, tail, flower crown, headphones, skin markings (freckles, beauty mark, blush lines)

All settings are persisted to `localStorage`.

### Stream Mode
- Dedicated OBS-compatible overlay view
- Chroma key options: transparent, green screen, blue screen
- Background style selector overrides avatar background
- PNG export
- Scale control (50–150%)
- OBS Browser Source setup guide included

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Building for production

```bash
npm run build
npm run preview
```

### OBS Integration

1. Start the app (`npm run dev` or host the built `dist/`)
2. In OBS: **Add Source → Browser Source**
3. Set the URL to the app address
4. Size: **450 × 560**
5. Enable **Allow Transparency**
6. In Stream Mode, set Chroma Key to **Transparent** and Background to **None**

## Tech Stack

| Layer | Library |
|-------|---------|
| UI framework | React 19 + TypeScript |
| Build tool | Vite 8 |
| 3D rendering | Three.js 0.184 |
| Face tracking | MediaPipe Tasks Vision 0.10 (FaceLandmarker) |
| Hand tracking | MediaPipe Tasks Vision 0.10 (HandLandmarker) |
| Styling | Tailwind CSS 3 |

## Performance Architecture

- **60fps hot ref** — animation loop writes a `MutableRefObject<AvatarLiveState>` every frame; Three.js reads from it directly, bypassing React state
- **Throttled React updates** — `setLiveState` called at ~15fps for UI elements (expression buttons, stats); immediate on expression changes
- **Face canvas dirty flag** — 1024×1024 face texture only redrawn when expression, blink, mouth, or gaze values change
- **Cached mesh refs** — tail/tuft sway uses pre-cached object refs; no per-frame `scene.traverse()`
- **Input thresholds** — webcam and mic hooks skip state updates when values are within noise threshold
- **Chunk splitting** — Three.js (~542KB), MediaPipe (~136KB), and React (~190KB) in separate chunks for parallel loading and long-term caching

## Unity Assets

The `unity/` directory contains assets for use with Unity URP + VRM 1.0:

### `unity/VTuberToon.shader`
A 4-pass Unity URP ShaderLab/HLSL toon shader:
- **Outline pass** — back-face expansion in world space with Z offset
- **ForwardLit pass** — 3-band cel shading (shadow/mid/highlight) with rim light, specular cel dot, additional lights, normal map, and emission
- **ShadowCaster pass** — correct shadow casting
- **DepthNormals pass** — SSAO / depth prepass support

All band edges use `smoothstep` for soft cel transitions. Configurable per-material in the Inspector.

### `unity/arkit_blendshapes.json`
52 ARKit blend shape → VRM 1.0 ExpressionPreset mapping configuration:
- Per-shape multipliers and optional clamp ranges
- Includes `expressionPresets` for 12 VTuber expressions
- Includes `lipsyncVisemes` for 5 phoneme shapes (rest / aa / oh / ee / oo / mm)

## Project Structure

```
src/
  components/
    Avatar3DCanvas.tsx    # Three.js canvas wrapper; reads hot liveStateRef
    AvatarCreator.tsx     # Customization UI (9 sections)
    LiveMode.tsx          # Webcam + mic live tracking view
    StreamMode.tsx        # OBS-compatible stream overlay
  hooks/
    useAvatarAnimation.ts # RAF loop; produces hot liveRef + throttled React state
    useMicrophoneInput.ts # Web Audio API mic + viseme analysis
    useWebcamTracking.ts  # MediaPipe face + hand tracking
  utils/
    avatar3DRenderer.ts   # Three.js scene, mesh builders, face canvas drawing
    visemeAnalyzer.ts     # FFT-based phoneme classification
    soundEffects.ts       # Expression sound feedback
    particleSystem.ts     # Particle emitter (expressions)
    colorUtils.ts         # Color helpers (lighten, darken, alpha)
  types/
    avatar.ts             # AvatarConfig, AvatarLiveState, type definitions
unity/
  VTuberToon.shader       # Unity URP 4-pass toon shader
  arkit_blendshapes.json  # 52 ARKit → VRM 1.0 blend shape config
```
