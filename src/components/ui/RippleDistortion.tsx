"use client";

import React, { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { Renderer, Program, Mesh, Geometry, Triangle, Texture, RenderTarget } from 'ogl';

const MAX_WAVES = 70;
const QUALITY_SCALE: Record<string, number> = { low: 0.4, medium: 0.6, high: 0.75 };
const START_SCALE = 1.0;
const LIFE_CONSTANT = Math.log(500);

const waveVertex = `
precision highp float;

attribute vec2 position;
attribute vec2 uv;
attribute vec2 iOffset;
attribute vec2 iScale;
attribute float iOpacity;
attribute float iRings;

varying vec2 vUv;
varying float vOpacity;
varying float vRings;

void main() {
  vUv = uv;
  vOpacity = iOpacity;
  vRings = iRings;
  gl_Position = vec4(iOffset + position * iScale, 0.0, 1.0);
}
`;

const waveFragment = `
precision highp float;

varying vec2 vUv;
varying float vOpacity;
varying float vRings;

uniform float uRings;

const float PI = 3.141592653589793;
const float EDGE = 0.006737947;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = dot(p, p);
  if (r > 1.0) discard;

  // Continuous fluid Gaussian brush profile
  float brush = (exp(-r * 4.2) - EDGE) / (1.0 - EDGE);
  
  // Concentric ripple rings (active when vRings > 0.05, e.g. on click or textured hover)
  if (vRings > 0.05) {
    brush *= 0.48 + 0.52 * cos(sqrt(r) * PI * 2.0 * vRings);
  }

  gl_FragColor = vec4(vec3(brush * vOpacity * vOpacity), 1.0);
}
`;

const screenVertex = `
precision highp float;
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const compositeFragment = `
precision highp float;

varying vec2 vUv;

uniform sampler2D uTexture;
uniform sampler2D uDisplacement;
uniform vec2 uResolution;
uniform vec2 uTextureSize;
uniform vec2 uTexel;
uniform vec3 uTint;
uniform vec3 uHighlight;
uniform float uStrength;
uniform float uSwirl;
uniform float uDispersion;
uniform float uGlint;
uniform float uTintAmount;
uniform float uGrayscale;

const float TAU = 6.283185307179586;

vec2 coverUV(vec2 uv) {
  vec2 safe = max(uTextureSize, vec2(1.0));
  vec2 s = uResolution / safe;
  vec2 scaledSize = safe * max(s.x, s.y);
  // Horizontally centered, vertically top-aligned to match object-position: center top
  vec2 offset = vec2((uResolution.x - scaledSize.x) * 0.5, uResolution.y - scaledSize.y);
  return (uv * uResolution - offset) / scaledSize;
}

void main() {
  float amount = texture2D(uDisplacement, vUv).r;
  vec2 base = coverUV(vUv);

  float theta = amount * uSwirl * TAU;
  vec2 dir = vec2(sin(theta), cos(theta));
  vec2 push = dir * amount * uStrength;

  vec4 tex = texture2D(uTexture, base + push);
  if (tex.a < 0.04) {
    discard;
  }

  // Fluid liquid metal / molten ruby surface gradient
  vec3 topTone = vec3(1.0, 0.24, 0.26);
  vec3 midTone = vec3(0.90, 0.11, 0.14);
  vec3 deepTone = vec3(0.68, 0.05, 0.08);
  float liquidY = clamp((base.y + push.y * 3.5 - 0.38) * 1.8, 0.0, 1.0);
  vec3 liquidGrad = mix(deepTone, mix(midTone, topTone, liquidY), liquidY);
  vec3 baseColor = mix(tex.rgb, liquidGrad, 0.60);

  vec3 color;
  if (uDispersion > 0.001) {
    float split = uDispersion * 0.25;
    color.r = texture2D(uTexture, base + push * (1.0 + split)).r;
    color.g = texture2D(uTexture, base + push).g;
    color.b = texture2D(uTexture, base + push * (1.0 - split)).b;
    color = mix(color, baseColor, 0.65);
  } else {
    color = baseColor;
  }

  if (uGrayscale > 0.001) {
    color = mix(color, vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), uGrayscale);
  }

  if (uTintAmount > 0.001) {
    color = mix(color, color * uTint * 1.5, clamp(amount * 1.5, 0.0, 1.0) * uTintAmount);
  }

  if (uGlint > 0.001 || amount > 0.001) {
    float ex = texture2D(uDisplacement, vUv + vec2(uTexel.x, 0.0)).r - texture2D(uDisplacement, vUv - vec2(uTexel.x, 0.0)).r;
    float ey = texture2D(uDisplacement, vUv + vec2(0.0, uTexel.y)).r - texture2D(uDisplacement, vUv - vec2(0.0, uTexel.y)).r;
    
    // 3D water surface normal with high responsiveness
    vec3 normal = normalize(vec3(-ex * 85.0, -ey * 85.0, 1.0));
    vec3 light = normalize(vec3(-0.35, 0.55, 0.85));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfVec = normalize(light + viewDir);

    // Liquid water specular glint on wave crests
    float NdotH = max(dot(normal, halfVec), 0.0);
    float spec = pow(NdotH, 18.0);
    color += uHighlight * spec * uGlint * clamp(amount * 4.0, 0.0, 1.0);

    // Wave slope shading: gives tangible 3D liquid waves (illuminated crests & deeper ruby troughs)
    float waveSlope = dot(normal.xy, light.xy);
    color += uHighlight * clamp(waveSlope * 1.4, 0.0, 0.75) * clamp(amount * 2.8, 0.0, 1.0);
    color = mix(color, color * 0.55, clamp(-waveSlope * 1.4, 0.0, 0.6) * clamp(amount * 2.8, 0.0, 1.0));
  }

  gl_FragColor = vec4(color, tex.a);
}
`;

type RippleTrigger = 'hover' | 'click' | 'both';
type RippleQuality = 'low' | 'medium' | 'high';

export interface RippleDistortionProps {
  src?: string;
  brushSize?: number;
  strength?: number;
  swirl?: number;
  rings?: number;
  hoverRings?: number;
  spread?: number;
  fade?: number;
  speed?: number;
  spacing?: number;
  dispersion?: number;
  glint?: number;
  tint?: string;
  tintAmount?: number;
  grayscale?: boolean;
  highlightColor?: string;
  trigger?: RippleTrigger;
  clickStrength?: number;
  quality?: RippleQuality;
  enabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

interface WaveConfig {
  brushSize: number;
  spread: number;
  fade: number;
  speed: number;
  spacing: number;
  clickStrength: number;
  rings: number;
  hoverRings: number;
  trigger: RippleTrigger;
  enabled: boolean;
}

interface Wave {
  x: number;
  y: number;
  scale: number;
  target: number;
  size: number;
  opacity: number;
  rings: number;
}

interface CompositeUniforms {
  uTexture: { value: Texture };
  uDisplacement: { value: Texture };
  uResolution: { value: [number, number] };
  uTextureSize: { value: [number, number] };
  uTexel: { value: [number, number] };
  uTint: { value: [number, number, number] };
  uHighlight: { value: [number, number, number] };
  uStrength: { value: number };
  uSwirl: { value: number };
  uDispersion: { value: number };
  uGlint: { value: number };
  uTintAmount: { value: number };
  uGrayscale: { value: number };
  [key: string]: { value: unknown };
}

interface WaveUniforms {
  uRings: { value: number };
  [key: string]: { value: unknown };
}

interface RippleUniforms {
  wave: WaveUniforms;
  composite: CompositeUniforms;
}

const hexToRGB = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map(c => c + c)
          .join('')
      : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [1, 1, 1];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const RippleDistortion = ({
  src = '/assets/hero-text.svg',
  brushSize = 90,
  strength = 0.16,
  swirl = 0.35,
  rings = 2,
  hoverRings = 0.0,
  spread = 2.6,
  fade = 3.2,
  speed = 0.55,
  spacing = 5,
  dispersion = 0.02,
  glint = 0.8,
  tint = '#e51d24',
  tintAmount = 0.18,
  grayscale = false,
  highlightColor = '#ffffff',
  trigger = 'both',
  clickStrength = 2.2,
  quality = 'high',
  enabled = true,
  className = '',
  style
}: RippleDistortionProps) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const configRef = useRef<WaveConfig>({} as WaveConfig);
  const uniformsRef = useRef<RippleUniforms | null>(null);

  configRef.current = { brushSize, spread, fade, speed, spacing, clickStrength, rings, hoverRings, trigger, enabled };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: 1
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const canvas = gl.canvas;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    mount.appendChild(canvas);

    const imageTexture = new Texture(gl, {
      generateMipmaps: false,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE
    });

    const offsets = new Float32Array(MAX_WAVES * 2);
    const scales = new Float32Array(MAX_WAVES * 2);
    const opacities = new Float32Array(MAX_WAVES);
    const ringsArray = new Float32Array(MAX_WAVES);

    const waves: Wave[] = Array.from({ length: MAX_WAVES }, () => ({
      x: 0,
      y: 0,
      scale: START_SCALE,
      target: START_SCALE,
      size: 1,
      opacity: 0,
      rings: 0
    }));
    let current = 0;

    const geometry = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]) },
      uv: { size: 2, data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]) },
      iOffset: { instanced: 1, size: 2, data: offsets },
      iScale: { instanced: 1, size: 2, data: scales },
      iOpacity: { instanced: 1, size: 1, data: opacities },
      iRings: { instanced: 1, size: 1, data: ringsArray }
    });

    const waveUniforms: WaveUniforms = { uRings: { value: rings } };
    const waveProgram = new Program(gl, {
      vertex: waveVertex,
      fragment: waveFragment,
      uniforms: waveUniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      cullFace: false
    });
    waveProgram.setBlendFunc(gl.ONE, gl.ONE);
    const waveMesh = new Mesh(gl, { geometry, program: waveProgram, frustumCulled: false });

    const displacementTarget = new RenderTarget(gl, {
      width: 2,
      height: 2,
      depth: false,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE
    });

    const compositeUniforms: CompositeUniforms = {
      uTexture: { value: imageTexture },
      uDisplacement: { value: displacementTarget.texture },
      uResolution: { value: [1, 1] },
      uTextureSize: { value: [1448, 1086] },
      uTexel: { value: [1, 1] },
      uTint: { value: hexToRGB(tint) },
      uHighlight: { value: hexToRGB(highlightColor) },
      uStrength: { value: strength },
      uSwirl: { value: swirl },
      uDispersion: { value: dispersion },
      uGlint: { value: glint },
      uTintAmount: { value: tintAmount },
      uGrayscale: { value: grayscale ? 1 : 0 }
    };

    const compositeMesh = new Mesh(gl, {
      geometry: new Triangle(gl),
      program: new Program(gl, {
        vertex: screenVertex,
        fragment: compositeFragment,
        uniforms: compositeUniforms,
        depthTest: false,
        depthWrite: false
      })
    });

    let disposed = false;
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    const applyImage = () => {
      if (disposed) return;
      imageTexture.image = image;
      const w = image.naturalWidth || 1448;
      const h = image.naturalHeight || 1086;
      compositeUniforms.uTextureSize.value = [w, h];
      renderer.render({ scene: compositeMesh });
    };
    image.onload = applyImage;
    image.src = src;
    if (image.complete && image.naturalWidth) {
      applyImage();
    }

    uniformsRef.current = { wave: waveUniforms, composite: compositeUniforms };

    let width = 1;
    let height = 1;

    const resize = () => {
      width = Math.max(1, mount.clientWidth);
      height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height);
      compositeUniforms.uResolution.value = [width, height];

      const scale = QUALITY_SCALE[quality] || QUALITY_SCALE.high;
      const fieldW = Math.max(2, Math.round(width * scale));
      const fieldH = Math.max(2, Math.round(height * scale));
      displacementTarget.setSize(fieldW, fieldH);
      compositeUniforms.uTexel.value = [1 / fieldW, 1 / fieldH];

      if (imageTexture.image) {
        renderer.render({ scene: compositeMesh });
      }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    let isLoopRunning = false;
    let isVisible = true;
    let needsRenderAfterClear = false;
    let raf = 0;
    let previousTime = 0;

    const startLoop = () => {
      if (!isLoopRunning && isVisible && !disposed) {
        isLoopRunning = true;
        previousTime = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    const stopLoop = () => {
      if (isLoopRunning) {
        cancelAnimationFrame(raf);
        isLoopRunning = false;
      }
    };

    const setNewWave = (
      x: number,
      y: number,
      opacity = 1,
      ringCount = 0,
      scaleMult = 1.0,
      spreadMult = 1.0
    ) => {
      const cfg = configRef.current;
      const wave = waves[current];
      const idx = current;
      current = (current + 1) % MAX_WAVES;
      
      wave.x = x;
      wave.y = y;
      wave.scale = START_SCALE * scaleMult;
      wave.target = START_SCALE * Math.max(1, cfg.spread) * scaleMult * spreadMult;
      wave.size = Math.max(1, cfg.brushSize);
      wave.opacity = opacity;
      wave.rings = ringCount;
      ringsArray[idx] = ringCount;

      needsRenderAfterClear = true;
      startLoop();
    };

    const localPoint = (clientX: number, clientY: number): [number, number] | null => {
      const rect = mount.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
        return null;
      }

      // Map client coordinates to 1448x1086 texture space
      const texW = compositeUniforms.uTextureSize.value[0] || 1448;
      const texH = compositeUniforms.uTextureSize.value[1] || 1086;
      const scale = Math.max(rect.width / texW, rect.height / texH);
      const scaledW = texW * scale;
      const offsetX = (rect.width - scaledW) * 0.5;
      const domX = clientX - rect.left;
      const domY = clientY - rect.top;
      const imgX = (domX - offsetX) / scale;
      const imgY = domY / scale;

      // Generous bounding box covering hero text region with smooth bleed:
      if (imgX < 110 || imgX > 1330 || imgY < 15 || imgY > 720) {
        return null;
      }

      return [clientX - rect.left, rect.height - (clientY - rect.top)];
    };

    let lastX = 0;
    let lastY = 0;
    let hasLastPoint = false;

    const emitHoverStroke = (startX: number, startY: number, endX: number, endY: number) => {
      const cfg = configRef.current;
      const dx = endX - startX;
      const dy = endY - startY;
      const dist = Math.hypot(dx, dy);

      const stepSize = Math.max(3, cfg.spacing || 5);
      const steps = Math.min(Math.max(1, Math.floor(dist / stepSize)), 24);
      const stepDist = dist / steps;
      const strokeOpacity = Math.min(0.58, 0.32 + (stepDist / 40) * 0.16);

      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = startX + dx * t;
        const y = startY + dy * t;
        setNewWave(x, y, strokeOpacity, cfg.hoverRings, 0.90, 1.05);
      }
    };

    const processPointerPoint = (clientX: number, clientY: number) => {
      if (!isVisible) return;
      const cfg = configRef.current;
      if (!cfg.enabled || reduceMotion || cfg.trigger === 'click') return;
      const point = localPoint(clientX, clientY);
      if (!point) {
        hasLastPoint = false;
        return;
      }

      if (!hasLastPoint) {
        setNewWave(point[0], point[1], 0.35, cfg.hoverRings, 0.85, 1.0);
        lastX = point[0];
        lastY = point[1];
        hasLastPoint = true;
        return;
      }

      const dist = Math.hypot(point[0] - lastX, point[1] - lastY);
      const minStep = Math.max(2, cfg.spacing || 5);
      if (dist >= minStep) {
        emitHoverStroke(lastX, lastY, point[0], point[1]);
        lastX = point[0];
        lastY = point[1];
      }
    };

    const onMove = (event: PointerEvent) => {
      if (!isVisible) return;
      const coalesced = typeof (event as any).getCoalescedEvents === 'function' 
        ? (event as any).getCoalescedEvents() 
        : null;

      if (coalesced && coalesced.length > 0) {
        for (let i = 0; i < coalesced.length; i++) {
          processPointerPoint(coalesced[i].clientX, coalesced[i].clientY);
        }
      } else {
        processPointerPoint(event.clientX, event.clientY);
      }
    };

    const onDown = (event: PointerEvent) => {
      if (!isVisible) return;
      const cfg = configRef.current;
      if (!cfg.enabled || reduceMotion || cfg.trigger === 'hover') return;
      const point = localPoint(event.clientX, event.clientY);
      if (!point) return;
      setNewWave(point[0], point[1], Math.min(1.0, cfg.clickStrength * 0.45), cfg.rings, 1.25, 1.3);
      lastX = point[0];
      lastY = point[1];
      hasLastPoint = true;
    };

    const onPointerLeave = () => {
      hasLastPoint = false;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });

    const loop = (now: number) => {
      if (!isVisible || disposed) {
        isLoopRunning = false;
        return;
      }

      const delta = previousTime ? Math.min(0.05, (now - previousTime) / 1000) : 0;
      previousTime = now;
      const cfg = configRef.current;

      const growth = reduceMotion ? 0 : 1 - Math.exp(-delta * (cfg.speed * 1.09));
      const decay = reduceMotion ? 1 : Math.exp((-delta * LIFE_CONSTANT) / Math.max(0.15, cfg.fade));

      let activeCount = 0;

      for (let i = 0; i < MAX_WAVES; i += 1) {
        const wave = waves[i];
        if (wave.opacity <= 0) {
          opacities[i] = 0;
          continue;
        }

        wave.opacity *= decay;
        wave.scale += (wave.target - wave.scale) * growth;

        if (wave.opacity < 0.002) {
          wave.opacity = 0;
          opacities[i] = 0;
          continue;
        }

        activeCount++;
        const half = (wave.scale * wave.size) / 2;
        offsets[i * 2] = (wave.x / width) * 2 - 1;
        offsets[i * 2 + 1] = (wave.y / height) * 2 - 1;
        scales[i * 2] = (half / width) * 2;
        scales[i * 2 + 1] = (half / height) * 2;
        opacities[i] = wave.opacity;
        ringsArray[i] = wave.rings;
      }

      if (activeCount > 0) {
        needsRenderAfterClear = true;
        geometry.attributes.iOffset.needsUpdate = true;
        geometry.attributes.iScale.needsUpdate = true;
        geometry.attributes.iOpacity.needsUpdate = true;
        geometry.attributes.iRings.needsUpdate = true;

        renderer.render({ scene: waveMesh, target: displacementTarget, clear: true });
        renderer.render({ scene: compositeMesh });
        raf = requestAnimationFrame(loop);
      } else if (needsRenderAfterClear) {
        // One final frame to ensure clean resting state, then sleep
        needsRenderAfterClear = false;
        renderer.render({ scene: waveMesh, target: displacementTarget, clear: true });
        renderer.render({ scene: compositeMesh });
        isLoopRunning = false;
      } else {
        isLoopRunning = false;
      }
    };

    // IntersectionObserver: sleep completely when scrolled out of viewport
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry.isIntersecting;
        if (isVisible) {
          if (imageTexture.image) {
            renderer.render({ scene: compositeMesh });
          }
        } else {
          stopLoop();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(mount);

    // Initial render of static text plate
    renderer.render({ scene: compositeMesh });

    return () => {
      disposed = true;
      io.disconnect();
      stopLoop();
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerleave', onPointerLeave);
      uniformsRef.current = null;
      if (canvas.parentNode === mount) mount.removeChild(canvas);
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, quality]);

  useEffect(() => {
    const u = uniformsRef.current;
    if (!u) return;
    u.wave.uRings.value = rings;
    u.composite.uStrength.value = strength;
    u.composite.uSwirl.value = swirl;
    u.composite.uDispersion.value = dispersion;
    u.composite.uGlint.value = glint;
    u.composite.uTintAmount.value = tintAmount;
    u.composite.uGrayscale.value = grayscale ? 1 : 0;
    u.composite.uHighlight.value = hexToRGB(highlightColor);
    u.composite.uTint.value = hexToRGB(tint);
  }, [rings, strength, swirl, dispersion, glint, tintAmount, grayscale, highlightColor, tint]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full overflow-hidden bg-transparent [&>canvas]:block [&>canvas]:w-full [&>canvas]:h-full ${className}`.trim()}
      style={style}
    />
  );
};

export default RippleDistortion;
