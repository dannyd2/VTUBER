import * as THREE from 'three';
import type { AvatarConfig, AvatarLiveState, Expression } from '../types/avatar';
import { lighten, darken, alpha } from './colorUtils';

const HAND_CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17],[0,9],
];

// ── helpers ────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) { return a + (b - a) * Math.max(0, Math.min(1, t)); }

function exprVal(state: AvatarLiveState, fn: (e: Expression) => number): number {
  return lerp(fn(state.prevExpression), fn(state.expression), state.expressionBlend);
}

function disposeMesh(obj: THREE.Object3D) {
  obj.traverse(child => {
    if ((child as THREE.Mesh).isMesh) {
      const m = child as THREE.Mesh;
      m.geometry?.dispose();
      if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
      else (m.material as THREE.Material)?.dispose();
    }
  });
}

// ── face canvas drawing ────────────────────────────────────────────────────

const CANVAS_SIZE = 1024;
const CX = 512;
const CY = 552;
const R  = 430;

function drawFaceCanvas(ctx: CanvasRenderingContext2D, config: AvatarConfig, state: AvatarLiveState) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  drawBlush3D(ctx, config, state);
  drawEyebrows3D(ctx, config, state);
  drawEyes3D(ctx, config, state);
  drawNose3D(ctx, config);
  drawMouth3D(ctx, config, state);
}

function drawBlush3D(ctx: CanvasRenderingContext2D, config: AvatarConfig, state: AvatarLiveState) {
  const intensity = exprVal(state, e =>
    e === 'blushing' ? 0.55 : (e === 'happy' || e === 'wink' || e === 'love') ? 0.3 : e === 'cry' ? 0.18 : 0);
  if (intensity < 0.01) return;
  for (const side of [-1, 1]) {
    const bx = CX + side * R * 0.52;
    const by = CY + R * 0.28;
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, R * 0.28);
    grad.addColorStop(0, alpha(config.blushColor, intensity));
    grad.addColorStop(1, alpha(config.blushColor, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(bx, by, R * 0.28, R * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEyebrows3D(ctx: CanvasRenderingContext2D, config: AvatarConfig, state: AvatarLiveState) {
  const spacingMult = config.eyeSpacing ?? 1.0;
  const eyeY = CY - R * 0.15 * (config.eyeSize ?? 1.0);
  const browY = eyeY - R * 0.3;
  const browW = R * 0.36 * (config.eyeSize ?? 1.0);

  const liftInner = exprVal(state, e =>
    e === 'surprised' || e === 'love' ? R * 0.07 : e === 'sad' || e === 'cry' ? R * 0.04 : 0);
  const liftOuter = exprVal(state, e =>
    e === 'angry' ? R * 0.07 : (e === 'sad' || e === 'cry') ? -R * 0.02 : 0);
  const raise = exprVal(state, e => (e === 'surprised' || e === 'love') ? R * 0.05 : 0);
  const smugLeft = exprVal(state, e => e === 'smug' ? R * 0.06 : 0);

  const style = config.eyebrowStyle ?? 'normal';
  const thickness: Record<string, number> = {
    normal: R * 0.055, thin: R * 0.028, thick: R * 0.085, arched: R * 0.042, serious: R * 0.075,
  };
  ctx.strokeStyle = config.eyebrowColor;
  ctx.lineWidth = thickness[style] ?? R * 0.055;
  ctx.lineCap = 'round';

  for (const side of [-1, 1]) {
    const bx = CX + side * R * 0.38 * spacingMult;
    const leftLift  = side === -1 ? liftInner : liftOuter;
    const rightLift = side === -1 ? liftOuter : liftInner;
    const extraRaise = side === -1 ? smugLeft : 0;
    const archExtra = style === 'arched' ? R * 0.08 : style === 'serious' ? -R * 0.02 : 0;

    ctx.beginPath();
    ctx.moveTo(bx - side * browW / 2, browY - raise - extraRaise + leftLift);
    ctx.quadraticCurveTo(bx, browY - R * 0.06 - raise - extraRaise * 0.5 - archExtra, bx + side * browW / 2, browY - raise + rightLift);
    ctx.stroke();
  }
}

function drawEyes3D(ctx: CanvasRenderingContext2D, config: AvatarConfig, state: AvatarLiveState) {
  const sizeMult    = config.eyeSize    ?? 1.0;
  const spacingMult = config.eyeSpacing ?? 1.0;
  const eyeY = CY - R * 0.12;
  const eyeSpacing = R * 0.4 * spacingMult;
  const eyeW = R * 0.42 * sizeMult;
  const eyeH = (config.eyeStyle === 'sleepy' ? R * 0.26 : R * 0.34) * sizeMult;
  const sleepyMult = exprVal(state, e => e === 'sleepy' ? 0.3 : 1.0);
  const effectiveH = eyeH * (config.eyeStyle === 'sleepy' ? 1 : sleepyMult <= 0.3 ? lerp(1, 0.3, 1 - sleepyMult) : 1);

  for (const side of [-1, 1]) {
    const ex = CX + side * eyeSpacing;
    const blink = side === -1 ? state.blinkLeft : state.blinkRight;
    const isWink = state.expression === 'wink' && side === -1 && state.expressionBlend > 0.5;
    drawSingleEye3D(ctx, config, state, ex, eyeY, eyeW, effectiveH, blink, isWink, side);
  }
}

function drawSingleEye3D(
  ctx: CanvasRenderingContext2D, config: AvatarConfig, state: AvatarLiveState,
  ex: number, ey: number, eyeW: number, eyeH: number,
  blinkAmt: number, isWink: boolean, side: number,
) {
  const gx = state.eyeGazeX * eyeW * 0.12;
  const gy = state.eyeGazeY * eyeH * 0.1;
  const irisR = eyeW * 0.37;
  const px = ex + gx;
  const py = ey + gy;

  // Wink — draw arc
  if (isWink) {
    ctx.strokeStyle = config.eyebrowColor;
    ctx.lineWidth = eyeW * 0.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ex - eyeW / 2, ey);
    ctx.quadraticCurveTo(ex, ey + eyeH * 0.5, ex + eyeW / 2, ey);
    ctx.stroke();
    return;
  }

  const openFrac = 1 - Math.max(blinkAmt, 0);
  const actualH = eyeH * openFrac;

  if (actualH < 2) {
    ctx.strokeStyle = config.eyebrowColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex - eyeW / 2, ey); ctx.lineTo(ex + eyeW / 2, ey);
    ctx.stroke();
    return;
  }

  // Sclera
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(ex, ey, eyeW / 2, actualH / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#fffef8';
  ctx.fill();
  ctx.clip();

  // Iris
  const isLove = exprVal(state, e => e === 'love' ? 1 : 0) > 0.5;
  const irisGrad = ctx.createRadialGradient(px - irisR * 0.25, py - irisR * 0.25, 0, px, py, irisR);
  if (isLove) {
    irisGrad.addColorStop(0, '#ffb3d4');
    irisGrad.addColorStop(0.45, '#e0669a');
    irisGrad.addColorStop(1, darken(config.eyeColor, 25));
  } else {
    irisGrad.addColorStop(0, lighten(config.eyeColor, 35));
    irisGrad.addColorStop(0.45, config.eyeColor);
    irisGrad.addColorStop(1, darken(config.eyeColor, 25));
  }
  ctx.beginPath();
  ctx.arc(px, py, irisR, 0, Math.PI * 2);
  ctx.fillStyle = irisGrad;
  ctx.fill();

  // Iris ring
  ctx.beginPath();
  ctx.arc(px, py, irisR * 0.88, 0, Math.PI * 2);
  ctx.strokeStyle = alpha(darken(config.eyeColor, 35), 0.4);
  ctx.lineWidth = irisR * 0.08;
  ctx.stroke();

  // Pupil
  if (config.eyeDecoration === 'star') {
    ctx.fillStyle = '#0d0d18';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const b = a + (2 * Math.PI) / 10;
      i === 0
        ? ctx.moveTo(px + Math.cos(a) * irisR * 0.38, py + Math.sin(a) * irisR * 0.38)
        : ctx.lineTo(px + Math.cos(a) * irisR * 0.38, py + Math.sin(a) * irisR * 0.38);
      ctx.lineTo(px + Math.cos(b) * irisR * 0.16, py + Math.sin(b) * irisR * 0.16);
    }
    ctx.closePath(); ctx.fill();
  } else if (config.eyeDecoration === 'heart' || isLove) {
    ctx.fillStyle = '#0d0d18';
    ctx.beginPath();
    ctx.moveTo(px, py + irisR * 0.18);
    ctx.bezierCurveTo(px, py, px - irisR * 0.38, py, px - irisR * 0.38, py + irisR * 0.18);
    ctx.bezierCurveTo(px - irisR * 0.38, py + irisR * 0.45, px, py + irisR * 0.6, px, py + irisR * 0.72);
    ctx.bezierCurveTo(px, py + irisR * 0.6, px + irisR * 0.38, py + irisR * 0.45, px + irisR * 0.38, py + irisR * 0.18);
    ctx.bezierCurveTo(px + irisR * 0.38, py, px, py, px, py + irisR * 0.18);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(px, py, irisR * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = '#0d0d18'; ctx.fill();
  }

  // Highlights
  ctx.beginPath();
  ctx.arc(px - irisR * 0.28, py - irisR * 0.28, irisR * 0.27, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
  ctx.beginPath();
  ctx.arc(px + irisR * 0.22, py - irisR * 0.1, irisR * 0.13, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();

  if (config.eyeDecoration === 'sparkle') {
    for (let i = 0; i < 3; i++) {
      const sa = (i * 2 * Math.PI) / 3 + Math.PI / 6;
      ctx.beginPath();
      ctx.arc(px + Math.cos(sa) * irisR * 0.3, py + Math.sin(sa) * irisR * 0.3, irisR * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
    }
  }
  ctx.restore();

  // Eyelid line
  ctx.beginPath();
  ctx.moveTo(ex - eyeW / 2, ey + actualH * 0.05);
  ctx.bezierCurveTo(ex - eyeW * 0.25, ey - actualH * 0.5, ex + eyeW * 0.25, ey - actualH * 0.5, ex + eyeW / 2, ey + actualH * 0.05);
  ctx.strokeStyle = '#1a0a2e'; ctx.lineWidth = eyeW * 0.075; ctx.lineCap = 'round'; ctx.stroke();

  // Lashes
  for (let i = 0; i < 6; i++) {
    const t = (i + 0.5) / 6;
    const lx = ex - eyeW / 2 + eyeW * t;
    const curveFrac = Math.sin(Math.PI * t);
    const ly = ey - actualH * 0.45 * curveFrac;
    const angle = -Math.PI / 2 + (t - 0.5) * 0.9 * -side;
    const len = eyeH * 0.22 * (0.6 + curveFrac * 0.4);
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + Math.cos(angle) * len, ly + Math.sin(angle) * len);
    ctx.strokeStyle = '#110820'; ctx.lineWidth = eyeW * 0.055; ctx.lineCap = 'round'; ctx.stroke();
  }

  // Cry teardrop
  if (exprVal(state, e => e === 'cry' ? 1 : 0) > 0.3) {
    ctx.fillStyle = alpha('#88ccff', 0.7);
    ctx.beginPath();
    ctx.moveTo(ex + eyeW * 0.1, ey + actualH * 0.5);
    ctx.bezierCurveTo(ex + eyeW * 0.2, ey + actualH * 0.5 + R * 0.1, ex, ey + actualH * 0.5 + R * 0.18, ex, ey + actualH * 0.5 + R * 0.18);
    ctx.bezierCurveTo(ex - eyeW * 0.2, ey + actualH * 0.5 + R * 0.18, ex - eyeW * 0.1, ey + actualH * 0.5, ex + eyeW * 0.1, ey + actualH * 0.5);
    ctx.fill();
  }
}

function drawNose3D(ctx: CanvasRenderingContext2D, config: AvatarConfig) {
  const style = config.noseStyle ?? 'dot';
  if (style === 'none') return;
  ctx.fillStyle = alpha(darken(config.skinColor, 28), 0.6);
  if (style === 'dot') {
    ctx.beginPath();
    ctx.ellipse(CX, CY + R * 0.13, R * 0.025, R * 0.016, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(CX + side * R * 0.065, CY + R * 0.15, R * 0.035, R * 0.022, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawMouth3D(ctx: CanvasRenderingContext2D, config: AvatarConfig, state: AvatarLiveState) {
  const my = CY + R * 0.42;
  const mW = R * 0.38 * (config.mouthSize ?? 1.0);
  // Tongue forces jaw slightly open so it's always visible
  const effectiveMouthOpen = Math.max(state.mouthOpen, state.tongueOut * 0.55);

  const curvature = exprVal(state, e => {
    if (e === 'happy' || e === 'blushing' || e === 'love' || e === 'laugh') return 0.38;
    if (e === 'sad' || e === 'cry') return -0.32;
    if (e === 'angry') return -0.22;
    if (e === 'wink') return 0.28;
    if (e === 'surprised') return 0.0;
    if (e === 'smug') return 0.22;
    if (e === 'sleepy') return 0.06;
    return 0.12;
  });

  const isSurprised = exprVal(state, e => e === 'surprised' ? 1 : 0);
  const isSmug = exprVal(state, e => e === 'smug' ? 1 : 0);

  if (isSurprised > 0.5) {
    const ow = mW * 0.38; const oh = ow * 0.5 + effectiveMouthOpen * R * 0.18;
    ctx.beginPath(); ctx.ellipse(CX, my + oh * 0.1, ow, oh, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#6b1a33'; ctx.fill();
    ctx.strokeStyle = config.lipColor; ctx.lineWidth = R * 0.03; ctx.stroke();
    return;
  }

  // Smug: offset center
  const smugOffset = isSmug * R * 0.08;
  const mcx = CX + smugOffset;

  // Viseme modifiers
  let wMod = 1, hMod = 1;
  const v = state.viseme;
  if (v === 'aa') { wMod = 1.1; hMod = 1.3; }
  else if (v === 'oh') { wMod = 0.75; hMod = 1.1; }
  else if (v === 'ee') { wMod = 1.25; hMod = 0.8; }
  else if (v === 'oo') { wMod = 0.55; hMod = 0.9; }
  else if (v === 'mm') { wMod = 0.9; hMod = 0; }

  const openH = R * 0.16 * effectiveMouthOpen * hMod;
  const effectiveW = mW * wMod;
  const curveY = my + curvature * R * 0.22;

  // Round mouth (oh/oo)
  if ((v === 'oh' || v === 'oo') && effectiveMouthOpen > 0.04) {
    ctx.beginPath();
    ctx.ellipse(mcx, my + openH * 0.4, effectiveW * 0.45, openH * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#6b1a33'; ctx.fill();
    ctx.strokeStyle = config.lipColor; ctx.lineWidth = R * 0.035; ctx.stroke();
  } else if (effectiveMouthOpen > 0.04 && v !== 'mm') {
    // Open mouth interior
    ctx.beginPath();
    ctx.moveTo(mcx - effectiveW / 2, my);
    ctx.quadraticCurveTo(mcx, curveY + openH * 0.3, mcx + effectiveW / 2, my);
    ctx.quadraticCurveTo(mcx, my + openH * 1.2, mcx - effectiveW / 2, my);
    ctx.fillStyle = '#6b1a33'; ctx.fill();

    // Teeth
    if (effectiveMouthOpen > 0.2 && v !== 'oo') {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(mcx - effectiveW / 2, my);
      ctx.quadraticCurveTo(mcx, curveY + openH * 0.3, mcx + effectiveW / 2, my);
      ctx.quadraticCurveTo(mcx, my + openH * 1.2, mcx - effectiveW / 2, my);
      ctx.clip();
      ctx.fillStyle = 'rgba(255,252,245,0.92)';
      ctx.fillRect(mcx - effectiveW / 2, my, effectiveW, openH * 0.52);
      ctx.restore();
    }

    // Tongue — extends out of mouth as tongueOut increases
    if (state.tongueOut > 0.08) {
      const tongueAmt  = Math.min(1, (state.tongueOut - 0.08) / 0.5);
      const tongueExtY = tongueAmt * openH * 0.5;  // protrudes below mouth
      ctx.fillStyle = alpha('#e0607a', tongueAmt * 0.95);
      ctx.beginPath();
      ctx.ellipse(mcx, my + openH * 0.65 + tongueExtY, effectiveW * 0.3, openH * 0.42 + tongueExtY, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tongue groove
      ctx.strokeStyle = alpha('#c0405a', tongueAmt * 0.5);
      ctx.lineWidth = effectiveW * 0.04;
      ctx.beginPath();
      ctx.moveTo(mcx, my + openH * 0.38);
      ctx.lineTo(mcx, my + openH * 0.9 + tongueExtY);
      ctx.stroke();
    }
  }

  // Upper lip curve
  ctx.beginPath();
  ctx.moveTo(mcx - effectiveW / 2, my);
  ctx.bezierCurveTo(mcx - effectiveW * 0.25, my - R * 0.04, mcx, my - R * 0.02, mcx, curveY);
  ctx.bezierCurveTo(mcx, my - R * 0.02, mcx + effectiveW * 0.25, my - R * 0.04, mcx + effectiveW / 2, my);
  ctx.strokeStyle = config.lipColor; ctx.lineWidth = R * 0.045; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.stroke();

  if (effectiveMouthOpen > 0.04 || Math.abs(curvature) > 0.15) {
    ctx.beginPath();
    ctx.moveTo(mcx - effectiveW * 0.4, my + openH * 0.45);
    ctx.quadraticCurveTo(mcx, my + openH * 0.9 + curvature * R * 0.1, mcx + effectiveW * 0.4, my + openH * 0.45);
    ctx.strokeStyle = alpha(config.lipColor, 0.55); ctx.lineWidth = R * 0.038; ctx.stroke();
  }
}

// ── 3D mesh builders ───────────────────────────────────────────────────────


function buildHead(config: AvatarConfig): THREE.Group {
  const group = new THREE.Group();
  const skinHex = config.skinColor;

  const headMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(skinHex),
    shininess: 22,
    specular: new THREE.Color(0.12, 0.08, 0.06),
  });

  // Anime head: sphere compressed front-to-back, slightly tall/wide
  const headGeo = new THREE.SphereGeometry(1, 64, 48);
  const head = new THREE.Mesh(headGeo, headMat);
  head.scale.set(1.1, 1.15, 0.92);
  head.castShadow = true;
  head.receiveShadow = true;
  group.add(head);

  // Anime ink outline (BackSide trick, scaled up per-axis)
  const outlineMat = new THREE.MeshBasicMaterial({ color: 0x110820, side: THREE.BackSide });
  const outline = new THREE.Mesh(headGeo, outlineMat);
  outline.scale.set(1.1 * 1.04, 1.15 * 1.04, 0.92 * 1.04);
  group.add(outline);

  // Ears at the sphere equator sides
  const earGeo = new THREE.SphereGeometry(0.18, 16, 16);
  for (const side of [-1, 1]) {
    const earMat = new THREE.MeshPhongMaterial({
      color: new THREE.Color(skinHex),
      shininess: 18,
      specular: new THREE.Color(0.1, 0.06, 0.06),
    });
    const ear = new THREE.Mesh(earGeo, earMat);
    ear.position.set(side * 1.05, -0.08, 0.06);
    ear.castShadow = true;
    group.add(ear);

    const innerGeo = new THREE.SphereGeometry(0.1, 12, 12);
    const innerMat = new THREE.MeshPhongMaterial({
      color: new THREE.Color(config.blushColor || '#f9a8d4'),
      shininess: 10,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.position.set(side * 1.12, -0.08, 0.1);
    group.add(inner);
  }

  return group;
}

function buildHair(config: AvatarConfig): THREE.Group {
  const group = new THREE.Group();
  const hc = new THREE.Color(config.hairColor);
  const style = config.hairStyle;

  const addMesh = (geo: THREE.BufferGeometry, pos: [number, number, number], rot?: [number, number, number], scale?: [number, number, number]) => {
    const mat = new THREE.MeshPhongMaterial({
      color: hc,
      shininess: 90,
      specular: new THREE.Color(config.hairHighlightColor || '#a78bfa').multiplyScalar(0.4),
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    if (rot) mesh.rotation.set(...rot);
    if (scale) mesh.scale.set(...scale);
    // outline
    const outMat = new THREE.MeshBasicMaterial({ color: 0x111122, side: THREE.BackSide });
    const outMesh = new THREE.Mesh(geo, outMat);
    outMesh.position.copy(mesh.position); outMesh.rotation.copy(mesh.rotation);
    outMesh.scale.set((scale?.[0] ?? 1) * 1.03, (scale?.[1] ?? 1) * 1.03, (scale?.[2] ?? 1) * 1.03);
    group.add(outMesh); group.add(mesh);
  };

  if (style === 'long' || style === 'bob') {
    // Cap (half-sphere)
    const capGeo = new THREE.SphereGeometry(1.08, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.46);
    addMesh(capGeo, [0, 0.28, 0]);

    // Side strands
    const strandLen = style === 'long' ? 2.8 : 1.2;
    for (const side of [-1, 1]) {
      const strandGeo = new THREE.CylinderGeometry(0.22, 0.14, strandLen, 12);
      addMesh(strandGeo, [side * 1.05, 0.3 - strandLen / 2, 0], [0, 0, side * 0.18]);
    }
    if (style === 'long') {
      // Back panel
      const backGeo = new THREE.CylinderGeometry(0.55, 0.35, 2.4, 12);
      addMesh(backGeo, [0, 0.3 - 1.2, -0.3], [0.12, 0, 0]);
    }

  } else if (style === 'short') {
    const capGeo = new THREE.SphereGeometry(1.08, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.44);
    addMesh(capGeo, [0, 0.28, 0]);
    // 4 short bangs
    const bangPositions: [number, number, number][] = [[-0.5, -0.62, 0.82], [-0.16, -0.58, 0.88], [0.16, -0.58, 0.88], [0.5, -0.62, 0.82]];
    for (const pos of bangPositions) {
      const bangGeo = new THREE.BoxGeometry(0.28, 0.35, 0.22);
      addMesh(bangGeo, pos, [0.15, 0, 0]);
    }

  } else if (style === 'twintails') {
    const capGeo = new THREE.SphereGeometry(1.08, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.46);
    addMesh(capGeo, [0, 0.28, 0]);
    // Twintail cylinders
    for (const side of [-1, 1]) {
      const tailGeo = new THREE.CylinderGeometry(0.18, 0.1, 2.2, 10);
      addMesh(tailGeo, [side * 1.1, -0.5, 0.1], [0.1, 0, side * 0.55]);
      // Scrunchie torus
      const torusGeo = new THREE.TorusGeometry(0.22, 0.07, 8, 20);
      const torusMat = new THREE.MeshPhongMaterial({ color: new THREE.Color(config.accentColor), shininess: 60 });
      const torus = new THREE.Mesh(torusGeo, torusMat);
      torus.position.set(side * 1.0, -0.08, 0.1);
      torus.rotation.set(0, 0, side * 0.55);
      group.add(torus);
    }

  } else if (style === 'ponytail') {
    const capGeo = new THREE.SphereGeometry(1.08, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.46);
    addMesh(capGeo, [0, 0.28, 0]);
    const ptGeo = new THREE.CylinderGeometry(0.2, 0.1, 2.5, 10);
    addMesh(ptGeo, [0, -0.2, -0.6], [-0.55, 0, 0]);
    const tieMat = new THREE.MeshPhongMaterial({ color: new THREE.Color(config.accentColor), shininess: 60 });
    const tieGeo = new THREE.TorusGeometry(0.22, 0.06, 8, 20);
    const tie = new THREE.Mesh(tieGeo, tieMat);
    tie.position.set(0, 0.52, -0.4); tie.rotation.set(-0.55, 0, 0);
    group.add(tie);

  } else if (style === 'bun') {
    const capGeo = new THREE.SphereGeometry(1.08, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.46);
    addMesh(capGeo, [0, 0.28, 0]);
    // Bun
    addMesh(new THREE.SphereGeometry(0.42, 20, 20), [0, 1.42, -0.38]);
    // Stem
    addMesh(new THREE.CylinderGeometry(0.16, 0.20, 0.28, 10), [0, 1.18, -0.22], [0.35, 0, 0]);
    // Accent tie
    const tieMat2 = new THREE.MeshPhongMaterial({ color: new THREE.Color(config.accentColor), shininess: 60 });
    const tieGeo2 = new THREE.TorusGeometry(0.26, 0.07, 8, 20);
    const tie2 = new THREE.Mesh(tieGeo2, tieMat2);
    tie2.position.set(0, 1.18, -0.24); tie2.rotation.set(-0.35, 0, 0);
    group.add(tie2);

  } else if (style === 'wavy') {
    const capGeo = new THREE.SphereGeometry(1.08, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.46);
    addMesh(capGeo, [0, 0.28, 0]);
    for (const side of [-1, 1]) {
      addMesh(new THREE.CylinderGeometry(0.22, 0.20, 1.0, 10), [side * 1.0, -0.15, 0.08], [0, 0, side * 0.14]);
      addMesh(new THREE.CylinderGeometry(0.20, 0.18, 1.0, 10), [side * 0.86, -1.08, -0.08], [0, 0, -side * 0.10]);
      addMesh(new THREE.CylinderGeometry(0.18, 0.13, 1.0, 10), [side * 1.0, -2.00,  0.06], [0, 0, side * 0.12]);
    }
    addMesh(new THREE.CylinderGeometry(0.52, 0.38, 2.0, 12), [0, -0.75, -0.32], [0.12, 0, 0]);
  }

  return group;
}

function buildAccessories(config: AvatarConfig): THREE.Group {
  const group = new THREE.Group();

  if (config.accessories.includes('cat_ears')) {
    for (const side of [-1, 1]) {
      const earGeo = new THREE.ConeGeometry(0.22, 0.45, 3);
      const earMat = new THREE.MeshToonMaterial({ color: new THREE.Color(config.hairColor) });
      const ear = new THREE.Mesh(earGeo, earMat);
      ear.position.set(side * 0.62, 1.28, 0);
      ear.rotation.set(0, 0, side * 0.22);
      group.add(ear);
      // Inner pink triangle
      const innerGeo = new THREE.ConeGeometry(0.12, 0.28, 3);
      const innerMat = new THREE.MeshToonMaterial({ color: 0xffb3cc });
      const inner = new THREE.Mesh(innerGeo, innerMat);
      inner.position.copy(ear.position); inner.position.z += 0.02;
      inner.rotation.copy(ear.rotation);
      group.add(inner);
    }
  }

  if (config.accessories.includes('bunny_ears')) {
    for (const side of [-1, 1]) {
      const earGeo = new THREE.CapsuleGeometry(0.1, 0.7, 8, 8);
      const earMat = new THREE.MeshToonMaterial({ color: new THREE.Color(config.hairColor) });
      const ear = new THREE.Mesh(earGeo, earMat);
      ear.position.set(side * 0.38, 1.55, 0);
      ear.rotation.set(0, 0, side * 0.12);
      group.add(ear);
      // Pink inner
      const innerGeo = new THREE.CapsuleGeometry(0.05, 0.5, 8, 8);
      const innerMat = new THREE.MeshToonMaterial({ color: 0xffb3cc });
      const inner = new THREE.Mesh(innerGeo, innerMat);
      inner.position.copy(ear.position); inner.position.z += 0.06;
      inner.rotation.copy(ear.rotation);
      group.add(inner);
    }
  }

  if (config.accessories.includes('horns')) {
    for (const side of [-1, 1]) {
      const hornGeo = new THREE.ConeGeometry(0.13, 0.5, 8);
      const hornMat = new THREE.MeshToonMaterial({ color: new THREE.Color(config.accentColor) });
      const horn = new THREE.Mesh(hornGeo, hornMat);
      horn.position.set(side * 0.45, 1.15, 0.1);
      horn.rotation.set(0.3, 0, side * 0.25);
      group.add(horn);
    }
  }

  if (config.accessories.includes('glasses')) {
    // Two torus frames
    for (const side of [-1, 1]) {
      const frameGeo = new THREE.TorusGeometry(0.22, 0.035, 8, 28);
      const frameMat = new THREE.MeshToonMaterial({ color: 0x888888 });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.set(side * 0.45, -0.12, 0.95);
      group.add(frame);
    }
    // Bridge cylinder
    const bridgeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.46, 8);
    const bridgeMat = new THREE.MeshToonMaterial({ color: 0x888888 });
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(0, -0.12, 0.95); bridge.rotation.z = Math.PI / 2;
    group.add(bridge);
  }

  if (config.accessories.includes('bow')) {
    const bowColor = new THREE.Color(config.accentColor);
    const bowLightColor = new THREE.Color(config.accentColor).multiplyScalar(1.3);
    // Two wings
    for (const side of [-1, 1]) {
      const wingGeo = new THREE.BoxGeometry(0.32, 0.2, 0.08);
      const wingMat = new THREE.MeshToonMaterial({ color: bowColor });
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.position.set(side * 0.22, 1.1, 0.1); wing.rotation.z = side * 0.18;
      group.add(wing);
    }
    // Center knot
    const knotGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const knotMat = new THREE.MeshToonMaterial({ color: bowLightColor });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    knot.position.set(0, 1.1, 0.12);
    group.add(knot);
  }

  return group;
}

function buildBonusAccessories(config: AvatarConfig): THREE.Group {
  const group = new THREE.Group();

  if (config.bonusAccessories.includes('headphones')) {
    // Band torus
    const bandGeo = new THREE.TorusGeometry(1.05, 0.05, 8, 32, Math.PI);
    const bandMat = new THREE.MeshToonMaterial({ color: 0x222233 });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.set(0, 0.1, 0); band.rotation.set(0, 0, Math.PI);
    group.add(band);
    // Ear cups
    for (const side of [-1, 1]) {
      const cupGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.22, 20);
      const cupMat = new THREE.MeshToonMaterial({ color: 0x333344 });
      const cup = new THREE.Mesh(cupGeo, cupMat);
      cup.position.set(side * 1.1, -0.05, 0); cup.rotation.z = Math.PI / 2;
      group.add(cup);
      // Colored accent disc
      const accentGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 20);
      const accentMat = new THREE.MeshToonMaterial({ color: new THREE.Color(config.accentColor) });
      const accent = new THREE.Mesh(accentGeo, accentMat);
      accent.position.set(side * (1.1 + 0.14), -0.05, 0); accent.rotation.z = Math.PI / 2;
      group.add(accent);
    }
  }

  if (config.bonusAccessories.includes('wings')) {
    // Bezier wing shape on each side
    for (const side of [-1, 1]) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.bezierCurveTo(side * 0.5, -1.1, side * 1.3, -0.7, side * 1.2, 0.1);
      shape.bezierCurveTo(side * 1.0, 0.4, side * 0.4, 0.3, 0, 0);
      // Lower panel
      shape.moveTo(0, 0);
      shape.bezierCurveTo(side * 0.8, 0.4, side * 1.0, 0.9, side * 0.6, 1.2);
      shape.bezierCurveTo(side * 0.3, 1.1, 0, 0.8, 0, 0);

      const wingGeo = new THREE.ShapeGeometry(shape);
      const wingMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(config.accentColor),
        side: THREE.DoubleSide,
        transparent: true, opacity: 0.65,
      });
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.position.set(side * 0.9, 0.3, -0.3);
      group.add(wing);
    }
  }

  if (config.bonusAccessories.includes('tail')) {
    // Animated tail — sway applied each frame via userData flag
    const tailGeo = new THREE.CylinderGeometry(0.12, 0.06, 1.2, 10);
    const tailMat = new THREE.MeshToonMaterial({ color: new THREE.Color(config.hairColor) });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0.15, -1.9, -0.3);
    tail.userData.isTail = true;
    group.add(tail);
    // Tuft
    const tuftGeo = new THREE.SphereGeometry(0.22, 12, 12);
    const tuftMat = new THREE.MeshToonMaterial({ color: new THREE.Color(config.hairHighlightColor) });
    const tuft = new THREE.Mesh(tuftGeo, tuftMat);
    tuft.position.set(0.15, -2.55, -0.3);
    tuft.userData.isTuft = true;
    group.add(tuft);
  }

  if (config.bonusAccessories.includes('flower_crown')) {
    const FLOWERS = 7;
    const colors = [0xf472b6, 0xfb923c, 0xfbbf24, 0x34d399, 0x60a5fa, 0xc084fc];
    for (let i = 0; i < FLOWERS; i++) {
      const angle = -Math.PI * 0.75 + (i / (FLOWERS - 1)) * Math.PI * 0.75 * 2;
      const fx = Math.cos(angle) * 0.95;
      const fy = 1.08 + Math.sin(Math.abs(angle)) * 0.05;
      const fz = Math.sin(angle) * 0.15;
      const col = colors[i % colors.length];
      // 5 petals
      for (let p = 0; p < 5; p++) {
        const pa = (p * 2 * Math.PI) / 5;
        const petalGeo = new THREE.CircleGeometry(0.09, 8);
        const petalMat = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide });
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.set(fx + Math.cos(pa) * 0.1, fy, fz + Math.sin(pa) * 0.1);
        petal.lookAt(0, fy + 2, 0);
        group.add(petal);
      }
      // Center
      const centerGeo = new THREE.CircleGeometry(0.055, 8);
      const centerMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide });
      const center = new THREE.Mesh(centerGeo, centerMat);
      center.position.set(fx, fy + 0.01, fz);
      center.lookAt(0, fy + 2, 0);
      group.add(center);
    }
  }

  return group;
}

function buildBody(config: AvatarConfig): THREE.Group {
  const group = new THREE.Group();

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.55, 12);
  const neckMat = new THREE.MeshToonMaterial({ color: new THREE.Color(config.skinColor) });
  const neck = new THREE.Mesh(neckGeo, neckMat);
  neck.position.set(0, -1.3, 0);
  group.add(neck);

  // Shoulders/chest — scaled by bodyType
  const bW = config.bodyType === 'slim' ? 1.9 : config.bodyType === 'curvy' ? 2.5 : 2.2;
  const bD = config.bodyType === 'slim' ? 0.55 : config.bodyType === 'curvy' ? 0.80 : 0.65;
  const bodyGeo = new THREE.BoxGeometry(bW, 2.0, bD);
  const bodyMat = new THREE.MeshToonMaterial({ color: new THREE.Color(config.outfitColor) });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.set(0, -2.35, 0);
  group.add(body);

  // Outfit details
  if (config.outfitStyle === 'idol') {
    // Bow tie
    for (const side of [-1, 1]) {
      const wingGeo = new THREE.BoxGeometry(0.28, 0.16, 0.1);
      const wingMat = new THREE.MeshToonMaterial({ color: new THREE.Color(config.accentColor) });
      const wing = new THREE.Mesh(wingGeo, wingMat);
      wing.position.set(side * 0.18, -1.62, 0.34);
      group.add(wing);
    }
    const knotGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const knotMat = new THREE.MeshToonMaterial({ color: new THREE.Color(config.accentColor).multiplyScalar(1.25) });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    knot.position.set(0, -1.62, 0.36);
    group.add(knot);
  } else if (config.outfitStyle === 'school') {
    // Collar triangle
    const shape = new THREE.Shape();
    shape.moveTo(-0.35, 0); shape.lineTo(0, -0.38); shape.lineTo(0.35, 0);
    const collarGeo = new THREE.ShapeGeometry(shape);
    const collarMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(config.accentColor), side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.set(0, -1.58, 0.35);
    group.add(collar);
  } else if (config.outfitStyle === 'fantasy') {
    // Gem decoration
    const gemGeo = new THREE.OctahedronGeometry(0.1);
    const gemMat = new THREE.MeshToonMaterial({ color: new THREE.Color(config.accentColor), emissive: new THREE.Color(config.accentColor), emissiveIntensity: 0.3 });
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.set(0, -1.65, 0.36);
    group.add(gem);
  }

  return group;
}

// ── Avatar3DRenderer ──────────────────────────────────────────────────────

export class Avatar3DRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private rootGroup: THREE.Group;
  private headGroup: THREE.Group;
  private hairGroup: THREE.Group;
  private accessoryGroup: THREE.Group;
  private bonusGroup: THREE.Group;
  private bodyGroup: THREE.Group;

  private faceCanvas: HTMLCanvasElement;
  private faceCtx: CanvasRenderingContext2D;
  private faceTex: THREE.CanvasTexture;

  private configSig = '';

  private handGroups: THREE.Group[] = [];
  private handJoints: THREE.Mesh[][] = [];
  private handBones: THREE.Mesh[][] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth || 512, canvas.clientHeight || 512, false);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(35, (canvas.clientWidth || 512) / (canvas.clientHeight || 512), 0.1, 100);
    this.camera.position.set(0, 0.4, 8);
    this.camera.lookAt(0, 0.4, 0);

    // Lighting — warm anime with rim depth
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const ambient = new THREE.AmbientLight(0xfff0e8, 0.55);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff3d0, 2.2);
    key.position.set(2.5, 5, 6);
    key.castShadow = true;
    key.shadow.mapSize.width  = 1024;
    key.shadow.mapSize.height = 1024;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far  = 25;
    key.shadow.bias = -0.002;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xd8e8ff, 0.7);
    fill.position.set(-4, 2, 3);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xff88cc, 0.55);
    rim.position.set(-0.5, -2, -5);
    this.scene.add(rim);

    // Face canvas texture
    this.faceCanvas = document.createElement('canvas');
    this.faceCanvas.width = CANVAS_SIZE;
    this.faceCanvas.height = CANVAS_SIZE;
    this.faceCtx = this.faceCanvas.getContext('2d')!;
    this.faceTex = new THREE.CanvasTexture(this.faceCanvas);

    // Groups
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    this.headGroup = new THREE.Group();
    this.rootGroup.add(this.headGroup);

    // Head mesh
    const headMeshes = buildHead({ skinColor: '#fde8d0', hairColor: '', hairHighlightColor: '', hairStyle: 'long', eyeColor: '', eyeStyle: 'round', eyeDecoration: 'normal', accessories: [], bonusAccessories: [], skinMarkings: [], outfitColor: '', outfitStyle: 'casual', accentColor: '', blushColor: '', eyebrowColor: '', lipColor: '', eyeSize: 1, eyeSpacing: 1, eyebrowStyle: 'normal', noseStyle: 'dot', mouthSize: 1, bodyType: 'average', background: 'none' });
    this.headGroup.add(headMeshes);

    // Face plane (inside headGroup)
    const facePlaneGeo = new THREE.PlaneGeometry(2.0, 2.0);
    const facePlaneMat = new THREE.MeshBasicMaterial({ map: this.faceTex, transparent: true, depthWrite: false, depthTest: false });
    const facePlane = new THREE.Mesh(facePlaneGeo, facePlaneMat);
    facePlane.renderOrder = 1;
    facePlane.position.set(0, 0.15, 0.93);
    this.headGroup.add(facePlane);

    this.hairGroup = new THREE.Group();
    this.headGroup.add(this.hairGroup);

    this.accessoryGroup = new THREE.Group();
    this.headGroup.add(this.accessoryGroup);

    this.bonusGroup = new THREE.Group();
    this.headGroup.add(this.bonusGroup);

    this.bodyGroup = new THREE.Group();
    this.rootGroup.add(this.bodyGroup);

    this.initHands('#fde8d0');
  }

  render(config: AvatarConfig, state: AvatarLiveState, handLandmarks?: Array<{ x: number; y: number; z: number }[]> | null): void {
    // Rebuild structural meshes only when config changes
    // Apply background
    const bg = config.background ?? 'none';
    if (bg === 'none') {
      this.scene.background = null;
    } else if (bg === 'gradient') {
      this.scene.background = new THREE.Color(0x1a0a2e);
    } else if (bg === 'stars') {
      this.scene.background = new THREE.Color(0x050510);
    } else if (bg === 'holographic') {
      this.scene.background = new THREE.Color(0x0a1a2a);
    } else if (bg === 'sakura') {
      this.scene.background = new THREE.Color(0x1a0a14);
    } else if (bg === 'rain') {
      this.scene.background = new THREE.Color(0x080c14);
    }

    const sig = JSON.stringify({
      skinColor: config.skinColor, hairColor: config.hairColor, hairHighlightColor: config.hairHighlightColor,
      hairStyle: config.hairStyle, eyeColor: config.eyeColor, eyeStyle: config.eyeStyle,
      eyeDecoration: config.eyeDecoration, accessories: config.accessories, bonusAccessories: config.bonusAccessories,
      outfitColor: config.outfitColor, outfitStyle: config.outfitStyle, accentColor: config.accentColor,
      blushColor: config.blushColor, eyebrowColor: config.eyebrowColor, lipColor: config.lipColor,
      bodyType: config.bodyType,
    });

    if (sig !== this.configSig) {
      this.configSig = sig;
      this.rebuildConfig(config);
    }

    // Head rotation & tilt
    this.headGroup.rotation.x = state.headRotX ?? 0;
    this.headGroup.rotation.y = -(state.headRotY ?? 0);
    this.headGroup.rotation.z = -state.headTilt;

    // Breathing
    this.rootGroup.position.y = Math.sin(state.breathPhase) * 0.04;

    // Tail sway animation
    const sway = Math.sin(Date.now() / 800) * 0.25;
    this.bonusGroup.traverse(child => {
      if (child.userData.isTail) child.rotation.z = sway;
      if (child.userData.isTuft) { child.rotation.z = sway * 1.2; child.position.x = 0.15 + sway * 0.3; }
    });

    // Redraw face canvas
    drawFaceCanvas(this.faceCtx, config, state);
    this.faceTex.needsUpdate = true;

    this.updateHands(handLandmarks ?? null);

    this.renderer.render(this.scene, this.camera);
  }

  private rebuildConfig(config: AvatarConfig) {
    // Rebuild head meshes
    while (this.headGroup.children.length > 0) {
      const child = this.headGroup.children[0];
      disposeMesh(child);
      this.headGroup.remove(child);
    }

    // Head
    const headMeshGroup = buildHead(config);
    this.headGroup.add(headMeshGroup);

    // Face plane
    const facePlaneGeo = new THREE.PlaneGeometry(2.0, 2.0);
    const facePlaneMat = new THREE.MeshBasicMaterial({ map: this.faceTex, transparent: true, depthWrite: false, depthTest: false });
    const facePlane = new THREE.Mesh(facePlaneGeo, facePlaneMat);
    facePlane.renderOrder = 1;
    facePlane.position.set(0, 0.15, 0.93);
    this.headGroup.add(facePlane);

    // Hair
    this.hairGroup = buildHair(config);
    this.headGroup.add(this.hairGroup);

    // Accessories
    this.accessoryGroup = buildAccessories(config);
    this.headGroup.add(this.accessoryGroup);

    // Bonus accessories (head-attached)
    this.bonusGroup = buildBonusAccessories(config);
    this.headGroup.add(this.bonusGroup);

    // Body (not head-attached — stays on rootGroup)
    while (this.bodyGroup.children.length > 0) {
      const child = this.bodyGroup.children[0];
      disposeMesh(child);
      this.bodyGroup.remove(child);
    }
    const newBody = buildBody(config);
    newBody.children.forEach(c => this.bodyGroup.add(c));
    this.bodyGroup.position.set(0, -1.05, 0);

    this.initHands(config.skinColor);
  }

  private initHands(skinColor: string) {
    // Remove old hand groups from scene
    this.handGroups.forEach(g => {
      disposeMesh(g);
      this.scene.remove(g);
    });
    this.handGroups = [];
    this.handJoints = [];
    this.handBones  = [];

    for (let h = 0; h < 2; h++) {
      const group = new THREE.Group();
      group.visible = false;
      this.scene.add(group);
      this.handGroups.push(group);

      const skinMat = new THREE.MeshPhongMaterial({
        color: new THREE.Color(skinColor),
        shininess: 18,
        specular: new THREE.Color(0.1, 0.06, 0.05),
      });
      const nailMat = new THREE.MeshPhongMaterial({
        color: new THREE.Color(skinColor).multiplyScalar(1.15),
        shininess: 50,
      });
      const outlineMat = new THREE.MeshBasicMaterial({
        color: 0x110820,
        side: THREE.BackSide,
      });

      // 21 joints (spheres)
      const joints: THREE.Mesh[] = [];
      for (let j = 0; j < 21; j++) {
        // Fingertips are slightly larger
        const r = (j === 4 || j === 8 || j === 12 || j === 16 || j === 20) ? 0.028 : 0.022;
        const geo = new THREE.SphereGeometry(r, 8, 8);
        const mesh = new THREE.Mesh(geo, j === 0 ? skinMat.clone() : skinMat);
        mesh.castShadow = true;
        group.add(mesh);
        joints.push(mesh);

        // Fingernail at fingertips
        if (j === 4 || j === 8 || j === 12 || j === 16 || j === 20) {
          const nailGeo = new THREE.BoxGeometry(0.028, 0.014, 0.022);
          const nail = new THREE.Mesh(nailGeo, nailMat);
          nail.position.set(0, 0, r * 0.6);
          mesh.add(nail);
        }
      }
      this.handJoints.push(joints);

      // 22 bones (cylinders)
      const bones: THREE.Mesh[] = [];
      for (let b = 0; b < HAND_CONNECTIONS.length; b++) {
        const geo = new THREE.CylinderGeometry(0.013, 0.016, 1, 6);
        const mesh = new THREE.Mesh(geo, skinMat);
        mesh.castShadow = true;
        group.add(mesh);

        // Bone outline
        const olGeo = new THREE.CylinderGeometry(0.016, 0.019, 1, 6);
        const ol = new THREE.Mesh(olGeo, outlineMat);
        mesh.add(ol);

        bones.push(mesh);
      }
      this.handBones.push(bones);
    }
  }

  private updateHands(
    landmarks: Array<{ x: number; y: number; z: number }[]> | null,
  ) {
    this.handGroups.forEach(g => { g.visible = false; });
    if (!landmarks?.length) return;

    // Map screen-space landmarks (0-1) to 3D world space
    const camZ  = this.camera.position.z;  // ~8
    const handZ = 1.8;  // place hands in front of avatar
    const fovRad = this.camera.fov * (Math.PI / 180);
    const dist = camZ - handZ;
    const viewH = 2 * dist * Math.tan(fovRad / 2);
    const viewW = viewH * this.camera.aspect;
    // camera lookAt y offset
    void camZ; // used via dist calculation above

    const toWorld = (pt: { x: number; y: number; z: number }): THREE.Vector3 =>
      new THREE.Vector3(
        (0.5 - pt.x) * viewW,
        0.4 + (0.5 - pt.y) * viewH,
        handZ + pt.z * 1.5,
      );

    landmarks.forEach((hand, hi) => {
      if (hi >= this.handGroups.length) return;
      const group = this.handGroups[hi];
      group.visible = true;

      const pts = hand.map(toWorld);

      // Update joint spheres
      pts.forEach((p, j) => {
        if (j < this.handJoints[hi].length) {
          this.handJoints[hi][j].position.copy(p);
        }
      });

      // Update bones
      HAND_CONNECTIONS.forEach(([a, b], i) => {
        if (i >= this.handBones[hi].length) return;
        if (a >= pts.length || b >= pts.length) return;
        const bone = this.handBones[hi][i];
        const from = pts[a];
        const to   = pts[b];
        const len  = from.distanceTo(to);
        if (len < 0.001) { bone.visible = false; return; }
        bone.visible = true;
        bone.position.copy(from).lerp(to, 0.5);
        bone.scale.y = len;
        bone.lookAt(to);
        bone.rotateX(Math.PI / 2);
      });
    });
  }

  dispose(): void {
    disposeMesh(this.scene);
    this.faceTex.dispose();
    this.renderer.dispose();
  }
}
